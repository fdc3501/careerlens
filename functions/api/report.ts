interface Env {
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_SUPABASE_URL: string;
}

interface PaymentCredential {
  orderId: string;       // polar_checkout_id for one_time; unused for subscription
  paymentType: 'one_time' | 'subscription';
}

interface RequestBody {
  careerInput: {
    jobTitle: string;
    experience: string;
    skills: string;
    industry: string;
    careerPath: string;
    leadershipExperience: string;
    globalExperience: string;
    goal: string;
  };
  analysis: {
    marketPosition: number;
    techTrend: number;
    demandLevel: number;
    overallScore: number;
    skills: { name: string; score: number; marketAvg: number }[];
    sources: string[];
  };
  credential?: PaymentCredential;
}

const SYSTEM_PROMPT = `You are a senior career strategy consultant and structured analysis engine for CareerLens.

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
   - Score ≥ 70 → Strong
   - Score 40–69 → Stable
   - Score ≤ 39 → Weak
10. If data is missing, clearly state:
   "해당 영역은 수집된 데이터가 충분하지 않아 구조적 신호를 생성할 수 없습니다."
11. Apply Career Development Guide algorithm strictly:
   - Gap ≥ 20 → 개선 필요
   - Gap ≥ 40 → 전략적 전환 고려
   - Trend ≥ 70 AND Gap ≥ 20 → 3개월 학습 권고
   - Demand ≤ 40 → 대체 기술 제안
12. Keep paragraphs under 4 lines.
13. Maintain analytical tone. No emotional encouragement.
14. Optimize for mobile readability.
15. Never mention OpenAI, GPT, or internal reasoning.
16. Respond in the SAME LANGUAGE as the user's input (if Korean input, respond in Korean; if English, respond in English).

TREND COMPARISON RULES (only when [PREVIOUS_ANALYSIS] and [TREND_DELTA] are present):
17t. Insert "## 0️⃣ 트렌드 변화 분석" as the FIRST section in content (before section 1).
18t. Always use EXACT numbers from [TREND_DELTA]. Never recalculate independently.
19t. Icons: ⬆️ delta ≥ 2 | ⬇️ delta ≤ -2 | ➡️ delta within ±1
20t. Show per-skill delta table for skills present in both analyses.
21t. 1-2 sentence trend interpretation citing exact delta values. ±1 is not meaningful.

EVIDENCE & REFERENCE RULES (CRITICAL):
17. Every analytical statement MUST cite the exact numeric signal value as inline evidence.
    - Pattern: "근거: [Signal Name] [Value]/100, Market Avg [Value]/100, Gap [±Value]"
    - Example: "근거: market_demand_signal 74/100, 시장 평균 70/100, Gap +4"
18. Every section MUST include a "📎 분석 근거" or "📎 Evidence" block that lists:
    - The exact signal names and values used for that section's analysis
    - The data source (e.g., "GitHub API 기반", "StackExchange API 기반", "사용자 입력 기반")
    - The threshold rule applied (e.g., "적용 기준: Score ≥ 70 → Strong")
19. Every skill analysis MUST show: User Score → Market Avg → Gap → Applied Rule
20. Roadmap items MUST reference the specific Gap value and signal that triggered the recommendation.

VISUAL FORMATTING RULES (CRITICAL):
21. Use progress bar visualization for every score:
    - Format: \`██████████░░░░░░░░░░ 50/100\`
    - Use █ for filled portion (score/5 blocks, max 20) and ░ for empty
    - Always show the numeric value after the bar
22. Use status badge emojis consistently:
    - 🟢 Strong (≥70)  🟡 Stable (40-69)  🔴 Weak (≤39)
23. Use blockquote (>) for key findings and critical insights
24. Use bold (**text**) for all numeric values in running text
25. Section headers must use emoji + clear labels
26. Tables must include a Classification column with 🟢/🟡/🔴 badges
27. Use callout blocks for warnings and action items:
    - ⚠️ for risk/warning items
    - ✅ for strength items
    - 🎯 for action items

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

## 0️⃣ 트렌드 변화 분석 (이전 분석 대비)
(Include this section ONLY when [PREVIOUS_ANALYSIS] and [TREND_DELTA] are present in the prompt)

| 지표 | 이전 | 현재 | 변화 |
|------|------|------|------|
| Overall Score | XX | XX | ⬆️ +N / ⬇️ -N / ➡️ 0 |
| Industry Growth | XX | XX | ... |
| Market Demand | XX | XX | ... |
| Skill Competitiveness | XX | XX | ... |

### 📊 스킬별 변화

| 스킬 | 이전 | 현재 | 변화 |
|------|------|------|------|
| (name) | XX | XX | ⬆️/⬇️/➡️ [±N] |

> (trend interpretation — 1-2 sentences with exact delta numbers)

📎 **트렌드 근거:** [TREND_DELTA] 사전 계산값 사용

---

## 1️⃣ Executive Strategic Snapshot

| Indicator | Score | Status |
|-----------|-------|--------|
| Industry Position | XX/100 | 🟢/🟡/🔴 Strong/Stable/Weak |
| Market Demand | XX/100 | 🟢/🟡/🔴 Strong/Stable/Weak |
| Skill Competitiveness | XX/100 | 🟢/🟡/🔴 Strong/Stable/Weak |
| DX Alignment | XX/100 | 🟢/🟡/🔴 Strong/Stable/Weak |
| Leadership | XX/100 | 🟢/🟡/🔴 Strong/Stable/Weak |
| Global Portability | XX/100 | 🟢/🟡/🔴 Strong/Stable/Weak |

> **핵심 진단:** 1-2문장 요약 with exact numbers

■ Structural Risk Level: 요약 with numbers
■ Immediate Strategic Focus: 한 문장 요약

📎 **분석 근거:** 종합 점수 산출 기준 — [list each signal name = value]

---

## 2️⃣ Industry & Market Signal Analysis

### 📊 Signal Comparison

| Signal | User | Market Avg | Gap | Bar | Status |
|--------|------|------------|-----|-----|--------|
| Industry Growth | XX | XX | ±XX | ████░░░░ | 🟢/🟡/🔴 |
| Market Demand | XX | XX | ±XX | ████░░░░ | 🟢/🟡/🔴 |

### ■ Industry Growth Signal
- \`████████████████░░░░ XX/100\`  Market Avg: **XX/100**  Gap: **±XX**
- 해석: (interpretation citing the exact numbers)
- 📎 근거: industry_growth_signal = XX, 적용 기준: Score ≥ 70 → Strong

### ■ Market Demand Signal
- (same structure with progress bar, numbers, evidence)

> (key insight from this section with numbers)

---

## 3️⃣ Skill Portfolio Analysis

### 📊 Competency Matrix

| Skill | User | Market Avg | Gap | Bar | Level | Action |
|-------|------|------------|-----|-----|-------|--------|
| name | XX | XX | ±XX | ████░░░░ | 🟢/🟡/🔴 | 개선필요/유지/강화 |

### ■ Skill Competitiveness
- \`progress_bar XX/100\` vs Market **XX/100** → Gap **±XX**
- 해석 with numbers
- 📎 근거: skill_competitiveness_signal = XX, 적용 기준 명시

### ■ DX Alignment
- (same structure)

### ■ Leadership Signal
- (same structure)

### ■ Global Portability
- (same structure)

> ✅ **구조적 강점:** (list with numbers)

> ⚠️ **구조적 취약:** (list with numbers and gap values)

---

## 4️⃣ Career Structural Diagnosis

### ▪ 현재 커리어 단계
(데이터 기반 정의 — experience_years, career_path 인용)

### ▪ 구조적 강점 3가지
- ✅ (strength 1 — 근거: signal = value)
- ✅ (strength 2 — 근거: signal = value)
- ✅ (strength 3 — 근거: signal = value)

### ▪ 구조적 리스크 3가지
- ⚠️ (risk 1 — 근거: signal = value, Gap = XX)
- ⚠️ (risk 2 — 근거: signal = value, Gap = XX)
- ⚠️ (risk 3 — 근거: signal = value, Gap = XX)

### ▪ 포지셔닝 평가
(interpretation with all relevant numbers cited)

📎 **진단 근거:** 사용된 신호 목록 — [signal = value, ...]

---

## 5️⃣ Career Development Roadmap

### 🎯 0~3개월 — 단기 보완
(Trend ≥ 70 AND Gap ≥ 20 항목 우선)
- 🎯 (action item — 근거: [skill] Gap = XX, Trend = XX → 3개월 학습 권고 규칙 적용)
- 🎯 (action item — 근거: ...)

### 🎯 3~6개월 — 경쟁력 강화
(Gap ≥ 20 항목)
- 🎯 (action item — 근거: [signal] Gap = XX)

### 🎯 6~12개월 — 전략적 재포지셔닝
(Gap ≥ 40 항목 중심)
- 🎯 (action item — 근거: [signal] Gap = XX → 전략적 전환 고려 규칙 적용)

📎 **로드맵 근거:** 적용된 알고리즘 — Gap ≥ 20 → 개선 필요, Gap ≥ 40 → 전략적 전환, Trend ≥ 70 AND Gap ≥ 20 → 3개월 학습 권고, Demand ≤ 40 → 대체 기술 제안

---

## 6️⃣ Data Transparency & Methodology

| Data Source | Signal | Status |
|-------------|--------|--------|
| GitHub API | Market Position, Tech Trend | ✅ 수집 완료 / ❌ 미수집 |
| StackExchange API | Demand Level | ✅/❌ |
| NPM Registry | Skill Popularity | ✅/❌ |
| PyPI API | Skill Maturity | ✅/❌ |
| User Input | Career Path, Leadership, Global | ✅ |

- 본 리포트는 구조화된 Decision Signals 기반 분석입니다.
- 모든 분석 문장에 수치 근거가 명시되어 있습니다.
- 외부 검색이나 확률 예측을 사용하지 않았습니다.
- 데이터 부족 영역은 명시적으로 제외했습니다.
- 적용 임계값: Strong ≥ 70, Stable 40-69, Weak ≤ 39`;

