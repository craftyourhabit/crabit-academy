/* ===============================================
   크래빗 아카데미 방문 기록

   두 가지를 남깁니다.
   1) 페이지뷰: 페이지가 열릴 때 한 줄
   2) 아웃바운드 클릭: data-track 속성이 있는 버튼, 또는 사이트 밖으로 나가는 링크를 누를 때 한 줄
      예) <a href="https://..." data-track="outbound-olkeoni">올커니 입장하기</a>

   보내는 곳은 Edge Function 'track' 입니다(supabase/functions/track).
   브라우저가 표에 직접 쓰지 않아요. 함수가 봇과 도배를 거른 뒤 넣습니다.

   【남기는 것】 경로, UTM 5종, 유입 도메인, 시각, 익명 방문자 id
   【남기지 않는 것】 이름, 연락처, 쿠키, IP 원문, 유입 주소 전체
   - 익명 방문자 id 는 이 브라우저가 처음 왔을 때 만든 무작위 문자열입니다.
     사람과 이어 붙일 방법이 없고, 브라우저 저장소를 지우면 새로 만들어져요.
   - 유입 주소는 도메인만 남깁니다. 전체 URL에는 검색어 같은 게 섞여 들어올 수 있어서요.

   【UTM 이어 붙이기】 인스타 링크로 아티클에 들어온 뒤 다른 페이지로 옮겨도,
   같은 탭 안에서는 처음 들어올 때의 UTM 을 계속 붙입니다(sessionStorage, 탭을 닫으면 초기화).
   그래야 "인스타로 와서 올커니 버튼을 눌렀다"를 이어서 셀 수 있어요.

   【로컬 확인】 localhost, 127.0.0.1 에서는 실제로 보내지 않고 콘솔에만 찍습니다.
   실제 사이트에서도 주소 끝에 ?track=mock 을 붙이면 보내지 않고 콘솔에만 찍어요.
   =============================================== */
