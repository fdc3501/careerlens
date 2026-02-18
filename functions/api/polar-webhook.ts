interface Env {
  POLAR_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_SUPABASE_URL: string;
}

// Verify Standard Webhooks signature using Web Crypto API
async function verifyWebhookSignature(
  payload: string,
  headers: { id: string; timestamp: string; signature: string },
  secret: string,
): Promise<boolean> {
  try {
    // Standard Webhooks: sign message = "{webhook-id}.{webhook-timestamp}.{body}"
    const signedContent = `${headers.id}.${headers.timestamp}.${payload}`;

    // Secret may have "whsec_" prefix - decode base64 portion
    const rawSecret = secret.startsWith('whsec_')
      ? secret.slice(6)
      : secret;

    // Import the key
    const keyData = Uint8Array.from(atob(rawSecret), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    // Compute HMAC-SHA256
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));

    // Base64 encode the computed signature
    const computed = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // The signature header may contain multiple signatures (space-separated v1,<sig>)
    const signatures = headers.signature.split(' ');
    for (const sig of signatures) {
      const sigValue = sig.startsWith('v1,') ? sig.slice(3) : sig;
      if (sigValue === computed) return true;
    }
    return false;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;

  if (!env.POLAR_WEBHOOK_SECRET || !supabaseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const webhookId = request.headers.get('webhook-id') ?? '';
  const webhookTimestamp = request.headers.get('webhook-timestamp') ?? '';
  const webhookSignature = request.headers.get('webhook-signature') ?? '';

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return Response.json({ error: 'Missing webhook headers' }, { status: 400 });
  }

  const payload = await request.text();

  // Verify signature
  const valid = await verifyWebhookSignature(
    payload,
    { id: webhookId, timestamp: webhookTimestamp, signature: webhookSignature },
    env.POLAR_WEBHOOK_SECRET,
  );

  if (!valid) {
    console.error('Invalid webhook signature');
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType: string = event.type;
  const data = event.data;

  const sbHeaders = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    Prefer: 'return=minimal',
  };

  try {
    if (eventType === 'order.paid') {
      // Update order status to succeeded
      const checkoutId = data.checkout?.id ?? data.checkout_id ?? '';
      const orderId = data.id ?? '';

      if (checkoutId) {
        await fetch(
          `${supabaseUrl}/rest/v1/orders?polar_checkout_id=eq.${encodeURIComponent(checkoutId)}`,
          {
            method: 'PATCH',
            headers: sbHeaders,
            body: JSON.stringify({ status: 'succeeded', polar_order_id: orderId }),
          },
        );
      }
    } else if (eventType === 'subscription.created') {
      // Insert subscription + update profile subscription_status
      const userId: string = data.metadata?.user_id ?? data.customer?.external_id ?? '';
      const email: string = data.customer?.email ?? '';
      const subId: string = data.id ?? '';
      const currentPeriodEnd: string | null = data.current_period_end ?? null;

      if (userId && subId) {
        await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
          method: 'POST',
          headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({
            polar_subscription_id: subId,
            user_id: userId,
            email,
            status: 'active',
            current_period_end: currentPeriodEnd,
          }),
        });

        await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
          {
            method: 'PATCH',
            headers: sbHeaders,
            body: JSON.stringify({ subscription_status: 'active' }),
          },
        );
      }
    } else if (eventType === 'subscription.updated') {
      const subId: string = data.id ?? '';
      const status: string = data.status ?? 'active';
      const currentPeriodEnd: string | null = data.current_period_end ?? null;

      if (subId) {
        await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?polar_subscription_id=eq.${encodeURIComponent(subId)}`,
          {
            method: 'PATCH',
            headers: sbHeaders,
            body: JSON.stringify({ status, current_period_end: currentPeriodEnd }),
          },
        );
      }
    } else if (eventType === 'subscription.revoked') {
      const subId: string = data.id ?? '';
      const userId: string = data.metadata?.user_id ?? data.customer?.external_id ?? '';

      if (subId) {
        await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?polar_subscription_id=eq.${encodeURIComponent(subId)}`,
          {
            method: 'PATCH',
            headers: sbHeaders,
            body: JSON.stringify({ status: 'revoked' }),
          },
        );
      }

      if (userId) {
        await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
          {
            method: 'PATCH',
            headers: sbHeaders,
            body: JSON.stringify({ subscription_status: 'none' }),
          },
        );
      }
    }

    return Response.json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return Response.json({ error: err.message || 'Processing failed' }, { status: 500 });
  }
};
