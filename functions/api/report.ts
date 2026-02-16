interface Env {
  OPENAI_API_KEY: string;
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
  };
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
12. Use structured visual formatting:
   - Section dividers
   - Compact comparison tables
   - Bullet hierarchy
   - Visual emphasis markers (■, ▲, ▼, →)
13. Keep paragraphs under 4 lines.
14. Maintain analytical tone. No emotional encouragement.
15. Optimize for mobile readability.
16. Never mention OpenAI, GPT, or internal reasoning.
17. Respond in the SAME LANGUAGE as the user's input (if Korean input, respond in Korean; if English, respond in English).

Your role is structured strategic interpretation and narrative synthesis only.

OUTPUT FORMAT:
Output a valid JSON object with the following structure. No markdown fences, no extra text outside JSON.
{
  "content": "Full markdown report following the template below",
  "summary": "2-3 sentence executive summary",
  "skillInsights": [{"name": "skill name", "analysis": "1-2 sentence analysis"}],
  "roadmap": {
    "month3": ["actionable item 1", "actionable item 2"],
    "month6": ["actionable item 1", "actionable item 2"],
    "month12": ["actionable item 1", "actionable item 2"]
  }
}

The "content" field must follow this template structure:

# CareerLens Strategic Career Report

━━━━━━━━━━━━━━━━━━
## 1️⃣ Executive Strategic Snapshot
━━━━━━━━━━━━━━━━━━

■ Industry Position: [Strong/Stable/Weak]
■ Market Demand: [Strong/Stable/Weak]
■ Skill Competitiveness: [Strong/Stable/Weak]
■ Structural Risk Level: 요약
■ Immediate Strategic Focus: 한 문장 요약

→ 5줄 이내로 전체 전략 구조 요약

---

━━━━━━━━━━━━━━━━━━
## 2️⃣ Industry Market Analysis
━━━━━━━━━━━━━━━━━━

### Signal Comparison Table

| Signal | User | Market Avg | Gap | Classification |
|--------|------|------------|-----|----------------|

### ■ Industry Growth
- User: XX / 100
- Market Avg: XX / 100
- Gap: ±XX
- Interpretation:

### ■ Market Demand
(same structure)

→ 제공된 신호만으로 산업 내 구조적 위치 해석

---

━━━━━━━━━━━━━━━━━━
## 3️⃣ Skill Portfolio Structural Analysis
━━━━━━━━━━━━━━━━━━

### Competency Matrix

| Domain | User | Market Avg | Gap | Level |
|--------|------|------------|-----|-------|

각 항목별 해석:

■ Skill Competitiveness
■ DX Alignment
■ Leadership Signal
■ Global Portability

▲ 구조적 강점
▼ 구조적 취약 영역

---

━━━━━━━━━━━━━━━━━━
## 4️⃣ Career Structural Diagnosis
━━━━━━━━━━━━━━━━━━

### ▪ 현재 커리어 단계 정의
(데이터 기반으로 정의)

### ▪ 구조적 강점 3가지

### ▪ 구조적 리스크 3가지

### ▪ 포지셔닝 명확성 평가

---

━━━━━━━━━━━━━━━━━━
## 5️⃣ Career Development Roadmap
━━━━━━━━━━━━━━━━━━

### 📌 0~3개월 (단기 보완)
- Trend ≥ 70 AND Gap ≥ 20 항목 우선

### 📌 3~6개월 (경쟁력 강화)
- 구조적 약점 보완

### 📌 6~12개월 (전략적 재포지셔닝)
- Gap ≥ 40 항목 중심

→ 각 단계는 실행 중심 문장으로 작성

---

━━━━━━━━━━━━━━━━━━
## 6️⃣ Structural Data Transparency
━━━━━━━━━━━━━━━━━━

- 본 리포트는 구조화된 Decision Signals 기반 분석입니다.
- 외부 검색이나 확률 예측을 사용하지 않았습니다.
- 데이터 부족 영역은 명시적으로 제외했습니다.`;

function buildUserPrompt(body: RequestBody): string {
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
수치 표현 규칙
━━━━━━━━━━━━━━━━━━

- 소숫점은 1자리까지 허용
- 3자리 이상 수치는 소숫점 생략
- 모든 수치는 단위 포함
- 비교 기준 반드시 명시`;

  return userPrompt;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.OPENAI_API_KEY) {
    return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
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

  // Provide defaults for new fields if missing (backward compatibility)
  body.careerInput.careerPath = body.careerInput.careerPath || body.careerInput.jobTitle || '';
  body.careerInput.leadershipExperience = body.careerInput.leadershipExperience || 'false';
  body.careerInput.globalExperience = body.careerInput.globalExperience || 'false';

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
          { role: 'user', content: buildUserPrompt(body) },
        ],
        temperature: 0.5,
        max_tokens: 4000,
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

    return Response.json(report);
  } catch (err: any) {
    return Response.json(
      { error: err.message || 'Failed to generate report' },
      { status: 500 },
    );
  }
};
