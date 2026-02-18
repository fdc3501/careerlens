interface Env {
  POLAR_ACCESS_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_SUPABASE_URL: string;
}

const POLAR_SANDBOX_API = 'https://sandbox-api.polar.sh';

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;

  if (!env.POLAR_ACCESS_TOKEN || !supabaseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const url = new URL(request.url);
  const checkoutId = url.searchParams.get('checkout_id');

  if (!checkoutId) {
    return Response.json({ error: 'Missing checkout_id' }, { status: 400 });
  }

  const sbHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  // 1. Check Supabase orders table first (webhook may have already updated it)
  const sbRes = await fetch(
    `${supabaseUrl}/rest/v1/orders?polar_checkout_id=eq.${encodeURIComponent(checkoutId)}&select=status,metadata_pending_session_key,payment_type`,
    { headers: sbHeaders },
  );
  const orders: any[] = await sbRes.json();
  const order = orders[0];

  if (order?.status === 'succeeded') {
    return Response.json({
      status: 'succeeded',
      metadata_pending_session_key: order.metadata_pending_session_key,
      payment_type: order.payment_type,
    });
  }

  if (order?.status === 'failed') {
    return Response.json({ status: 'failed' });
  }

  // 2. Order is still pending (or not found) — query Polar API directly
  //    This handles webhook delays without waiting 20+ seconds
  const polarRes = await fetch(
    `${POLAR_SANDBOX_API}/v1/checkouts/custom/${encodeURIComponent(checkoutId)}`,
    { headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}` } },
  );

  if (!polarRes.ok) {
    // Polar API error — return current DB status
    return Response.json({ status: order?.status ?? 'pending' });
  }

  const checkout: any = await polarRes.json();
  // Polar checkout statuses: open | confirmed | succeeded | expired | failed
  const polarStatus: string = checkout.status ?? 'open';

  if (polarStatus === 'succeeded' && order) {
    // Webhook hasn't arrived yet — manually mark order as succeeded
    await fetch(
      `${supabaseUrl}/rest/v1/orders?polar_checkout_id=eq.${encodeURIComponent(checkoutId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...sbHeaders,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ status: 'succeeded' }),
      },
    );
    return Response.json({
      status: 'succeeded',
      metadata_pending_session_key: order.metadata_pending_session_key,
      payment_type: order.payment_type,
    });
  }

  if (polarStatus === 'failed' || polarStatus === 'expired') {
    return Response.json({ status: 'failed' });
  }

  // Still open / confirmed — caller should keep polling
  return Response.json({ status: 'pending' });
};
