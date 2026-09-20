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

/* 카카오페이 서버는 HTTP/1.1 전용인데, 엣지 런타임에서 압축 응답을 읽다가
   "error reading a body from connection"으로 끊기는 일이 있었습니다.
   압축을 끄고(identity), 본문 읽기까지 마친 결과를 돌려줍니다. */
async function kakao(path: string, body: Record<string, unknown>) {
  const res = await fetch(KAKAO_BASE + path, {
    method: "POST",
    headers: {
      "Authorization": "SECRET_KEY " + (Deno.env.get("KAKAOPAY_SECRET_KEY") || "").trim(),
      "Content-Type": "application/json",
      "Accept-Encoding": "identity",
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(raw); } catch { /* 원문은 부른 쪽에서 로그로 남깁니다 */ }
  return { ok: res.ok, status: res.status, raw, data };
}

/* 시크릿이 비어 있으면 결제를 시작하기 전에 알 수 있게 로그를 남깁니다.
   대시보드 > Edge Functions > pay > Logs 에서 보입니다. */
for (const name of ["KAKAOPAY_SECRET_KEY", "KAKAOPAY_CID", "SITE_BASE"]) {
  if (!Deno.env.get(name)) console.error(name + " 시크릿이 비어 있습니다.");
}

/* 결제창 주소 만들기. 주문을 먼저 만들고 카카오페이 ready를 부릅니다. */
/* =====================================================================
   결제 완료 문자(LMS) 안내

   카카오 알림톡 승인 전까지 쓰는 임시 통로입니다. 승인이 나면 이 블록과
   approve 안의 호출 한 줄만 지우면 됩니다.

   필요한 시크릿 (없으면 문자만 조용히 건너뜁니다. 결제는 그대로 성공합니다.)
     SOLAPI_API_KEY / SOLAPI_API_SECRET  솔라피 콘솔 > 개발/연동
     SOLAPI_SENDER                       사전 등록한 발신번호 (숫자만)
     NOTIFY_TOKEN                        /pay/resend 를 부를 때 쓰는 임의의 암호
   ===================================================================== */
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

/* 문자(LMS) 본문. 사용자가 확정한 문구입니다. 이모지는 일반 문자에서 깨져서 쓰지 않고,
   목록은 하이픈으로 답니다. 알림톡 승인 후에는 이 블록째 지웁니다. */
function smsBody(order: any, access: any): string {
  const who = order.buyer_name ? order.buyer_name + " 원장님" : "원장님";
  const lines = [
    "안녕하세요, " + who + "! 크래빗팀이에요.",
    "",
    '"' + order.title + '" 결제가 완료되었어요.',
    "",
  ];
  if (access && access.access_url) {
    lines.push("- 시청 페이지: " + access.access_url);
    if (access.access_password) lines.push("- 비밀번호: " + access.access_password);
    lines.push("", "결제하신 날부터 3개월 동안 보실 수 있어요. 링크와 비밀번호는 원장님 전용이라 공유는 삼가 주세요.");
  } else {
    lines.push("시청 안내는 곧 메일로 보내드릴게요.");
  }
  lines.push(
    "",
    "크래빗과 함께 배우신 내용이 실제 원장님의 일상 속에 작고 큰 변화를 가져다줄 수 있기를 진심으로 바라는 마음입니다 :)",
    "",
    "감사합니다!",
  );
  return lines.join("\n");
}

/* =====================================================================
   결제 완료 메일 (Resend HTTP API)

   문자와 같은 임시 통로입니다. 알림톡 승인 후에는 이 블록과 approve 안의 호출을 지웁니다.
   문구를 고치면 admin/시청안내-메일양식.html 도 같이 맞춰 주세요(손으로 보낼 때 쓰는 사본).

   필요한 시크릿 (없으면 메일만 조용히 건너뜁니다. 결제는 그대로 성공합니다.)
     RESEND_API_KEY   resend.com 에서 발급
     MAIL_FROM        예: 크래빗 아카데미 <academy@crabit.co.kr> (도메인 인증을 마친 주소)
   ===================================================================== */
function mailHtml(order: any, access: any): string {
  const esc = (v: unknown) =>
    String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const who = order.buyer_name ? esc(order.buyer_name) + " 원장님" : "원장님";
  const site = (Deno.env.get("SITE_BASE") || "").replace(/\/$/, "");
  const url = access && access.access_url ? esc(access.access_url) : "";
  const pw = access && access.access_password ? esc(access.access_password) : "";
  const note = access && access.access_note
    ? esc(access.access_note)
    : "링크와 비밀번호는 원장님 전용이라 외부에 공유하지 말아 주세요.";

  /* 버튼은 브랜드 핑크. 휴대폰 다크모드가 어두운 색과 흰 글씨를 뒤집어 버려서 남색 버튼은 묻힙니다. */
  const box = url
    ? '<tr><td style="padding:26px 40px 0">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F9FAFC;border-radius:16px"><tr><td style="padding:24px">'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>'
      + '<td align="center" bgcolor="#FB75BB" style="background-color:#FB75BB;border-radius:12px">'
      + '<a href="' + url + '" style="display:block;background-color:#FB75BB;color:#16192A;text-decoration:none;font-size:17px;font-weight:700;padding:17px 20px;border-radius:12px">시청 페이지 열기</a>'
      + "</td></tr></table>"
      + (pw
          ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px;border-top:1px solid #E8E8E8"><tr><td style="padding:18px 2px 0">'
            + '<p style="margin:0;font-size:14px;line-height:1.6;color:#7F808A">🔑 시청 비밀번호</p>'
            + '<p style="margin:6px 0 0;font-size:24px;font-weight:700;letter-spacing:0.08em;color:#16192A">' + pw + "</p>"
            + '<p style="margin:10px 0 0;font-size:13.5px;line-height:1.7;color:#7F808A">' + note + "</p>"
            + "</td></tr></table>"
          : "")
      + "</td></tr></table></td></tr>"
    : "";

  return '<div style="margin:0;padding:0;background:#F2F3F6">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F2F3F6;padding:28px 12px"><tr><td align="center">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;background:#FFFFFF;border-radius:20px;overflow:hidden;font-family:\'Apple SD Gothic Neo\',\'Malgun Gothic\',Arial,sans-serif;color:#16192A">'
    + '<tr><td style="padding:36px 40px 0">'
    + '<p style="margin:0 0 14px;font-size:22px;font-weight:700;letter-spacing:-0.02em;line-height:1.4;color:#16192A">안녕하세요, ' + who + "! 크래빗팀이에요.</p>"
    + '<p style="margin:0;font-size:15.5px;line-height:1.75;color:#4A4D5C"><b style="color:#16192A">' + esc(order.title) + "</b> 결제가 완료되어 아래 시청링크와 비밀번호 안내를 전달드립니다. 😊<br /><br />"
    + "아래 버튼을 누르고 비밀번호를 입력하시면 바로 보실 수 있습니다!</p></td></tr>"
    + box
    + '<tr><td style="padding:30px 40px 0">'
    + '<p style="margin:0 0 12px;font-size:16.5px;font-weight:700;color:#16192A">📎 함께 드리는 자료</p>'
    + '<p style="margin:0;font-size:15px;line-height:1.85;color:#4A4D5C">강의 슬라이드와 실습 자료를 모두 시청 페이지 안에 모아 뒀어요. 영상 아래에서 바로 열어 보실 수 있습니다.</p></td></tr>'
    + '<tr><td style="padding:26px 40px 0">'
    + '<p style="margin:0 0 10px;font-size:16.5px;font-weight:700;color:#16192A">💡 나중에 강의를 들으실 때 이렇게 하세요!</p>'
    + '<p style="margin:0 0 10px;font-size:15px;line-height:1.85;color:#4A4D5C">방법 1) <a href="' + site + '/vod" style="color:#16192A;font-weight:600">VOD 강의 페이지</a>에서 해당 강의를 열고, "이미 구매하셨나요? 시청 페이지 열기"를 누르고 위 비밀번호를 입력하시면 언제든 다시 들어오실 수 있어요.</p>'
    + '<p style="margin:0;font-size:15px;line-height:1.85;color:#4A4D5C">방법 2) 이 이메일 또는 함께 발송된 문자를 찾아 링크 클릭 및 비밀번호 입력을 하여 언제든 다시 들으실 수 있어요.</p></td></tr>'
    + '<tr><td style="padding:28px 40px 34px">'
    + '<p style="margin:0;font-size:15px;line-height:1.85;color:#4A4D5C">크래빗과 함께 배우신 내용이 실제 원장님의 일상 속에 작고 큰 변화를 가져다줄 수 있기를 진심으로 바라는 마음입니다 :) 좋은 하루 보내세요, 원장님!</p>'
    + '<p style="margin:18px 0 0;font-size:15px;line-height:1.8;color:#16192A">감사합니다.<br />크래빗팀 드림</p></td></tr>'
    + '<tr><td style="padding:22px 40px 30px;border-top:1px solid #E8E8E8">'
    + '<p style="margin:0;font-size:12.5px;line-height:1.8;color:#7F808A">(주)크래빗 | 대표 김현지<br />사업자등록번호 747-86-03279 | 통신판매업신고 제 2025-서울구로-2011<br />서울시 구로구 디지털로 288, 2003-1호 | 문의 010-5957-2483<br />'
    + '<a href="' + site + '/policy.html" style="color:#7F808A">이용약관과 환불 규정</a></p></td></tr>'
    + "</table></td></tr></table></div>";
}

async function sendMail(order: any, access: any): Promise<void> {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("MAIL_FROM");
  const to = String(order.buyer_email || "").trim();
  if (!key || !from || !to) return;   /* 설정 전이거나 메일 주소를 안 남겼으면 건너뛴다 */
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "[크래빗 아카데미] " + order.title + " 결제 완료 안내",
        html: mailHtml(order, access),
      }),
    });
    if (!res.ok) console.error("메일 발송 실패", res.status, (await res.text()).slice(0, 300));
  } catch (e) {
    /* 메일이 실패해도 결제는 이미 끝났다. 결제 응답을 막지 않는다. */
    console.error("메일 발송 예외", String(e).slice(0, 200));
  }
}

