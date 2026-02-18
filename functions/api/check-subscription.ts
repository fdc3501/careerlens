interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_SUPABASE_URL: string;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;

  if (!supabaseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Missing authorization' }, { status: 401 });
  }

  const jwt = authHeader.slice(7);

  // Verify JWT and get user
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  if (!userRes.ok) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userData: any = await userRes.json();
  const userId: string = userData.id;

  // Get subscription status from profiles
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=subscription_status`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );

  const profiles: any[] = await profileRes.json();
  const subscriptionStatus = profiles[0]?.subscription_status ?? 'none';
  const active = subscriptionStatus === 'active';

  if (!active) {
    return Response.json({ active: false, limitReached: false, resetAt: null });
  }

  // Check today's usage
  const today = new Date().toISOString().split('T')[0];
  const usageRes = await fetch(
    `${supabaseUrl}/rest/v1/daily_usage?user_id=eq.${encodeURIComponent(userId)}&usage_date=eq.${today}&select=report_count`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );

  const usageData: any[] = await usageRes.json();
  const reportCount = usageData[0]?.report_count ?? 0;
  const limitReached = reportCount >= 1;

  // Reset at midnight UTC
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  return Response.json({
    active: true,
    limitReached,
    resetAt: tomorrow.toISOString(),
  });
};
