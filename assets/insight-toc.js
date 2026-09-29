/* =====================================================================
   크래빗 아카데미 - 자료 페이지 공용 오른쪽 목차 (insight-theme.css 와 함께)

   - 페이지에 옛 오른쪽 목차(#sideToc, nav.toc[aria-label="개요"])가 있으면 그 항목을 그대로 가져오고,
     없으면 본문의 h2(모달 안 제목은 제외)로 목차를 만듭니다. 항목이 3개 미만이면 만들지 않아요.
   - 위치는 본문 글의 오른쪽 끝에서 60px 띄운 자리. 화면이 좁으면 CSS가 숨깁니다.
   - 지금 읽는 섹션을 핑크로 표시합니다.
   ===================================================================== */
(function () {
  function textOf(a) { return (a.textContent || "").replace(/\s+/g, " ").trim(); }
  var items = [];
  var old = document.querySelector("#sideToc") || document.querySelector('body > nav.toc[aria-label="개요"]');
  if (old) {
    old.querySelectorAll('a[href^="#"]').forEach(function (a) { items.push({ href: a.getAttribute("href"), text: textOf(a) }); });
  } else {
    var root = document.querySelector("main") || document.querySelector(".wrap") || document.body;
    var n = 0;
    root.querySelectorAll("h2").forEach(function (h) {
      if (h.closest(".modal-backdrop, [role=dialog], dialog")) return;
      if (!h.id) h.id = "sec-" + (++n);
      items.push({ href: "#" + h.id, text: textOf(h) });
    });
  }
  if (items.length < 3) return;

  var nav = document.createElement("nav");
  nav.className = "ins-toc"; nav.setAttribute("aria-label", "목차");
  nav.innerHTML = '<div class="toc-h">목차</div><ul></ul>';
  var ul = nav.querySelector("ul");
  items.forEach(function (it) {
    var li = document.createElement("li"); var a = document.createElement("a");
    a.href = it.href; a.textContent = it.text; li.appendChild(a); ul.appendChild(li);
  });
  document.body.appendChild(nav);

  // 본문 글 오른쪽 끝 기준으로 자리 잡기
  function place() {
    var ref = document.querySelector("main h1, .wrap h1") || document.querySelector("main, .wrap");
    if (!ref) return;
    var box = (ref.closest("main, .wrap") || ref).getBoundingClientRect();
    var cs = getComputedStyle(ref.closest("main, .wrap") || ref);
    var right = box.right - parseFloat(cs.paddingRight || 0);
    nav.style.left = Math.round(right + 60) + "px";
    nav.classList.add("ready");
  }
  place(); window.addEventListener("resize", place);

  // 지금 읽는 섹션 표시
  var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
  if (!("IntersectionObserver" in window)) return;
  var map = {}; links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
  var visible = {};
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
    var best = null, bestR = 0;
    Object.keys(visible).forEach(function (id) { if (visible[id] > bestR) { bestR = visible[id]; best = id; } });
    links.forEach(function (a) { a.classList.remove("active"); });
    if (best && map[best]) map[best].classList.add("active");
  }, { rootMargin: "-80px 0px -55% 0px", threshold: [0, 0.2, 0.5, 1] });
  Object.keys(map).forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    // 제목만 있는 경우 섹션 전체를 관찰
    var sec = el.tagName === "H2" ? (el.closest("section") || el) : el;
    if (sec !== el && !sec.id) sec.id = id + "-sec";
    if (sec !== el) { map[sec.id] = map[id]; }
    obs.observe(sec);
  });
})();
