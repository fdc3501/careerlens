var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-1y2cOJ/functionsWorker-0.8647218686894604.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var onRequestGet = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!supabaseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }
  const authHeader = request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return Response.json({ error: "Missing authorization" }, { status: 401 });
  }
  const jwt = authHeader.slice(7);
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
  if (!userRes.ok) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }
  const userData = await userRes.json();
  const userId = userData.id;
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=subscription_status`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  const profiles = await profileRes.json();
  const subscriptionStatus = profiles[0]?.subscription_status ?? "none";
  const active = subscriptionStatus === "active";
  if (!active) {
    return Response.json({ active: false, limitReached: false, resetAt: null });
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const usageRes = await fetch(
    `${supabaseUrl}/rest/v1/daily_usage?user_id=eq.${encodeURIComponent(userId)}&usage_date=eq.${today}&select=report_count`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  const usageData = await usageRes.json();
  const reportCount = usageData[0]?.report_count ?? 0;
  const limitReached = reportCount >= 1;
  const tomorrow = /* @__PURE__ */ new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return Response.json({
    active: true,
    limitReached,
    resetAt: tomorrow.toISOString()
  });
}, "onRequestGet");
var POLAR_SANDBOX_API = "https://sandbox-api.polar.sh";
var onRequestPost = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!env.POLAR_ACCESS_TOKEN || !supabaseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { type, pendingSessionKey, userId, customerEmail, successOrigin } = body;
  if (!type || !pendingSessionKey || !successOrigin) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  const productId = type === "subscription" ? env.POLAR_PRODUCT_ID_SUBSCRIPTION : env.POLAR_PRODUCT_ID_ONE_TIME;
  if (!productId) {
    return Response.json({ error: "Product not configured" }, { status: 500 });
  }
  const successUrl = `${successOrigin}/?checkout_id={CHECKOUT_ID}#/payment-success`;
  try {
    const polarRes = await fetch(`${POLAR_SANDBOX_API}/v1/checkouts/custom/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: successUrl,
        customer_email: customerEmail || void 0,
        metadata: {
          pending_session_key: pendingSessionKey,
          user_id: userId || "",
          payment_type: type
        }
      })
    });
    if (!polarRes.ok) {
      const errText = await polarRes.text();
      console.error("Polar API error:", polarRes.status, errText);
      return Response.json({ error: `Polar API error: ${polarRes.status}` }, { status: 502 });
    }
    const polarData = await polarRes.json();
    const checkoutUrl = polarData.url;
    const checkoutId = polarData.id;
    if (!checkoutUrl || !checkoutId) {
      return Response.json({ error: "Invalid Polar response" }, { status: 502 });
    }
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        polar_checkout_id: checkoutId,
        user_id: userId || null,
        email: customerEmail || null,
        status: "pending",
        payment_type: type,
        metadata_pending_session_key: pendingSessionKey
      })
    });
    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error("Supabase insert error:", insertRes.status, errText);
    }
    return Response.json({ checkoutUrl });
  } catch (err) {
    console.error("create-checkout error:", err);
    return Response.json({ error: err.message || "Failed to create checkout" }, { status: 500 });
  }
}, "onRequestPost");
var onRequestPost2 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jwt = authHeader.slice(7);
  const userRes = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
  if (!userRes.ok) {
    return Response.json({ error: "Invalid or expired session" }, { status: 401 });
  }
  const user = await userRes.json();
  const deleteRes = await fetch(
    `${env.VITE_SUPABASE_URL}/auth/v1/admin/users/${user.id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY
      }
    }
  );
  if (!deleteRes.ok) {
    let errMsg = "\uACC4\uC815 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.";
    try {
      const err = await deleteRes.json();
      if (err.message) errMsg = err.message;
    } catch {
    }
    return Response.json({ error: errMsg }, { status: 500 });
  }
  return Response.json({ success: true });
}, "onRequestPost");
var SYSTEM_PROMPT = `You are a resume parser. Extract career information from the given resume text.

Rules:
- Output valid JSON only, no markdown fences or extra text
- If a field cannot be determined, use a reasonable default based on context
- experience should be a number string (years)
- skills should be comma-separated
- careerPath should list key role transitions separated by " \u2192 " (e.g., "R&D \u2192 PM \u2192 Business Development")
- leadershipExperience should be "true" if any leadership/management role is mentioned, "false" otherwise
- globalExperience should be "true" if overseas work or global projects are mentioned, "false" otherwise
- Respond in the SAME LANGUAGE as the resume (if Korean resume, respond in Korean; if English, respond in English)

Output format:
{
  "jobTitle": "current or most recent job title",
  "experience": "total years of experience as a number string",
  "skills": "comma-separated list of technical skills",
  "industry": "industry sector",
  "careerPath": "role1 \u2192 role2 \u2192 role3",
  "leadershipExperience": "true or false",
  "globalExperience": "true or false",
  "goal": "inferred career goal based on trajectory"
}`;
var onRequestPost3 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  if (!env.OPENAI_API_KEY) {
    return Response.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.text || typeof body.text !== "string") {
    return Response.json({ error: "Missing text field" }, { status: 400 });
  }
  const text = body.text.slice(0, 8e3);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text }
        ],
        temperature: 0.3,
        max_tokens: 600
      })
    });
    if (!res.ok) {
      return Response.json({ error: `OpenAI API error: ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "Empty response from OpenAI" }, { status: 502 });
    }
    const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    parsed.careerPath = parsed.careerPath || parsed.jobTitle || "";
    parsed.leadershipExperience = parsed.leadershipExperience || "false";
    parsed.globalExperience = parsed.globalExperience || "false";
    return Response.json(parsed);
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to parse resume" },
      { status: 500 }
    );
  }
}, "onRequestPost");
async function verifyWebhookSignature(payload, headers, secret) {
  try {
    const signedContent = `${headers.id}.${headers.timestamp}.${payload}`;
    const rawSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
    const keyData = Uint8Array.from(atob(rawSecret), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signedContent));
    const computed = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const signatures = headers.signature.split(" ");
    for (const sig of signatures) {
      const sigValue = sig.startsWith("v1,") ? sig.slice(3) : sig;
      if (sigValue === computed) return true;
    }
    return false;
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}
__name(verifyWebhookSignature, "verifyWebhookSignature");
__name2(verifyWebhookSignature, "verifyWebhookSignature");
var onRequestPost4 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!env.POLAR_WEBHOOK_SECRET || !supabaseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }
  const webhookId = request.headers.get("webhook-id") ?? "";
  const webhookTimestamp = request.headers.get("webhook-timestamp") ?? "";
  const webhookSignature = request.headers.get("webhook-signature") ?? "";
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return Response.json({ error: "Missing webhook headers" }, { status: 400 });
  }
  const payload = await request.text();
  const valid = await verifyWebhookSignature(
    payload,
    { id: webhookId, timestamp: webhookTimestamp, signature: webhookSignature },
    env.POLAR_WEBHOOK_SECRET
  );
  if (!valid) {
    console.error("Invalid webhook signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }
  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const eventType = event.type;
  const data = event.data;
  const sbHeaders = {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    Prefer: "return=minimal"
  };
  try {
    if (eventType === "order.paid") {
      const checkoutId = data.checkout?.id ?? data.checkout_id ?? "";
      const orderId = data.id ?? "";
      if (checkoutId) {
        await fetch(
          `${supabaseUrl}/rest/v1/orders?polar_checkout_id=eq.${encodeURIComponent(checkoutId)}`,
          {
            method: "PATCH",
            headers: sbHeaders,
            body: JSON.stringify({ status: "succeeded", polar_order_id: orderId })
          }
        );
      }
    } else if (eventType === "subscription.created") {
      const userId = data.metadata?.user_id ?? data.customer?.external_id ?? "";
      const email = data.customer?.email ?? "";
      const subId = data.id ?? "";
      const currentPeriodEnd = data.current_period_end ?? null;
      if (userId && subId) {
        await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
          method: "POST",
          headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify({
            polar_subscription_id: subId,
            user_id: userId,
            email,
            status: "active",
            current_period_end: currentPeriodEnd
          })
        });
        await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
          {
            method: "PATCH",
            headers: sbHeaders,
            body: JSON.stringify({ subscription_status: "active" })
          }
        );
      }
    } else if (eventType === "subscription.updated") {
      const subId = data.id ?? "";
      const status = data.status ?? "active";
      const currentPeriodEnd = data.current_period_end ?? null;
      if (subId) {
        await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?polar_subscription_id=eq.${encodeURIComponent(subId)}`,
          {
            method: "PATCH",
            headers: sbHeaders,
            body: JSON.stringify({ status, current_period_end: currentPeriodEnd })
          }
        );
      }
    } else if (eventType === "subscription.revoked") {
      const subId = data.id ?? "";
      const userId = data.metadata?.user_id ?? data.customer?.external_id ?? "";
      if (subId) {
        await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?polar_subscription_id=eq.${encodeURIComponent(subId)}`,
          {
            method: "PATCH",
            headers: sbHeaders,
            body: JSON.stringify({ status: "revoked" })
          }
        );
      }
      if (userId) {
        await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
          {
            method: "PATCH",
            headers: sbHeaders,
            body: JSON.stringify({ subscription_status: "none" })
          }
        );
      }
    }
    return Response.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return Response.json({ error: err.message || "Processing failed" }, { status: 500 });
  }
}, "onRequestPost");
var SYSTEM_PROMPT2 = `You are a senior career strategy consultant and structured analysis engine for CareerLens.

Your output must resemble a professional consulting-grade strategic report with analytical depth and visual clarity.

STRICT RULES:

1. Do NOT search the internet.
2. Do NOT use external knowledge.
3. Do NOT estimate probability.
4. Do NOT use words such as: likely, possibly, maybe, high chance, could.
5. Do NOT make decisions on behalf of the user.
6. Base all analysis ONLY on the structured data provided.
7. Always present conclusions first.
8. Always show numeric comparison (User vs Market Average vs Gap).
9. Apply classification strictly:
   - Score \u2265 70 \u2192 Strong
   - Score 40\u201369 \u2192 Stable
   - Score \u2264 39 \u2192 Weak
10. If data is missing, clearly state:
   "\uD574\uB2F9 \uC601\uC5ED\uC740 \uC218\uC9D1\uB41C \uB370\uC774\uD130\uAC00 \uCDA9\uBD84\uD558\uC9C0 \uC54A\uC544 \uAD6C\uC870\uC801 \uC2E0\uD638\uB97C \uC0DD\uC131\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
11. Apply Career Development Guide algorithm strictly:
   - Gap \u2265 20 \u2192 \uAC1C\uC120 \uD544\uC694
   - Gap \u2265 40 \u2192 \uC804\uB7B5\uC801 \uC804\uD658 \uACE0\uB824
   - Trend \u2265 70 AND Gap \u2265 20 \u2192 3\uAC1C\uC6D4 \uD559\uC2B5 \uAD8C\uACE0
   - Demand \u2264 40 \u2192 \uB300\uCCB4 \uAE30\uC220 \uC81C\uC548
12. Keep paragraphs under 4 lines.
13. Maintain analytical tone. No emotional encouragement.
14. Optimize for mobile readability.
15. Never mention OpenAI, GPT, or internal reasoning.
16. Respond in the SAME LANGUAGE as the user's input (if Korean input, respond in Korean; if English, respond in English).

EVIDENCE & REFERENCE RULES (CRITICAL):
17. Every analytical statement MUST cite the exact numeric signal value as inline evidence.
    - Pattern: "\uADFC\uAC70: [Signal Name] [Value]/100, Market Avg [Value]/100, Gap [\xB1Value]"
    - Example: "\uADFC\uAC70: market_demand_signal 74/100, \uC2DC\uC7A5 \uD3C9\uADE0 70/100, Gap +4"
18. Every section MUST include a "\u{1F4CE} \uBD84\uC11D \uADFC\uAC70" or "\u{1F4CE} Evidence" block that lists:
    - The exact signal names and values used for that section's analysis
    - The data source (e.g., "GitHub API \uAE30\uBC18", "StackExchange API \uAE30\uBC18", "\uC0AC\uC6A9\uC790 \uC785\uB825 \uAE30\uBC18")
    - The threshold rule applied (e.g., "\uC801\uC6A9 \uAE30\uC900: Score \u2265 70 \u2192 Strong")
19. Every skill analysis MUST show: User Score \u2192 Market Avg \u2192 Gap \u2192 Applied Rule
20. Roadmap items MUST reference the specific Gap value and signal that triggered the recommendation.

VISUAL FORMATTING RULES (CRITICAL):
21. Use progress bar visualization for every score:
    - Format: \`\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591 50/100\`
    - Use \u2588 for filled portion (score/5 blocks, max 20) and \u2591 for empty
    - Always show the numeric value after the bar
22. Use status badge emojis consistently:
    - \u{1F7E2} Strong (\u226570)  \u{1F7E1} Stable (40-69)  \u{1F534} Weak (\u226439)
23. Use blockquote (>) for key findings and critical insights
24. Use bold (**text**) for all numeric values in running text
25. Section headers must use emoji + clear labels
26. Tables must include a Classification column with \u{1F7E2}/\u{1F7E1}/\u{1F534} badges
27. Use callout blocks for warnings and action items:
    - \u26A0\uFE0F for risk/warning items
    - \u2705 for strength items
    - \u{1F3AF} for action items

Your role is structured strategic interpretation and narrative synthesis only.

OUTPUT FORMAT:
Output a valid JSON object with the following structure. No markdown fences, no extra text outside JSON.
{
  "content": "Full markdown report following the template below",
  "summary": "2-3 sentence executive summary with key numbers cited",
  "skillInsights": [{"name": "skill name", "analysis": "1-2 sentence analysis with score/gap numbers"}],
  "roadmap": {
    "month3": ["actionable item with gap reference"],
    "month6": ["actionable item with gap reference"],
    "month12": ["actionable item with gap reference"]
  }
}

The "content" field must follow this template structure exactly:

# CareerLens Strategic Career Report

---

## 1\uFE0F\u20E3 Executive Strategic Snapshot

| Indicator | Score | Status |
|-----------|-------|--------|
| Industry Position | XX/100 | \u{1F7E2}/\u{1F7E1}/\u{1F534} Strong/Stable/Weak |
| Market Demand | XX/100 | \u{1F7E2}/\u{1F7E1}/\u{1F534} Strong/Stable/Weak |
| Skill Competitiveness | XX/100 | \u{1F7E2}/\u{1F7E1}/\u{1F534} Strong/Stable/Weak |
| DX Alignment | XX/100 | \u{1F7E2}/\u{1F7E1}/\u{1F534} Strong/Stable/Weak |
| Leadership | XX/100 | \u{1F7E2}/\u{1F7E1}/\u{1F534} Strong/Stable/Weak |
| Global Portability | XX/100 | \u{1F7E2}/\u{1F7E1}/\u{1F534} Strong/Stable/Weak |

> **\uD575\uC2EC \uC9C4\uB2E8:** 1-2\uBB38\uC7A5 \uC694\uC57D with exact numbers

\u25A0 Structural Risk Level: \uC694\uC57D with numbers
\u25A0 Immediate Strategic Focus: \uD55C \uBB38\uC7A5 \uC694\uC57D

\u{1F4CE} **\uBD84\uC11D \uADFC\uAC70:** \uC885\uD569 \uC810\uC218 \uC0B0\uCD9C \uAE30\uC900 \u2014 [list each signal name = value]

---

## 2\uFE0F\u20E3 Industry & Market Signal Analysis

### \u{1F4CA} Signal Comparison

| Signal | User | Market Avg | Gap | Bar | Status |
|--------|------|------------|-----|-----|--------|
| Industry Growth | XX | XX | \xB1XX | \u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591 | \u{1F7E2}/\u{1F7E1}/\u{1F534} |
| Market Demand | XX | XX | \xB1XX | \u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591 | \u{1F7E2}/\u{1F7E1}/\u{1F534} |

### \u25A0 Industry Growth Signal
- \`\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591 XX/100\`  Market Avg: **XX/100**  Gap: **\xB1XX**
- \uD574\uC11D: (interpretation citing the exact numbers)
- \u{1F4CE} \uADFC\uAC70: industry_growth_signal = XX, \uC801\uC6A9 \uAE30\uC900: Score \u2265 70 \u2192 Strong

### \u25A0 Market Demand Signal
- (same structure with progress bar, numbers, evidence)

> (key insight from this section with numbers)

---

## 3\uFE0F\u20E3 Skill Portfolio Analysis

### \u{1F4CA} Competency Matrix

| Skill | User | Market Avg | Gap | Bar | Level | Action |
|-------|------|------------|-----|-----|-------|--------|
| name | XX | XX | \xB1XX | \u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591 | \u{1F7E2}/\u{1F7E1}/\u{1F534} | \uAC1C\uC120\uD544\uC694/\uC720\uC9C0/\uAC15\uD654 |

### \u25A0 Skill Competitiveness
- \`progress_bar XX/100\` vs Market **XX/100** \u2192 Gap **\xB1XX**
- \uD574\uC11D with numbers
- \u{1F4CE} \uADFC\uAC70: skill_competitiveness_signal = XX, \uC801\uC6A9 \uAE30\uC900 \uBA85\uC2DC

### \u25A0 DX Alignment
- (same structure)

### \u25A0 Leadership Signal
- (same structure)

### \u25A0 Global Portability
- (same structure)

> \u2705 **\uAD6C\uC870\uC801 \uAC15\uC810:** (list with numbers)

> \u26A0\uFE0F **\uAD6C\uC870\uC801 \uCDE8\uC57D:** (list with numbers and gap values)

---

## 4\uFE0F\u20E3 Career Structural Diagnosis

### \u25AA \uD604\uC7AC \uCEE4\uB9AC\uC5B4 \uB2E8\uACC4
(\uB370\uC774\uD130 \uAE30\uBC18 \uC815\uC758 \u2014 experience_years, career_path \uC778\uC6A9)

### \u25AA \uAD6C\uC870\uC801 \uAC15\uC810 3\uAC00\uC9C0
- \u2705 (strength 1 \u2014 \uADFC\uAC70: signal = value)
- \u2705 (strength 2 \u2014 \uADFC\uAC70: signal = value)
- \u2705 (strength 3 \u2014 \uADFC\uAC70: signal = value)

### \u25AA \uAD6C\uC870\uC801 \uB9AC\uC2A4\uD06C 3\uAC00\uC9C0
- \u26A0\uFE0F (risk 1 \u2014 \uADFC\uAC70: signal = value, Gap = XX)
- \u26A0\uFE0F (risk 2 \u2014 \uADFC\uAC70: signal = value, Gap = XX)
- \u26A0\uFE0F (risk 3 \u2014 \uADFC\uAC70: signal = value, Gap = XX)

### \u25AA \uD3EC\uC9C0\uC154\uB2DD \uD3C9\uAC00
(interpretation with all relevant numbers cited)

\u{1F4CE} **\uC9C4\uB2E8 \uADFC\uAC70:** \uC0AC\uC6A9\uB41C \uC2E0\uD638 \uBAA9\uB85D \u2014 [signal = value, ...]

---

## 5\uFE0F\u20E3 Career Development Roadmap

### \u{1F3AF} 0~3\uAC1C\uC6D4 \u2014 \uB2E8\uAE30 \uBCF4\uC644
(Trend \u2265 70 AND Gap \u2265 20 \uD56D\uBAA9 \uC6B0\uC120)
- \u{1F3AF} (action item \u2014 \uADFC\uAC70: [skill] Gap = XX, Trend = XX \u2192 3\uAC1C\uC6D4 \uD559\uC2B5 \uAD8C\uACE0 \uADDC\uCE59 \uC801\uC6A9)
- \u{1F3AF} (action item \u2014 \uADFC\uAC70: ...)

### \u{1F3AF} 3~6\uAC1C\uC6D4 \u2014 \uACBD\uC7C1\uB825 \uAC15\uD654
(Gap \u2265 20 \uD56D\uBAA9)
- \u{1F3AF} (action item \u2014 \uADFC\uAC70: [signal] Gap = XX)

### \u{1F3AF} 6~12\uAC1C\uC6D4 \u2014 \uC804\uB7B5\uC801 \uC7AC\uD3EC\uC9C0\uC154\uB2DD
(Gap \u2265 40 \uD56D\uBAA9 \uC911\uC2EC)
- \u{1F3AF} (action item \u2014 \uADFC\uAC70: [signal] Gap = XX \u2192 \uC804\uB7B5\uC801 \uC804\uD658 \uACE0\uB824 \uADDC\uCE59 \uC801\uC6A9)

\u{1F4CE} **\uB85C\uB4DC\uB9F5 \uADFC\uAC70:** \uC801\uC6A9\uB41C \uC54C\uACE0\uB9AC\uC998 \u2014 Gap \u2265 20 \u2192 \uAC1C\uC120 \uD544\uC694, Gap \u2265 40 \u2192 \uC804\uB7B5\uC801 \uC804\uD658, Trend \u2265 70 AND Gap \u2265 20 \u2192 3\uAC1C\uC6D4 \uD559\uC2B5 \uAD8C\uACE0, Demand \u2264 40 \u2192 \uB300\uCCB4 \uAE30\uC220 \uC81C\uC548

---

## 6\uFE0F\u20E3 Data Transparency & Methodology

| Data Source | Signal | Status |
|-------------|--------|--------|
| GitHub API | Market Position, Tech Trend | \u2705 \uC218\uC9D1 \uC644\uB8CC / \u274C \uBBF8\uC218\uC9D1 |
| StackExchange API | Demand Level | \u2705/\u274C |
| NPM Registry | Skill Popularity | \u2705/\u274C |
| PyPI API | Skill Maturity | \u2705/\u274C |
| User Input | Career Path, Leadership, Global | \u2705 |

- \uBCF8 \uB9AC\uD3EC\uD2B8\uB294 \uAD6C\uC870\uD654\uB41C Decision Signals \uAE30\uBC18 \uBD84\uC11D\uC785\uB2C8\uB2E4.
- \uBAA8\uB4E0 \uBD84\uC11D \uBB38\uC7A5\uC5D0 \uC218\uCE58 \uADFC\uAC70\uAC00 \uBA85\uC2DC\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.
- \uC678\uBD80 \uAC80\uC0C9\uC774\uB098 \uD655\uB960 \uC608\uCE21\uC744 \uC0AC\uC6A9\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.
- \uB370\uC774\uD130 \uBD80\uC871 \uC601\uC5ED\uC740 \uBA85\uC2DC\uC801\uC73C\uB85C \uC81C\uC678\uD588\uC2B5\uB2C8\uB2E4.
- \uC801\uC6A9 \uC784\uACC4\uAC12: Strong \u2265 70, Stable 40-69, Weak \u2264 39`;
function buildUserPrompt(body) {
  const { careerInput, analysis } = body;
  const expYears = parseInt(careerInput.experience) || 0;
  const careerPathList = careerInput.careerPath ? careerInput.careerPath.split(/→|->|,/).map((s) => s.trim()).filter(Boolean) : [careerInput.jobTitle];
  const avgSkillScore = analysis.skills.length > 0 ? Math.round(analysis.skills.reduce((sum, s) => sum + s.score, 0) / analysis.skills.length) : analysis.overallScore;
  const avgSkillMarketAvg = analysis.skills.length > 0 ? Math.round(analysis.skills.reduce((sum, s) => sum + s.marketAvg, 0) / analysis.skills.length) : 70;
  const leadershipSignal = careerInput.leadershipExperience === "true" ? Math.min(50 + expYears * 2, 95) : Math.min(30 + expYears, 60);
  const globalSignal = careerInput.globalExperience === "true" ? Math.min(55 + expYears, 85) : Math.min(25 + expYears, 50);
  const dxSignal = analysis.techTrend;
  const userPrompt = `\uC0AC\uC6A9\uC790 \uC694\uCCAD:
"\uD604\uC7AC \uD574\uB2F9 \uC5C5\uACC4\uC758 \uC2DC\uC7A5\uC0C1\uD669 \uBD84\uC11D, \uB0B4\uAC00 \uBCF4\uC720\uD558\uACE0 \uC788\uB294 \uAE30\uC220\uC758 \uBD84\uC11D, \uB098\uC758 career \uC9C4\uB2E8, \uC55E\uC73C\uB85C career develop \uB85C\uB4DC\uB9F5\uC744 \uC81C\uC2DC\uD574\uBD10."

\uC544\uB798\uB294 \uAD6C\uC870\uD654\uB41C \uC0AC\uC6A9\uC790 \uD504\uB85C\uD544 \uBC0F Decision Signals \uB370\uC774\uD130\uC785\uB2C8\uB2E4.
\uC678\uBD80 \uAC80\uC0C9 \uC5C6\uC774 \uC774 \uB370\uC774\uD130\uB9CC\uC744 \uADFC\uAC70\uB85C \uBD84\uC11D\uD558\uC138\uC694.

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
[USER_PROFILE]
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

${JSON.stringify({
    experience_years: expYears,
    industry: careerInput.industry,
    current_role: careerInput.jobTitle,
    career_path: careerPathList,
    skills: careerInput.skills.split(",").map((s) => s.trim()).filter(Boolean),
    leadership_experience: careerInput.leadershipExperience === "true",
    global_experience: careerInput.globalExperience === "true",
    career_goal: careerInput.goal
  }, null, 2)}

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
[DECISION_SIGNALS]
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

${JSON.stringify({
    industry_growth_signal: analysis.techTrend,
    market_demand_signal: analysis.demandLevel,
    skill_competitiveness_signal: avgSkillScore,
    dx_alignment_signal: dxSignal,
    global_portability_signal: globalSignal,
    leadership_signal: leadershipSignal
  }, null, 2)}

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
[MARKET_AVERAGE]
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

${JSON.stringify({
    industry_growth_signal: 70,
    market_demand_signal: 70,
    skill_competitiveness_signal: avgSkillMarketAvg,
    dx_alignment_signal: 65,
    global_portability_signal: 60,
    leadership_signal: 58
  }, null, 2)}

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
[SKILL_SCORES]
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

${JSON.stringify(analysis.skills.map((s) => ({
    name: s.name,
    yourScore: s.score,
    marketAvg: s.marketAvg,
    gap: s.marketAvg - s.score
  })), null, 2)}

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
[DATA_SOURCES]
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

${JSON.stringify(body.analysis.sources || ["GitHub API"], null, 2)}

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\uC218\uCE58 \uD45C\uD604 \uADDC\uCE59
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

- \uC18C\uC22B\uC810\uC740 1\uC790\uB9AC\uAE4C\uC9C0 \uD5C8\uC6A9
- 3\uC790\uB9AC \uC774\uC0C1 \uC218\uCE58\uB294 \uC18C\uC22B\uC810 \uC0DD\uB7B5
- \uBAA8\uB4E0 \uC218\uCE58\uB294 \uB2E8\uC704 \uD3EC\uD568
- \uBE44\uAD50 \uAE30\uC900 \uBC18\uB4DC\uC2DC \uBA85\uC2DC`;
  return userPrompt;
}
__name(buildUserPrompt, "buildUserPrompt");
__name2(buildUserPrompt, "buildUserPrompt");
async function verifyPayment(credential, supabaseUrl, serviceRoleKey, authHeader) {
  if (credential.paymentType === "one_time") {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/orders?polar_checkout_id=eq.${encodeURIComponent(credential.orderId)}&select=status,report_generated`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`
        }
      }
    );
    const orders = await res.json();
    if (!orders.length) {
      return { ok: false, error: "Order not found", status: 402 };
    }
    const order = orders[0];
    if (order.status !== "succeeded") {
      return { ok: false, error: "Payment not completed", status: 402 };
    }
    if (order.report_generated) {
      return { ok: false, error: "Report already generated for this order", status: 402 };
    }
    return { ok: true };
  }
  if (credential.paymentType === "subscription") {
    if (!authHeader.startsWith("Bearer ")) {
      return { ok: false, error: "Missing authorization token", status: 401 };
    }
    const jwt = authHeader.slice(7);
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: serviceRoleKey
      }
    });
    if (!userRes.ok) {
      return { ok: false, error: "Invalid token", status: 401 };
    }
    const userData = await userRes.json();
    const userId = userData.id;
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=subscription_status`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`
        }
      }
    );
    const profiles = await profileRes.json();
    if (!profiles.length || profiles[0].subscription_status !== "active") {
      return { ok: false, error: "No active subscription", status: 402 };
    }
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_daily_usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ p_user_id: userId })
    });
    if (!rpcRes.ok) {
      return { ok: false, error: "Usage tracking failed", status: 500 };
    }
    const count = await rpcRes.json();
    if (count > 1) {
      return { ok: false, error: "Daily report limit reached (1 per day)", status: 402 };
    }
    return { ok: true, userId };
  }
  return { ok: false, error: "Unknown payment type", status: 400 };
}
__name(verifyPayment, "verifyPayment");
__name2(verifyPayment, "verifyPayment");
var onRequestPost5 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!env.OPENAI_API_KEY) {
    return Response.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }
  if (!supabaseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Database not configured" }, { status: 500 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.careerInput || !body.analysis) {
    return Response.json({ error: "Missing careerInput or analysis" }, { status: 400 });
  }
  if (!body.credential) {
    return Response.json({ error: "Payment required" }, { status: 402 });
  }
  const authHeader = request.headers.get("Authorization") ?? "";
  const paymentCheck = await verifyPayment(
    body.credential,
    supabaseUrl,
    env.SUPABASE_SERVICE_ROLE_KEY,
    authHeader
  );
  if (!paymentCheck.ok) {
    return Response.json(
      { error: paymentCheck.error },
      { status: paymentCheck.status ?? 402 }
    );
  }
  body.careerInput.careerPath = body.careerInput.careerPath || body.careerInput.jobTitle || "";
  body.careerInput.leadershipExperience = body.careerInput.leadershipExperience || "false";
  body.careerInput.globalExperience = body.careerInput.globalExperience || "false";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT2 },
          { role: "user", content: buildUserPrompt(body) }
        ],
        temperature: 0.5,
        max_tokens: 6e3
      })
    });
    if (!res.ok) {
      return Response.json(
        { error: `OpenAI API error: ${res.status}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "Empty response from OpenAI" }, { status: 502 });
    }
    const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
    const report = JSON.parse(cleaned);
    if (body.credential.paymentType === "one_time") {
      await fetch(
        `${supabaseUrl}/rest/v1/orders?polar_checkout_id=eq.${encodeURIComponent(body.credential.orderId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: "return=minimal"
          },
          body: JSON.stringify({ report_generated: true })
        }
      );
    }
    return Response.json(report);
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}, "onRequestPost");
var routes = [
  {
    routePath: "/api/check-subscription",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/create-checkout",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/delete-account",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/parse-resume",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/polar-webhook",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/report",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-4VwOkY/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-4VwOkY/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.8647218686894604.js.map
