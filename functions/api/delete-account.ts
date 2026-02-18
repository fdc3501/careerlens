interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jwt = authHeader.slice(7);

  // Verify JWT and get user info
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  if (!userRes.ok) {
    return Response.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  const user = (await userRes.json()) as { id: string };

  // Delete user via Supabase Admin API (requires service role key)
  const deleteRes = await fetch(
    `${env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  );

  if (!deleteRes.ok) {
    let errMsg = '계정 삭제에 실패했습니다.';
    try {
      const err = (await deleteRes.json()) as { message?: string };
      if (err.message) errMsg = err.message;
    } catch {
      // ignore parse error
    }
    return Response.json({ error: errMsg }, { status: 500 });
  }

  return Response.json({ success: true });
};
