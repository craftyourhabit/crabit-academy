/* =====================================================================
   크래빗 아카데미 어드민 - 성과 탭, UTM 링크 탭

   데이터는 Supabase 크래빗 아카데미 프로젝트에 있습니다.
   - academy_events     : assets/track.js 가 남긴 페이지뷰와 아웃바운드 클릭
   - academy_utm_links  : 이 화면에서 만든 UTM 링크
   - 집계 함수            : academy_overview, academy_page_stats, academy_utm_stats,
                            academy_utm_paths, academy_funnel
   만드는 SQL 과 배포 순서는 admin/ANALYTICS.md 에 있어요.

   로컬 확인: http://localhost:4174/admin.html?mock=1 로 열면 로그인 없이
   가짜 숫자로 화면만 그려 봅니다(localhost 에서만 동작).
   ===================================================================== */

const AN_SITE = "https://craftyourhabit.github.io/crabit-academy/";

/* 이번 편 퍼널. 새 편을 만들면 여기에 한 줄 추가하면 성과 탭에 카드가 하나 더 생깁니다. */
const AN_FUNNELS = [
  {
    title: "칼퇴지킴이 01 AI 툴 5개",
    source: "instagram",
    campaign: "ai-tools-5",           // ai-tools-5 로 시작하는 캠페인 전부
    path: "/r/ai-tools-5",
    label: "outbound-olkeoni",
    steps: ["인스타 유입", "아티클 조회", "올커니 클릭"]
  }
];

/* 기존에 쓰던 값(마케팅 어드민 KPI 시트 UTM_Links 기준). 입력칸 드롭다운으로 제안합니다. */
const AN_SOURCES = ["instagram", "kakao", "crabit-academy", "leaflet", "highmentor-leaders"];
const AN_MEDIUMS = ["social", "email", "print", "event-landing", "article"];

/* 이번 편 기본값 묶음. 누르면 폼이 한 번에 채워집니다. */
const AN_PRESETS = [
  { key: "caption", label: "AI 툴 5개 | 인스타 캡션", kind: "article", article: "ai-tools-5",
    source: "instagram", medium: "social", campaign: "ai-tools-5", content: "caption",
    name: d => "[인스타 캡션] " + d + " AI 툴 5가지 아티클 링크" },
  { key: "dm", label: "AI 툴 5개 | 매니챗 DM", kind: "article", article: "ai-tools-5",
    source: "instagram", medium: "social", campaign: "ai-tools-5", content: "manychat-dm",
    name: d => "[인스타 매니챗 DM] " + d + " AI 툴 5가지 아티클 링크" },
  { key: "olk", label: "AI 툴 5개 | 아티클 안 올커니 버튼", kind: "external", extLabel: "올커니 입장 링크",
    source: "crabit-academy", medium: "article", campaign: "ai-tools-5", content: "olkeoni-cta",
    name: d => "[크래빗 아카데미 아티클] " + d + " AI 툴 5가지 올커니 입장 링크" }
];

let anRange = 30;            // 7 | 30 | null(전체)
let anPageMode = "article";  // article | all

/* ---------- 작은 도구 ---------- */
const anNum = n => Number(n || 0).toLocaleString("ko-KR");
const anPct = (a, b) => (Number(b) > 0 ? (Number(a) * 100 / Number(b)).toFixed(1) + "%" : "-");
const anVal = v => String(v == null ? "" : v).trim().toLowerCase().replace(/\s+/g, "_");
const AN_VALID = /^[a-z0-9_-]+$/;
function anToday() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return String(d.getUTCMonth() + 1).padStart(2, "0") + "." + String(d.getUTCDate()).padStart(2, "0");
}
function anDate(iso) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return d.getUTCFullYear() + "/" + String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + String(d.getUTCDate()).padStart(2, "0");
}
function anRpc(name, args) {
  return table("/rpc/" + name, { method: "POST", body: args || {} });
}
async function anCopy(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (er) { /* 무시 */ }
    ta.remove();
  }
  if (btn) {
    const was = btn.textContent;
    btn.textContent = "복사했어요";
    setTimeout(() => { btn.textContent = was; }, 1400);
  }
}

/* 아티클 목록: 공개 자료 중 사이트 안 페이지가 있는 것 */
function anArticles() {
  return (store.RESOURCES || [])
    .filter(r => r.href && !/^https?:/i.test(r.href) && r.access !== "soon")
    .map(r => ({ id: r.id, title: r.title, href: r.href.replace(/\.html$/, ""), path: "/" + r.href.replace(/\.html$/, "") }));
}
function anPageTitle(path) {
  if (path === "/") return "홈";
  if (path === "/resources") return "자료 목록";
  if (path === "/event") return "강의 상세";
  const a = anArticles().find(x => x.path === path);
  return a ? a.title : path;
}

/* UTM 붙인 주소 만들기. 기존 쿼리와 # 위치를 지킵니다. */
function anBuildUrl(base, p) {
  const u = new URL(base);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(k => u.searchParams.delete(k));
  u.searchParams.set("utm_source", p.source);
  u.searchParams.set("utm_medium", p.medium);
  u.searchParams.set("utm_campaign", p.campaign);
  if (p.content) u.searchParams.set("utm_content", p.content);
  return u.toString();
}
const anKey = (s, m, c, ct) => [s || "", m || "", c || "", ct || ""].join("|");

/* ---------- 스타일 (이 두 탭에서만 씀) ----------
   크래빗 디자인 규칙: 카드는 테두리 대신 옅은 그림자, 왼쪽 막대 금지,
   태그는 배경색과 글자색만, 굵기 700 이하, 핑크는 포인트에만. */
