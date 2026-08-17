/* =====================================================================
   크래빗 아카데미 어드민 - Cloudflare Worker 인증 프록시

   하는 일은 딱 하나입니다. 깃허브 토큰을 감춰 주는 것.
   레포가 public 이라 어드민 페이지에 토큰을 넣으면 전 세계에 공개됩니다.
   그래서 토큰은 이 Worker의 시크릿으로만 두고, 어드민은 비밀번호로 로그인해
   이 Worker를 통해서만 레포를 읽고 씁니다.

   필요한 시크릿 (wrangler secret put <이름>):
     ADMIN_PASSWORD   어머님이 입력하실 로그인 비밀번호. 12자 이상 권장.
     GITHUB_TOKEN     crabit-academy 레포 Contents 읽기/쓰기 권한 토큰
     SESSION_SECRET   세션 서명용 임의 문자열 (openssl rand -hex 32)

   설정값은 wrangler.toml 의 [vars] 에 있습니다.
   ===================================================================== */

const TEXT = new TextEncoder();
const SESSION_HOURS = 12;

/* 어드민이 건드려도 되는 경로만 허용합니다.
   .github/workflows 같은 곳에 쓰지 못하게 막아, 세션이 새더라도
   토큰을 빼내는 워크플로를 심는 일은 불가능하게 합니다. */
const ALLOWED_PATHS = [
  /^assets\/resources\.js$/,
  /^assets\/resources-private\.js$/,
  /^assets\/events\.js$/,
  /^assets\/thumbs\/[A-Za-z0-9._-]+$/,
  /^assets\/events\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/,
  /^p\/[a-f0-9]{16}\/[A-Za-z0-9._-]+$/
];

function pathAllowed(path) {
  if (typeof path !== "string" || !path) return false;
  if (path.includes("..") || path.startsWith("/") || path.startsWith(".")) return false;
  return ALLOWED_PATHS.some(re => re.test(path));
}

/* ---------- 유틸 ---------- */

function b64url(bytes) {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* 길이가 달라도 시간이 새지 않도록 비교합니다. */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sign(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw", TEXT.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return b64url(await crypto.subtle.sign("HMAC", key, TEXT.encode(data)));
}

async function issueToken(env) {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = b64url(TEXT.encode(JSON.stringify({ exp })));
  return payload + "." + (await sign(env.SESSION_SECRET, payload));
}

async function verifyToken(env, token) {
  if (!token || typeof token !== "string") return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, await sign(env.SESSION_SECRET, payload))) return false;
  try {
    const raw = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(raw);
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(env) }
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 깃허브 Contents API ---------- */

async function github(env, method, path, body) {
  const url = "https://api.github.com/repos/" + env.REPO + "/contents/" + path
    + (method === "GET" ? "?ref=" + encodeURIComponent(env.BRANCH) : "");
  const res = await fetch(url, {
    method,
    headers: {
      "Authorization": "Bearer " + env.GITHUB_TOKEN,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "crabit-academy-admin",
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res;
}

/* ---------- 라우팅 ---------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = url.pathname.replace(/\/+$/, "");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    /* 로그인: 비밀번호를 받아 12시간짜리 세션 토큰을 내줍니다. */
    if (route === "/api/login" && request.method === "POST") {
      let password = "";
      try { ({ password } = await request.json()); } catch { /* 형식 오류는 아래에서 처리 */ }
      if (!safeEqual(String(password || ""), env.ADMIN_PASSWORD)) {
        /* 무차별 대입을 늦추기 위한 지연입니다. */
        await sleep(700);
        return json(env, { error: "비밀번호가 올바르지 않습니다." }, 401);
      }
      return json(env, { token: await issueToken(env), expiresInHours: SESSION_HOURS });
    }

    /* 여기부터는 전부 로그인 필요 */
    const auth = request.headers.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!(await verifyToken(env, token))) {
      return json(env, { error: "로그인이 필요합니다. 다시 로그인해 주세요.", code: "unauthorized" }, 401);
    }

    /* 파일 읽기: 내용(base64)과 sha를 함께 돌려줍니다.
       sha는 저장할 때 "내가 읽은 뒤로 남이 바꾸지 않았다"를 확인하는 데 씁니다. */
    if (route === "/api/file" && request.method === "GET") {
      const path = url.searchParams.get("path") || "";
      if (!pathAllowed(path)) return json(env, { error: "허용되지 않은 경로입니다: " + path }, 400);
      const res = await github(env, "GET", path);
      if (res.status === 404) return json(env, { exists: false, content: null, sha: null });
      if (!res.ok) return json(env, { error: "깃허브 읽기 실패 (" + res.status + ")" }, 502);
      const data = await res.json();
      return json(env, { exists: true, contentBase64: data.content.replace(/\n/g, ""), sha: data.sha });
    }

    /* 파일 저장(생성/수정). content는 base64로 받습니다. */
    if (route === "/api/file" && request.method === "PUT") {
      let body;
      try { body = await request.json(); } catch { return json(env, { error: "요청 형식 오류" }, 400); }
      const { path, contentBase64, sha, message } = body || {};
      if (!pathAllowed(path)) return json(env, { error: "허용되지 않은 경로입니다: " + path }, 400);
      if (typeof contentBase64 !== "string") return json(env, { error: "내용이 비어 있습니다." }, 400);

      const payload = {
        message: message || ("어드민에서 " + path + " 수정"),
        content: contentBase64,
        branch: env.BRANCH
      };
      if (sha) payload.sha = sha;

      const res = await github(env, "PUT", path, payload);
      if (res.status === 409 || res.status === 422) {
        return json(env, {
          error: "다른 곳에서 먼저 수정됐어요. 새로고침한 뒤 다시 저장해 주세요.",
          code: "conflict"
        }, 409);
      }
      if (!res.ok) {
        return json(env, { error: "저장 실패 (" + res.status + ") " + (await res.text()).slice(0, 200) }, 502);
      }
      const data = await res.json();
      return json(env, { ok: true, sha: data.content && data.content.sha, commit: data.commit && data.commit.sha });
    }

    /* 파일 삭제 */
    if (route === "/api/file" && request.method === "DELETE") {
      let body;
      try { body = await request.json(); } catch { return json(env, { error: "요청 형식 오류" }, 400); }
      const { path, sha, message } = body || {};
      if (!pathAllowed(path)) return json(env, { error: "허용되지 않은 경로입니다: " + path }, 400);
      if (!sha) return json(env, { error: "sha가 필요합니다." }, 400);
      const res = await github(env, "DELETE", path, {
        message: message || ("어드민에서 " + path + " 삭제"),
        sha,
        branch: env.BRANCH
      });
      if (!res.ok) return json(env, { error: "삭제 실패 (" + res.status + ")" }, 502);
      return json(env, { ok: true });
    }

    /* 세션이 살아 있는지 확인용 */
    if (route === "/api/ping") return json(env, { ok: true });

    return json(env, { error: "없는 주소입니다." }, 404);
  }
};
