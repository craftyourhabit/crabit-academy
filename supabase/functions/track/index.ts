/* =====================================================================
   크래빗 아카데미 - 방문 기록 접수 (Supabase Edge Function)

   assets/track.js 가 보내는 페이지뷰와 아웃바운드 클릭을 받아 academy_events 표에
   넣습니다. 방문자는 로그인하지 않으므로 JWT 검사를 끄고(config.toml 의
   [functions.track]), 대신 여기서 직접 걸러요. 비밀 메일함(mailbox)과 같은 방식입니다.

   - 표에는 service role 로만 넣습니다. anon 은 표에 아무 권한이 없어요(admin/supabase-analytics.sql).
   - 이름, 연락처, IP 원문은 받지도 저장하지도 않습니다.
   - IP 는 소금(TRACK_SALT)과 오늘 날짜(한국 시간)를 섞은 해시만 남깁니다.
     날마다 값이 바뀌어 날짜를 넘어 이어 붙일 수 없고, 도배 제한에만 씁니다.
   - 봇(검색엔진, 링크 미리보기)은 조용히 버립니다.
   - 기록이 실패해도 방문자 화면에는 아무 영향이 없도록 항상 짧게 답합니다.

   시크릿: ALLOWED_ORIGIN(예: https://craftyourhabit.github.io, 쉼표로 여러 개 가능),
          TRACK_SALT(아무 긴 문자열)
   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 는 Supabase 가 자동으로 넣어 줍니다.
   ===================================================================== */

const RATE_WINDOW_SEC = 60;
const RATE_MAX = 120;            // 같은 IP 해시에서 1분에 120건 넘으면 버립니다
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|curl|wget|python-requests/i;

function allowedOrigins(): string[] | null {
  const raw = (Deno.env.get("ALLOWED_ORIGIN") || "").trim();
  if (!raw) return null;                               // 비어 있으면 모두 허용(설정 전 확인용)
  return raw.split(",").map((s) => {
    try { return new URL(s.trim()).origin; } catch { return ""; }
  }).filter(Boolean);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const list = allowedOrigins();
  let allow = "*";
  if (list) {
    if (!origin || !list.includes(origin)) return { "Vary": "Origin" };
    allow = origin;
  }
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function reply(origin: string | null, status = 204) {
  return new Response(null, { status, headers: corsHeaders(origin) });
}

/* 문자열 하나를 정리합니다. 제어문자를 지우고 길이를 자릅니다. */
function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return s ? s.slice(0, max) : null;
}

/* UTM 값은 소문자로 통일합니다. Instagram 과 instagram 이 따로 잡히지 않게요. */
function utm(v: unknown): string | null {
  const s = str(v, 100);
  return s ? s.toLowerCase() : null;
}

function host(v: unknown): string | null {
  const s = str(v, 120);
  if (!s) return null;
  return /^[a-z0-9.-]+(:\d+)?$/i.test(s) ? s.toLowerCase() : null;
}

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return reply(origin);
  if (req.method !== "POST") return reply(origin, 405);

  /* 허용한 사이트에서 온 요청만 받습니다. */
  const list = allowedOrigins();
  if (list && (!origin || !list.includes(origin))) return reply(origin, 403);

  /* 봇이면 저장하지 않고 성공처럼 답합니다. */
  const ua = req.headers.get("user-agent") || "";
  if (!ua || BOT_UA.test(ua)) return reply(origin);

  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return reply(origin, 500);

  /* track.js 는 미리 확인 요청(OPTIONS)이 생기지 않게 text/plain 으로 JSON 을 보냅니다. */
  const raw = await req.text().catch(() => "");
  if (!raw || raw.length > 4000) return reply(origin, 400);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return reply(origin, 400); }
  if (!body || typeof body !== "object") return reply(origin, 400);

  const type = body.type === "outbound" ? "outbound" : body.type === "pageview" ? "pageview" : null;
  const path = str(body.path, 200);
  const visitorId = str(body.visitor_id, 40);
  if (!type || !path || !path.startsWith("/")) return reply(origin, 400);
  if (!visitorId || !/^[a-z0-9]{8,40}$/.test(visitorId)) return reply(origin, 400);

  /* 어드민 화면은 세지 않습니다. */
  if (/^\/admin(\/|$)/.test(path)) return reply(origin);

  const label = type === "outbound" ? (str(body.label, 60) || "outbound-link") : null;
  if (label && !/^[a-z0-9_-]+$/i.test(label)) return reply(origin, 400);

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const salt = Deno.env.get("TRACK_SALT") || "crabit-track";
  const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const ipHash = (await sha256hex(salt + ":" + day + ":" + ip)).slice(0, 32);

  const rest = url + "/rest/v1/academy_events";
  const headers = { "apikey": service, "Authorization": "Bearer " + service, "Content-Type": "application/json" };

  /* 같은 IP 해시에서 1분에 너무 많이 오면 버립니다. */
  const since = new Date(Date.now() - RATE_WINDOW_SEC * 1000).toISOString();
  const cnt = await fetch(rest + "?select=id&ip_hash=eq." + ipHash + "&created_at=gte." + encodeURIComponent(since), {
    method: "HEAD",
    headers: { ...headers, "Prefer": "count=exact" },
  }).catch(() => null);
  if (cnt) {
    const total = Number((cnt.headers.get("content-range") || "*/0").split("/")[1] || 0);
    if (total >= RATE_MAX) return reply(origin, 429);
  }

  const u = (body.utm && typeof body.utm === "object") ? body.utm as Record<string, unknown> : {};
  const row = {
    type,
    path,
    event_id: str(body.event_id, 60),
    label,
    target_host: type === "outbound" ? host(body.target_host) : null,
    utm_source: utm(u.source),
    utm_medium: utm(u.medium),
    utm_campaign: utm(u.campaign),
    utm_content: utm(u.content),
    utm_term: utm(u.term),
    referrer_host: host(body.referrer_host),
    visitor_id: visitorId,
    ip_hash: ipHash,
  };

  const ins = await fetch(rest, {
    method: "POST",
    headers: { ...headers, "Prefer": "return=minimal" },
    body: JSON.stringify(row),
  }).catch(() => null);
  if (!ins || !ins.ok) return reply(origin, 500);
  return reply(origin);
});
