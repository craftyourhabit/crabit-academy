/* ===============================================
   공통 헤더 메뉴 (모든 페이지)
   - 좁은 화면(640px 이하)에서는 헤더의 글자 메뉴를 숨기고 햄버거 버튼을 띄웁니다.
     누르면 헤더 아래로 교육 / 설명회, VOD 강의, 자료 / 인사이트가 펼쳐져요.
   - 넓은 화면은 지금처럼 글자 메뉴를 그대로 씁니다.
   - 뒤로가기 버튼을 조금 연하게 보이게 하는 것도 여기서 합니다.
   각 페이지 헤더는 손으로 쓴 인라인 스타일이라, 한 곳에서 고치려고 이 파일로 모았어요.
   메뉴 항목은 페이지의 header nav 안 링크를 그대로 가져옵니다. 메뉴를 바꾸려면 각 페이지의 nav 를 고치세요.
   =============================================== */
(function () {
  var nav = document.querySelector("header nav");
  if (!nav) return;
  var links = [].slice.call(nav.querySelectorAll("a"));
  if (!links.length) return;

  var css = ""
    + "header a[aria-label='뒤로가기']{color:rgba(22,25,42,.42)!important;border-color:#EEEEF1!important;background:rgba(255,255,255,.7)!important}"
    + "header a[aria-label='뒤로가기']:hover{color:#16192A!important}"
    + ".sm-btn{display:none;align-items:center;justify-content:center;width:40px;height:40px;margin-left:auto;border:0;border-radius:10px;background:none;color:#16192A;cursor:pointer;-webkit-tap-highlight-color:transparent}"
    + ".sm-btn:hover{background:#F2F3F6}"
    + ".sm-btn svg{width:24px;height:24px;display:block}"
    + ".sm-panel{position:fixed;left:0;right:0;z-index:59;background:#fff;box-shadow:0 12px 24px rgba(22,25,42,.08);border-bottom:1px solid #E8E8E8;padding:8px 24px 16px;display:none}"
    + ".sm-panel.open{display:block}"
    + ".sm-panel a{display:block;padding:15px 4px;font-size:17px;font-weight:600;color:#16192A;text-decoration:none;border-bottom:1px solid #F2F3F6;font-family:inherit}"
    + ".sm-panel a:last-child{border-bottom:0}"
    + ".sm-panel a.on{color:#FB75BB}"
    + ".sm-dim{position:fixed;inset:0;z-index:58;background:rgba(22,25,42,.18);display:none}"
    + ".sm-dim.open{display:block}"
    + "@media (max-width:640px){"
    +   "header nav{display:none!important}"
    +   ".sm-btn{display:inline-flex}"
    + "}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var ICON_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sm-btn";
  btn.setAttribute("aria-label", "메뉴 열기");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = ICON_OPEN;
  nav.parentElement.appendChild(btn);

  var panel = document.createElement("div");
  panel.className = "sm-panel";
  panel.id = "siteMenu";
  btn.setAttribute("aria-controls", "siteMenu");
  var here = location.pathname.replace(/\.html$/, "").split("/").pop();
  links.forEach(function (a) {
    var c = document.createElement("a");
    c.href = a.getAttribute("href");
    c.textContent = a.textContent.trim();
    var target = (a.getAttribute("href") || "").replace(/\.html$/, "").split("/").pop();
    if (target && target === here) c.className = "on";
    panel.appendChild(c);
  });
  var dim = document.createElement("div");
  dim.className = "sm-dim";
  document.body.appendChild(dim);
  document.body.appendChild(panel);

  function place() {
    var h = document.querySelector("header");
    panel.style.top = Math.max(0, h.getBoundingClientRect().bottom) + "px";
  }
  function setOpen(open) {
    if (open) place();
    panel.classList.toggle("open", open);
    dim.classList.toggle("open", open);
    btn.innerHTML = open ? ICON_CLOSE : ICON_OPEN;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  }
  btn.addEventListener("click", function () { setOpen(!panel.classList.contains("open")); });
  dim.addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 640) setOpen(false); else if (panel.classList.contains("open")) place(); });
  window.addEventListener("scroll", function () { if (panel.classList.contains("open")) place(); }, { passive: true });
})();
