interface Env {
  POLAR_ACCESS_TOKEN: string;
  POLAR_PRODUCT_ID_ONE_TIME: string;
  POLAR_PRODUCT_ID_SUBSCRIPTION: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_SUPABASE_URL: string;
}

interface RequestBody {
  type: 'one_time' | 'subscription';
  pendingSessionKey: string;
  userId?: string;
  customerEmail?: string;
  successOrigin: string;
}

const POLAR_SANDBOX_API = 'https://sandbox-api.polar.sh';

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;

  if (!env.POLAR_ACCESS_TOKEN || !supabaseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { type, pendingSessionKey, userId, customerEmail, successOrigin } = body;

  if (!type || !pendingSessionKey || !successOrigin) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const productId = type === 'subscription'
    ? env.POLAR_PRODUCT_ID_SUBSCRIPTION
    : env.POLAR_PRODUCT_ID_ONE_TIME;

  if (!productId) {
    return Response.json({ error: 'Product not configured' }, { status: 500 });
  }

  // success_url: query string must be BEFORE # so window.location.search can read it
  const successUrl = `${successOrigin}/?checkout_id={CHECKOUT_ID}#/payment-success`;

  try {
    // Create Polar checkout session
    const polarRes = await fetch(`${POLAR_SANDBOX_API}/v1/checkouts/custom/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: successUrl,
        customer_email: customerEmail || undefined,
        metadata: {
          pending_session_key: pendingSessionKey,
          ...(userId ? { user_id: userId } : {}),
          payment_type: type,
        },
      }),
    });

    if (!polarRes.ok) {
      const errText = await polarRes.text();
      console.error('Polar API error:', polarRes.status, errText);
      return Response.json({ error: `Polar API error: ${polarRes.status}` }, { status: 502 });
    }

    const polarData: any = await polarRes.json();
    const checkoutUrl: string = polarData.url;
    const checkoutId: string = polarData.id;

    if (!checkoutUrl || !checkoutId) {
      return Response.json({ error: 'Invalid Polar response' }, { status: 502 });
    }

    // Insert pending order into Supabase
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        polar_checkout_id: checkoutId,
        user_id: userId || null,
        email: customerEmail || null,
        status: 'pending',
        payment_type: type,
        metadata_pending_session_key: pendingSessionKey,
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error('Supabase insert error:', insertRes.status, errText);
      // Don't block checkout if DB insert fails - log and continue
    }

    return Response.json({ checkoutUrl });
  } catch (err: any) {
    console.error('create-checkout error:', err);
    return Response.json({ error: err.message || 'Failed to create checkout' }, { status: 500 });
  }
};
