/* =====================================================================
   크래빗 아카데미 - 카카오페이 결제 (Supabase Edge Function)

   프로젝트: crabit-academy-payments (iwitqfnhlyseuxxndvny)
   신청폼의 '크래빗 아카데미' 프로젝트와 다른 프로젝트입니다. 돈이 오가는
   일이라 따로 두었고, 나중에 수강생 계정을 붙일 때 이쪽이 본체가 됩니다.

   카카오페이 Secret key는 브라우저에 두는 순간 전 세계에 공개됩니다.
   그래서 키는 이 함수의 시크릿으로만 두고, 브라우저는 이 함수만 부릅니다.
   금액도 브라우저가 보내는 값을 믿지 않습니다. products 표에서 서버가
   직접 읽습니다. 브라우저가 금액을 조작할 길이 없습니다.

   주소 두 개를 받습니다.
     POST /pay/ready    주문 생성 + 카카오페이 결제창 주소 받기
     POST /pay/approve  결제 인증 후 승인 확정 + 제공 정보 반환

   필요한 시크릿 (supabase secrets set --project-ref iwitqfnhlyseuxxndvny <이름>=<값>):
     KAKAOPAY_SECRET_KEY  개발 단계는 Secret key(dev), 오픈 때 실 Secret key로 교체
     KAKAOPAY_CID         개발 단계는 TC0ONETIME, 오픈 때 실 CID로 교체
     ALLOWED_ORIGIN       예: https://craftyourhabit.github.io
     SITE_BASE            예: https://craftyourhabit.github.io/crabit-academy
   ===================================================================== */

const KAKAO_BASE = "https://open-api.kakaopay.com";

