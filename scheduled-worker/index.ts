/**
 * CareerLens 일일 이메일 스케줄러
 * 매일 06:00 KST (21:00 UTC) 구독 활성 유저에게 커리어 인사이트 + 업계 뉴스 이메일 발송
 *
 * 배포: cd scheduled-worker && npx wrangler deploy
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  APP_URL: string;           // 예: https://careerlens.pages.dev
  EMAIL_FROM: string;        // 예: CareerLens <no-reply@careerlens.com>
  OPENAI_API_KEY?: string;   // 선택 — AI 업계 브리핑 생성 시 사용
}

interface Subscriber {
  user_id: string;
  email: string;
  career_input: CareerInput;
  last_analysis: AnalysisResult | null;
  unsubscribe_token: string;
}

interface CareerInput {
  jobTitle: string;
  experience: string;
  skills: string;
  industry: string;
  careerPath?: string;
  goal?: string;
}

interface AnalysisResult {
  overallScore: number;
  marketPosition: number;
  techTrend: number;
  demandLevel: number;
  skills: { name: string; score: number; marketAvg: number }[];
}

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

// ────────────────────────────────────────────────
// 메인 스케줄 핸들러
// ────────────────────────────────────────────────
export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    console.log('[EmailScheduler] 일일 이메일 발송 시작');

    const sbHeaders = {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    };

    // 1. 활성 구독자 조회 (RPC: get_active_email_subscribers)
    const rpcRes = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/get_active_email_subscribers`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!rpcRes.ok) {
      const err = await rpcRes.text();
      console.error('[EmailScheduler] 구독자 조회 실패:', err);
      return;
    }

    const subscribers = (await rpcRes.json()) as Subscriber[];
    console.log(`[EmailScheduler] 발송 대상: ${subscribers.length}명`);

    let sent = 0;
    let failed = 0;

    // 2. 각 구독자에게 이메일 발송
    for (const sub of subscribers) {
      const { success, error } = await sendDailyEmail(sub, env);

      // 3. 발송 결과 기록
      const now = new Date().toISOString();

      if (success) {
        sent++;
        // last_email_sent_at 업데이트
        await fetch(
          `${env.SUPABASE_URL}/rest/v1/subscriber_profiles?user_id=eq.${sub.user_id}`,
          {
            method: 'PATCH',
            headers: { ...sbHeaders, Prefer: 'return=minimal' },
            body: JSON.stringify({ last_email_sent_at: now }),
          },
        );
      } else {
        failed++;
        console.error(`[EmailScheduler] 발송 실패 (${sub.email}):`, error);
      }

      // email_logs 기록
      await fetch(`${env.SUPABASE_URL}/rest/v1/email_logs`, {
        method: 'POST',
        headers: { ...sbHeaders, Prefer: 'return=minimal' },
        body: JSON.stringify({
          user_id: sub.user_id,
          email: sub.email,
          subject: buildSubject(sub.career_input),
          sent_at: now,
          status: success ? 'sent' : 'failed',
          error_message: error ?? null,
        }),
      });
    }

    console.log(`[EmailScheduler] 완료 — 성공: ${sent}, 실패: ${failed}`);
  },
};

// ────────────────────────────────────────────────
// 이메일 발송 (Resend API)
// ────────────────────────────────────────────────
async function sendDailyEmail(
  sub: Subscriber,
  env: Env,
): Promise<{ success: boolean; error?: string }> {
  try {
    // 업계 뉴스 & AI 브리핑 병렬 fetch (실패해도 이메일은 발송)
    const [news, briefing] = await Promise.all([
      fetchIndustryNews(sub.career_input.industry, sub.career_input.jobTitle),
      env.OPENAI_API_KEY
        ? generateIndustryBriefing(sub.career_input, env.OPENAI_API_KEY)
        : Promise.resolve(null),
    ]);

    const html = buildEmailHtml(sub, env.APP_URL, news, briefing);
    const subject = buildSubject(sub.career_input);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'CareerLens <no-reply@careerlens.com>',
        to: [sub.email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Resend ${res.status}: ${body}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ────────────────────────────────────────────────
// 업계 뉴스 fetch (Google News RSS — 무료, API 키 불필요)
// ────────────────────────────────────────────────
async function fetchIndustryNews(industry: string, jobTitle: string): Promise<NewsItem[]> {
  const query = encodeURIComponent(`${industry} ${jobTitle} 채용 동향 트렌드`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CareerLens/1.0)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    return parseRssItems(xml).slice(0, 5);
  } catch (e) {
    console.warn('[fetchIndustryNews] 뉴스 조회 실패 (무시):', e);
    return [];
  }
}

function parseRssItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = extractCdata(content, 'title') ?? extractTagText(content, 'title');
    const link = extractTagText(content, 'link') ?? extractTagText(content, 'guid');
    const source = extractCdata(content, 'source') ?? extractTagText(content, 'source');
    const pubDate = extractTagText(content, 'pubDate');

    if (title && link) {
      items.push({ title, link, source: source ?? '', pubDate: pubDate ?? '' });
    }
  }

  return items;
}

function extractCdata(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

function extractTagText(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

// ────────────────────────────────────────────────
// AI 업계 브리핑 (OpenAI — OPENAI_API_KEY가 있을 때만 실행)
// ────────────────────────────────────────────────
async function generateIndustryBriefing(
  ci: CareerInput,
  apiKey: string,
): Promise<string | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content:
              '당신은 채용 시장 분석 전문가입니다. 주어진 업종/직종에 대한 오늘의 업계 시황을 3문장 이내로 간결하게 한국어로 요약해주세요. 구체적인 수치나 최신 트렌드를 언급하고, 구직자/현직자에게 실용적인 인사이트를 제공하세요.',
          },
          {
            role: 'user',
            content: `업종: ${ci.industry}\n직종: ${ci.jobTitle}\n경력: ${ci.experience}년\n\n오늘의 업계 시황을 3문장 이내로 요약해주세요.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (e) {
    console.warn('[generateIndustryBriefing] AI 브리핑 생성 실패 (무시):', e);
    return null;
  }
}

// ────────────────────────────────────────────────
// 이메일 제목
// ────────────────────────────────────────────────
function buildSubject(input: CareerInput): string {
  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  return `[CareerLens] ${today} ${escHtml(input.industry)} 업계 뉴스 & 커리어 인사이트`;
}

// ────────────────────────────────────────────────
// 이메일 HTML 빌드
// ────────────────────────────────────────────────
function buildEmailHtml(
  sub: Subscriber,
  appUrl: string,
  news: NewsItem[],
  briefing: string | null,
): string {
  const { career_input: ci, last_analysis: analysis, unsubscribe_token } = sub;

  const score = analysis?.overallScore ?? 0;
  const level = score >= 70 ? 'Strong 🟢' : score >= 40 ? 'Stable 🟡' : 'Weak 🔴';
  const levelColor = score >= 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626';

  // 기술 갭 상위 3개 (Gap이 큰 순)
  const topGaps = (analysis?.skills ?? [])
    .map(s => ({ ...s, gap: s.marketAvg - s.score }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);

  const gapRows = topGaps.length > 0
    ? topGaps.map(s => `
        <tr>
          <td style="padding:8px 12px;font-size:14px;color:#374151;border-bottom:1px solid #f1f5f9">${escHtml(s.name)}</td>
          <td style="padding:8px 12px;font-size:14px;color:#374151;border-bottom:1px solid #f1f5f9;text-align:center">${s.score}</td>
          <td style="padding:8px 12px;font-size:14px;color:#374151;border-bottom:1px solid #f1f5f9;text-align:center">${s.marketAvg}</td>
          <td style="padding:8px 12px;font-size:14px;font-weight:600;border-bottom:1px solid #f1f5f9;text-align:center;color:${s.gap >= 20 ? '#dc2626' : '#16a34a'}">
            ${s.gap > 0 ? '+' : ''}${s.gap}
          </td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding:12px;text-align:center;color:#9ca3af;font-size:13px">스킬 데이터가 없습니다</td></tr>`;

  // 뉴스 섹션 HTML
  const newsSection = news.length > 0 ? `
    <!-- 업계 뉴스 -->
    <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0">
      <h2 style="margin:0 0 4px;font-size:16px;font-weight:700;color:#0f172a">📰 오늘의 ${escHtml(ci.industry)} 업계 뉴스</h2>
      <p style="margin:0 0 16px;font-size:12px;color:#94a3b8">Google News 기준 최신 업계 소식</p>
      ${briefing ? `
      <div style="background:#f0f9ff;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:16px">
        <p style="margin:0;font-size:13px;color:#1e3a5f;line-height:1.6">🤖 <strong>AI 업계 브리핑:</strong> ${escHtml(briefing)}</p>
      </div>
      ` : ''}
      <ul style="margin:0;padding:0;list-style:none">
        ${news.map((item, idx) => `
        <li style="padding:10px 0;${idx < news.length - 1 ? 'border-bottom:1px solid #f1f5f9' : ''}">
          <a href="${escHtml(item.link)}"
             style="font-size:14px;font-weight:600;color:#1e293b;text-decoration:none;display:block;margin-bottom:4px;line-height:1.4">
            ${escHtml(item.title)}
          </a>
          <span style="font-size:12px;color:#94a3b8">
            ${item.source ? escHtml(item.source) + ' · ' : ''}${formatPubDate(item.pubDate)}
          </span>
        </li>`).join('')}
      </ul>
    </div>` : '';

  const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${unsubscribe_token}`;
  const reportUrl = `${appUrl}/#/mypage`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CareerLens 일일 인사이트</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">

    <!-- 헤더 -->
    <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:16px;padding:32px;margin-bottom:20px;text-align:center">
      <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:0.05em">CAREERLENS</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff">오늘의 커리어 인사이트</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8)">${escHtml(ci.jobTitle)} · ${escHtml(ci.experience)}년 경력 · ${escHtml(ci.industry)}</p>
    </div>

    <!-- 종합 점수 -->
    <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0;text-align:center">
      <p style="margin:0 0 4px;font-size:13px;color:#64748b">종합 커리어 점수</p>
      <p style="margin:0 0 4px;font-size:48px;font-weight:900;color:#0f172a">${score}</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:${levelColor}">${level}</p>
    </div>

    <!-- 시그널 요약 -->
    <div style="display:flex;gap:12px;margin-bottom:16px">
      ${analysis ? `
      <div style="flex:1;background:#fff;border-radius:12px;padding:16px;border:1px solid #e2e8f0;text-align:center">
        <p style="margin:0 0 2px;font-size:11px;color:#94a3b8">시장 포지션</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#0f172a">${analysis.marketPosition}</p>
      </div>
      <div style="flex:1;background:#fff;border-radius:12px;padding:16px;border:1px solid #e2e8f0;text-align:center">
        <p style="margin:0 0 2px;font-size:11px;color:#94a3b8">기술 트렌드</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#0f172a">${analysis.techTrend}</p>
      </div>
      <div style="flex:1;background:#fff;border-radius:12px;padding:16px;border:1px solid #e2e8f0;text-align:center">
        <p style="margin:0 0 2px;font-size:11px;color:#94a3b8">수요 수준</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#0f172a">${analysis.demandLevel}</p>
      </div>
      ` : '<p style="color:#94a3b8;font-size:13px">분석 데이터가 없습니다.</p>'}
    </div>

    ${newsSection}

    <!-- 기술 갭 분석 -->
    <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0f172a">🎯 오늘의 집중 포인트 — 기술 갭</h2>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0">스킬</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0">내 점수</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0">시장평균</th>
            <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0">Gap</th>
          </tr>
        </thead>
        <tbody>${gapRows}</tbody>
      </table>
      ${topGaps[0] && topGaps[0].gap >= 20 ? `
      <div style="margin-top:16px;padding:12px 16px;background:#fef3c7;border-radius:8px;border-left:3px solid #f59e0b">
        <p style="margin:0;font-size:13px;color:#92400e">
          ⚠️ <strong>${escHtml(topGaps[0].name)}</strong> 스킬의 Gap이 <strong>+${topGaps[0].gap}</strong>로 가장 큽니다. 오늘 30분 학습을 시작해보세요.
        </p>
      </div>
      ` : ''}
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px">
      <a href="${escHtml(reportUrl)}"
         style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700">
        전체 분석 리포트 보기 →
      </a>
    </div>

    <!-- 푸터 -->
    <div style="text-align:center;padding:16px">
      <p style="margin:0 0 8px;font-size:12px;color:#94a3b8">
        CareerLens · 데이터 기반 커리어 분석 서비스
      </p>
      <p style="margin:0;font-size:12px;color:#94a3b8">
        이 이메일을 받고 싶지 않으시면
        <a href="${escHtml(unsubscribeUrl)}" style="color:#6366f1;text-decoration:underline">여기를 클릭</a>하여 수신 거부하세요.
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────
function formatPubDate(pubDate: string): string {
  if (!pubDate) return '';
  try {
    return new Date(pubDate).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return pubDate;
  }
}

function escHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