async function sendSms(order: any, access: any): Promise<void> {
  const to = String(order.buyer_phone || "").replace(/[^0-9]/g, "");
  const from = String(Deno.env.get("SOLAPI_SENDER") || "").replace(/[^0-9]/g, "");
  const auth = await solapiAuth();
  if (!to || !from || !auth) return;   /* 설정 전이면 조용히 건너뛴다 */
  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: { "Authorization": auth, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { to, from, subject: "크래빗 아카데미", text: smsBody(order, access) } }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data && data.errorCode)) {
      console.error("문자 발송 실패", res.status, JSON.stringify(data).slice(0, 300));
    }
  } catch (e) {
    /* 문자가 실패해도 결제는 이미 끝났다. 절대 결제 응답을 막지 않는다. */
    console.error("문자 발송 예외", String(e).slice(0, 200));
  }
}

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
  const readyBody = {
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
  };
  /* 본문 읽기에서 끊기면 한 번 다시 시도합니다. ready는 결제창 주소를
     만드는 단계라 다시 불러도 돈과 무관합니다. */
  let kakaoRes;
  try {
    kakaoRes = await kakao("/online/v1/payment/ready", readyBody);
  } catch {
    kakaoRes = await kakao("/online/v1/payment/ready", readyBody);
  }
  const kakaoData = kakaoRes.data;
  if (!kakaoRes.ok || !kakaoData.tid) {
    console.error("카카오페이 ready 실패", kakaoRes.status, kakaoRes.raw.slice(0, 500));
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

  let kakaoRes;
  try {
    kakaoRes = await kakao("/online/v1/payment/approve", {
      cid: order.cid,
      tid: order.tid,
      partner_order_id: order.id,
      partner_user_id: order.id,
      pg_token: pgToken,
    });
  } catch {
    /* 승인 요청 후 응답을 못 읽으면 승인이 됐는지 알 수 없습니다.
       같은 요청을 무턱대고 다시 보내는 대신 조회 API로 실제 상태를 봅니다. */
    kakaoRes = null;
  }
  let kakaoData = kakaoRes ? kakaoRes.data : {};
  if (!kakaoRes || !kakaoRes.ok) {
    const lookup = await kakao("/online/v1/payment/order", { cid: order.cid, tid: order.tid })
      .catch(() => null);
    if (lookup && lookup.ok && lookup.data.status === "SUCCESS_PAYMENT") {
      kakaoData = lookup.data;
    } else {
      if (kakaoRes) console.error("카카오페이 approve 실패", kakaoRes.status, kakaoRes.raw.slice(0, 500));
      else console.error("카카오페이 approve 응답 읽기 실패, 조회로도 승인 확인 안 됨");
      return json({ error: "결제 승인에 실패했어요. 결제가 완료되지 않았으니 다시 시도해 주세요." }, 502);
    }
  }

  const approvedAt = kakaoData.approved_at || new Date().toISOString();
  await db("orders?id=eq." + order.id, {
    method: "PATCH",
    body: JSON.stringify({ status: "approved", approved_at: approvedAt, pg_payload: kakaoData }),
  });

  const acc = await access();
  /* 알림톡 승인 전까지 쓰는 임시 안내. 실패해도 결제 결과에는 영향을 주지 않는다. */
  await sendSms({ ...order, title: order.title }, acc);
  await sendMail(order, acc);

  return json({
    ok: true, event_id: order.event_id, title: order.title, amount: order.amount,
    approved_at: approvedAt, access: acc,
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
    /* 안내 문자를 다시 보내는 통로. 아무나 부르면 구매자 폰으로 문자가 쏟아지니
       NOTIFY_TOKEN 시크릿을 아는 사람만 부를 수 있게 막는다. */
    if (path.endsWith("/resend")) {
      const token = Deno.env.get("NOTIFY_TOKEN") || "";
      if (!token || String(body?.token || "") !== token) return json({ error: "권한이 없어요." }, 401);
      const r = await db("orders?id=eq." + encodeURIComponent(String(body?.order_id || "")) + "&select=*");
      const rows = r.ok ? await r.json() : [];
      const o = rows[0];
      if (!o) return json({ error: "주문을 찾을 수 없어요." }, 404);
      const p = await db("products?event_id=eq." + encodeURIComponent(o.event_id)
        + "&select=access_url,access_password,access_note");
      const prows = p.ok ? await p.json() : [];
      await sendSms(o, prows[0] || {});
      await sendMail(o, prows[0] || {});
      return json({ ok: true, to: String(o.buyer_phone || "").slice(-4) });
    }
  } catch (e) {
    console.error("처리 중 오류", e);
    return json({ error: "일시적인 오류가 났어요. 잠시 후 다시 시도해 주세요." }, 500);
  }
  return json({ error: "없는 주소입니다." }, 404);
});
