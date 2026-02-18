/**
 * GET  /api/email-preferences  → { emailEnabled: boolean }
 * PATCH /api/email-preferences  → { emailEnabled: boolean }
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_SUPABASE_URL: string;
}

async function getUser(supabaseUrl: string, serviceKey: string, jwt: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: serviceKey,
    },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; email: string }>;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;

  const auth = request.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUser(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, auth.slice(7));
  if (!user) return Response.json({ error: 'Invalid token' }, { status: 401 });

  const res = await fetch(
    `${supabaseUrl}/rest/v1/subscriber_profiles?user_id=eq.${user.id}&select=email_enabled`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );

  const rows: { email_enabled: boolean }[] = await res.json();
  const emailEnabled = rows[0]?.email_enabled ?? true;

  return Response.json({ emailEnabled });
};

export const onRequestPatch = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;

  const auth = request.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUser(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, auth.slice(7));
  if (!user) return Response.json({ error: 'Invalid token' }, { status: 401 });

  let body: { emailEnabled: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const patchRes = await fetch(
    `${supabaseUrl}/rest/v1/subscriber_profiles?user_id=eq.${user.id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email_enabled: body.emailEnabled }),
    },
  );

  if (!patchRes.ok) {
    return Response.json({ error: 'Update failed' }, { status: 500 });
  }

  return Response.json({ emailEnabled: body.emailEnabled });
};
