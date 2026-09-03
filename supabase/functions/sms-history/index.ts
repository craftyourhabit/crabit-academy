/* =====================================================================
   크래빗 아카데미 어드민 - 솔라피 발송 내역 조회 (Supabase Edge Function)

   솔라피로 실제 나간 문자 내역(번호, 시각, 성공/실패)을 어드민에서 바로
   보기 위한 읽기 전용 프록시입니다. 발송은 하지 않습니다.

   send-sms 와 같은 시크릿을 씁니다:
     SOLAPI_API_KEY, SOLAPI_API_SECRET, ALLOWED_ORIGIN
   ===================================================================== */

const SOLAPI = "https://api.solapi.com";

function safeOrigin(): string | null {
  const raw = (Deno.env.get("ALLOWED_ORIGIN") || "").trim();
  if (!raw) return "*";
  try {
    const u = new URL(raw);
    if (u.pathname !== "/" || u.search || u.hash) return null;
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

function corsHeaders() {
  const origin = safeOrigin();
  if (origin === null) return { "Vary": "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

async function verifyUser(req: Request): Promise<boolean> {
  const authz = req.headers.get("Authorization") || "";
  if (!authz.startsWith("Bearer ")) return false;
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return false;
  const res = await fetch(url + "/auth/v1/user", {
    headers: { "Authorization": authz, "apikey": anon },
  });
  if (!res.ok) return false;
  const user = await res.json().catch(() => null);
  return !!(user && user.id && user.aud === "authenticated");
}

async function solapiAuth(): Promise<string | null> {
  const key = Deno.env.get("SOLAPI_API_KEY");
  const secret = Deno.env.get("SOLAPI_API_SECRET");
  if (!key || !secret) return null;
  const date = new Date().toISOString();
  const saltBytes = new Uint8Array(32);
  crypto.getRandomValues(saltBytes);
  const salt = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(date + salt));
  const signature = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `HMAC-SHA256 apiKey=${key}, date=${date}, salt=${salt}, signature=${signature}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "GET") return json({ error: "GET 만 받습니다." }, 405);
  if (!(await verifyUser(req))) {
    return json({ error: "로그인이 필요합니다. 다시 로그인해 주세요.", code: "unauthorized" }, 401);
  }

  const auth = await solapiAuth();
  if (!auth) return json({ error: "솔라피 API 키가 설정되지 않았어요." }, 500);

  const inUrl = new URL(req.url);
  const limit = Math.min(500, Math.max(1, parseInt(inUrl.searchParams.get("limit") || "300", 10) || 300));

  /* 솔라피 메시지 목록. 최근 것부터 넉넉히 가져옵니다. */
  const q = new URLSearchParams({ limit: String(limit) });
  const startDate = inUrl.searchParams.get("startDate");
  if (startDate) q.set("startDate", startDate);

  let res: Response;
  try {
    res = await fetch(SOLAPI + "/messages/v4/list?" + q.toString(), {
      method: "GET",
      headers: { "Authorization": auth, "Content-Type": "application/json" },
    });
  } catch (_e) {
    return json({ error: "솔라피에 연결하지 못했어요." }, 502);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.errorMessage || data.message)) || ("조회 실패 (" + res.status + ")");
    return json({ error: msg }, 502);
  }

  /* messageList 는 { messageId: {...} } 객체라 배열로 펴서 최근순 정렬해 돌려줍니다. */
  const ml = (data && data.messageList) || {};
  const list = Object.keys(ml).map((id) => {
    const m = ml[id] || {};
    return {
      id,
      to: m.to,
      from: m.from,
      type: m.type,
      text: m.text,
      statusCode: m.statusCode,
      statusMessage: m.statusMessage,
      dateCreated: m.dateCreated,
      dateReceived: m.dateReceived,
    };
  }).sort((a, b) => String(b.dateCreated || "").localeCompare(String(a.dateCreated || "")));

  return json({ ok: true, list });
});