(function anStyle() {
  const css = `
  .an-card { background:#fff; border:1px solid transparent; border-radius:14px; padding:20px 22px; margin-bottom:18px; box-shadow:0 1px 4px rgba(22,25,42,0.06), 0 6px 18px rgba(22,25,42,0.04); }
  .an-head { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:14px; }
  .an-title { font-size:15.5px; font-weight:700; }
  .an-sub { font-size:13px; color:var(--muted); margin-top:2px; }
  .an-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
  .an-kpi { background:#fff; border-radius:14px; padding:16px 18px; box-shadow:0 1px 4px rgba(22,25,42,0.06); }
  .an-kpi .l { font-size:13px; color:var(--muted); }
  .an-kpi .n { font-size:23px; font-weight:700; letter-spacing:-0.02em; margin-top:4px; font-variant-numeric:tabular-nums; }
  .an-kpi .s { font-size:12.5px; color:var(--muted); margin-top:2px; }
  .an-tag { display:inline-block; font-size:12px; font-weight:600; padding:3px 9px; border-radius:7px; background:#F2F3F6; color:rgba(22,25,42,0.7); white-space:nowrap; }
  .an-tag.pink { background:#FEE9F4; color:#D1468F; }
  .an-tag.dark { background:#16192A; color:#fff; }
  .an-funnel { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .an-step { background:#F9FAFC; border-radius:12px; padding:16px 16px 14px; position:relative; }
  .an-step .st-l { font-size:13px; color:var(--muted); font-weight:600; }
  .an-step .st-n { font-size:26px; font-weight:700; letter-spacing:-0.02em; margin:4px 0 10px; font-variant-numeric:tabular-nums; }
  .an-step .st-n small { font-size:13px; font-weight:500; color:var(--muted); margin-left:3px; }
  .an-bar { height:8px; border-radius:99px; background:#EDEEF2; overflow:hidden; }
  .an-bar i { display:block; height:100%; background:#FB75BB; border-radius:99px; }
  .an-step .st-r { font-size:12.5px; color:var(--muted); margin-top:8px; }
  .an-step .st-r b { color:var(--ink); font-weight:700; }
  .an-foot { display:flex; flex-wrap:wrap; gap:8px 18px; margin-top:14px; font-size:13px; color:var(--muted); }
  .an-foot b { color:var(--ink); font-weight:600; }
  .an-tbl-wrap { overflow-x:auto; }
  .an-tbl { width:100%; border-collapse:collapse; font-size:13.5px; }
  .an-tbl th { text-align:left; font-size:12.5px; font-weight:600; color:var(--muted); padding:9px 10px; border-bottom:1px solid var(--line); white-space:nowrap; }
  .an-tbl td { padding:11px 10px; border-bottom:1px solid #F0F1F4; vertical-align:middle; }
  .an-tbl tr:last-child td { border-bottom:0; }
  .an-tbl .r { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .an-tbl .t { font-weight:600; max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .an-tbl .m { font-size:12.5px; color:var(--muted); }
  .an-tbl td.tg { min-width:170px; }
  .an-tbl td.uv { min-width:210px; }
  .an-mini { display:flex; align-items:center; gap:8px; }
  .an-mini .an-bar { width:70px; height:6px; flex:none; }
  .an-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:0 16px; }
  .an-presets { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px; }
  .an-preset { font:inherit; font-size:13px; font-weight:600; padding:8px 13px; border-radius:99px; border:0; background:#F2F3F6; color:var(--ink); cursor:pointer; }
  .an-preset:hover { background:#E9EAEE; }
  .an-preset.on { background:#16192A; color:#fff; }
  .an-out { background:#F9FAFC; border-radius:12px; padding:14px 16px; margin:4px 0 14px; }
  .an-out .u { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; word-break:break-all; line-height:1.6; }
  .an-out .u.empty { color:var(--muted); font-family:inherit; }
  .an-acts { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .an-msg { font-size:13.5px; color:var(--muted); }
  .an-msg.ok { color:#0B7A3B; } .an-msg.bad { color:#C2255C; }
  .an-note { background:#F9FAFC; border-radius:12px; padding:13px 15px; font-size:13.5px; color:var(--muted); margin-bottom:18px; line-height:1.7; }
  .an-note b { color:var(--ink); font-weight:600; }
  .an-empty { padding:30px 0; text-align:center; color:var(--muted); font-size:14px; }
  .an-split { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
  @media (max-width: 900px) {
    .an-kpis { grid-template-columns:repeat(2,1fr); }
    .an-funnel { grid-template-columns:1fr; }
    .an-grid { grid-template-columns:1fr; }
  }`;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
})();

/* 기간 선택 버튼 (7일, 30일, 전체) */
function anRangeSeg(onChange) {
  const seg = el("div", "seg-mini");
  [[7, "7일"], [30, "30일"], [null, "전체"]].forEach(([d, lab]) => {
    const b = el("button", anRange === d ? "on" : null, lab);
    b.type = "button";
    b.addEventListener("click", () => { anRange = d; onChange(); });
    seg.appendChild(b);
  });
  return seg;
}

/* 표를 아직 안 만들었을 때 보여 줄 안내 */
function anSetupNote(box, e) {
  const n = el("div", "an-note");
  n.innerHTML = "<b>아직 측정 준비가 끝나지 않았어요.</b><br />"
    + "Supabase SQL Editor 에서 <code>admin/supabase-analytics.sql</code> 을 실행하고, "
    + "Edge Function <code>track</code> 을 배포해야 숫자가 쌓입니다. 순서는 <code>admin/ANALYTICS.md</code> 에 있어요."
    + (e && e.message ? "<br /><span style=\"font-size:12.5px\">오류: " + String(e.message).replace(/</g, "&lt;") + "</span>" : "");
  box.appendChild(n);
}

