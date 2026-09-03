/* =====================================================================
   크래빗 아카데미 어드민 - 문자(LMS) 발송 프록시 (Supabase Edge Function)

   신청자에게 안내 문자를 폰 메시지 앱을 열지 않고 바로 보냅니다.
   솔라피(Solapi) API를 서버에서 부르고, 브라우저에는 결과만 돌려줍니다.

   왜 서버를 거치나: 브라우저는 문자를 몰래 못 보냅니다. 또 솔라피
   API 시크릿을 페이지에 넣으면 public 레포에 그대로 노출됩니다.
   그래서 키는 이 함수의 시크릿에만 두고, 로그인한 관리자의 요청만 넘깁니다.

   필요한 시크릿 (supabase secrets set <이름>=<값>):
     SOLAPI_API_KEY     솔라피 콘솔 > 개발/연동 > API Key
     SOLAPI_API_SECRET  같은 화면의 시크릿
     SOLAPI_SENDER      사전 등록한 발신번호 (숫자만, 예: 01012345678)
     ALLOWED_ORIGIN     예: https://craftyourhabit.github.io

   SUPABASE_URL 과 SUPABASE_ANON_KEY 는 Supabase가 자동으로 넣어 줍니다.
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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

/* 부른 사람이 진짜 로그인한 관리자인지 Supabase Auth에 물어봅니다.
   github 함수와 같은 방식입니다. */
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

/* 솔라피 HMAC-SHA256 인증 헤더. date + salt 를 시크릿으로 해시합니다. */
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

/* 전화번호에서 숫자만 남깁니다. 솔라피는 하이픈 없는 형태를 씁니다. */
function digitsOnly(s: unknown): string {
  return String(s == null ? "" : s).replace(/[^0-9]/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return json({ error: "POST 만 받습니다." }, 405);
  }
  if (!(await verifyUser(req))) {
    return json({ error: "로그인이 필요합니다. 다시 로그인해 주세요.", code: "unauthorized" }, 401);
  }

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "요청 형식 오류" }, 400); }

  const to = digitsOnly(body?.to);
  const text = String(body?.text || "").trim();
  const subject = String(body?.subject || "크래빗 아카데미").slice(0, 40);
  if (to.length < 9) return json({ error: "받는 번호가 올바르지 않습니다." }, 400);
  if (!text) return json({ error: "보낼 내용이 비어 있습니다." }, 400);

  const from = digitsOnly(Deno.env.get("SOLAPI_SENDER"));
  if (!from) return json({ error: "발신번호(SOLAPI_SENDER)가 설정되지 않았어요. 솔라피에 등록한 번호를 시크릿에 넣어 주세요." }, 500);

  const auth = await solapiAuth();
  if (!auth) return json({ error: "솔라피 API 키(SOLAPI_API_KEY/SECRET)가 설정되지 않았어요." }, 500);

  /* 길이에 따라 SMS/LMS 로 자동 분류되게 type 을 비워 둡니다.
     이 안내문은 줌 링크가 들어가 길어서 실제로는 LMS 로 나갑니다. */
  const message: Record<string, unknown> = { to, from, text };
  /* LMS 는 제목을 붙일 수 있습니다. SMS 로 짧게 나가면 솔라피가 제목을 무시합니다. */
  message.subject = subject;

  let res: Response;
  try {
    res = await fetch(SOLAPI + "/messages/v4/send", {
      method: "POST",
      headers: { "Authorization": auth, "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch (_e) {
    return json({ error: "솔라피에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요." }, 502);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    /* 솔라피 오류 메시지를 그대로 전달해 원인을 바로 알 수 있게 합니다. */
    const msg = (data && (data.errorMessage || data.message)) || ("발송 실패 (" + res.status + ")");
    return json({ error: msg, detail: data }, 502);
  }

  /* 성공 응답의 statusCode 가 2000이 아니면 실패로 봅니다. */
  const okCode = data && (data.statusCode === "2000" || data.statusCode === 2000 || (data.groupId && !data.errorCode));
  if (!okCode && data && data.errorCode) {
    return json({ error: data.errorMessage || ("발송 실패: " + data.errorCode), detail: data }, 502);
  }

  return json({ ok: true, result: data });
});
