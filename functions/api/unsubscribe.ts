/**
 * GET /api/unsubscribe?token={unsubscribe_token}
 * 이메일 링크 클릭 시 비로그인 수신 거부 처리
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_SUPABASE_URL: string;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;

  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(unsubscribeHtml('오류', '유효하지 않은 수신 거부 링크입니다.', false), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 400,
    });
  }

  const patchRes = await fetch(
    `${supabaseUrl}/rest/v1/subscriber_profiles?unsubscribe_token=eq.${encodeURIComponent(token)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email_enabled: false }),
    },
  );

  if (!patchRes.ok) {
    return new Response(unsubscribeHtml('오류', '처리 중 오류가 발생했습니다. 다시 시도해주세요.', false), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 500,
    });
  }

  return new Response(unsubscribeHtml('수신 거부 완료', '이메일 수신이 거부되었습니다. 마이페이지에서 다시 설정할 수 있습니다.', true), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};

function unsubscribeHtml(title: string, message: string, success: boolean): string {
  const icon = success ? '✅' : '❌';
  const color = success ? '#16a34a' : '#dc2626';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} – CareerLens</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #fff; border-radius: 16px; padding: 48px 40px; max-width: 420px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { margin: 0 0 12px; font-size: 22px; color: ${color}; }
    p { margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.6; }
    a { display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">CareerLens 홈으로</a>
  </div>
</body>
</html>`;
}
