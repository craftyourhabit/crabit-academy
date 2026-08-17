/* ===============================================
   크래빗 아카데미 조회수 기록

   페이지가 열릴 때 한 줄을 Supabase에 넣습니다. 그게 전부예요.

   【남기지 않는 것】
   - 쿠키, 방문자 식별자, IP를 저장하지 않습니다.
   - 유입 주소는 도메인만 남깁니다. 전체 URL에는 검색어 같은 게
     섞여 들어올 수 있어서 통째로 버립니다.

   그래서 "누가 봤는지"는 알 수 없고 "몇 번 봤는지"만 압니다.
   강의별 조회수와 전환율에는 그걸로 충분합니다.

   새로고침으로 숫자가 부풀지 않도록, 같은 탭에서 같은 페이지를 다시
   열면 세지 않습니다. (sessionStorage, 탭을 닫으면 초기화)
   =============================================== */
(function () {
  var SB_URL = "https://ttolvlzubashyhdctbqr.supabase.co";
  var SB_KEY = "sb_publishable_BLr1R3be079ViSLSoAtIqQ_ZTs7T6HG";

  try {
    /* 어드민은 세지 않습니다. 우리가 들락거린 게 조회수로 잡히면 안 되니까요. */
    if (/\/admin(\.html)?$/.test(location.pathname)) return;

    /* 브라우저가 "추적하지 마세요"라고 알려주면 존중합니다. */
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;

    var path = location.pathname.slice(0, 200);
    var eventId = null;
    if (/event(\.html)?$/.test(location.pathname)) {
      eventId = new URLSearchParams(location.search).get("id");
      if (eventId) eventId = String(eventId).slice(0, 60);
    }

    /* 같은 탭에서 이미 센 페이지면 넘어갑니다. */
    var mark = "crabit_pv:" + path + ":" + (eventId || "");
    if (sessionStorage.getItem(mark)) return;
    sessionStorage.setItem(mark, "1");

    var host = null;
    if (document.referrer) {
      try {
        var h = new URL(document.referrer).hostname;
        /* 사이트 안에서 이동한 건 유입이 아니라 그냥 이동입니다. */
        if (h && h !== location.hostname) host = h.slice(0, 120);
      } catch (e) { /* 이상한 referrer는 그냥 버립니다 */ }
    }

    var body = JSON.stringify({ event_id: eventId, path: path, referrer_host: host });

    /* sendBeacon 은 페이지를 떠나는 중에도 안전하게 보냅니다.
       apikey 헤더를 못 실어서 쿼리스트링으로 넘깁니다. */
    var url = SB_URL + "/rest/v1/academy_pageviews?apikey=" + encodeURIComponent(SB_KEY);
    var sent = false;
    if (navigator.sendBeacon) {
      sent = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    }
    if (!sent) {
      fetch(SB_URL + "/rest/v1/academy_pageviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SB_KEY,
          "Authorization": "Bearer " + SB_KEY,
          "Prefer": "return=minimal"
        },
        body: body,
        keepalive: true
      }).catch(function () { /* 조회수 기록이 실패해도 페이지는 멀쩡해야 합니다 */ });
    }
  } catch (e) {
    /* 기록이 안 되는 건 사이트가 깨지는 것보다 훨씬 나은 일입니다. */
  }
})();