function buildUserPrompt(body: RequestBody, previousAnalysis?: RequestBody['analysis'] | null): string {
  const { careerInput, analysis } = body;
  const expYears = parseInt(careerInput.experience) || 0;

  // Build career_path array from careerPath string
  const careerPathList = careerInput.careerPath
    ? careerInput.careerPath.split(/→|->|,/).map(s => s.trim()).filter(Boolean)
    : [careerInput.jobTitle];

  // Map analysis data to Decision Signals
  const avgSkillScore = analysis.skills.length > 0
    ? Math.round(analysis.skills.reduce((sum, s) => sum + s.score, 0) / analysis.skills.length)
    : analysis.overallScore;

  const avgSkillMarketAvg = analysis.skills.length > 0
    ? Math.round(analysis.skills.reduce((sum, s) => sum + s.marketAvg, 0) / analysis.skills.length)
    : 70;

  // Leadership signal based on experience + leadership flag
  const leadershipSignal = careerInput.leadershipExperience === 'true'
    ? Math.min(50 + expYears * 2, 95)
    : Math.min(30 + expYears, 60);

  // Global portability signal
  const globalSignal = careerInput.globalExperience === 'true'
    ? Math.min(55 + expYears, 85)
    : Math.min(25 + expYears, 50);

  // DX alignment: derived from tech trend
  const dxSignal = analysis.techTrend;

  const userPrompt = `사용자 요청:
"현재 해당 업계의 시장상황 분석, 내가 보유하고 있는 기술의 분석, 나의 career 진단, 앞으로 career develop 로드맵을 제시해봐."

아래는 구조화된 사용자 프로필 및 Decision Signals 데이터입니다.
외부 검색 없이 이 데이터만을 근거로 분석하세요.

━━━━━━━━━━━━━━━━━━
[USER_PROFILE]
━━━━━━━━━━━━━━━━━━

${JSON.stringify({
    experience_years: expYears,
    industry: careerInput.industry,
    current_role: careerInput.jobTitle,
    career_path: careerPathList,
    skills: careerInput.skills.split(',').map(s => s.trim()).filter(Boolean),
    leadership_experience: careerInput.leadershipExperience === 'true',
    global_experience: careerInput.globalExperience === 'true',
    career_goal: careerInput.goal,
  }, null, 2)}

━━━━━━━━━━━━━━━━━━
[DECISION_SIGNALS]
━━━━━━━━━━━━━━━━━━

${JSON.stringify({
    industry_growth_signal: analysis.techTrend,
    market_demand_signal: analysis.demandLevel,
    skill_competitiveness_signal: avgSkillScore,
    dx_alignment_signal: dxSignal,
    global_portability_signal: globalSignal,
    leadership_signal: leadershipSignal,
  }, null, 2)}

━━━━━━━━━━━━━━━━━━
[MARKET_AVERAGE]
━━━━━━━━━━━━━━━━━━

${JSON.stringify({
    industry_growth_signal: 70,
    market_demand_signal: 70,
    skill_competitiveness_signal: avgSkillMarketAvg,
    dx_alignment_signal: 65,
    global_portability_signal: 60,
    leadership_signal: 58,
  }, null, 2)}

━━━━━━━━━━━━━━━━━━
[SKILL_SCORES]
━━━━━━━━━━━━━━━━━━

${JSON.stringify(analysis.skills.map(s => ({
    name: s.name,
    yourScore: s.score,
    marketAvg: s.marketAvg,
    gap: s.marketAvg - s.score,
  })), null, 2)}

━━━━━━━━━━━━━━━━━━
[DATA_SOURCES]
━━━━━━━━━━━━━━━━━━

${JSON.stringify(body.analysis.sources || ['GitHub API'], null, 2)}

━━━━━━━━━━━━━━━━━━
수치 표현 규칙
━━━━━━━━━━━━━━━━━━

- 소숫점은 1자리까지 허용
- 3자리 이상 수치는 소숫점 생략
- 모든 수치는 단위 포함
- 비교 기준 반드시 명시`;

  if (previousAnalysis) {
    const prevAvgSkill = previousAnalysis.skills.length > 0
      ? Math.round(previousAnalysis.skills.reduce((s, sk) => s + sk.score, 0) / previousAnalysis.skills.length)
      : previousAnalysis.overallScore;

    const deltas = {
      overall_score:          analysis.overallScore - previousAnalysis.overallScore,
      industry_growth_signal: analysis.techTrend    - previousAnalysis.techTrend,
      market_demand_signal:   analysis.demandLevel  - previousAnalysis.demandLevel,
      skill_competitiveness:  avgSkillScore         - prevAvgSkill,
      skill_deltas: analysis.skills
        .map(s => {
          const prev = previousAnalysis!.skills.find(ps => ps.name === s.name);
          return prev ? { name: s.name, delta: s.score - prev.score } : null;
        })
        .filter(Boolean),
    };

    userPrompt += `\n\n━━━━━━━━━━━━━━━━━━\n[PREVIOUS_ANALYSIS]\n━━━━━━━━━━━━━━━━━━\n\n${JSON.stringify({
      overallScore: previousAnalysis.overallScore,
      techTrend: previousAnalysis.techTrend,
      demandLevel: previousAnalysis.demandLevel,
      skills: previousAnalysis.skills,
    }, null, 2)}\n\n━━━━━━━━━━━━━━━━━━\n[TREND_DELTA] (사전 계산값 — 반드시 그대로 사용)\n━━━━━━━━━━━━━━━━━━\n\n${JSON.stringify(deltas, null, 2)}`;
  }

  return userPrompt;
}

