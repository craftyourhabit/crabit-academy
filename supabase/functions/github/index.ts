/* =====================================================================
   크래빗 아카데미 어드민 - 깃허브 커밋 프록시 (Supabase Edge Function)

   예전에는 Cloudflare Worker가 하던 일입니다. 관리 대상을 Supabase 하나로
   줄이려고 이쪽으로 옮겼습니다. 하는 일은 그대로예요.

   레포가 public 이라 어드민 페이지에 깃허브 토큰을 넣으면 전 세계에 공개됩니다.
   그래서 토큰은 이 함수의 시크릿으로만 두고, 로그인한 사람의 요청만 깃허브로
   넘겨 줍니다.

   필요한 시크릿 (supabase secrets set <이름>=<값>):
     GITHUB_TOKEN   crabit-academy 레포 Contents 읽기/쓰기 권한 토큰
     GH_REPO        예: craftyourhabit/crabit-academy
     GH_BRANCH      예: main
     ALLOWED_ORIGIN 예: https://craftyourhabit.github.io

   SUPABASE_ 로 시작하는 이름은 Supabase가 예약해 두어서 쓸 수 없습니다.
   그래서 GH_ 접두어를 씁니다.
   ===================================================================== */

const GITHUB_API = "https://api.github.com";

/* 어드민이 건드려도 되는 경로만 허용합니다.
   .github/workflows 같은 곳에 쓰지 못하게 막아, 세션이 새더라도
   토큰을 빼내는 워크플로를 심는 일은 불가능하게 합니다. */
const ALLOWED_PATHS = [
  /^assets\/resources\.js$/,
  /^assets\/resources-private\.js$/,
  /^assets\/events\.js$/,
  /^assets\/thumbs\/[A-Za-z0-9._-]+$/,
  /^assets\/events\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/,
  /^p\/[a-f0-9]{16}\/[A-Za-z0-9._-]+$/,
  /* 어드민에서 만드는 공개 아티클 페이지와 본문 사진 */
  /^r\/[A-Za-z0-9._-]+\.html$/,
  /^assets\/articles\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/,
  /* 어드민 이전에 손으로 만든 콘텐츠 페이지. 본문 수정을 허용합니다.
     index.html, admin.html 같은 사이트 뼈대는 계속 막아 둡니다. */
  /^daegu-prompts\.html$/,
  /^claude-code-windows\.html$/,
];

function pathAllowed(path: unknown): path is string {
  if (typeof path !== "string" || !path) return false;
  if (path.includes("..") || path.startsWith("/") || path.startsWith(".")) return false;
  return ALLOWED_PATHS.some((re) => re.test(path));
}

/* 시크릿에 잘못된 값이 들어가도 그대로 응답 헤더에 싣지 않습니다.
   실제로 ALLOWED_ORIGIN 끝에 깃허브 토큰이 붙어 들어간 적이 있고,
   그 값이 Access-Control-Allow-Origin 헤더로 전 세계에 나갔습니다.
   주소 형태가 아니면 아예 안 싣습니다. 그러면 CORS가 막혀서 바로 알아챌 수 있고,
   무엇보다 비밀이 밖으로 새지 않습니다. */