/* github 함수와 같은 이유로, 시크릿이 오염돼도 헤더로 새 나가지 않게 합니다. */
function safeOrigin() {
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
    "Access-Control-Allow-Headers": "Content-Type",
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

/* DB는 service role 키로만 만집니다. anon 은 표에 아무 권한이 없어서
   이 함수를 거치지 않고는 주문을 만들지도 읽지도 못합니다. */
function db(path: string, init: RequestInit = {}) {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return fetch(Deno.env.get("SUPABASE_URL") + "/rest/v1/" + path, {
    ...init,
    headers: {
      "apikey": key,
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function kakao(path: string, body: Record<string, unknown>) {
  return fetch(KAKAO_BASE + path, {
    method: "POST",
    headers: {
      "Authorization": "SECRET_KEY " + Deno.env.get("KAKAOPAY_SECRET_KEY"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/* 시크릿이 비어 있으면 결제를 시작하기 전에 알 수 있게 로그를 남깁니다.
   대시보드 > Edge Functions > pay > Logs 에서 보입니다. */
for (const name of ["KAKAOPAY_SECRET_KEY", "KAKAOPAY_CID", "SITE_BASE"]) {
  if (!Deno.env.get(name)) console.error(name + " 시크릿이 비어 있습니다.");
}

/* 결제창 주소 만들기. 주문을 먼저 만들고 카카오페이 ready를 부릅니다. */
async function handleReady(body: Record<string, unknown>) {
  const eventId = String(body.event_id || "");
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").replace(/[^0-9]/g, "");
  const email = String(body.email || "").trim() || null;
  const org = String(body.org || "").trim() || null;

  if (!eventId || !name || phone.length < 9 || phone.length > 11) {
    return json({ error: "신청 정보가 올바르지 않아요. 처음부터 다시 시도해 주세요." }, 400);
  }

  /* 금액의 원본은 products 표입니다. 브라우저가 보낸 금액은 받지도 않습니다. */
  const prodRes = await db(
    "products?event_id=eq." + encodeURIComponent(eventId) + "&active=eq.true&select=event_id,title,price",
  );
  const products = prodRes.ok ? await prodRes.json() : [];
  if (!products.length) {
    return json({ error: "지금은 결제할 수 없는 강의예요. 잠시 후 다시 시도해 주세요." }, 400);
  }
  const product = products[0];

  const cid = Deno.env.get("KAKAOPAY_CID") || "";
  const orderRes = await db("orders", {
    method: "POST",
    headers: { "Prefer": "return=representation" },
    body: JSON.stringify({
      event_id: product.event_id,
      title: product.title,
      amount: product.price,
      buyer_name: name,
      buyer_phone: phone,
      buyer_email: email,
      buyer_org: org,
      cid,
    }),
  });
  if (!orderRes.ok) {
    console.error("주문 생성 실패", orderRes.status, await orderRes.text());
    return json({ error: "주문을 만들지 못했어요. 잠시 후 다시 시도해 주세요." }, 502);
  }
  const order = (await orderRes.json())[0];

  const site = Deno.env.get("SITE_BASE") || "";
  const kakaoRes = await kakao("/online/v1/payment/ready", {
    cid,
    partner_order_id: order.id,
    partner_user_id: order.id,
    item_name: String(product.title).slice(0, 100),
    quantity: 1,
    total_amount: product.price,
    tax_free_amount: 0,
    approval_url: site + "/pay/complete.html?oid=" + order.id,
    cancel_url: site + "/pay/cancel.html?oid=" + order.id,
    fail_url: site + "/pay/fail.html?oid=" + order.id,
  });
  const kakaoData = await kakaoRes.json().catch(() => ({}));
  if (!kakaoRes.ok || !kakaoData.tid) {
    console.error("카카오페이 ready 실패", kakaoRes.status, JSON.stringify(kakaoData));
    await db("orders?id=eq." + order.id, {
      method: "PATCH",
      body: JSON.stringify({ status: "failed", memo: "ready 실패 " + kakaoRes.status }),
    });
    return json({ error: "카카오페이 연결에 실패했어요. 잠시 후 다시 시도해 주세요." }, 502);
  }

  await db("orders?id=eq." + order.id, {
    method: "PATCH",
    body: JSON.stringify({ tid: kakaoData.tid }),
  });

  return json({
    order_id: order.id,
    redirect_pc: kakaoData.next_redirect_pc_url,
    redirect_mobile: kakaoData.next_redirect_mobile_url,
  });
}

/* 결제 승인 확정. 완료 페이지가 pg_token을 들고 부릅니다. */
async function handleApprove(body: Record<string, unknown>) {
  const orderId = String(body.order_id || "");
  const pgToken = String(body.pg_token || "");
  if (!/^[0-9a-f-]{36}$/.test(orderId)) return json({ error: "주문 번호가 올바르지 않아요." }, 400);

  const orderRes = await db("orders?id=eq." + orderId + "&select=*");
  const orders = orderRes.ok ? await orderRes.json() : [];
  if (!orders.length) return json({ error: "주문을 찾을 수 없어요." }, 404);
  const order = orders[0];

  /* 제공 정보는 완료 화면에 함께 내보냅니다. 비어 있으면 화면이
     "따로 안내드립니다"로 나갑니다. products 표만 채우면 자동 안내로 바뀝니다. */
  const access = async () => {
    const r = await db(
      "products?event_id=eq." + encodeURIComponent(order.event_id)
        + "&select=access_url,access_password,access_note",
    );
    const rows = r.ok ? await r.json() : [];
    return rows[0] || {};
  };

  /* 완료 페이지를 새로고침해도 다시 성공으로 답합니다.
     승인을 두 번 부르지 않고 저장된 결과를 돌려줍니다. */
  if (order.status === "approved") {
    return json({
      ok: true, event_id: order.event_id, title: order.title, amount: order.amount,
      approved_at: order.approved_at, access: await access(),
    });
  }
  if (order.status !== "ready" || !order.tid) {
    return json({ error: "결제를 진행할 수 없는 주문이에요. 처음부터 다시 시도해 주세요." }, 400);
  }
  if (!pgToken) return json({ error: "결제 인증 정보가 없어요. 처음부터 다시 시도해 주세요." }, 400);

  const kakaoRes = await kakao("/online/v1/payment/approve", {
    cid: order.cid,
    tid: order.tid,
    partner_order_id: order.id,
    partner_user_id: order.id,
    pg_token: pgToken,
  });
  const kakaoData = await kakaoRes.json().catch(() => ({}));
  if (!kakaoRes.ok) {
    console.error("카카오페이 approve 실패", kakaoRes.status, JSON.stringify(kakaoData));
    return json({ error: "결제 승인에 실패했어요. 결제가 완료되지 않았으니 다시 시도해 주세요." }, 502);
  }

  const approvedAt = kakaoData.approved_at || new Date().toISOString();
  await db("orders?id=eq." + order.id, {
    method: "PATCH",
    body: JSON.stringify({ status: "approved", approved_at: approvedAt, pg_payload: kakaoData }),
  });

  return json({
    ok: true, event_id: order.event_id, title: order.title, amount: order.amount,
    approved_at: approvedAt, access: await access(),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") return json({ error: "없는 주소입니다." }, 404);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "요청 형식 오류" }, 400); }

  const path = new URL(req.url).pathname;
  try {
    if (path.endsWith("/ready")) return await handleReady(body);
    if (path.endsWith("/approve")) return await handleApprove(body);
  } catch (e) {
    console.error("처리 중 오류", e);
    return json({ error: "일시적인 오류가 났어요. 잠시 후 다시 시도해 주세요." }, 500);
  }
  return json({ error: "없는 주소입니다." }, 404);
});