/* =====================================================================
   성과 탭
   ===================================================================== */
async function renderAnalytics() {
  const box = document.getElementById("list");
  document.querySelector("#listTitle").firstChild.textContent = "성과";
  document.querySelector("#listCnt").textContent = "";
  box.className = "";
  box.innerHTML = '<div class="empty">불러오는 중이에요…</div>';

  const days = anRange;
  let ov, pages, utms, upaths, links, funnels;
  try {
    [ov, pages, utms, upaths, links, funnels] = await Promise.all([
      anRpc("academy_overview", { p_days: days }),
      anRpc("academy_page_stats", { p_days: days }),
      anRpc("academy_utm_stats", { p_days: days }),
      anRpc("academy_utm_paths", { p_days: days }),
      table("/academy_utm_links?select=*&order=created_at.desc"),
      Promise.all(AN_FUNNELS.map(f => anRpc("academy_funnel", {
        p_source: f.source, p_campaign_prefix: f.campaign, p_path: f.path, p_label: f.label, p_days: days
      })))
    ]);
  } catch (e) {
    box.innerHTML = "";
    anSetupNote(box, e);
    return;
  }
  if (days !== anRange) return;   // 불러오는 사이 기간을 바꿨으면 버림
  ov = (ov && ov[0]) || {};
  pages = pages || []; utms = utms || []; upaths = upaths || []; links = links || [];
  box.innerHTML = "";

  /* --- 머리: 기간 --- */
  const top = el("div", "an-head");
  const tl = el("div");
  tl.appendChild(el("div", "an-sub", "방문 기록은 assets/track.js 가 남깁니다. 어드민 방문과 로컬 확인은 세지 않아요."));
  top.appendChild(tl);
  top.appendChild(anRangeSeg(renderAnalytics));
  box.appendChild(top);

  /* --- 요약 숫자 --- */
  const k = el("div", "an-kpis");
  [
    ["페이지뷰", anNum(ov.views), "같은 탭 새로고침은 한 번만"],
    ["순방문자", anNum(ov.visitors), "브라우저 기준"],
    ["UTM 유입 방문자", anNum(ov.utm_visitors), "순방문자의 " + anPct(ov.utm_visitors, ov.visitors)],
    ["아웃바운드 클릭", anNum(ov.outbound_clicks), "data-track 버튼과 바깥 링크"]
  ].forEach(([l, n, s]) => {
    const c = el("div", "an-kpi");
    c.appendChild(el("div", "l", l)); c.appendChild(el("div", "n", n)); c.appendChild(el("div", "s", s));
    k.appendChild(c);
  });
  box.appendChild(k);

  /* --- 퍼널 카드 --- */
  AN_FUNNELS.forEach((f, i) => {
    const r = ((funnels[i] || [])[0]) || {};
    const card = el("div", "an-card");
    const h = el("div", "an-head");
    const hl = el("div");
    hl.appendChild(el("div", "an-title", "퍼널 | " + f.title));
    hl.appendChild(el("div", "an-sub", "utm_source=" + f.source + ", utm_campaign=" + f.campaign + "* 로 들어와 "
      + f.path + " 을 보고 " + f.label + " 을 누른 방문자"));
    h.appendChild(hl);
    h.appendChild(el("span", "an-tag pink", "클릭 기준"));
    card.appendChild(h);

    const vals = [r.inflow_visitors, r.article_visitors, r.click_visitors].map(Number).map(v => v || 0);
    const max = Math.max(1, vals[0]);
    const grid = el("div", "an-funnel");
    vals.forEach((v, j) => {
      const s = el("div", "an-step");
      s.appendChild(el("div", "st-l", (j + 1) + ". " + f.steps[j]));
      const n = el("div", "st-n", anNum(v));
      n.appendChild(el("small", null, "명"));
      s.appendChild(n);
      const bar = el("div", "an-bar"); const bi = el("i"); bi.style.width = Math.round(v / max * 100) + "%";
      bar.appendChild(bi); s.appendChild(bar);
      const rr = el("div", "st-r");
      if (j === 0) rr.innerHTML = "기준 단계";
      else rr.innerHTML = "앞 단계 대비 <b>" + anPct(v, vals[j - 1]) + "</b>" + (j === 2 ? " | 유입 대비 <b>" + anPct(v, vals[0]) + "</b>" : "");
      s.appendChild(rr);
      grid.appendChild(s);
    });
    card.appendChild(grid);

    /* 캡션과 DM 중 어디서 더 왔는지 */
    const split = utms.filter(u => u.utm_source === f.source && String(u.utm_campaign || "").indexOf(f.campaign) === 0);
    if (split.length) {
      const sp = el("div", "an-split");
      split.forEach(u => {
        sp.appendChild(el("span", "an-tag", (u.utm_content || "(content 없음)") + " " + anNum(u.visitors) + "명, 올커니 " + anNum(u.olkeoni_visitors) + "명"));
      });
      card.appendChild(sp);
    }

    const foot = el("div", "an-foot");
    foot.innerHTML = "<span>올커니 클릭 수(중복 포함) <b>" + anNum(r.click_total) + "회</b></span>"
      + "<span>경로와 상관없이 아티클 본 방문자 <b>" + anNum(r.all_article_visitors) + "명</b></span>"
      + "<span>경로와 상관없이 올커니 누른 방문자 <b>" + anNum(r.all_click_visitors) + "명</b></span>";
    card.appendChild(foot);
    const note = el("div", "an-sub", "올커니 입장은 버튼 클릭 기준이에요. 오픈채팅방에 실제로 들어왔는지는 우리 쪽에서 셀 수 없습니다.");
    note.style.marginTop = "10px";
    card.appendChild(note);
    box.appendChild(card);
  });

  /* --- 아티클별 조회수 --- */
  const pc = el("div", "an-card");
  const ph = el("div", "an-head");
  ph.appendChild(el("div", "an-title", "아티클별 조회수"));
  const pseg = el("div", "seg-mini");
  [["article", "아티클"], ["all", "전체 페이지"]].forEach(([m, lab]) => {
    const b = el("button", anPageMode === m ? "on" : null, lab);
    b.type = "button";
    b.addEventListener("click", () => { anPageMode = m; renderAnalytics(); });
    pseg.appendChild(b);
  });
  ph.appendChild(pseg);
  pc.appendChild(ph);

  const artPaths = new Set(anArticles().map(a => a.path));
  let prow = pages.filter(p => Number(p.views) > 0 || Number(p.outbound_clicks) > 0);
  if (anPageMode === "article") {
    prow = prow.filter(p => artPaths.has(p.path));
    /* 아직 조회가 0인 아티클도 목록에는 보이게 */
    anArticles().forEach(a => { if (!prow.find(p => p.path === a.path)) prow.push({ path: a.path, views: 0, visitors: 0, utm_visitors: 0, outbound_clicks: 0 }); });
  }
  prow.sort((a, b) => Number(b.views) - Number(a.views));
  if (!prow.length) {
    pc.appendChild(el("div", "an-empty", "이 기간에는 기록이 없어요."));
  } else {
    const maxV = Math.max(1, ...prow.map(p => Number(p.views)));
    const wrap = el("div", "an-tbl-wrap");
    const t = el("table", "an-tbl");
    t.innerHTML = "<thead><tr><th>페이지</th><th class=\"r\">페이지뷰</th><th class=\"r\">순방문자</th><th class=\"r\">UTM 유입 비중</th><th class=\"r\">아웃바운드 클릭</th></tr></thead>";
    const tb = el("tbody");
    prow.forEach(p => {
      const tr = el("tr");
      const td0 = el("td");
      td0.appendChild(el("div", "t", anPageTitle(p.path)));
      td0.appendChild(el("div", "m", p.path));
      tr.appendChild(td0);
      const td1 = el("td", "r");
      const mini = el("div", "an-mini"); mini.style.justifyContent = "flex-end";
      const bar = el("div", "an-bar"); const bi = el("i"); bi.style.width = Math.round(Number(p.views) / maxV * 100) + "%";
      bar.appendChild(bi); mini.appendChild(bar); mini.appendChild(el("span", null, anNum(p.views)));
      td1.appendChild(mini); tr.appendChild(td1);
      tr.appendChild(el("td", "r", anNum(p.visitors)));
      tr.appendChild(el("td", "r", anPct(p.utm_visitors, p.visitors)));
      tr.appendChild(el("td", "r", anNum(p.outbound_clicks)));
      tb.appendChild(tr);
    });
    t.appendChild(tb); wrap.appendChild(t); pc.appendChild(wrap);
  }
  box.appendChild(pc);

  /* --- UTM별 유입 --- */
  const uc = el("div", "an-card");
  const uh = el("div", "an-head");
  const uhl = el("div");
  uhl.appendChild(el("div", "an-title", "UTM별 유입"));
  uhl.appendChild(el("div", "an-sub", "아티클 조회는 링크가 가리키는 페이지 기준, 클릭률은 유입 방문자 중 아웃바운드를 누른 비율이에요."));
  uh.appendChild(uhl);
  const toUtm = el("button", "btn btn-secondary btn-sm", "UTM 링크 만들기");
  toUtm.addEventListener("click", () => goTab("utm"));
  uh.appendChild(toUtm);
  uc.appendChild(uh);

  const linkMap = new Map();
  links.slice().reverse().forEach(l => linkMap.set(anKey(l.utm_source, l.utm_medium, l.utm_campaign, l.utm_content), l));
  if (!utms.length) {
    uc.appendChild(el("div", "an-empty", "이 기간에 UTM 으로 들어온 방문이 없어요."));
  } else {
    const wrap = el("div", "an-tbl-wrap");
    const t = el("table", "an-tbl");
    t.innerHTML = "<thead><tr><th>캠페인</th><th>source / medium</th><th class=\"r\">유입 방문자</th><th class=\"r\">아티클 조회</th><th class=\"r\">아웃바운드 클릭</th><th class=\"r\">클릭률</th></tr></thead>";
    const tb = el("tbody");
    utms.forEach(u => {
      const key = anKey(u.utm_source, u.utm_medium, u.utm_campaign, u.utm_content);
      const link = linkMap.get(key);
      const mine = upaths.filter(p => anKey(p.utm_source, p.utm_medium, p.utm_campaign, p.utm_content) === key);
      let tp = null;
      if (link && link.target_kind === "article") {
        try { tp = "/" + new URL(link.base_url).pathname.replace(/^\/crabit-academy\//, "").replace(/\.html$/, ""); } catch (e) { tp = null; }
        if (tp === "/") tp = "/";
      }
      const hit = tp ? mine.find(p => p.path === tp) : mine.slice().sort((a, b) => Number(b.views) - Number(a.views))[0];

      const tr = el("tr");
      const td0 = el("td");
      td0.appendChild(el("div", "t", link ? link.name : u.utm_campaign));
      td0.appendChild(el("div", "m", u.utm_campaign + (u.utm_content ? " / " + u.utm_content : "") + (link ? "" : " (등록 안 된 UTM)")));
      tr.appendChild(td0);
      tr.appendChild(el("td", "m", u.utm_source + " / " + (u.utm_medium || "-")));
      tr.appendChild(el("td", "r", anNum(u.visitors)));
      const td3 = el("td", "r");
      td3.appendChild(el("div", null, hit ? anNum(hit.views) : "0"));
      if (hit) td3.appendChild(el("div", "m", anPageTitle(hit.path)));
      tr.appendChild(td3);
      const td4 = el("td", "r");
      td4.appendChild(el("div", null, anNum(u.outbound_clicks)));
      if (Number(u.olkeoni_clicks)) td4.appendChild(el("div", "m", "올커니 " + anNum(u.olkeoni_clicks)));
      tr.appendChild(td4);
      tr.appendChild(el("td", "r", anPct(u.outbound_visitors, u.visitors)));
      tb.appendChild(tr);
    });
    t.appendChild(tb); wrap.appendChild(t); uc.appendChild(wrap);
  }
  box.appendChild(uc);
}

/* =====================================================================
   UTM 링크 탭
   ===================================================================== */
const anForm = { kind: "article", article: "ai-tools-5", extUrl: "", extLabel: "", name: "", source: "", medium: "", campaign: "", content: "", memo: "", preset: null };

async function renderUtm() {
  const box = document.getElementById("list");
  document.querySelector("#listTitle").firstChild.textContent = "UTM 링크";
  document.querySelector("#listCnt").textContent = "";
  box.className = "";
  box.innerHTML = '<div class="empty">불러오는 중이에요…</div>';

  let links = [], stats = [], loadErr = null;
  try {
    [links, stats] = await Promise.all([
      table("/academy_utm_links?select=*&order=created_at.desc"),
      anRpc("academy_utm_stats", { p_days: null }).catch(() => [])
    ]);
    links = links || []; stats = stats || [];
  } catch (e) { loadErr = e; }
  box.innerHTML = "";
  if (loadErr) anSetupNote(box, loadErr);

  const arts = anArticles();
  if (!anForm.extUrl) { try { anForm.extUrl = localStorage.getItem("crabit_utm_ext_url") || ""; } catch (e) { /* 무시 */ } }

  /* --- 만들기 카드 --- */
  const card = el("div", "an-card");
  const h = el("div", "an-head");
  const hl = el("div");
  hl.appendChild(el("div", "an-title", "새 UTM 링크"));
  hl.appendChild(el("div", "an-sub", "캠페인명은 [채널 자료] MM.DD 무슨 링크 형식으로 써 주세요. utm 값은 영문 소문자, 숫자, -, _ 만 됩니다."));
  h.appendChild(hl);
  card.appendChild(h);

  const pr = el("div", "an-presets");
  AN_PRESETS.forEach(p => {
    const b = el("button", "an-preset" + (anForm.preset === p.key ? " on" : ""), p.label);
    b.type = "button";
    b.addEventListener("click", () => {
      Object.assign(anForm, {
        preset: p.key, kind: p.kind, source: p.source, medium: p.medium, campaign: p.campaign, content: p.content,
        name: p.name(anToday())
      });
      if (p.article) anForm.article = p.article;
      if (p.extLabel) anForm.extLabel = p.extLabel;
      renderUtm();
    });
    pr.appendChild(b);
  });
  card.appendChild(pr);

  const field = (label, node, hint) => {
    const f = el("label", "field");
    f.appendChild(el("span", "lab", label));
    f.appendChild(node);
    if (hint) f.appendChild(el("span", "hint", hint));
    return f;
  };
  const input = (key, ph, list) => {
    const i = document.createElement("input");
    i.type = "text"; i.value = anForm[key] || ""; i.placeholder = ph || "";
    if (list) i.setAttribute("list", list);
    i.addEventListener("input", () => { anForm[key] = i.value; anForm.preset = null; update(); });
    return i;
  };

  /* 대상 */
  const sel = document.createElement("select");
  arts.forEach(a => {
    const o = document.createElement("option"); o.value = "a:" + a.id; o.textContent = "아티클 | " + a.title; sel.appendChild(o);
  });
  [["p:home", "사이트 | 홈"], ["p:resources", "사이트 | 자료 목록"], ["x", "외부 링크 직접 입력 (예: 올커니 입장 링크)"]].forEach(([v, t]) => {
    const o = document.createElement("option"); o.value = v; o.textContent = t; sel.appendChild(o);
  });
  sel.value = anForm.kind === "external" ? "x" : (anForm.article === "__home" ? "p:home" : anForm.article === "__resources" ? "p:resources" : "a:" + anForm.article);
  if (!sel.value && sel.options.length) sel.selectedIndex = 0;
  sel.addEventListener("change", () => {
    const v = sel.value;
    if (v === "x") anForm.kind = "external";
    else { anForm.kind = "article"; anForm.article = v === "p:home" ? "__home" : v === "p:resources" ? "__resources" : v.slice(2); }
    anForm.preset = null;
    renderUtm();
  });
  card.appendChild(field("링크 대상", sel));

  if (anForm.kind === "external") {
    const g = el("div", "an-grid");
    const u = input("extUrl", "https://...");
    u.type = "url";
    u.addEventListener("change", () => { try { localStorage.setItem("crabit_utm_ext_url", anForm.extUrl); } catch (e) { /* 무시 */ } });
    g.appendChild(field("외부 링크 주소", u, "올커니 입장 링크처럼 사이트 밖 주소. 한 번 넣으면 이 브라우저가 기억해요."));
    g.appendChild(field("대상 이름", input("extLabel", "예: 올커니 입장 링크")));
    card.appendChild(g);
  }

  card.appendChild(field("캠페인명", input("name", "[인스타 캡션] " + anToday() + " AI 툴 5가지 아티클 링크")));

  /* source, medium 제안 목록: 기존 값 + 저장된 링크에서 쓴 값 */
  const mkList = (id, base, extra) => {
    const dl = document.createElement("datalist"); dl.id = id;
    Array.from(new Set(base.concat(extra.filter(Boolean)))).forEach(v => { const o = document.createElement("option"); o.value = v; dl.appendChild(o); });
    return dl;
  };
  card.appendChild(mkList("anSrcList", AN_SOURCES, links.map(l => l.utm_source)));
  card.appendChild(mkList("anMedList", AN_MEDIUMS, links.map(l => l.utm_medium)));
  card.appendChild(mkList("anCmpList", [], links.map(l => l.utm_campaign)));

  const g1 = el("div", "an-grid");
  g1.appendChild(field("utm_source", input("source", "instagram", "anSrcList"), "어디서 (instagram, kakao, crabit-academy …)"));
  g1.appendChild(field("utm_medium", input("medium", "social", "anMedList"), "어떤 방식 (social, email, article …)"));
  card.appendChild(g1);
  const g2 = el("div", "an-grid");
  g2.appendChild(field("utm_campaign", input("campaign", "ai-tools-5", "anCmpList"), "무슨 캠페인 (편 단위로 같게)"));
  g2.appendChild(field("utm_content", input("content", "caption"), "선택. 같은 캠페인 안에서 자리 구분 (caption, manychat-dm …)"));
  card.appendChild(g2);
  card.appendChild(field("메모 (선택)", input("memo", "")));

  const out = el("div", "an-out");
  const outU = el("div", "u");
  out.appendChild(outU);
  card.appendChild(out);

  const acts = el("div", "an-acts");
  const copyB = el("button", "btn btn-secondary btn-sm", "주소 복사");
  const saveB = el("button", "btn btn-primary btn-sm", "목록에 저장");
  const msg = el("span", "an-msg");
  acts.appendChild(copyB); acts.appendChild(saveB); acts.appendChild(msg);
  card.appendChild(acts);
  box.appendChild(card);

  function baseUrl() {
    if (anForm.kind === "external") return (anForm.extUrl || "").trim();
    if (anForm.article === "__home") return AN_SITE;
    if (anForm.article === "__resources") return AN_SITE + "resources";
    const a = arts.find(x => x.id === anForm.article);
    return a ? AN_SITE + a.href : "";
  }
  function targetLabel() {
    if (anForm.kind === "external") return (anForm.extLabel || "").trim() || null;
    if (anForm.article === "__home") return "홈";
    if (anForm.article === "__resources") return "자료 목록";
    const a = arts.find(x => x.id === anForm.article);
    return a ? a.title : null;
  }
  function current() {
    const p = { source: anVal(anForm.source), medium: anVal(anForm.medium), campaign: anVal(anForm.campaign), content: anVal(anForm.content) };
    const base = baseUrl();
    const errs = [];
    if (!/^https?:\/\//i.test(base)) errs.push("링크 대상 주소");
    ["source", "medium", "campaign"].forEach(k => { if (!p[k]) errs.push("utm_" + k); });
    const bad = ["source", "medium", "campaign", "content"].filter(k => p[k] && !AN_VALID.test(p[k]));
    let url = null;
    if (!errs.length && !bad.length) { try { url = anBuildUrl(base, p); } catch (e) { errs.push("링크 대상 주소"); } }
    return { p, base, url, errs, bad };
  }
  function update() {
    const c = current();
    if (c.url) { outU.className = "u"; outU.textContent = c.url; }
    else {
      outU.className = "u empty";
      outU.textContent = c.bad.length
        ? c.bad.map(k => "utm_" + k).join(", ") + " 에는 영문 소문자, 숫자, -, _ 만 쓸 수 있어요."
        : "채워야 할 칸: " + c.errs.join(", ");
    }
    copyB.disabled = !c.url;
    saveB.disabled = !c.url || !String(anForm.name || "").trim();
  }
  update();

  copyB.addEventListener("click", () => { const c = current(); if (c.url) anCopy(c.url, copyB); });
  saveB.addEventListener("click", async () => {
    const c = current();
    if (!c.url) return;
    saveB.disabled = true; msg.className = "an-msg"; msg.textContent = "저장하는 중…";
    try {
      await table("/academy_utm_links", {
        method: "POST",
        headers: { "Prefer": "return=minimal" },
        body: {
          name: String(anForm.name).trim().slice(0, 120),
          target_kind: anForm.kind === "external" ? "external" : "article",
          target_label: targetLabel(),
          base_url: c.base, utm_source: c.p.source, utm_medium: c.p.medium, utm_campaign: c.p.campaign,
          utm_content: c.p.content || null, utm_url: c.url, memo: String(anForm.memo || "").trim() || null
        }
      });
      msg.className = "an-msg ok"; msg.textContent = "저장했어요.";
      setTimeout(renderUtm, 700);
    } catch (e) {
      msg.className = "an-msg bad"; msg.textContent = e.message || "저장하지 못했어요.";
      saveB.disabled = false;
    }
  });

  /* --- 저장된 링크 목록 --- */
  const lc = el("div", "an-card");
  const lh = el("div", "an-head");
  const lhl = el("div");
  lhl.appendChild(el("div", "an-title", "저장된 링크 " + (links.length ? links.length + "개" : "")));
  lhl.appendChild(el("div", "an-sub", "\"시트용 복사\"는 KPI 대시보드 시트 UTM_Links 탭 칸 순서(생성일, 캠페인명, source, medium, campaign, content, baseUrl, utmUrl)로 복사해요."));
  lh.appendChild(lhl);
  if (links.length) {
    const allB = el("button", "btn btn-secondary btn-sm", "전체 시트용 복사");
    allB.addEventListener("click", () => anCopy(links.slice().reverse().map(anSheetRow).join("\n"), allB));
    lh.appendChild(allB);
  }
  lc.appendChild(lh);

  const statMap = new Map(stats.map(s => [anKey(s.utm_source, s.utm_medium, s.utm_campaign, s.utm_content), s]));
  if (!links.length) {
    lc.appendChild(el("div", "an-empty", "아직 저장된 링크가 없어요. 위 기본값 버튼으로 이번 편 링크부터 만들어 보세요."));
  } else {
    const wrap = el("div", "an-tbl-wrap");
    const t = el("table", "an-tbl");
    t.innerHTML = "<thead><tr><th>생성일</th><th>캠페인명</th><th>대상</th><th>utm</th><th class=\"r\">유입 방문자(전체)</th><th></th></tr></thead>";
    const tb = el("tbody");
    links.forEach(l => {
      const s = statMap.get(anKey(l.utm_source, l.utm_medium, l.utm_campaign, l.utm_content));
      const tr = el("tr");
      tr.appendChild(el("td", "m", anDate(l.created_at)));
      const tn = el("td"); tn.appendChild(el("div", "t", l.name)); if (l.memo) tn.appendChild(el("div", "m", l.memo)); tr.appendChild(tn);
      const tt = el("td", "tg");
      tt.appendChild(el("span", "an-tag" + (l.target_kind === "external" ? " dark" : ""), l.target_kind === "external" ? "외부" : "아티클"));
      tt.appendChild(el("div", "m", l.target_label || l.base_url));
      tr.appendChild(tt);
      tr.appendChild(el("td", "m uv", [l.utm_source, l.utm_medium, l.utm_campaign, l.utm_content].filter(Boolean).join(" / ")));
      tr.appendChild(el("td", "r", s ? anNum(s.visitors) : (l.target_kind === "external" ? "측정 밖" : "0")));
      const ta = el("td", "r");
      const cb = el("button", "btn btn-ghost btn-sm", "주소 복사");
      cb.addEventListener("click", () => anCopy(l.utm_url, cb));
      const sb = el("button", "btn btn-ghost btn-sm", "시트용 복사");
      sb.addEventListener("click", () => anCopy(anSheetRow(l), sb));
      const db = el("button", "btn btn-ghost btn-sm", "삭제");
      db.addEventListener("click", async () => {
        const ok = typeof uiConfirm === "function"
          ? await uiConfirm({ title: "이 링크를 목록에서 지울까요?", desc: l.name + "\n이미 퍼뜨린 주소는 계속 동작하고, 들어온 기록도 남아요.", okText: "삭제" })
          : confirm("이 링크를 목록에서 지울까요?");
        if (!ok) return;
        try { await table("/academy_utm_links?id=eq." + encodeURIComponent(l.id), { method: "DELETE" }); renderUtm(); }
        catch (e) { alert(e.message || "지우지 못했어요."); }
      });
      ta.appendChild(cb); ta.appendChild(sb); ta.appendChild(db);
      tr.appendChild(ta);
      tb.appendChild(tr);
    });
    t.appendChild(tb); wrap.appendChild(t); lc.appendChild(wrap);
  }
  box.appendChild(lc);

  const n = el("div", "an-note");
  n.innerHTML = "<b>외부 링크(올커니 입장 링크 등)의 UTM 은 우리 쪽에서 셀 수 없어요.</b> 오픈채팅 같은 바깥 서비스가 UTM 을 기록하지 않기 때문입니다. "
    + "대신 아티클 안 버튼에 <code>data-track=\"outbound-olkeoni\"</code> 를 붙여 두면, 누가 어느 UTM 으로 들어와 버튼을 눌렀는지는 성과 탭에서 보입니다.";
  box.appendChild(n);
}

function anSheetRow(l) {
  const clean = v => String(v == null ? "" : v).replace(/[\t\n\r]+/g, " ");
  return [anDate(l.created_at), l.name, l.utm_source, l.utm_medium, l.utm_campaign, l.utm_content || "", l.base_url, l.utm_url].map(clean).join("\t");
}

/* =====================================================================
   로컬 확인용 가짜 데이터 (localhost + ?mock=1 일 때만)
   실제 사이트에서는 이 블록이 아무 일도 하지 않습니다.
   ===================================================================== */
(function anMock() {
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const qs = new URLSearchParams(location.search);
  if (!local || qs.get("mock") !== "1") return;

  const mockLinks = [
    { id: "m1", created_at: "2026-10-01T03:00:00Z", name: "[인스타 캡션] 10.01 AI 툴 5가지 아티클 링크", target_kind: "article", target_label: "원장님 퇴근 시간 앞당기는 AI 비서 5명 고용하기",
      base_url: AN_SITE + "r/ai-tools-5", utm_source: "instagram", utm_medium: "social", utm_campaign: "ai-tools-5", utm_content: "caption",
      utm_url: AN_SITE + "r/ai-tools-5?utm_source=instagram&utm_medium=social&utm_campaign=ai-tools-5&utm_content=caption" },
    { id: "m2", created_at: "2026-10-01T03:05:00Z", name: "[인스타 매니챗 DM] 10.01 AI 툴 5가지 아티클 링크", target_kind: "article", target_label: "원장님 퇴근 시간 앞당기는 AI 비서 5명 고용하기",
      base_url: AN_SITE + "r/ai-tools-5", utm_source: "instagram", utm_medium: "social", utm_campaign: "ai-tools-5", utm_content: "manychat-dm",
      utm_url: AN_SITE + "r/ai-tools-5?utm_source=instagram&utm_medium=social&utm_campaign=ai-tools-5&utm_content=manychat-dm" },
    { id: "m3", created_at: "2026-10-01T03:10:00Z", name: "[크래빗 아카데미 아티클] 10.01 AI 툴 5가지 올커니 입장 링크", target_kind: "external", target_label: "올커니 입장 링크",
      base_url: "https://example.com/olkeoni", utm_source: "crabit-academy", utm_medium: "article", utm_campaign: "ai-tools-5", utm_content: "olkeoni-cta",
      utm_url: "https://example.com/olkeoni?utm_source=crabit-academy&utm_medium=article&utm_campaign=ai-tools-5&utm_content=olkeoni-cta" }
  ];
  const mul = d => (d === 7 ? 0.45 : d === 30 ? 1 : 1.3);
  const R = n => Math.round(n);
  const data = {
    academy_overview: d => [{ views: R(1840 * mul(d)), visitors: R(1210 * mul(d)), utm_visitors: R(640 * mul(d)), outbound_clicks: R(152 * mul(d)) }],
    academy_page_stats: d => [
      { path: "/r/ai-tools-5", views: R(920 * mul(d)), visitors: R(702 * mul(d)), utm_visitors: R(560 * mul(d)), outbound_clicks: R(118 * mul(d)), outbound_visitors: R(96 * mul(d)) },
      { path: "/", views: R(410 * mul(d)), visitors: R(320 * mul(d)), utm_visitors: R(40 * mul(d)), outbound_clicks: R(8 * mul(d)), outbound_visitors: R(7 * mul(d)) },
      { path: "/resources", views: R(260 * mul(d)), visitors: R(190 * mul(d)), utm_visitors: R(22 * mul(d)), outbound_clicks: 0, outbound_visitors: 0 },
      { path: "/r/student-tier-marketing-2026", views: R(180 * mul(d)), visitors: R(150 * mul(d)), utm_visitors: R(18 * mul(d)), outbound_clicks: R(4 * mul(d)), outbound_visitors: R(4 * mul(d)) },
      { path: "/event", views: R(70 * mul(d)), visitors: R(52 * mul(d)), utm_visitors: 0, outbound_clicks: 0, outbound_visitors: 0 }
    ],
    academy_utm_stats: d => [
      { utm_source: "instagram", utm_medium: "social", utm_campaign: "ai-tools-5", utm_content: "manychat-dm", visitors: R(388 * mul(d)), pageviews: R(430 * mul(d)), outbound_clicks: R(84 * mul(d)), outbound_visitors: R(71 * mul(d)), olkeoni_clicks: R(80 * mul(d)), olkeoni_visitors: R(68 * mul(d)) },
      { utm_source: "instagram", utm_medium: "social", utm_campaign: "ai-tools-5", utm_content: "caption", visitors: R(172 * mul(d)), pageviews: R(190 * mul(d)), outbound_clicks: R(23 * mul(d)), outbound_visitors: R(20 * mul(d)), olkeoni_clicks: R(21 * mul(d)), olkeoni_visitors: R(19 * mul(d)) },
      { utm_source: "kakao", utm_medium: "social", utm_campaign: "academy-0929", utm_content: null, visitors: R(80 * mul(d)), pageviews: R(120 * mul(d)), outbound_clicks: R(6 * mul(d)), outbound_visitors: R(5 * mul(d)), olkeoni_clicks: 0, olkeoni_visitors: 0 }
    ],
    academy_utm_paths: d => [
      { utm_source: "instagram", utm_medium: "social", utm_campaign: "ai-tools-5", utm_content: "manychat-dm", path: "/r/ai-tools-5", views: R(410 * mul(d)), visitors: R(380 * mul(d)) },
      { utm_source: "instagram", utm_medium: "social", utm_campaign: "ai-tools-5", utm_content: "caption", path: "/r/ai-tools-5", views: R(180 * mul(d)), visitors: R(168 * mul(d)) },
      { utm_source: "kakao", utm_medium: "social", utm_campaign: "academy-0929", utm_content: null, path: "/", views: R(90 * mul(d)), visitors: R(70 * mul(d)) }
    ],
    academy_funnel: d => [{ inflow_visitors: R(560 * mul(d)), article_visitors: R(548 * mul(d)), click_visitors: R(87 * mul(d)), click_total: R(101 * mul(d)), all_article_visitors: R(702 * mul(d)), all_click_visitors: R(96 * mul(d)) }]
  };

  /* 깃허브 대신 로컬 파일을 읽고, Supabase 대신 위 숫자를 돌려줍니다. */
  gh.read = async path => {
    const res = await fetch(path + "?t=" + Date.now());
    if (!res.ok) return { exists: false, text: null, sha: null };
    return { exists: true, text: await res.text(), sha: "mock" };
  };
  window.table = async (path, opts) => {
    const m = String(path).match(/^\/rpc\/([a-z_]+)/);
    if (m && data[m[1]]) return data[m[1]](opts && opts.body ? opts.body.p_days : null);
    if (/^\/academy_utm_links/.test(path)) {
      const method = (opts && opts.method) || "GET";
      if (method === "POST") { mockLinks.unshift(Object.assign({ id: "m" + Date.now(), created_at: new Date().toISOString() }, opts.body)); return null; }
      if (method === "DELETE") { const id = decodeURIComponent(String(path).split("id=eq.")[1] || ""); const i = mockLinks.findIndex(l => l.id === id); if (i >= 0) mockLinks.splice(i, 1); return null; }
      return mockLinks.slice();
    }
    return [];
  };
  console.info("[admin:mock] 가짜 데이터로 성과, UTM 탭을 그립니다.");
  window.addEventListener("load", async () => {
    await enterApp();
    const pre = AN_PRESETS.find(p => p.key === qs.get("preset"));
    if (pre) Object.assign(anForm, { preset: pre.key, kind: pre.kind, article: pre.article || anForm.article, extLabel: pre.extLabel || "",
      source: pre.source, medium: pre.medium, campaign: pre.campaign, content: pre.content, name: pre.name(anToday()) });
    const tab = qs.get("tab");
    if (tab) goTab(tab);
  });
})();