function safeOrigin() {
  const raw = (Deno.env.get("ALLOWED_ORIGIN") || "").trim();
  if (!raw) return "*";
  try {
    const u = new URL(raw);
    /* 주소에 경로나 물음표가 붙어 있으면 오염된 값으로 봅니다.
       정상값은 https://호스트 형태뿐입니다. */
    if (u.pathname !== "/" || u.search || u.hash) return null;
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

function corsHeaders() {
  const origin = safeOrigin();
  if (origin === null) {
    /* 값이 이상하면 CORS 헤더를 아예 주지 않습니다. */
    return { "Vary": "Origin" };
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

/* 설정이 깨져 있으면 시작할 때 로그에 남깁니다.
   Supabase 대시보드 > Edge Functions > github > Logs 에서 보입니다. */
if (safeOrigin() === null) {
  console.error("ALLOWED_ORIGIN 값이 올바른 주소가 아닙니다. CORS 헤더를 내보내지 않습니다.");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

/* 부른 사람이 진짜 로그인한 관리자인지 확인합니다.
   토큰을 직접 뜯어보지 않고 Supabase Auth에 물어봅니다.
   그래야 서명 검증과 만료 확인을 우리가 손으로 하지 않아도 됩니다.
   publishable 키만 들고 오면 사용자 정보가 안 나오므로 여기서 걸립니다. */
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

async function github(method: string, path: string, body?: unknown) {
  const repo = Deno.env.get("GH_REPO");
  const branch = Deno.env.get("GH_BRANCH") || "main";
  const url = GITHUB_API + "/repos/" + repo + "/contents/" + path
    + (method === "GET" ? "?ref=" + encodeURIComponent(branch) : "");

  return fetch(url, {
    method,
    headers: {
      "Authorization": "Bearer " + Deno.env.get("GITHUB_TOKEN"),
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "crabit-academy-admin",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (!(await verifyUser(req))) {
    return json({ error: "로그인이 필요합니다. 다시 로그인해 주세요.", code: "unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const branch = Deno.env.get("GH_BRANCH") || "main";

  /* 파일 읽기: 내용(base64)과 sha를 함께 돌려줍니다.
     sha는 저장할 때 "내가 읽은 뒤로 남이 바꾸지 않았다"를 확인하는 데 씁니다. */
  if (req.method === "GET") {
    const path = url.searchParams.get("path") || "";
    if (!pathAllowed(path)) return json({ error: "허용되지 않은 경로입니다: " + path }, 400);

    const res = await github("GET", path);
    if (res.status === 404) return json({ exists: false, content: null, sha: null });
    if (!res.ok) return json({ error: "깃허브 읽기 실패 (" + res.status + ")" }, 502);

    const data = await res.json();
    return json({ exists: true, contentBase64: String(data.content).replace(/\n/g, ""), sha: data.sha });
  }

  /* 파일 저장(생성/수정). content는 base64로 받습니다. */
  if (req.method === "PUT") {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: "요청 형식 오류" }, 400); }
    const { path, contentBase64, sha, message } = body || {};
    if (!pathAllowed(path)) return json({ error: "허용되지 않은 경로입니다: " + path }, 400);
    if (typeof contentBase64 !== "string") return json({ error: "내용이 비어 있습니다." }, 400);

    const payload: Record<string, unknown> = {
      message: message || ("어드민에서 " + path + " 수정"),
      content: contentBase64,
      branch,
    };
    if (sha) payload.sha = sha;

    const res = await github("PUT", path, payload);
    if (res.status === 409 || res.status === 422) {
      return json({
        error: "다른 곳에서 먼저 수정됐어요. 새로고침한 뒤 다시 저장해 주세요.",
        code: "conflict",
      }, 409);
    }
    if (!res.ok) {
      return json({ error: "저장 실패 (" + res.status + ") " + (await res.text()).slice(0, 200) }, 502);
    }
    const data = await res.json();
    return json({ ok: true, sha: data.content && data.content.sha, commit: data.commit && data.commit.sha });
  }

  /* 파일 삭제 */
  if (req.method === "DELETE") {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: "요청 형식 오류" }, 400); }
    const { path, sha, message } = body || {};
    if (!pathAllowed(path)) return json({ error: "허용되지 않은 경로입니다: " + path }, 400);
    if (!sha) return json({ error: "sha가 필요합니다." }, 400);

    const res = await github("DELETE", path, {
      message: message || ("어드민에서 " + path + " 삭제"),
      sha,
      branch,
    });
    if (!res.ok) return json({ error: "삭제 실패 (" + res.status + ")" }, 502);
    return json({ ok: true });
  }

  return json({ error: "없는 주소입니다." }, 404);
});
