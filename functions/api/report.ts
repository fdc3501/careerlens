interface Env {
  OPENAI_API_KEY: string;
}

interface RequestBody {
  careerInput: {
    jobTitle: string;
    experience: string;
    skills: string;
    industry: string;
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

const SYSTEM_PROMPT = `You are a career analysis report generator. You produce structured career reports based on Decision Signals data.

Rules:
- NEVER use probability or prediction language. Use threshold-based assessments only.
- Thresholds: Strong (≥70), Stable (40-69), Weak (≤39)
- Respond in the SAME LANGUAGE as the user's input (if Korean input, respond in Korean; if English, respond in English)
- Output valid JSON only, no markdown fences or extra text

Output format:
{
  "summary": "A 2-3 sentence executive summary of the career position",
  "skillInsights": [{"name": "skill name", "analysis": "1-2 sentence analysis of this skill's market position"}],
  "roadmap": {
    "month3": ["actionable item 1", "actionable item 2"],
    "month6": ["actionable item 1", "actionable item 2"],
    "month12": ["actionable item 1", "actionable item 2"]
  }
}`;

function buildUserPrompt(body: RequestBody): string {
  const { careerInput, analysis } = body;
  return JSON.stringify({
    jobTitle: careerInput.jobTitle,
    experience: careerInput.experience,
    skills: careerInput.skills,
    industry: careerInput.industry,
    goal: careerInput.goal,
    scores: {
      overall: analysis.overallScore,
      marketPosition: analysis.marketPosition,
      techTrend: analysis.techTrend,
      demandLevel: analysis.demandLevel,
    },
    skillScores: analysis.skills.map(s => ({
      name: s.name,
      yourScore: s.score,
      marketAvg: s.marketAvg,
      gap: s.marketAvg - s.score,
    })),
  });
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
        temperature: 0.7,
        max_tokens: 1500,
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
