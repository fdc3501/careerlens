interface Env {
  OPENAI_API_KEY: string;
}

const SYSTEM_PROMPT = `You are a resume parser. Extract career information from the given resume text.

Rules:
- Output valid JSON only, no markdown fences or extra text
- If a field cannot be determined, use a reasonable default based on context
- experience should be a number string (years)
- skills should be comma-separated
- Respond in the SAME LANGUAGE as the resume (if Korean resume, respond in Korean; if English, respond in English)

Output format:
{
  "jobTitle": "current or most recent job title",
  "experience": "total years of experience as a number string",
  "skills": "comma-separated list of technical skills",
  "industry": "industry sector",
  "goal": "inferred career goal based on trajectory"
}`;

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.OPENAI_API_KEY) {
    return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  let body: { text: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.text || typeof body.text !== 'string') {
    return Response.json({ error: 'Missing text field' }, { status: 400 });
  }

  // Truncate to ~8000 chars to stay within token limits
  const text = body.text.slice(0, 8000);

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
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      return Response.json({ error: `OpenAI API error: ${res.status}` }, { status: 502 });
    }

    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return Response.json({ error: 'Empty response from OpenAI' }, { status: 502 });
    }

    const cleaned = content.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return Response.json(parsed);
  } catch (err: any) {
    return Response.json(
      { error: err.message || 'Failed to parse resume' },
      { status: 500 },
    );
  }
};