(function () {
  var SB_URL = "https://ttolvlzubashyhdctbqr.supabase.co";
  var ENDPOINT = SB_URL + "/functions/v1/track";

  try {
    if (window.__crabitTrack) return;             /* 두 번 붙어도 한 번만 동작 */
    window.__crabitTrack = true;

    /* 어드민은 세지 않습니다. 우리가 들락거린 게 조회수로 잡히면 안 되니까요. */
    if (/\/admin(\.html)?$/.test(location.pathname)) return;

    /* 브라우저가 "추적하지 마세요"라고 알려주면 존중합니다. */
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;

    var qs = new URLSearchParams(location.search);
    var MOCK = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
      || /\.(localhost|test)$/.test(location.hostname)
      || location.protocol === "file:"
      || qs.get("track") === "mock";

    /* ---------- 사이트 기준 경로 ----------
       깃허브 페이지에서는 주소가 /crabit-academy/r/ai-tools-5 처럼 시작합니다.
       이 스크립트 위치(…/assets/track.js)로 사이트 뿌리를 알아내서 떼어 내고,
       .html 과 index 도 지웁니다. 그래서 어디서 열든 /r/ai-tools-5 로 같게 모여요. */
    var base = "/";
    try {
      var me = document.currentScript && document.currentScript.src;
      if (!me) {
        var ss = document.querySelectorAll('script[src*="assets/track.js"]');
        if (ss.length) me = ss[ss.length - 1].src;
      }
      if (me) base = new URL(me, location.href).pathname.replace(/assets\/track\.js.*$/, "");
    } catch (e) { /* 못 찾으면 / 기준 */ }

    function sitePath(p) {
      var s = p || "/";
      if (base !== "/" && s.indexOf(base) === 0) s = "/" + s.slice(base.length);
      s = s.replace(/\/index(\.html)?$/, "/").replace(/\.html$/, "");
      if (s.length > 1) s = s.replace(/\/+$/, "");
      return (s || "/").slice(0, 200);
    }
    var path = sitePath(location.pathname);

    /* ---------- 익명 방문자 id ---------- */
    function rand() {
      var chars = "abcdefghijklmnopqrstuvwxyz0123456789", out = "";
      var a = new Uint8Array(24);
      (window.crypto || window.msCrypto).getRandomValues(a);
      for (var i = 0; i < a.length; i++) out += chars[a[i] % chars.length];
      return out;
    }
    var vid = null;
    try {
      vid = localStorage.getItem("crabit_vid");
      if (!vid || !/^[a-z0-9]{8,40}$/.test(vid)) { vid = rand(); localStorage.setItem("crabit_vid", vid); }
    } catch (e) {
      /* 저장소를 못 쓰는 브라우저면 이번 페이지 동안만 쓰는 값으로 */
      vid = rand();
    }

    /* ---------- UTM ---------- */
    var KEYS = ["source", "medium", "campaign", "content", "term"];
    var utm = null;
    KEYS.forEach(function (k) {
      var v = qs.get("utm_" + k);
      if (v) { utm = utm || {}; utm[k] = String(v).trim().toLowerCase().slice(0, 100); }
    });
    try {
      if (utm && utm.source) sessionStorage.setItem("crabit_utm", JSON.stringify(utm));
      else utm = JSON.parse(sessionStorage.getItem("crabit_utm") || "null");
    } catch (e) { /* 저장소를 못 쓰면 이번 주소의 UTM 만 */ }
    utm = utm || {};

    /* ---------- 유입 도메인 ---------- */
    var refHost = null;
    if (document.referrer) {
      try {
        var h = new URL(document.referrer).hostname;
        /* 사이트 안에서 이동한 건 유입이 아니라 그냥 이동입니다. */
        if (h && h !== location.hostname) refHost = h.slice(0, 120);
      } catch (e) { /* 이상한 referrer는 버립니다 */ }
    }

    var eventId = null;
    if (/\/event$/.test(path)) {
      eventId = qs.get("id");
      if (eventId) eventId = String(eventId).slice(0, 60);
    }

    /* ---------- 보내기 ----------
       text/plain 으로 보내면 브라우저가 미리 확인 요청(OPTIONS)을 하지 않아 한 번에 끝납니다.
       keepalive 를 켜 두면 링크를 눌러 페이지를 떠나는 중에도 끝까지 보내요.
       쿠키는 싣지 않습니다(credentials: omit). */
    function send(payload) {
      payload.path = path;
      payload.visitor_id = vid;
      payload.utm = utm;
      payload.referrer_host = refHost;
      if (eventId) payload.event_id = eventId;
      if (MOCK) {
        if (window.console) console.info("[track:mock] " + payload.type + (payload.label ? " " + payload.label : ""), payload);
        return;
      }
      var body = JSON.stringify(payload);
      try {
        if (window.fetch) {
          fetch(ENDPOINT, {
            method: "POST", mode: "cors", credentials: "omit", keepalive: true,
            headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: body
          }).catch(function () { /* 기록이 실패해도 페이지는 멀쩡해야 합니다 */ });
        } else if (navigator.sendBeacon) {
          navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain;charset=UTF-8" }));
        }
      } catch (e) { /* 무시 */ }
    }

    /* ---------- 페이지뷰 ----------
       새로고침으로 숫자가 부풀지 않도록, 같은 탭에서 같은 페이지를 다시 열면 세지 않습니다. */
    var mark = "crabit_pv:" + path + ":" + (eventId || "") + ":" + (utm.campaign || "");
    var seen = false;
    try { seen = !!sessionStorage.getItem(mark); sessionStorage.setItem(mark, "1"); } catch (e) { /* 저장소 없음 */ }
    if (!seen) send({ type: "pageview" });

    /* ---------- 아웃바운드 클릭 ----------
       1) data-track="outbound-olkeoni" 처럼 이름을 붙인 버튼은 그 이름으로
       2) 이름은 없지만 사이트 밖으로 나가는 링크는 outbound-link 로 남깁니다. */
    var lastClick = 0;
    document.addEventListener("click", function (e) {
      try {
        var t = e.target && e.target.closest ? e.target.closest("[data-track], a[href]") : null;
        if (!t) return;
        var a = t.tagName === "A" ? t : (t.closest && t.closest("a[href]"));
        var label = t.getAttribute("data-track");
        var target = null;
        if (a && /^https?:/i.test(a.href)) {
          try { target = new URL(a.href).hostname; } catch (er) { target = null; }
        }
        if (!label) {
          if (!target || target === location.hostname) return;   /* 사이트 안 이동은 세지 않음 */
          label = "outbound-link";
        }
        label = String(label).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 60) || "outbound-link";
        /* 한 번 누른 게 두 번 잡히지 않게(겹친 요소, 더블클릭) */
        var now = Date.now();
        if (now - lastClick < 400) return;
        lastClick = now;
        send({ type: "outbound", label: label, target_host: target });
      } catch (er) { /* 무시 */ }
    }, true);

    /* 스크립트에서 직접 남기고 싶을 때: window.crabitTrack("outbound-olkeoni") */
    window.crabitTrack = function (label, targetHost) {
      send({ type: "outbound", label: String(label || "outbound-link").toLowerCase().slice(0, 60), target_host: targetHost || null });
    };
  } catch (e) {
    /* 기록이 안 되는 건 사이트가 깨지는 것보다 훨씬 나은 일입니다. */
  }
})();