/** Verify payment credential before generating report */
async function verifyPayment(
  credential: PaymentCredential,
  supabaseUrl: string,
  serviceRoleKey: string,
  authHeader: string,
): Promise<{ ok: boolean; userId?: string; userEmail?: string; error?: string; status?: number }> {
  if (credential.paymentType === 'one_time') {
    // Validate order in Supabase
    const res = await fetch(
      `${supabaseUrl}/rest/v1/orders?polar_checkout_id=eq.${encodeURIComponent(credential.orderId)}&select=status,report_generated`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    );
    const orders: any[] = await res.json();
    if (!orders.length) {
      return { ok: false, error: 'Order not found', status: 402 };
    }
    const order = orders[0];
    if (order.status !== 'succeeded') {
      return { ok: false, error: 'Payment not completed', status: 402 };
    }
    if (order.report_generated) {
      return { ok: false, error: 'Report already generated for this order', status: 402 };
    }
    return { ok: true };
  }

  if (credential.paymentType === 'subscription') {
    // Verify JWT
    if (!authHeader.startsWith('Bearer ')) {
      return { ok: false, error: 'Missing authorization token', status: 401 };
    }
    const jwt = authHeader.slice(7);

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: serviceRoleKey,
      },
    });

    if (!userRes.ok) {
      return { ok: false, error: 'Invalid token', status: 401 };
    }

    const userData: any = await userRes.json();
    const userId: string = userData.id;
    const userEmail: string = userData.email ?? '';

    // Check subscription status
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=subscription_status`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    );
    const profiles: any[] = await profileRes.json();
    if (!profiles.length || profiles[0].subscription_status !== 'active') {
      return { ok: false, error: 'No active subscription', status: 402 };
    }

    // Increment daily usage atomically
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_daily_usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ p_user_id: userId }),
    });

    if (!rpcRes.ok) {
      return { ok: false, error: 'Usage tracking failed', status: 500 };
    }

    const count: number = await rpcRes.json();
    if (count > 1) {
      return { ok: false, error: 'Daily report limit reached (1 per day)', status: 402 };
    }

    return { ok: true, userId, userEmail };
  }

  return { ok: false, error: 'Unknown payment type', status: 400 };
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;

  if (!env.OPENAI_API_KEY) {
    return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  if (!supabaseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Database not configured' }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.careerInput || !body.analysis) {
    return Response.json({ error: 'Missing careerInput or analysis' }, { status: 400 });
  }

  // Payment gate
  if (!body.credential) {
    return Response.json({ error: 'Payment required' }, { status: 402 });
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  const paymentCheck = await verifyPayment(
    body.credential,
    supabaseUrl,
    env.SUPABASE_SERVICE_ROLE_KEY,
    authHeader,
  );

  if (!paymentCheck.ok) {
    return Response.json(
      { error: paymentCheck.error },
      { status: paymentCheck.status ?? 402 },
    );
  }

  // Provide defaults for new fields if missing (backward compatibility)
  body.careerInput.careerPath = body.careerInput.careerPath || body.careerInput.jobTitle || '';
  body.careerInput.leadershipExperience = body.careerInput.leadershipExperience || 'false';
  body.careerInput.globalExperience = body.careerInput.globalExperience || 'false';

  // Fetch previous analysis for subscription users (trend comparison)
  let previousAnalysis: RequestBody['analysis'] | null = null;
  if (body.credential.paymentType === 'subscription' && paymentCheck.userId) {
    const spRes = await fetch(
      `${supabaseUrl}/rest/v1/subscriber_profiles?user_id=eq.${encodeURIComponent(paymentCheck.userId)}&select=last_analysis`,
      { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } },
    );
    const spData: any[] = await spRes.json();
    if (spData[0]?.last_analysis) previousAnalysis = spData[0].last_analysis;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(body, previousAnalysis) },
        ],
        temperature: 0.5,
        max_tokens: 6000,
      }),
    });

    if (!res.ok) {
      return Response.json(
        { error: `OpenAI API error: ${res.status}` },
        { status: 502 },
      );
    }

    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return Response.json({ error: 'Empty response from OpenAI' }, { status: 502 });
    }

    // Parse the JSON response from OpenAI
    const cleaned = content.replace(/```json\n?|```\n?/g, '').trim();
    const report = JSON.parse(cleaned);

    const sbHeaders = {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
    };

    // Mark one-time order as report generated
    if (body.credential.paymentType === 'one_time') {
      await fetch(
        `${supabaseUrl}/rest/v1/orders?polar_checkout_id=eq.${encodeURIComponent(body.credential.orderId)}`,
        {
          method: 'PATCH',
          headers: sbHeaders,
          body: JSON.stringify({ report_generated: true }),
        },
      );
    }

    // 구독 유저: 최신 커리어 데이터 upsert → 일일 이메일 발송용
    if (
      body.credential.paymentType === 'subscription' &&
      paymentCheck.userId &&
      paymentCheck.userEmail
    ) {
      await fetch(`${supabaseUrl}/rest/v1/subscriber_profiles?on_conflict=user_id`, {
        method: 'POST',
        headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          user_id: paymentCheck.userId,
          email: paymentCheck.userEmail,
          career_input: body.careerInput,
          last_analysis: body.analysis,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    return Response.json(report);
  } catch (err: any) {
    return Response.json(
      { error: err.message || 'Failed to generate report' },
      { status: 500 },
    );
  }
};
