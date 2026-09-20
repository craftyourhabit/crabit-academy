/* ===============================================
   결제 진행 단계 표시 (신청서 작성 → 주문 확인 → 결제)

   apply.html 에 있던 단계 표시를 결제 결과 페이지(pay/*.html)에서도 그대로 쓰기 위해
   한 곳으로 모았습니다. 모양이 갈라지지 않게 CSS 도 여기서 넣습니다.

   쓰는 법
     payStepBar(2)        3단계(결제)가 진행 중. 현재 단계는 핑크로 보입니다.
     payStepBar(3)        세 단계 모두 완료(결제까지 끝난 화면).
     payStepBar(2, ["신청서 작성", "접수 완료"])  단계 이름을 바꿀 때.
   =============================================== */
(function () {
  var css = ""
    + ".steps{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:30px}"
    + ".steps .st{display:flex;align-items:center;gap:9px;font-size:14.5px;font-weight:600;color:rgba(22,25,42,.3)}"
    + ".steps .st .n{flex:none;width:24px;height:24px;border-radius:99px;background:#F2F3F6;color:rgba(22,25,42,.55);"
    +   "font-size:12.5px;font-weight:700;display:flex;align-items:center;justify-content:center}"
    /* 지금 하고 있는 단계만 핑크. 지나온 단계는 회색 동그라미에 핑크 체크. */
    + ".steps .st.on{color:#FB75BB}"
    + ".steps .st.on .n{background:#FB75BB;color:#fff}"
    + ".steps .st.done{color:rgba(22,25,42,.55)}"
    + ".steps .st.done .n{background:#F2F3F6;color:#FB75BB}"
    + ".steps .arw{color:rgba(22,25,42,.3);font-size:13px}"
    + "@media (max-width:560px){.steps{gap:7px}.steps .st{font-size:13.5px}}";

  function injectCss() {
    if (document.getElementById("payStepsCss")) return;
    var st = document.createElement("style");
    st.id = "payStepsCss";
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* at: 진행 중인 단계 번호(0부터). names.length 를 넣으면 전부 완료로 그립니다. */
  window.payStepBar = function (at, names) {
    injectCss();
    names = names || ["신청서 작성", "주문 확인", "결제"];
    return '<div class="steps">' + names.map(function (n, i) {
      var cls = i < at ? "st done" : (i === at ? "st on" : "st");
      return '<div class="' + cls + '"><span class="n">' + (i < at ? "✓" : (i + 1)) + "</span>" + n + "</div>"
        + (i < names.length - 1 ? '<span class="arw">→</span>' : "");
    }).join("") + "</div>";
  };

  /* 정적인 페이지에서는 data-pay-steps 속성만 달아 두면 알아서 그립니다.
     예: <div data-pay-steps="2"></div> */
  document.addEventListener("DOMContentLoaded", function () {
    var nodes = document.querySelectorAll("[data-pay-steps]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].innerHTML = window.payStepBar(Number(nodes[i].getAttribute("data-pay-steps")));
    }
  });
})();
