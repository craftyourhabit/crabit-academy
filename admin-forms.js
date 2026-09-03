/* =====================================================================
   크래빗 아카데미 어드민 - 편집 폼과 저장 로직
   admin.html 에서 불러 씁니다. (admin.html 의 도우미 함수들을 그대로 사용)
   ===================================================================== */

/* ---------------------------------------------------------------
   교육 / 설명회 편집
   --------------------------------------------------------------- */
function openEvent(id, copyFrom, resume) {
  const isNew = !id;
  /* copyFrom 이 있으면 그 강의를 그대로 베껴 새 강의로 시작합니다.
     제목과 주소, 날짜만 비워 두면 나머지 틀은 그대로 쓸 수 있습니다. */
  const src = isNew ? (copyFrom ? store.EVENTS_DB[copyFrom] || {} : {}) : store.EVENTS_DB[id];

  /* 폼이 다루는 값만 state 로 복사합니다. 고급 항목은 src 에 남겨 두고
     저장할 때 그대로 되돌려 넣습니다. */
  const state = resume || {
    id: id || "",
    type: src.type || "Lecture",
    category: src.category || CATEGORIES_EVENT[0],
    host: src.host || "크래빗",
    kind: src.kind || "교육",
    title: src.title || "",
    date: src.date || "",
    startDate: src.startDate || "",
    format: src.format || (src.place ? "offline" : "online"),
    onlineUrl: src.onlineUrl || "",
    place: src.place || "",
    placeUrl: src.placeUrl || "",
    thumb: src.thumb || "",
    desc: src.desc || "",
    points: arrToLines(src.points),
    speaker: src.speaker || "",
    speakerRole: src.speakerRole || "",
    assistant: src.assistant || "",
    prep: arrToLines(src.prep),
    audience: src.audience || "",
    status: src.status || "upcoming",
    /* 예전에 쓰던 자유 입력 fee 값이 남아 있으면 유료로 옮겨 담습니다.
       저장하면 fee는 빠지고 priceType과 price로 정리됩니다. */
    priceType: src.priceType || (src.fee ? "paid" : "free"),
    price: src.price != null ? String(src.price)
         : (src.fee ? String(src.fee).replace(/[^0-9]/g, "") : ""),
    feeNote: src.feeNote || "",
    applyUrl: src.applyUrl || "",
    replayUrl: src.replayUrl || "",
    provision: src.provision || "",
    refundNote: src.refundNote || "",
    /* 원본을 직접 건드리지 않도록 깊게 복사합니다. 취소하고 나갔을 때
       화면에서 했던 편집이 남아 있으면 안 되기 때문입니다. */
    article: (src.article || []).map(b => Object.assign({}, b,
      b.items ? { items: b.items.slice() } : null)),
    /* 커리큘럼과 제공 자료. 저장 전에 취소하고 나가도 원본이 그대로여야 하므로
       배열과 그 안의 객체까지 새로 만들어 둡니다. */
    sessions: (src.sessions || []).map(x => Object.assign({}, x, {
      points: (x.points || []).slice(), gifts: (x.gifts || []).slice()
    })),
    materials: (src.materials || []).map(x => Object.assign({}, x)),
    materialsTitle: src.materialsTitle || "",
    materialsSub: src.materialsSub || "",
    ci: {
      eyebrow: (src.curriculumIntro || {}).eyebrow || "",
      question: (src.curriculumIntro || {}).question || "",
      pains: ((src.curriculumIntro || {}).pains || []).slice()
    },
    contactName: (src.contact || {}).name || "",
    contactTel: (src.contact || {}).tel || ""
  };
  if (isNew && copyFrom && !resume) {
    /* 그대로 두면 안 되는 것만 비웁니다. 날짜와 신청 링크는 강의마다 다르고,
       썸네일은 같은 파일을 가리켜도 되지만 헷갈리니 새로 고르게 합니다. */
    state.title = state.title + " (복사본)";
    state.date = "";
    state.startDate = "";
    state.applyUrl = "";
    state.replayUrl = "";
    state.status = "upcoming";
  }

  /* 캘린더 등록 여부 */
  if (!resume) {
    const sched = store.SCHEDULE.find(s => s.id === id);
    state.__onCalendar = !!sched;
    state.__time = sched ? sched.time : "10:00";
  }

  const view = document.getElementById("editView");
  view.innerHTML = "";

  const head = el("div", "head-row");
  head.appendChild(el("h2", null, isNew ? (copyFrom ? "교육 / 설명회 복제" : "새 교육 / 설명회") : "교육 / 설명회 수정"));
  view.appendChild(head);

  /* 고급 항목이 붙어 있으면 알려 줍니다. */
  const adv = ADVANCED_KEYS.filter(k => src[k]);
  if (adv.length) {
    const names = { sessions: "커리큘럼", materials: "제공 자료", detailImages: "상세 이미지", contact: "문의처", curriculumIntro: "커리큘럼 도입 배너" };
    const n = el("div", "note");
    n.innerHTML = "<strong>" + adv.map(k => names[k]).join(", ") + "</strong> 이 등록돼 있어요. "
      + "이 화면에서는 수정할 수 없지만 저장해도 <strong>그대로 유지됩니다.</strong> 바꾸시려면 알려 주세요.";
    view.appendChild(n);
  }

  /* --- 홍보문구 붙여넣기 (새로 만들 때만) --- */
  if (isNew) {
    const p0 = panel("홍보문구 붙여넣기", "카톡 공지가 있으면 여기에 붙여넣어 보세요. 채울 수 있는 칸을 먼저 채웁니다.");
    p0.appendChild(promoPaster(state, () => openEvent(id, copyFrom, state)));
    view.appendChild(p0);
  }

  /* --- 기본 --- */
  const p1 = panel("기본 정보", "카드와 상세페이지에 바로 보이는 내용이에요.");

  if (isNew) {
    const idIn = input(state.id, "예: summer-webinar (영문 소문자와 하이픈)");
    idIn.addEventListener("input", () => state.id = idIn.value.trim());
    p1.appendChild(field("주소에 쓸 이름", idIn, {
      required: true,
      hint: "상세페이지 주소가 됩니다. 나중에 바꿀 수 없어요. 비워 두면 제목에서 자동으로 만듭니다."
    }));
  }

  const titleIn = input(state.title, "예: 우리 학원만의 AI 마케터 고용하기");
  titleIn.addEventListener("input", () => { state.title = titleIn.value; refreshPreview(); });
  p1.appendChild(field("제목", titleIn, { required: true }));

  const kindRow = el("div"); kindRow.style.marginBottom = "18px";
  kindRow.appendChild(el("span", "lab", "분류"));
  kindRow.querySelector(".lab").style.cssText = "display:block;font-size:14px;font-weight:600;margin-bottom:7px";
  kindRow.appendChild(segment(["교육", "설명회"], state, "kind", refreshPreview));
  p1.appendChild(kindRow);

  const hostRow = el("div"); hostRow.style.marginBottom = "18px";
  const hostLab = el("span", "lab", "주최");
  hostLab.style.cssText = "display:block;font-size:14px;font-weight:600;margin-bottom:7px";
  hostRow.appendChild(hostLab);
  hostRow.appendChild(segment(["크래빗", "올커니"], state, "host"));
  p1.appendChild(hostRow);

  const two = el("div", "row2");
  const catSel = select(CATEGORIES_EVENT, state.category);
  catSel.addEventListener("change", () => state.category = catSel.value);
  two.appendChild(field("카테고리", catSel, { hint: "전체보기 탭에서 쓰입니다." }));
  const typeSel = select(TYPES, state.type);
  typeSel.addEventListener("change", () => state.type = typeSel.value);
  two.appendChild(field("형태", typeSel, { hint: "강의 / 웨비나 / 과정 등" }));
  p1.appendChild(two);

  const dateIn = input(state.date, "예: 2026.09.03 (수) 20:00");
  dateIn.addEventListener("input", () => { state.date = dateIn.value; refreshPreview(); });
  p1.appendChild(field("날짜 표시", dateIn, { required: true, hint: "카드에 이 글자 그대로 보입니다." }));

  const descIn = textarea(state.desc, "이 교육이 어떤 내용인지 2~3문장으로 적어 주세요.", 4);
  descIn.addEventListener("input", () => { state.desc = descIn.value; refreshPreview(); });
  p1.appendChild(field("소개 글", descIn, { required: true }));

  const pointsIn = textarea(state.points, "한 줄에 하나씩 적어 주세요.\n예)\n노션에 한 줄 적으면 AI가 기획안으로 정리\n기획안만 있으면 카드뉴스 자동 제작", 5);
  pointsIn.addEventListener("input", () => state.points = pointsIn.value);
  p1.appendChild(field("이런 내용을 다뤄요", pointsIn, { hint: "엔터로 줄을 나누면 항목이 하나씩 늘어납니다." }));

  p1.appendChild(field("썸네일", imagePicker(state, "thumb", "assets/thumbs/", refreshPreview), {
    hint: "가로로 긴 이미지(16:9)가 가장 예쁘게 나와요. 자동으로 크기를 줄여 올립니다."
  }));
  view.appendChild(p1);

  /* --- 일정과 장소 --- */
  const p2 = panel("일정과 장소", "온라인 교육이면 장소는 비워 두세요.");
  const sd = input(state.startDate, "", "date");
  sd.addEventListener("input", () => state.startDate = sd.value);
  const two2 = el("div", "row2");
  two2.appendChild(field("진행 날짜", sd, { hint: "이 날짜가 지나면 자동으로 '마감'이 됩니다." }));
  const tm = input(state.__time, "", "time");
  tm.addEventListener("input", () => state.__time = tm.value);
  two2.appendChild(field("시작 시각", tm, { hint: "달력에 표시할 시각이에요." }));
  p2.appendChild(two2);

  const calWrap = el("label", "field");
  const calLine = el("div");
  calLine.style.cssText = "display:flex;align-items:center;gap:9px";
  const cal = document.createElement("input");
  cal.type = "checkbox"; cal.checked = state.__onCalendar;
  cal.style.cssText = "width:17px;height:17px;accent-color:#16192A";
  cal.addEventListener("change", () => state.__onCalendar = cal.checked);
  calLine.appendChild(cal);
  calLine.appendChild(el("span", null, "예정 일정 달력에 표시하기"));
  calLine.style.fontSize = "15px";
  calWrap.appendChild(calLine);
  calWrap.appendChild(el("span", "hint", "체크하면 '예정 일정' 페이지의 월간 달력에 올라갑니다. 진행 날짜가 있어야 해요."));
  p2.appendChild(calWrap);

  /* --- 진행 방식 --- */
  const fmRow = el("div");
  fmRow.style.marginBottom = "18px";
  const fmLab = el("span", "lab", "진행 방식");
  fmLab.style.cssText = "display:block;font-size:14px;font-weight:600;margin-bottom:7px";
  fmRow.appendChild(fmLab);
  fmRow.appendChild(segment([
    ["offline", "오프라인"], ["online", "온라인"], ["hybrid", "동시 진행"]
  ], state, "format", v => {
    plcWrap.style.display = (v === "online") ? "none" : "block";
    urlWrap.style.display = (v === "offline") ? "none" : "block";
  }));
  p2.appendChild(fmRow);

  const plc = input(state.place, "예: 광명 GIDC, 경기도 광명시 일직로 43 C동 1715호");
  plc.addEventListener("input", () => state.place = plc.value);
  const plcWrap = field("장소", plc);
  plcWrap.style.display = (state.format === "online") ? "none" : "block";
  p2.appendChild(plcWrap);
  const plcU = input(state.placeUrl, "예: https://naver.me/...", "url");
  plcU.addEventListener("input", () => state.placeUrl = plcU.value);
  p2.appendChild(field("장소 지도 링크", plcU, { hint: "네이버 지도 공유 링크를 넣으면 장소를 눌러 열 수 있어요." }));

  const ourl = input(state.onlineUrl, "예: https://zoom.us/j/...", "url");
  ourl.addEventListener("input", () => state.onlineUrl = ourl.value);
  const urlWrap = field("온라인 참여 링크 (줌 등)", ourl, {
    hint: "이 링크는 사이트에 절대 안 보입니다. 링크를 아는 사람은 누구나 들어올 수 있기 때문이에요. "
        + "신청하고 결제까지 마친 분에게만 알림톡으로 따로 보냅니다."
  });
  urlWrap.style.display = (state.format === "offline") ? "none" : "block";
  p2.appendChild(urlWrap);
  view.appendChild(p2);

  /* --- 진행자와 신청 --- */
  const p3 = panel("진행자와 신청", "해당 없는 칸은 비워 두셔도 됩니다.");
  const two3 = el("div", "row2");
  const sp = input(state.speaker, "예: 김현지");
  sp.addEventListener("input", () => state.speaker = sp.value);
  two3.appendChild(field("연사", sp));
  const spr = input(state.speakerRole, "예: 크래빗 대표");
  spr.addEventListener("input", () => state.speakerRole = spr.value);
  two3.appendChild(field("연사 소개", spr));
  p3.appendChild(two3);

  const asst = input(state.assistant, "예: 올커니 조경이 대표");
  asst.addEventListener("input", () => state.assistant = asst.value);
  p3.appendChild(field("스페셜 조교", asst));

  const aud = input(state.audience, "예: 학원 원장·운영자 (선착순 25명)");
  aud.addEventListener("input", () => state.audience = aud.value);
  p3.appendChild(field("이런 분께 추천해요", aud));

  const prep = textarea(state.prep, "한 줄에 하나씩.\n예)\n노트북\nClaude 유료 플랜 (최소 Pro)", 3);
  prep.addEventListener("input", () => state.prep = prep.value);
  p3.appendChild(field("준비물", prep, { hint: "엔터로 줄을 나누면 항목이 하나씩 늘어납니다." }));

  /* --- 수강료 --- */
  const ptRow = el("div");
  ptRow.style.marginBottom = "18px";
  const ptLab = el("span", "lab", "수강료");
  ptLab.style.cssText = "display:block;font-size:14px;font-weight:600;margin-bottom:7px";
  ptRow.appendChild(ptLab);
  ptRow.appendChild(segment([["free", "무료"], ["paid", "유료"]], state, "priceType", v => {
    amtWrap.style.display = v === "paid" ? "block" : "none";
    refreshPreview();
  }));
  p3.appendChild(ptRow);

  /* 금액은 반드시 숫자만 받습니다. 나중에 카카오페이 같은 결제에 그대로 넘길 값이라
     "330,000원" 처럼 글자가 섞이면 결제가 붙지 않습니다. */
  const amt = input(state.price, "예: 330000", "text");
  amt.setAttribute("inputmode", "numeric");
  const amtPreview = el("span", "hint", "");
  const showAmt = () => {
    const n = Number(String(state.price).replace(/[^0-9]/g, ""));
    amtPreview.textContent = n > 0
      ? "화면에는 " + n.toLocaleString("ko-KR") + "원 으로 보입니다."
      : "숫자만 넣어 주세요. 쉼표나 '원'은 빼고 330000 처럼요.";
  };
  amt.addEventListener("input", () => {
    /* 실수로 쉼표나 글자를 넣어도 조용히 숫자만 남깁니다. */
    const only = amt.value.replace(/[^0-9]/g, "");
    if (amt.value !== only) amt.value = only;
    state.price = only;
    showAmt();
    refreshPreview();
  });
  const amtWrap = field("금액 (원)", amt);
  amtWrap.appendChild(amtPreview);
  amtWrap.style.display = state.priceType === "paid" ? "block" : "none";
  showAmt();
  p3.appendChild(amtWrap);

  const feeNote = input(state.feeNote, "예: 교재비와 다과 포함, VAT 포함");
  feeNote.addEventListener("input", () => state.feeNote = feeNote.value);
  p3.appendChild(field("수강료 부가 설명", feeNote, {
    hint: "선택 사항이에요. 금액 아래 작은 글씨로 들어갑니다. "
        + "입금 계좌는 여기에 넣지 마세요. 사이트가 공개라 검색에 노출됩니다."
  }));

  const ap = input(state.applyUrl, "예: https://forms.gle/...", "url");
  ap.addEventListener("input", () => state.applyUrl = ap.value);
  p3.appendChild(field("신청 링크", ap, { hint: "넣으면 상세페이지에 신청 버튼이 생깁니다." }));
  view.appendChild(p3);

  /* --- 상세 본문 --- */
  const pA = panel("상세 본문", "강의 소개 아래에 붙는 글이에요. 블록을 쌓아 만듭니다.");
  const artHint = el("div", "note");
  artHint.innerHTML = "글 안에서 <strong>**이렇게**</strong> 별표 두 개로 감싸면 <strong>굵게</strong> 나옵니다. "
    + "불릿은 한 줄에 하나씩 적어 주세요.";
  pA.appendChild(artHint);
  pA.appendChild(articleEditor(state));
  view.appendChild(pA);

  /* --- 제공과 환불 --- */
  const pT = panel("서비스 제공과 환불", "유료 상품은 반드시 채워 주세요. 결제 심사에서 확인하는 항목입니다.");
  const provIn = textarea(state.provision, "예: 결제를 마치시면 시청용 비밀번호를 바로 보내드립니다. 받으신 뒤에는 1년간 보실 수 있어요.");
  provIn.addEventListener("input", () => state.provision = provIn.value);
  pT.appendChild(field("서비스 제공", provIn, {
    hint: "무엇을 언제까지 어떻게 드리는지 적습니다. 전자상거래법상 알려야 하는 내용이에요."
  }));
  const rn = textarea(state.refundNote, "비우면 '강의 전날까지 전액, 당일 시작 전까지 80%' 기본 문구가 나갑니다.");
  rn.addEventListener("input", () => state.refundNote = rn.value);
  pT.appendChild(field("환불 안내", rn, {
    hint: "녹화본처럼 시작일이 없는 상품은 반드시 적어 주세요. 날짜 기준 문구가 그대로 나가면 규정과 실제가 어긋납니다."
  }));
  view.appendChild(pT);

  /* --- 커리큘럼 --- */
  const pC = panel("커리큘럼", "회차별 내용이에요. 상세페이지에서 화면 끝까지 펼쳐집니다.");
  pC.appendChild(curriculumEditor(state));
  view.appendChild(pC);

  /* --- 제공 자료 --- */
  const pM = panel("제공 자료", "결제하시면 함께 드리는 것들이에요.");
  pM.appendChild(materialsEditor(state));
  view.appendChild(pM);

  /* --- 문의처 --- */
  const pQ = panel("문의처", "적으면 신청 카드 아래에 담당자 연락처가 붙습니다.");
  const cn = input(state.contactName, "예: 조경이 대표");
  cn.addEventListener("input", () => state.contactName = cn.value);
  pQ.appendChild(field("담당자", cn));
  const ct = input(state.contactTel, "예: 010-0000-0000");
  ct.addEventListener("input", () => state.contactTel = ct.value);
  pQ.appendChild(field("연락처", ct, { hint: "담당자와 연락처를 둘 다 적어야 표시됩니다." }));
  view.appendChild(pQ);

  /* --- 공개 상태 --- */
  const p4 = panel("공개 상태", null);
  const stRow = el("div");
  stRow.appendChild(segment([
    ["upcoming", "예정 (신청 받는 중)"],
    ["closed", "마감"],
    ["replay-soon", "다시보기 준비 중"],
    ["replay", "다시보기 공개"]
  ], state, "status", v => { rvWrap.style.display = v === "replay" ? "block" : "none"; refreshPreview(); }));
  p4.appendChild(stRow);
  const rv = input(state.replayUrl, "예: https://youtu.be/...", "url");
  rv.addEventListener("input", () => state.replayUrl = rv.value);
  const rvWrap = field("다시보기 영상 링크", rv);
  rvWrap.style.marginTop = "18px";
  rvWrap.style.display = state.status === "replay" ? "block" : "none";
  p4.appendChild(rvWrap);
  view.appendChild(p4);

  /* --- 미리보기 --- */
  /* --- 알림톡 --- */
  /* 이미 등록된 강의에만 붙입니다. 새로 만드는 중에는 보낼 대상이 없어요. */
  if (!isNew) {
    const pn = panel("알림톡", "이 강의 신청자에게 보낸 기록입니다.");
    const nbox = el("div");
    nbox.id = "notiBox";
    nbox.appendChild(el("div", "hint", "불러오는 중이에요…"));
    pn.appendChild(nbox);
    view.appendChild(pn);
    loadNotifications(id, state.title);
  }

  /* --- 올리기 전에 확인 --- */
  const p6 = panel("올리기 전에 확인", "결제 심사에서 보는 항목이에요.");
  const chk = compliancePanel(state);
  p6.appendChild(chk);
  const pvRow = el("div", "blk-add");
  const pvBtn = el("button", "btn btn-secondary btn-sm", "상세페이지 미리보기");
  pvBtn.type = "button";
  pvBtn.addEventListener("click", () => openPreview(state));
  const reBtn = el("button", "btn btn-secondary btn-sm", "확인 다시 하기");
  reBtn.type = "button";
  reBtn.addEventListener("click", () => chk.__refresh());
  pvRow.appendChild(pvBtn); pvRow.appendChild(reBtn);
  p6.appendChild(pvRow);
  const pvHint = el("div");
  pvHint.style.cssText = "font-size:12.5px;color:var(--muted);margin-top:10px;line-height:1.6";
  pvHint.textContent = "미리보기는 새 탭에서 열리고 아직 저장되지 않은 내용을 보여 줍니다. 사이트에는 아무 영향이 없어요.";
  p6.appendChild(pvHint);
  view.appendChild(p6);

  const p5 = panel("미리보기", "홈 화면에 이렇게 보입니다.");
  const pv = el("div", "pv");
  p5.appendChild(pv);
  view.appendChild(p5);

  function refreshPreview() {
    const over = state.status !== "upcoming";
    pv.innerHTML = "";
    const c = el("div", "pv-card");
    const im = el("img");
    im.src = (state.__upload_thumb ? "data:image/" + (state.__upload_thumb.ext === "svg" ? "svg+xml" : "jpeg") + ";base64," + state.__upload_thumb.base64 : state.thumb) || "assets/favicon.png";
    im.alt = "";
    im.onerror = () => { im.style.visibility = "hidden"; };
    c.appendChild(im);
    const b = el("div", "b");
    const tags = el("div", "tags");
    tags.appendChild(el("span", "badge soon", state.kind));
    tags.appendChild(el("span", "badge " + (over ? "closed" : "up"), over ? "마감" : "예정"));
    b.appendChild(tags);
    b.appendChild(el("strong", null, state.title || "(제목을 입력해 주세요)"));
    b.appendChild(el("p", null, state.desc || ""));
    b.appendChild(el("div", "dt", state.date || ""));
    c.appendChild(b);
    pv.appendChild(c);
  }
  refreshPreview();

  view.appendChild(saveBar(setMsg => saveEvent(state, id, isNew, setMsg), renderList));
  showEdit();
}

async function saveEvent(state, id, isNew, setMsg) {
  /* 1. 검증 */
  if (!state.title.trim()) throw new Error("제목을 입력해 주세요.");
  if (!state.desc.trim()) throw new Error("소개 글을 입력해 주세요.");
  if (!state.date.trim()) throw new Error("날짜 표시를 입력해 주세요.");

  let key = id;
  if (isNew) {
    key = slugify(state.id || state.title);
    if (store.EVENTS_DB[key]) throw new Error("“" + key + "” 는 이미 있는 주소예요. 다른 이름을 써 주세요.");
  }
  if (state.__onCalendar && !state.startDate) throw new Error("달력에 표시하려면 진행 날짜를 정해 주세요.");

  /* 2. 썸네일 업로드 */
  if (state.__upload_thumb) {
    setMsg("썸네일을 올리는 중…");
    const u = state.__upload_thumb;
    const path = "assets/thumbs/" + key + "-" + Date.now().toString(36) + "." + u.ext;
    await gh.writeBinary(path, u.base64, null, "어드민: " + state.title + " 썸네일 추가");
    state.thumb = path;
    delete state.__upload_thumb;
  }

  await uploadArticleImages(state, key);

  /* 3. EVENTS_DB 갱신. 폼이 안 다루는 항목은 원본에서 그대로 가져옵니다. */
  const prev = store.EVENTS_DB[key] || {};
  const next = {};
  const put = (k, v) => { if (v !== "" && v != null && !(Array.isArray(v) && !v.length)) next[k] = v; };

  put("type", state.type);
  put("category", state.category);
  put("host", state.host);
  put("kind", state.kind);
  put("title", state.title.trim());
  put("date", state.date.trim());
  put("startDate", state.startDate);
  put("format", state.format);
  /* 오프라인만 하는 강의에는 온라인 링크를 남기지 않습니다. */
  if (state.format !== "offline") put("onlineUrl", state.onlineUrl.trim());
  put("place", state.place.trim());
  put("placeUrl", state.placeUrl.trim());
  put("thumb", state.thumb);
  put("desc", state.desc.trim());
  put("points", linesToArr(state.points));
  put("speaker", state.speaker.trim());
  put("speakerRole", state.speakerRole.trim());
  put("assistant", state.assistant.trim());
  put("prep", linesToArr(state.prep));
  put("audience", state.audience.trim());
  put("status", state.status);
  /* 유료일 때만 금액을 남깁니다. 무료로 되돌리면 price는 아예 빠집니다.
     예전 자유 입력 fee는 여기서 더 이상 쓰지 않으므로 저장하면 자연히 사라집니다. */
  put("priceType", state.priceType);
  if (state.priceType === "paid") {
    const n = Number(String(state.price).replace(/[^0-9]/g, ""));
    if (n > 0) next.price = n;
  }
  put("feeNote", state.feeNote.trim());
  put("applyUrl", state.applyUrl.trim());
  put("provision", state.provision.trim());
  put("refundNote", state.refundNote.trim());
  put("article", cleanArticle(state.article));
  put("sessions", cleanSessions(state.sessions));
  put("materials", cleanMaterials(state.materials));
  put("materialsTitle", state.materialsTitle.trim());
  put("materialsSub", state.materialsSub.trim());
  const ci = cleanIntro(state.ci);
  if (ci) next.curriculumIntro = ci;
  if (state.contactName.trim() && state.contactTel.trim()) {
    next.contact = { name: state.contactName.trim(), tel: state.contactTel.trim() };
  }

  /* 폼이 다루지 않는 항목은 원본에서 그대로 가져옵니다.
     목록을 따로 관리하지 않고 "내가 안 쓴 건 전부 유지"로 두어야
     새 항목이 생겨도 저장하다가 조용히 지워지는 일이 없습니다. */
  Object.keys(prev).forEach(k => {
    if (!OWNED_KEYS.includes(k) && !(k in next)) next[k] = prev[k];
  });
  next.replayUrl = state.status === "replay" ? state.replayUrl.trim() : (state.replayUrl.trim() || "");

  const db = Object.assign({}, store.EVENTS_DB);
  db[key] = next;

  /* 4. 달력 갱신 */
  let sch = store.SCHEDULE.filter(s => s.id !== key);
  if (state.__onCalendar && state.startDate) {
    sch.push({ date: state.startDate, time: state.__time || "10:00", id: key });
  }
  sch.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  /* 5. 커밋 */
  setMsg("저장하는 중…");
  let text = store.eventsText;
  text = spliceMarker(text, "EVENTS_DB", "const EVENTS_DB = " + jsLit(db, 0) + ";");
  text = spliceMarker(text, "SCHEDULE", "const SCHEDULE = " + jsLit(sch, 0) + ";");
  const res = await gh.writeText(EVENT_FILE, text, store.eventsSha,
    "어드민: " + (isNew ? "교육 추가 - " : "교육 수정 - ") + next.title);

  store.eventsText = text;
  store.eventsSha = res.sha;
  store.EVENTS_DB = db;
  store.SCHEDULE = sch;
}

/* ---------------------------------------------------------------
   신청자 상세

   목록에서는 한 줄로만 보이니 문의사항이 길면 잘립니다.
   여기서는 남기신 내용을 그대로 다 보여 줍니다.
   --------------------------------------------------------------- */
function setApplicationStatus(id, next) {
  return table("/academy_applications?id=eq." + id, {
    method: "PATCH",
    headers: { "Prefer": "return=minimal" },
    body: { status: next, paid_at: next === "paid" ? new Date().toISOString() : null }
  });
}

function openApplicantDetail(it) {
  const view = document.getElementById("editView");
  view.innerHTML = "";
  showEdit();

  const head = el("div", "head-row");
  const back = el("button", "btn btn-secondary btn-sm", "← 신청자 목록으로");
  back.type = "button";
  back.addEventListener("click", () => renderList());
  head.appendChild(back);
  view.appendChild(head);

  const st = AP_STATUS[it.status] || AP_STATUS.pending;
  const p = panel(null, null);

  const hb = el("div", "dv-h");
  const b = el("div");
  b.appendChild(el("span", "badge " + st.cls, st.label));
  hb.appendChild(b);
  hb.appendChild(el("h2", null, it.name || "(이름 없음)"));
  hb.appendChild(el("div", "dv-sub", (it.org || "소속 미기재") + "  |  " + apDate(it.created_at) + " 신청"));
  p.appendChild(hb);

  /* 전화와 메일은 바로 누를 수 있게 링크로 둡니다. */
  const tel = el("a", null, apPhone(it.phone));
  tel.href = "tel:" + String(it.phone || "").replace(/[^0-9]/g, "");
  tel.style.cssText = "color:var(--ink);font-weight:600";
  const mail = it.email ? el("a", null, it.email) : null;
  if (mail) { mail.href = "mailto:" + it.email; mail.style.cssText = "color:var(--ink);font-weight:600"; }

  p.appendChild(dvTable([
    ["연락처", it.phone ? tel : ""],
    ["이메일", mail || ""],
    ["학원명과 직책", it.org],
    ["신청 강의", it.event_title || it.event_id],
    ["결제 금액", it.event_fee],
    ["알게 된 경로", it.source],
    ["상태", st.label],
    ["신청 일시", apDate(it.created_at)],
    ["입금 확인", it.paid_at ? apDate(it.paid_at) : ""]
  ]));
  view.appendChild(p);

  if (it.message) {
    const pm = panel("문의사항", "신청하실 때 남겨 주신 내용이에요.");
    const box = el("div");
    box.style.cssText = "font-size:15px;line-height:1.8;white-space:pre-wrap";
    box.textContent = it.message;
    pm.appendChild(box);
    view.appendChild(pm);
  }
  if (it.memo) {
    const pn = panel("우리 메모", null);
    const box = el("div");
    box.style.cssText = "font-size:15px;line-height:1.8;white-space:pre-wrap;color:var(--muted)";
    box.textContent = it.memo;
    pn.appendChild(box);
    view.appendChild(pn);
  }

  const acts = el("div", "dv-acts");
  const isPaid = it.status === "paid";
  const isCancelled = it.status === "cancelled";
  const mk = (label, cls, next) => {
    const x = el("button", "btn " + cls, label);
    x.type = "button";
    x.addEventListener("click", async () => {
      x.disabled = true;
      try {
        await setApplicationStatus(it.id, next);
        renderList();
      } catch (e) {
        x.disabled = false;
        alert("상태를 바꾸지 못했어요. " + (e.message || ""));
      }
    });
    acts.appendChild(x);
  };
  /* 취소된 건은 곧바로 '입금 확인'으로 넘기지 않습니다.
     되돌리는 건 '대기'로 돌아오는 것이지 돈이 들어온 게 아니니까요. */
  if (isCancelled) mk("취소 되돌리기", "btn-secondary", "pending");
  else if (isPaid) mk("대기로 되돌리기", "btn-secondary", "pending");
  else { mk("입금 확인", "btn-primary", "paid"); mk("신청 취소", "btn-danger", "cancelled"); }
  view.appendChild(acts);
}

/* ---------------------------------------------------------------
   상세 보기

   목록에서 한 줄을 누르면 무엇이 들어 있는지 한눈에 보여 줍니다.
   고칠 게 없으면 그냥 보고 나가고, 있으면 여기서 바로 수정으로 넘어갑니다.
   --------------------------------------------------------------- */
function dvTable(rows) {
  const t = el("div", "dv-tbl");
  rows.forEach(([k, v]) => {
    t.appendChild(el("div", null, k));
    const cell = el("div", v ? null : "dim");
    if (v instanceof Node) cell.appendChild(v);
    else cell.textContent = v || "비어 있음";
    t.appendChild(cell);
  });
  return t;
}
function dvBullets(arr) {
  const ul = el("ul", "dv-list");
  (arr || []).forEach(x => ul.appendChild(el("li", null, x)));
  return ul;
}
function dvSection(title, node) {
  const w = el("div", "dv-sec");
  w.appendChild(el("h3", null, title));
  w.appendChild(node);
  return w;
}
function dvBackBar(view) {
  const head = el("div", "head-row");
  const back = el("button", "btn btn-secondary btn-sm", "← 목록으로");
  back.type = "button";
  back.addEventListener("click", () => renderList());
  head.appendChild(back);
  view.appendChild(head);
}

function openEventDetail(id) {
  const d = store.EVENTS_DB[id];
  if (!d) return renderList();
  const view = document.getElementById("editView");
  view.innerHTML = "";
  showEdit();
  dvBackBar(view);

  const fmtLabel = { vod: "VOD", offline: "오프라인", online: "온라인", hybrid: "오프라인 + 온라인 동시" };
  const over = d.status !== "upcoming";
  const price = (d.priceType === "paid" && Number(d.price) > 0)
    ? Number(d.price).toLocaleString("ko-KR") + "원"
    : (d.priceType === "paid" ? "유료 (금액 미입력)" : "무료");

  const p = panel(null, null);
  const head = el("div", "dv-head");
  const img = el("img");
  img.src = d.thumb || "assets/favicon.png";
  img.alt = "";
  img.onerror = () => { img.style.visibility = "hidden"; };
  head.appendChild(img);
  const hb = el("div", "dv-h");
  const badges = el("div");
  badges.appendChild(el("span", "badge " + (over ? "closed" : "up"), over ? "마감" : "예정"));
  hb.appendChild(badges);
  hb.appendChild(el("h2", null, d.title || "(제목 없음)"));
  hb.appendChild(el("div", "dv-sub", [d.kind, d.category, d.host].filter(Boolean).join("  |  ")));
  head.appendChild(hb);
  p.appendChild(head);

  const link = el("a", null, "사이트에서 보기");
  link.href = "event.html?id=" + encodeURIComponent(id);
  link.target = "_blank"; link.rel = "noopener";
  link.style.cssText = "color:var(--ink);font-weight:600;text-decoration:underline;text-underline-offset:3px";

  p.appendChild(dvTable([
    ["주소", id],
    ["일정", d.date],
    ["진행 방식", fmtLabel[d.format] || d.format || "온라인"],
    ["장소", d.place],
    ["대상", d.audience],
    ["수강료", price],
    ["금액 설명", d.feeNote],
    ["서비스 제공", d.provision],
    ["환불 안내", d.refundNote || "기본 문구 (강의 전날까지 전액, 당일 시작 전까지 80%)"],
    ["신청 링크", d.applyUrl || "우리 신청 페이지 사용"],
    ["상세페이지", link]
  ]));
  view.appendChild(p);

  const p2 = panel("내용", null);
  p2.appendChild(dvSection("소개", el("div", null, d.desc || "비어 있음")));
  if (d.points) p2.appendChild(dvSection("이런 내용을 다뤄요", dvBullets(d.points)));
  if (d.article && d.article.length) {
    p2.appendChild(dvSection("상세 본문", el("div", null, d.article.length + "개 블록")));
  }
  if (d.sessions && d.sessions.length) {
    p2.appendChild(dvSection("커리큘럼 " + d.sessions.length + "회차",
      dvBullets(d.sessions.map(x => [x.no, x.title].filter(Boolean).join("  ")))));
  }
  if (d.materials && d.materials.length) {
    p2.appendChild(dvSection((d.materialsTitle || "제공 자료") + " " + d.materials.length + "종",
      dvBullets(d.materials.map(x => x.name + (x.note ? "  (" + x.note + ")" : "")))));
  }
  view.appendChild(p2);

  /* 사이트에서 보이는 모습 그대로 확인하며 고칠 수 있게 상세페이지를 통째로 띄웁니다. */
  const pv = panel("실제 상세페이지 미리보기", null);
  const fr = el("iframe", "dv-frame");
  fr.src = "event.html?id=" + encodeURIComponent(id) + "&_pv=" + Date.now();
  fr.loading = "lazy";
  pv.appendChild(fr);
  view.appendChild(pv);

  const acts = el("div", "dv-acts");
  const mk = (label, cls, fn) => {
    const b = el("button", "btn " + cls, label);
    b.type = "button"; b.addEventListener("click", fn); acts.appendChild(b);
  };
  mk("수정하기", "btn-primary", () => openEvent(id));
  mk("복제해서 새로 만들기", "btn-secondary", () => openEvent(null, id));
  mk("삭제", "btn-danger", () => confirmDelete(true, id, d.title, false));
  view.appendChild(acts);
}

function openResourceDetail(id, priv) {
  const list = priv ? store.RESOURCES_PRIVATE : store.RESOURCES;
  const d = list.find(r => r.id === id);
  if (!d) return renderList();
  const view = document.getElementById("editView");
  view.innerHTML = "";
  showEdit();
  dvBackBar(view);

  const map = { public: ["open", "공개"], protected: ["locked", "일부공개"], soon: ["soon", "공개 예정"], private: ["priv", "비공개"] };
  const [cls, lab] = map[priv ? "private" : d.access] || map.public;

  const p = panel(null, null);
  const head = el("div", "dv-head");
  const img = el("img");
  img.src = d.thumb || "assets/favicon.png";
  img.alt = "";
  img.onerror = () => { img.style.visibility = "hidden"; };
  head.appendChild(img);
  const hb = el("div", "dv-h");
  const b = el("div");
  b.appendChild(el("span", "badge " + cls, lab));
  hb.appendChild(b);
  hb.appendChild(el("h2", null, d.title || "(제목 없음)"));
  hb.appendChild(el("div", "dv-sub", [d.category, d.date].filter(Boolean).join("  |  ")));
  head.appendChild(hb);
  p.appendChild(head);

  p.appendChild(dvTable([
    ["주소", id],
    ["분류", d.category],
    ["설명", d.sub],
    ["공개 범위", lab],
    ["파일", (d.files && d.files.length) ? d.files.length + "개" : ""],
    ["영상", d.youtube]
  ]));
  view.appendChild(p);

  if (d.files && d.files.length) {
    const p2 = panel("첨부 파일", null);
    p2.appendChild(dvBullets(d.files.map(f => f.name || f)));
    view.appendChild(p2);
  }

  /* href가 우리 사이트 안의 페이지면 글 내용을 그대로 보여 주고 고칠 수 있게 합니다.
     일부공개는 비밀번호로 주소를 찾아 열고, 외부 링크(노션 등)는 링크만 안내합니다. */
  const contentPage = (d.href && !/^https?:/i.test(d.href))
    ? (d.href.indexOf(".") > -1 ? d.href : d.href + ".html")
    : null;
  if (contentPage) {
    view.appendChild(bodyPanel(contentPage, () => openResourceDetail(id, priv)));
  } else if (!priv && d.access === "protected") {
    view.appendChild(protectedBodyPanel(id, priv));
  } else if (d.href) {
    const pv = panel("콘텐츠", null);
    const a = el("a", null, "외부 페이지에서 열기: " + d.href);
    a.href = d.href; a.target = "_blank"; a.rel = "noopener";
    a.style.cssText = "color:var(--ink);font-weight:600;text-decoration:underline;text-underline-offset:3px";
    pv.appendChild(a);
    view.appendChild(pv);
  }

  const acts = el("div", "dv-acts");
  const mk = (label, c, fn) => {
    const x = el("button", "btn " + c, label);
    x.type = "button"; x.addEventListener("click", fn); acts.appendChild(x);
  };
  mk("수정하기", "btn-primary", () => openResource(id, priv));
  mk("삭제", "btn-danger", () => confirmDelete(false, id, d.title, priv));
  view.appendChild(acts);
}

/* 콘텐츠 페이지 HTML을 통째로 열어 고치는 간이 편집기.
   구조를 바꾸는 큰 수정은 코드에서 하는 게 안전하고, 여기서는 글 위주로 고칩니다. */
async function openPageEditor(path, back) {
  const view = document.getElementById("editView");
  view.innerHTML = "";
  showEdit();
  const head = el("div", "head-row");
  const b = el("button", "btn btn-secondary btn-sm", "← 돌아가기");
  b.type = "button";
  b.addEventListener("click", back);
  head.appendChild(b);
  view.appendChild(head);

  const p = panel("본문 수정 - " + path, null);
  p.appendChild(el("div", "dv-sub",
    "페이지 HTML을 그대로 편집합니다. 저장하면 깃허브에 커밋되고 1~2분 안에 사이트에 반영돼요. 태그 구조는 두고 글 내용 위주로 고쳐 주세요."));
  const ta = document.createElement("textarea");
  ta.style.cssText = "width:100%;height:62vh;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;line-height:1.6;border:1px solid var(--line);border-radius:10px;padding:14px;margin-top:12px;box-sizing:border-box;resize:vertical";
  ta.value = "불러오는 중이에요…";
  ta.disabled = true;
  p.appendChild(ta);
  const acts = el("div", "dv-acts");
  const save = el("button", "btn btn-primary", "저장하고 배포");
  save.type = "button";
  acts.appendChild(save);
  p.appendChild(acts);
  view.appendChild(p);

  let sha = null;
  try {
    const f = await gh.read(path);
    if (!f.exists) { ta.value = "파일을 찾지 못했어요: " + path; return; }
    sha = f.sha;
    ta.value = f.text;
    ta.disabled = false;
  } catch (e) {
    ta.value = "불러오지 못했어요. " + (e.message || "");
    return;
  }

  save.addEventListener("click", async () => {
    if (!confirm(path + " 를 저장할까요? 사이트에 바로 반영됩니다.")) return;
    save.disabled = true;
    save.textContent = "저장 중…";
    try {
      await gh.writeText(path, ta.value, sha, "어드민에서 본문 수정: " + path);
      alert("저장했어요. 1~2분 안에 사이트에 반영됩니다.");
      back();
    } catch (e) {
      alert("저장하지 못했어요. " + (e.message || ""));
      save.disabled = false;
      save.textContent = "저장하고 배포";
    }
  });
}

/* ---------------------------------------------------------------
   홍보문구 붙여넣기

   카톡 공지를 통째로 붙여넣으면 확실하게 알아볼 수 있는 것만 채웁니다.
   날짜, 시간, 링크, 금액, 진행 형태 정도입니다.
   제목과 커리큘럼은 사람이 판단해야 하는 영역이라 건드리지 않습니다.
   덮어쓰지 않고 "비어 있는 칸만" 채웁니다. 쓰던 내용을 지우면 안 되니까요.
   --------------------------------------------------------------- */
function parsePromo(text) {
  const t = String(text || "");
  const out = {};

  /* 날짜: 8월 21일 / 2026.08.21 / 2026-08-21 */
  let y = new Date().getFullYear(), mo = null, d = null;
  let m = t.match(/(20\d{2})[.\-\/]\s*(\d{1,2})[.\-\/]\s*(\d{1,2})/);
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else {
    m = t.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (m) { mo = +m[1]; d = +m[2]; }
  }
  if (mo && d) {
    const iso = y + "-" + String(mo).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    out.startDate = iso;
    const wd = (t.match(/\(\s*([월화수목금토일])\s*\)/) || [])[1];
    /* 시간: 오전 11시 / 밤 10:30 / 20:00 */
    let time = "";
    const tm = t.match(/(오전|오후|밤|저녁|아침)?\s*(\d{1,2})\s*(?::|시)\s*(\d{2})?\s*분?/);
    if (tm) {
      const ap = tm[1] || "";
      let hh = +tm[2];
      if ((ap === "오후" || ap === "밤" || ap === "저녁") && hh < 12) hh += 12;
      time = String(hh).padStart(2, "0") + ":" + (tm[3] || "00");
    }
    out.date = y + "." + String(mo).padStart(2, "0") + "." + String(d).padStart(2, "0")
      + (wd ? " (" + wd + ")" : "") + (time ? " " + time : "");
    if (time) out.__time = time;
  }

  /* 신청 링크: 우리 도메인은 빼고 바깥 폼 주소만 */
  const urls = t.match(/https?:\/\/[^\s)\]"']+/g) || [];
  const ext = urls.find(u => !/craftyourhabit|crabit\.co\.kr/i.test(u));
  if (ext) out.applyUrl = ext.replace(/[.,]$/, "");

  /* 금액: 8만원 / 90,000원 / 무료 */
  const man = t.match(/(\d+)\s*만\s*원/);
  const won = t.match(/([\d,]{4,})\s*원/);
  if (man) { out.priceType = "paid"; out.price = String(+man[1] * 10000); }
  else if (won) { out.priceType = "paid"; out.price = won[1].replace(/,/g, ""); }
  else if (/무료|참가비\s*없|free/i.test(t)) { out.priceType = "free"; }

  /* 진행 형태 */
  const online = /줌|zoom|유튜브|youtube|라이브|온라인|웨비나|비대면/i.test(t);
  const offline = /오프라인|현장|장소\s*:|교육장|센터|호실|층\b/i.test(t);
  const vod = /녹화본|다시보기|vod|영상\s*제공/i.test(t);
  if (vod) out.format = "vod";
  else if (online && offline) out.format = "hybrid";
  else if (online) out.format = "online";
  else if (offline) out.format = "offline";

  return out;
}

function promoPaster(state, onFilled) {
  const wrap = el("div");
  const ta = textarea("", "카톡 공지나 홍보문구를 통째로 붙여넣어 주세요.");
  ta.rows = 5;
  wrap.appendChild(ta);

  const row = el("div", "blk-add");
  const btn = el("button", "btn btn-secondary btn-sm", "읽어와서 빈 칸 채우기");
  btn.type = "button";
  const msg = el("div");
  msg.style.cssText = "font-size:13px;color:var(--muted);margin-top:8px;line-height:1.6";

  btn.addEventListener("click", () => {
    const got = parsePromo(ta.value);
    const filled = [];
    const set = (k, label) => {
      if (got[k] == null || got[k] === "") return;
      /* 이미 쓰신 값은 건드리지 않습니다. */
      if (state[k] !== "" && state[k] != null && state[k] !== "free") return;
      state[k] = got[k];
      filled.push(label);
    };
    set("date", "일정");
    set("startDate", "시작일");
    set("applyUrl", "신청 링크");
    if (got.priceType && state.priceType === "free" && !state.price) {
      state.priceType = got.priceType;
      if (got.price) state.price = got.price;
      filled.push(got.priceType === "paid" ? "가격" : "무료 여부");
    }
    if (got.format && !state.__formatTouched) { state.format = got.format; filled.push("진행 형태"); }
    if (got.__time) state.__time = got.__time;

    msg.textContent = filled.length
      ? filled.join(", ") + " 을(를) 채웠어요. 나머지는 직접 확인해 주세요."
      : "채울 수 있는 게 없었어요. 이미 값이 있거나 문구에서 찾지 못했습니다.";
    if (filled.length && onFilled) onFilled();
  });

  row.appendChild(btn);
  wrap.appendChild(row);
  wrap.appendChild(msg);
  return wrap;
}

/* ---------------------------------------------------------------
   미리보기와 심사 항목 확인

   저장하기 전에 실제 상세페이지가 어떻게 나오는지 보고,
   결제 심사에서 확인하는 항목이 비어 있지 않은지 짚어 줍니다.
   --------------------------------------------------------------- */

/* 지금 폼의 값을 상세페이지가 읽는 모양(EVENTS_DB 의 한 칸)으로 바꿉니다.
   저장 로직과 같은 규칙을 써야 미리보기와 실제가 어긋나지 않습니다. */
function draftEvent(state) {
  const o = {};
  const put = (k, v) => { if (v !== "" && v != null && !(Array.isArray(v) && !v.length)) o[k] = v; };
  put("type", state.type); put("category", state.category); put("host", state.host);
  put("kind", state.kind); put("title", state.title.trim()); put("date", state.date.trim());
  put("startDate", state.startDate); put("format", state.format);
  if (state.format !== "offline") put("onlineUrl", state.onlineUrl.trim());
  put("place", state.place.trim()); put("placeUrl", state.placeUrl.trim());
  put("thumb", state.__upload_thumb ? ("data:image/jpeg;base64," + state.__upload_thumb.base64) : state.thumb);
  put("desc", state.desc.trim()); put("points", linesToArr(state.points));
  put("speaker", state.speaker.trim()); put("speakerRole", state.speakerRole.trim());
  put("assistant", state.assistant.trim()); put("prep", linesToArr(state.prep));
  put("audience", state.audience.trim()); put("status", state.status);
  put("priceType", state.priceType);
  if (state.priceType === "paid") {
    const n = Number(String(state.price).replace(/[^0-9]/g, ""));
    if (n > 0) o.price = n;
  }
  put("feeNote", state.feeNote.trim()); put("applyUrl", state.applyUrl.trim());
  put("provision", state.provision.trim()); put("refundNote", state.refundNote.trim());
  /* 아직 안 올린 본문 사진은 미리보기에서만 임시로 보여 줍니다. */
  put("article", cleanArticle(state.article).map((b, i) => {
    const src = state.article[i] && state.article[i].__upload;
    return (b.type === "img" && src) ? Object.assign({}, b, { src: "data:image/jpeg;base64," + src.base64 }) : b;
  }));
  put("sessions", cleanSessions(state.sessions));
  put("materials", cleanMaterials(state.materials));
  put("materialsTitle", state.materialsTitle.trim());
  put("materialsSub", state.materialsSub.trim());
  const ci = cleanIntro(state.ci);
  if (ci) o.curriculumIntro = ci;
  if (state.contactName.trim() && state.contactTel.trim()) {
    o.contact = { name: state.contactName.trim(), tel: state.contactTel.trim() };
  }
  return o;
}

function openPreview(state) {
  try {
    sessionStorage.setItem("crabit_preview", JSON.stringify(draftEvent(state)));
  } catch (e) {
    alert("미리보기를 준비하지 못했어요. 사진이 너무 크면 그럴 수 있습니다.");
    return;
  }
  window.open("event.html?preview=1", "crabit_preview_win");
}

/* 결제 심사에서 확인하는 항목입니다.
   빠지면 반려될 수 있어서 저장하기 전에 눈에 띄게 알려 줍니다. */
function complianceRows(state) {
  const paid = state.priceType === "paid";
  const price = Number(String(state.price).replace(/[^0-9]/g, ""));
  return [
    { ok: !!state.title.trim(), t: "상품명", why: "제목이 있어야 상품으로 보입니다." },
    { ok: !!state.thumb || !!state.__upload_thumb, t: "대표 이미지", why: "목록과 상세 맨 위에 쓰입니다." },
    { ok: !!state.desc.trim(), t: "상품 설명", why: "무엇을 파는지 알 수 있어야 합니다." },
    { ok: !paid || price > 0, t: "판매 가격", why: "유료인데 금액이 비어 있으면 상세페이지에 가격이 아예 안 나옵니다." },
    { ok: !!state.provision.trim(), t: "서비스 제공 기간", why: "전자상거래법이 요구하고 결제 심사도 상품마다 확인합니다." },
    { ok: !paid || !!state.refundNote.trim() || !!state.startDate,
      t: "환불 기준", why: "시작일이 없는 상품(녹화본 등)은 환불 안내를 직접 적어야 합니다. 안 그러면 날짜 기준 문구가 그대로 나갑니다." }
  ];
}

function compliancePanel(state) {
  const box = el("div");
  const draw = () => {
    box.innerHTML = "";
    const rows = complianceRows(state);
    const bad = rows.filter(r => !r.ok);
    const head = el("div");
    head.style.cssText = "font-size:14px;font-weight:700;margin-bottom:10px";
    head.textContent = bad.length ? ("채우셔야 할 항목이 " + bad.length + "개 있어요") : "모두 채워졌습니다";
    head.style.color = bad.length ? "#C0392B" : "var(--muted)";
    box.appendChild(head);
    rows.forEach(r => {
      const line = el("div");
      line.style.cssText = "display:flex;gap:9px;align-items:flex-start;font-size:13.5px;line-height:1.6;margin-bottom:7px";
      const mark = el("span", null, r.ok ? "O" : "X");
      mark.style.cssText = "flex:none;width:16px;font-weight:700;color:" + (r.ok ? "#1E8E5A" : "#C0392B");
      const txt = el("div");
      txt.appendChild(el("strong", null, r.t));
      if (!r.ok) {
        const w = el("div", null, r.why);
        w.style.cssText = "color:var(--muted);font-size:12.5px;margin-top:2px";
        txt.appendChild(w);
      }
      line.appendChild(mark); line.appendChild(txt);
      box.appendChild(line);
    });
  };
  draw();
  box.__refresh = draw;
  return box;
}

/* ---------------------------------------------------------------
   되풀이되는 목록을 다루는 도우미

   커리큘럼 회차, 제공 자료처럼 "같은 모양이 여러 개" 인 것을 만듭니다.
   순서 바꾸기와 삭제, 더하기가 다 같은 방식이라 한 곳에 모았습니다.
   --------------------------------------------------------------- */
function repeatList(arr, opts) {
  const wrap = el("div");
  const list = el("div");
  wrap.appendChild(list);

  const addBtn = el("button", "btn btn-secondary btn-sm", "+ " + opts.addLabel);
  addBtn.type = "button";
  addBtn.style.marginTop = "4px";
  addBtn.addEventListener("click", () => { arr.push(opts.blank()); draw(); });
  wrap.appendChild(addBtn);

  function draw() {
    list.innerHTML = "";
    if (!arr.length) {
      list.appendChild(el("div", "blk-empty", opts.empty));
      return;
    }
    arr.forEach((item, i) => {
      const box = el("div", "blk");
      const top = el("div", "blk-top");
      const t = el("div", "blk-kind");
      const lab = el("span");
      lab.style.cssText = "font-size:13px;font-weight:700;color:var(--muted)";
      lab.textContent = opts.label(item, i);
      t.appendChild(lab);
      top.appendChild(t);

      const move = el("div", "blk-move");
      const mk = (txt, title, cls, fn, off) => {
        const x = el("button", cls, txt);
        x.type = "button"; x.title = title; x.disabled = !!off;
        x.addEventListener("click", fn);
        move.appendChild(x);
      };
      mk("↑", "위로", null, () => { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); draw(); }, i === 0);
      mk("↓", "아래로", null, () => { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); draw(); }, i === arr.length - 1);
      mk("×", "삭제", "del", () => {
        if (!confirm(opts.confirmText || "이 항목을 지울까요?")) return;
        arr.splice(i, 1); draw();
      });
      top.appendChild(move);
      box.appendChild(top);
      opts.body(box, item, i, draw);
      list.appendChild(box);
    });
  }
  draw();
  return wrap;
}

/* 한 줄짜리 입력에 라벨을 붙여 되풀이 목록 안에 넣습니다. */
function miniField(labelText, node, hint) {
  const w = el("div");
  w.style.marginTop = "10px";
  const l = el("div", null, labelText);
  l.style.cssText = "font-size:12.5px;font-weight:700;margin-bottom:5px";
  if (hint) {
    const h = el("span", null, "  " + hint);
    h.style.cssText = "font-weight:400;color:var(--muted)";
    l.appendChild(h);
  }
  w.appendChild(l); w.appendChild(node);
  return w;
}

/* ---------------------------------------------------------------
   커리큘럼 편집
   --------------------------------------------------------------- */
function curriculumEditor(state) {
  const wrap = el("div");

  /* 도입 배너 */
  const introBox = el("div", "blk");
  introBox.style.background = "var(--fill-soft)";
  const ih = el("div", null, "도입 배너");
  ih.style.cssText = "font-size:13px;font-weight:700;margin-bottom:2px";
  introBox.appendChild(ih);
  const ihd = el("div", null, "커리큘럼 맨 앞에 어둡게 깔리는 띠예요. 비워 두면 안 나옵니다.");
  ihd.style.cssText = "font-size:12.5px;color:var(--muted);margin-bottom:10px";
  introBox.appendChild(ihd);

  const eb = input(state.ci.eyebrow, "예: 4년 만에 지점 7개까지 늘린 노하우 전격 공개");
  eb.addEventListener("input", () => state.ci.eyebrow = eb.value);
  introBox.appendChild(miniField("작은 배지", eb));

  const q = textarea(state.ci.question, "예: 잘 가르치는 것만으로\n지역 1등이 될 수 있을까요?");
  q.addEventListener("input", () => state.ci.question = q.value);
  introBox.appendChild(miniField("큰 질문", q, "줄바꿈이 그대로 살아납니다"));

  const pn = textarea(arrToLines(state.ci.pains), "한 줄에 하나씩\n두 번째\n세 번째");
  pn.addEventListener("input", () => state.ci.pains = linesToArr(pn.value));
  introBox.appendChild(miniField("이런 분께 필요합니다", pn, "한 줄에 하나씩, 세 개가 가장 보기 좋아요"));
  wrap.appendChild(introBox);

  /* 회차 */
  const secLab = el("div", null, "회차");
  secLab.style.cssText = "font-size:13px;font-weight:700;margin:18px 0 8px";
  wrap.appendChild(secLab);

  wrap.appendChild(repeatList(state.sessions, {
    addLabel: "회차 더하기",
    empty: "아직 회차가 없어요. 아래에서 더해 보세요.",
    confirmText: "이 회차를 지울까요?",
    blank: () => ({ no: "", title: "", sub: "", speaker: "", speakerRole: "", points: [], gifts: [] }),
    label: (x, i) => x.no || (i + 1) + "번째 회차",
    body: (box, x, i, draw) => {
      const no = input(x.no, "예: 1강, 1부 특강");
      no.addEventListener("input", () => { x.no = no.value; });
      no.addEventListener("change", draw);
      box.appendChild(miniField("회차 이름", no));

      const ti = input(x.title, "예: 5년 뒤에도 살아남는 수학학원의 조건");
      ti.addEventListener("input", () => x.title = ti.value);
      box.appendChild(miniField("제목", ti));

      const sb = input(x.sub, "제목 아래 한 줄 설명 (비워도 됩니다)");
      sb.addEventListener("input", () => x.sub = sb.value);
      box.appendChild(miniField("한 줄 설명", sb));

      const sp = input(x.speaker, "이 회차를 맡는 분 (비워도 됩니다)");
      sp.addEventListener("input", () => x.speaker = sp.value);
      box.appendChild(miniField("진행", sp));

      const sr = input(x.speakerRole, "소속이나 직함");
      sr.addEventListener("input", () => x.speakerRole = sr.value);
      box.appendChild(miniField("진행자 소개", sr));

      const pt = textarea(arrToLines(x.points), "한 줄에 하나씩 적어 주세요.");
      pt.addEventListener("input", () => x.points = linesToArr(pt.value));
      box.appendChild(miniField("강의 내용", pt, "한 줄에 하나씩"));

      const gf = textarea(arrToLines(x.gifts), "이 회차에 드리는 자료 (비워도 됩니다)");
      gf.addEventListener("input", () => x.gifts = linesToArr(gf.value));
      box.appendChild(miniField("함께 드리는 자료", gf, "한 줄에 하나씩"));
    }
  }));
  return wrap;
}

/* ---------------------------------------------------------------
   제공 자료 편집
   --------------------------------------------------------------- */
function materialsEditor(state) {
  const wrap = el("div");

  const ti = input(state.materialsTitle, "비우면 '제공 자료 N종'으로 나옵니다");
  ti.addEventListener("input", () => state.materialsTitle = ti.value);
  wrap.appendChild(miniField("섹션 제목", ti, "자료가 아니라 혜택이면 '참여 혜택' 처럼 바꿔 주세요"));

  const sb = input(state.materialsSub, "비우면 기본 안내 문구가 나옵니다");
  sb.addEventListener("input", () => state.materialsSub = sb.value);
  wrap.appendChild(miniField("섹션 설명", sb));

  const lab = el("div", null, "항목");
  lab.style.cssText = "font-size:13px;font-weight:700;margin:18px 0 8px";
  wrap.appendChild(lab);

  wrap.appendChild(repeatList(state.materials, {
    addLabel: "자료 더하기",
    empty: "아직 자료가 없어요.",
    confirmText: "이 자료를 지울까요?",
    blank: () => ({ name: "", note: "" }),
    label: (x, i) => String(i + 1).padStart(2, "0"),
    body: (box, x) => {
      const nm = input(x.name, "예: 강사 업무 체크리스트");
      nm.addEventListener("input", () => x.name = nm.value);
      box.appendChild(miniField("이름", nm));
      const nt = input(x.note, "예: 현장 참가자와 동일하게 제공 (비워도 됩니다)");
      nt.addEventListener("input", () => x.note = nt.value);
      box.appendChild(miniField("덧붙임", nt));
    }
  }));
  return wrap;
}

/* 저장 직전에 빈 것을 걸러 냅니다. */
function cleanSessions(list) {
  return (list || []).map(x => {
    const title = (x.title || "").trim();
    if (!title) return null;
    const o = { no: (x.no || "").trim(), title: title };
    if ((x.sub || "").trim()) o.sub = x.sub.trim();
    if ((x.speaker || "").trim()) o.speaker = x.speaker.trim();
    if ((x.speakerRole || "").trim()) o.speakerRole = x.speakerRole.trim();
    const pts = (x.points || []).map(v => v.trim()).filter(Boolean);
    if (pts.length) o.points = pts;
    const gf = (x.gifts || []).map(v => v.trim()).filter(Boolean);
    if (gf.length) o.gifts = gf;
    if (x.poster) o.poster = x.poster;
    return o;
  }).filter(Boolean);
}
function cleanMaterials(list) {
  return (list || []).map(x => {
    const name = (x.name || "").trim();
    if (!name) return null;
    const o = { name: name };
    if ((x.note || "").trim()) o.note = x.note.trim();
    return o;
  }).filter(Boolean);
}
function cleanIntro(ci) {
  const eyebrow = (ci.eyebrow || "").trim();
  const question = (ci.question || "").trim();
  const pains = (ci.pains || []).map(v => v.trim()).filter(Boolean);
  if (!eyebrow && !question && !pains.length) return null;
  const o = {};
  if (eyebrow) o.eyebrow = eyebrow;
  if (question) o.question = question;
  if (pains.length) o.pains = pains;
  return o;
}

/* ---------------------------------------------------------------
   상세 본문 블록 에디터

   상세페이지의 '강의 소개' 아래에 붙는 글을 블록으로 쌓습니다.
   블록은 문단, 소제목, 불릿, 인용, 사진 다섯 가지입니다.

   사진은 고른 순간 올리지 않고 state 에 담아 두었다가 저장할 때 한꺼번에
   올립니다. 쓰다가 그만두면 안 올린 것과 같아야 하기 때문입니다.
   --------------------------------------------------------------- */
const BLOCK_KINDS = [
  { t: "p",     name: "문단" },
  { t: "h",     name: "소제목" },
  { t: "ul",    name: "불릿" },
  { t: "quote", name: "인용" },
  { t: "img",   name: "사진" }
];
const BLOCK_PLACEHOLDER = {
  p: "본문을 적어 주세요. **별표 두 개**로 감싸면 굵게 나옵니다.",
  h: "소제목",
  ul: "한 줄에 하나씩 적어 주세요.\n두 번째 항목\n세 번째 항목",
  quote: "따옴표로 크게 보여 줄 문장이에요.\n줄바꿈도 그대로 살아납니다."
};

function articleEditor(state) {
  const wrap = el("div");
  const list = el("div");
  wrap.appendChild(list);

  const add = el("div", "blk-add");
  BLOCK_KINDS.forEach(k => {
    const b = el("button", "btn btn-secondary btn-sm", "+ " + k.name);
    b.type = "button";
    b.addEventListener("click", () => {
      state.article.push(k.t === "img" ? { type: "img", src: "", caption: "" }
                        : k.t === "ul" ? { type: "ul", items: [] }
                        : { type: k.t, text: "" });
      draw();
    });
    add.appendChild(b);
  });
  wrap.appendChild(add);

  function draw() {
    list.innerHTML = "";
    if (!state.article.length) {
      list.appendChild(el("div", "blk-empty", "아직 본문이 없어요. 아래에서 블록을 더해 보세요."));
      return;
    }
    state.article.forEach((b, i) => list.appendChild(blockRow(state, b, i, draw)));
  }
  draw();
  return wrap;
}

function blockRow(state, b, i, draw) {
  const box = el("div", "blk");

  /* 위: 종류 고르기와 순서 바꾸기 */
  const top = el("div", "blk-top");
  const kinds = el("div", "blk-kind");
  BLOCK_KINDS.forEach(k => {
    const btn = el("button", b.type === k.t ? "on" : null, k.name);
    btn.type = "button";
    btn.addEventListener("click", () => {
      if (b.type === k.t) return;
      /* 종류를 바꿔도 적어 둔 글은 최대한 살립니다. */
      const txt = b.type === "ul" ? (b.items || []).join("\n") : (b.text || "");
      Object.keys(b).forEach(key => delete b[key]);
      b.type = k.t;
      if (k.t === "ul") b.items = txt ? txt.split("\n") : [];
      else if (k.t === "img") { b.src = ""; b.caption = ""; }
      else b.text = txt;
      draw();
    });
    kinds.appendChild(btn);
  });
  top.appendChild(kinds);

  const move = el("div", "blk-move");
  const mk = (label, title, cls, fn, off) => {
    const x = el("button", cls, label);
    x.type = "button"; x.title = title; x.disabled = !!off;
    x.addEventListener("click", fn);
    move.appendChild(x);
  };
  mk("↑", "위로", null, () => {
    state.article.splice(i - 1, 0, state.article.splice(i, 1)[0]); draw();
  }, i === 0);
  mk("↓", "아래로", null, () => {
    state.article.splice(i + 1, 0, state.article.splice(i, 1)[0]); draw();
  }, i === state.article.length - 1);
  mk("×", "삭제", "del", () => {
    if (!confirm("이 블록을 지울까요?")) return;
    state.article.splice(i, 1); draw();
  });
  top.appendChild(move);
  box.appendChild(top);

  /* 아래: 내용 */
  if (b.type === "img") {
    /* 사진은 state 에 담아 두었다가 저장할 때 올립니다. */
    const holder = { src: b.src || "" };
    const pick = imagePicker(holder, "src", "", () => {
      b.__upload = holder.__upload_src;
      b.src = holder.src;
    });
    box.appendChild(pick);
    const cap = input(b.caption || "", "사진 아래 설명 (비워도 됩니다)");
    cap.className = "cap";
    cap.addEventListener("input", () => b.caption = cap.value);
    box.appendChild(cap);
  } else if (b.type === "h") {
    const t = input(b.text || "", BLOCK_PLACEHOLDER.h);
    t.addEventListener("input", () => b.text = t.value);
    box.appendChild(t);
  } else {
    const t = textarea(b.type === "ul" ? (b.items || []).join("\n") : (b.text || ""),
                       BLOCK_PLACEHOLDER[b.type]);
    t.addEventListener("input", () => {
      if (b.type === "ul") b.items = t.value.split("\n");
      else b.text = t.value;
    });
    box.appendChild(t);
  }
  return box;
}

/* 저장 직전에 빈 블록을 걸러 냅니다.
   실수로 더해 놓고 비워 둔 블록이 그대로 나가면 상세페이지에 빈 줄이 생깁니다. */
function cleanArticle(blocks) {
  return (blocks || []).map(b => {
    if (b.type === "img") return b.src ? { type: "img", src: b.src, caption: (b.caption || "").trim() } : null;
    if (b.type === "ul") {
      const items = (b.items || []).map(x => x.trim()).filter(Boolean);
      return items.length ? { type: "ul", items: items } : null;
    }
    const text = (b.text || "").trim();
    return text ? { type: b.type, text: text } : null;
  }).filter(Boolean);
}

/* 본문 안의 사진을 올립니다. 저장할 때 한 번에 처리합니다. */
async function uploadArticleImages(state, key) {
  for (let i = 0; i < state.article.length; i++) {
    const b = state.article[i];
    if (!b.__upload) continue;
    setMsg("본문 사진을 올리는 중… (" + (i + 1) + ")");
    const path = "assets/events/" + key + "/body-" + Date.now().toString(36) + "-" + i + "." + b.__upload.ext;
    await gh.writeBinary(path, b.__upload.base64, null, "어드민: " + state.title + " 본문 사진");
    b.src = path;
    delete b.__upload;
  }
}

/* ---------------------------------------------------------------
   본문 리치 에디터

   콘텐츠 페이지의 <!-- @admin:body:start / end --> 사이(마커가 없으면
   <main> 안쪽)를 그대로 보여 주고, 워드처럼 고칠 수 있게 합니다.
   제목은 엘리스 디지털 배움체, 콜아웃과 사진, 링크를 지원합니다.
   스타일은 assets/article.css 하나를 어드민과 실제 페이지가 함께 씁니다.
   --------------------------------------------------------------- */
const BODY_START = "<!-- @admin:body:start -->";
const BODY_END = "<!-- @admin:body:end -->";

function extractBody(html) {
  const s = html.indexOf(BODY_START);
  const e = html.indexOf(BODY_END);
  if (s > -1 && e > s) {
    const i = s + BODY_START.length;
    return { before: html.slice(0, i), inner: html.slice(i, e), after: html.slice(e) };
  }
  const m = html.match(/<main\b[^>]*>/i);
  const me = html.lastIndexOf("</main>");
  if (m && me > -1) {
    const i = html.indexOf(m[0]) + m[0].length;
    if (i <= me) return { before: html.slice(0, i), inner: html.slice(i, me), after: html.slice(me) };
  }
  return null;
}

/* 본문에 넣는 사진. 썸네일과 달리 16:9로 만들지 않고 비율을 그대로 둡니다. */
function prepareArticleImage(f) {
  return new Promise((resolve, reject) => {
    const isSvg = f.type === "image/svg+xml" || /\.svg$/i.test(f.name);
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    if (isSvg) {
      reader.onload = () => resolve({ dataUrl: reader.result, ext: "svg" });
      reader.readAsDataURL(f);
      return;
    }
    reader.onload = () => {
      const im = new Image();
      im.onerror = () => reject(new Error("이미지 형식이 아니에요"));
      im.onload = () => {
        const MAX = 1280;
        const sc = Math.min(1, MAX / im.width);
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * sc);
        c.height = Math.round(im.height * sc);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        resolve({ dataUrl: c.toDataURL("image/jpeg", 0.85), ext: "jpg" });
      };
      im.src = reader.result;
    };
    reader.readAsDataURL(f);
  });
}

/* 편집 도구 막대 + 편집 영역. */
function richEditor() {
  const root = el("div");
  const bar = el("div", "rt-bar");
  const area = el("div", "rt-area article-body");
  area.contentEditable = "true";
  area.setAttribute("spellcheck", "false");

  const btn = (label, title, fn) => {
    const b = el("button", null, label);
    b.type = "button";
    b.title = title || label;
    /* mousedown에서 처리해야 본문의 글자 선택이 풀리지 않습니다. */
    b.addEventListener("mousedown", e => { e.preventDefault(); fn(); });
    bar.appendChild(b);
    return b;
  };
  const cmd = (c, v) => { area.focus(); document.execCommand(c, false, v || null); };

  btn("제목", "큰 제목 (엘리스체)", () => cmd("formatBlock", "<h2>"));
  btn("소제목", "작은 제목 (엘리스체)", () => cmd("formatBlock", "<h3>"));
  btn("본문", "일반 문단으로 되돌리기", () => cmd("formatBlock", "<p>"));
  bar.appendChild(el("span", "rt-gap"));
  btn("굵게", "선택한 글자를 굵게", () => cmd("bold"));
  btn("목록", "불릿 목록", () => cmd("insertUnorderedList"));
  btn("콜아웃", "안내 상자로 감싸기 / 풀기", () => toggleCallout(area));

  bar.appendChild(el("span", "rt-gap"));
  btn("링크", "선택한 글자에 링크 걸기", () => {
    area.focus();
    const sel = window.getSelection();
    const anchorEl = sel.anchorNode &&
      (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
    const a = anchorEl && anchorEl.closest && anchorEl.closest("a");
    if (a && area.contains(a) && sel.isCollapsed) {
      if (confirm("이 링크를 풀까요?\n" + a.href)) {
        while (a.firstChild) a.parentNode.insertBefore(a.firstChild, a);
        a.remove();
      }
      return;
    }
    if (sel.isCollapsed) { alert("링크를 걸 글자를 먼저 드래그해 주세요."); return; }
    const url = prompt("연결할 주소를 넣어 주세요.", "https://");
    if (!url || url === "https://") return;
    document.execCommand("createLink", false, url.trim());
    /* 새 창으로 열리게 표시해 둡니다. */
    area.querySelectorAll("a:not([target])").forEach(x => {
      x.target = "_blank";
      x.rel = "noopener";
    });
  });

  const file = document.createElement("input");
  file.type = "file";
  file.accept = "image/*";
  file.style.display = "none";
  btn("사진", "사진 넣기 (저장할 때 함께 올라갑니다)", () => file.click());
  file.addEventListener("change", async () => {
    const f = file.files && file.files[0];
    file.value = "";
    if (!f) return;
    try {
      const out = await prepareArticleImage(f);
      const im = document.createElement("img");
      im.src = out.dataUrl;
      im.setAttribute("data-new", out.ext);
      im.alt = "";
      const sel = window.getSelection();
      if (sel.rangeCount && area.contains(sel.anchorNode)) {
        /* 커서가 든 최상위 블록 뒤에 넣습니다. 문단 한가운데가 갈라지지 않게요. */
        let blk = sel.anchorNode;
        while (blk && blk.parentNode !== area) blk = blk.parentNode;
        if (blk && blk !== area) blk.after(im);
        else area.appendChild(im);
      } else {
        area.appendChild(im);
      }
    } catch (e) {
      alert("사진을 읽지 못했어요: " + e.message);
    }
  });

  root.appendChild(bar);
  root.appendChild(area);
  root.appendChild(file);
  return {
    root,
    area,
    getHtml: () => area.innerHTML.trim(),
    setHtml: h => { area.innerHTML = h; }
  };
}

/* 커서가 든 블록을 콜아웃(안내 상자)으로 감싸거나 풀어 줍니다. */
function toggleCallout(area) {
  area.focus();
  const sel = window.getSelection();
  if (!sel.rangeCount || !area.contains(sel.anchorNode)) return;
  const anchorEl = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
  const co = anchorEl && anchorEl.closest && anchorEl.closest(".callout");
  if (co && area.contains(co)) {
    while (co.firstChild) co.parentNode.insertBefore(co.firstChild, co);
    co.remove();
    return;
  }
  let blk = sel.anchorNode;
  while (blk && blk.parentNode !== area) blk = blk.parentNode;
  if (!blk || blk === area) return;
  const box = document.createElement("div");
  box.className = "callout";
  area.insertBefore(box, blk);
  box.appendChild(blk);
}

/* 에디터가 들고 있는 새 사진(data URL)을 깃허브에 올리고 주소를 바꿔 넣습니다.
   prefix는 페이지 위치에 따른 상대 경로입니다. 루트 페이지는 "", p/해시/ 페이지는 "../../". */
async function uploadEditorImages(area, key, prefix, setMsg) {
  const imgs = Array.from(area.querySelectorAll("img[data-new]"));
  for (let i = 0; i < imgs.length; i++) {
    const im = imgs[i];
    if (setMsg) setMsg("본문 사진을 올리는 중… (" + (i + 1) + "/" + imgs.length + ")");
    const ext = im.getAttribute("data-new") || "jpg";
    const b64 = String(im.src).split(",")[1];
    if (!b64) { im.removeAttribute("data-new"); continue; }
    const path = "assets/articles/" + key + "/img-" + Date.now().toString(36) + "-" + i + "." + ext;
    await gh.writeBinary(path, b64, null, "어드민: 본문 사진 (" + key + ")");
    im.src = (prefix || "") + path;
    im.removeAttribute("data-new");
  }
}

/* 에디터에 실제 내용이 있으면 HTML을, 비어 있으면 "" 를 돌려줍니다. */
function editorBody(state) {
  const ed = state.__editor;
  if (!ed) return "";
  const hasText = ed.area.textContent.trim().length > 0;
  const hasMedia = !!ed.area.querySelector("img, iframe");
  return (hasText || hasMedia) ? ed.getHtml() : "";
}

/* 페이지 경로에서 사진 폴더 이름과 상대 경로 prefix를 얻습니다.
   사진은 assets/articles/<이름>/ 에 올라가는데, 페이지가 어느 깊이에 있느냐에
   따라 그 폴더를 가리키는 상대 경로가 달라집니다. */
function pageImageTarget(path) {
  if (path.indexOf("p/") === 0) return { key: path.split("/")[1], prefix: "../../" };
  if (path.indexOf("r/") === 0) {
    return { key: path.slice(2).replace(/\.html$/, "").replace(/[^A-Za-z0-9-]+/g, "-"), prefix: "../" };
  }
  return { key: path.replace(/\.html$/, "").replace(/[^A-Za-z0-9-]+/g, "-"), prefix: "" };
}

/* 눈 아이콘이 달린 비밀번호 입력칸. 로그인 화면과 같은 모양입니다.
   누르면 입력한 글자가 보여서 오타를 확인할 수 있어요. */
function pwField(placeholder) {
  const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.7 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a18.4 18.4 0 0 1-3.2 4.1"/><path d="M6.2 6.6A18.2 18.2 0 0 0 2 12s3.6 7 10 7a10.4 10.4 0 0 0 4.5-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m3 3 18 18"/></svg>';
  const wrap = el("div", "pw-wrap");
  const inp = document.createElement("input");
  inp.type = "password";
  inp.autocomplete = "off";
  if (placeholder) inp.placeholder = placeholder;
  const btn = el("button", "pw-toggle");
  btn.type = "button";
  btn.innerHTML = EYE;
  btn.setAttribute("aria-label", "비밀번호 보기");
  btn.title = "비밀번호 보기";
  btn.addEventListener("click", () => {
    const show = inp.type === "password";
    inp.type = show ? "text" : "password";
    btn.innerHTML = show ? EYE_OFF : EYE;
    const label = show ? "비밀번호 숨기기" : "비밀번호 보기";
    btn.setAttribute("aria-label", label);
    btn.title = label;
    inp.focus();
  });
  wrap.appendChild(inp);
  wrap.appendChild(btn);
  return { wrap, input: inp };
}

/* 상세 화면에 붙는 본문 패널. 내용을 그대로 보여 주고, 그 자리에서 고칩니다. */
function bodyPanel(path, refresh) {
  const p = panel("본문", null);
  const holder = el("div");
  holder.textContent = "본문을 불러오는 중이에요…";
  holder.style.cssText = "font-size:14px;color:var(--muted)";
  p.appendChild(holder);

  (async () => {
    let f;
    try {
      f = await gh.read(path);
    } catch (e) {
      holder.textContent = "본문을 불러오지 못했어요. " + (e.message || "");
      return;
    }
    if (!f.exists) { holder.textContent = "페이지 파일을 찾지 못했어요: " + path; return; }
    const cut = extractBody(f.text);
    if (!cut) {
      holder.innerHTML = "";
      holder.appendChild(el("div", "note",
        "이 페이지는 본문 구획 표시가 없어 여기서 바로 고칠 수 없어요. HTML 편집으로 열어 주세요."));
      const b = el("button", "btn btn-secondary btn-sm", "HTML로 수정");
      b.type = "button";
      b.addEventListener("click", () => openPageEditor(path, refresh));
      holder.appendChild(b);
      return;
    }
    renderView(f, cut);
  })();

  function renderView(f, cut) {
    holder.innerHTML = "";
    holder.style.cssText = "";
    const view = el("div", "dv-body article-body");
    view.innerHTML = cut.inner;
    holder.appendChild(view);

    const acts = el("div", "dv-acts");
    const edit = el("button", "btn btn-primary btn-sm", "본문 수정하기");
    edit.type = "button";
    edit.addEventListener("click", () => renderEdit(f, cut));
    const raw = el("button", "btn btn-ghost btn-sm", "HTML로 수정");
    raw.type = "button";
    raw.addEventListener("click", () => openPageEditor(path, refresh));
    acts.appendChild(edit);
    acts.appendChild(raw);
    holder.appendChild(acts);
  }

  function renderEdit(f, cut) {
    holder.innerHTML = "";
    const ed = richEditor();
    ed.setHtml(cut.inner);
    holder.appendChild(ed.root);

    const msg = el("div", "rt-hint",
      "글자를 고치고 저장을 누르면 1~2분 안에 사이트에 반영돼요. 사진과 링크, 콜아웃은 위 도구로 넣습니다.");
    const acts = el("div", "dv-acts");
    const save = el("button", "btn btn-primary", "저장하고 배포");
    const cancel = el("button", "btn btn-secondary", "취소");
    save.type = "button";
    cancel.type = "button";
    cancel.addEventListener("click", () => renderView(f, cut));
    save.addEventListener("click", async () => {
      save.disabled = true; cancel.disabled = true;
      save.innerHTML = '<span class="spin"></span> 저장 중';
      try {
        const t = pageImageTarget(path);
        await uploadEditorImages(ed.area, t.key, t.prefix, m => { msg.textContent = m; });
        const html = cut.before + "\n" + ed.getHtml() + "\n" + cut.after;
        const r = await gh.writeText(path, html, f.sha, "어드민에서 본문 수정: " + path);
        f.sha = r.sha;
        f.text = html;
        msg.textContent = "저장했어요. 1~2분 뒤 사이트에 반영됩니다.";
        renderView(f, extractBody(html));
      } catch (e) {
        msg.textContent = "저장하지 못했어요. " + (e.message || "");
        save.disabled = false; cancel.disabled = false;
        save.textContent = "저장하고 배포";
      }
    });
    acts.appendChild(save);
    acts.appendChild(cancel);
    holder.appendChild(acts);
    holder.appendChild(msg);
  }

  return p;
}

/* 일부공개 자료의 본문 패널. 비밀번호는 어디에도 저장돼 있지 않아서
   한 번 넣어야 페이지 주소를 찾을 수 있습니다. */
function protectedBodyPanel(id, priv) {
  const p = panel("본문",
    "일부공개 자료의 주소는 비밀번호로 만들어져요. 안내하시는 비밀번호를 넣으면 본문이 열립니다.");
  const row = el("div");
  row.style.cssText = "display:flex;gap:8px;max-width:440px";
  const pf = pwField("자료 비밀번호");
  pf.wrap.style.flex = "1";
  const pw = pf.input;
  const go = el("button", "btn btn-secondary", "본문 열기");
  go.type = "button";
  row.appendChild(pf.wrap);
  row.appendChild(go);
  p.appendChild(row);
  const err = el("div", "err", "");
  p.appendChild(err);

  const open = async () => {
    const v = pw.value.trim();
    if (!v) { err.textContent = "비밀번호를 입력해 주세요."; return; }
    go.disabled = true; go.textContent = "확인 중…"; err.textContent = "";
    try {
      const hash = (await sha256hex(v)).slice(0, 16);
      const path = "p/" + hash + "/index.html";
      const f = await gh.read(path);
      if (!f.exists) throw new Error("이 비밀번호로 만든 자료 페이지가 없어요. 다시 확인해 주세요.");
      p.replaceWith(bodyPanel(path, () => openResourceDetail(id, priv)));
    } catch (e) {
      err.textContent = e.message || "열지 못했어요.";
      go.disabled = false; go.textContent = "본문 열기";
    }
  };
  go.addEventListener("click", open);
  pw.addEventListener("keydown", e => { if (e.key === "Enter") open(); });
  return p;
}

/* ---------------------------------------------------------------
   자료 / 인사이트 편집
   --------------------------------------------------------------- */
function openResource(id, isPrivate) {
  const isNew = !id;
  const list = isPrivate ? store.RESOURCES_PRIVATE : store.RESOURCES;
  const src = isNew ? {} : (list.find(r => r.id === id) || {});

  const state = {
    id: id || "",
    category: src.category || CATEGORIES_RES[0],
    title: src.title || "",
    sub: src.sub || "",
    thumb: src.thumb || "",
    access: isPrivate ? "private" : (src.access || "public"),
    href: src.href || "",
    /* 자료 페이지 내용 */
    __editor: null,
    password: "",
    youtube: "",
    files: [],
    links: ""
  };
  const wasPrivate = !!isPrivate;
  const wasId = id;

  const view = document.getElementById("editView");
  view.innerHTML = "";

  const head = el("div", "head-row");
  head.appendChild(el("h2", null, isNew ? "새 자료 / 인사이트" : "자료 / 인사이트 수정"));
  view.appendChild(head);

  /* --- 기본 --- */
  const p1 = panel("기본 정보", null);

  if (isNew) {
    const idIn = input("", "예: summer-guide (영문 소문자와 하이픈)");
    idIn.addEventListener("input", () => state.id = idIn.value.trim());
    p1.appendChild(field("구분용 이름", idIn, { hint: "비워 두면 제목에서 자동으로 만듭니다." }));
  }

  const titleIn = input(state.title, "예: 원장님을 위한 클로드 코워크 설치 가이드");
  titleIn.addEventListener("input", () => { state.title = titleIn.value; refreshPreview(); });
  p1.appendChild(field("제목", titleIn, { required: true }));

  const subIn = textarea(state.sub, "이 자료가 무엇인지 한 줄로 적어 주세요.", 2);
  subIn.addEventListener("input", () => { state.sub = subIn.value; refreshPreview(); });
  p1.appendChild(field("한 줄 설명", subIn, { required: true }));

  const catSel = select(CATEGORIES_RES, state.category);
  catSel.addEventListener("change", () => { state.category = catSel.value; refreshPreview(); });
  p1.appendChild(field("카테고리", catSel));

  p1.appendChild(field("썸네일", imagePicker(state, "thumb", "assets/thumbs/", refreshPreview), {
    hint: "가로로 긴 이미지(16:9)를 넣어 주세요."
  }));
  view.appendChild(p1);

  /* --- 본문 --- */
  if (isNew) {
    const pB = panel("본문 작성", "여기 쓴 내용으로 자료 페이지가 만들어져요. 제목 버튼을 누르면 엘리스체 제목이 됩니다.");
    const ed = richEditor();
    state.__editor = ed;
    pB.appendChild(ed.root);
    pB.appendChild(el("div", "rt-hint",
      "공개 자료: 본문을 쓰면 페이지가 자동으로 만들어져요. 이미 만들어 둔 페이지에 연결하려면 본문은 비우고 아래 공개 설정에서 \"연결할 페이지\"만 적어 주세요. "
      + "일부공개 자료: 본문과 함께 아래의 영상, 첨부 파일, 참고 링크가 비밀번호 페이지에 들어갑니다."));
    view.appendChild(pB);
  } else {
    const pB = panel("본문", null);
    const note = el("div", "note");
    note.innerHTML = "글 내용은 목록에서 이 자료를 눌러 들어가는 <strong>상세 화면</strong>에서 그대로 보면서 고칠 수 있어요. 이 화면에서는 제목과 설명, 공개 범위만 다룹니다.";
    pB.appendChild(note);
    view.appendChild(pB);
  }

  /* --- 공개 설정 --- */
  const p2 = panel("공개 설정", "누가 볼 수 있는지 정합니다.");
  p2.appendChild(segment([
    ["public", "공개"],
    ["protected", "일부공개"],
    ["private", "비공개"]
  ], state, "access", onAccessChange));

  const accessNote = el("div", "note");
  accessNote.style.marginTop = "18px";
  p2.appendChild(accessNote);

  /* 공개일 때: 연결할 페이지 주소 */
  const hrefIn = input(state.href, "예: claude-code-windows");
  hrefIn.addEventListener("input", () => state.href = hrefIn.value.trim());
  const hrefWrap = field("연결할 페이지", hrefIn, {
    hint: "이 사이트 안의 페이지 이름이에요. 확장자(.html)는 빼고 적습니다."
  });
  p2.appendChild(hrefWrap);

  /* 일부공개일 때: 비밀번호 + 상세페이지 내용 */
  const pwF = pwField("신청자에게 안내할 비밀번호");
  const pwIn = pwF.input;
  pwIn.addEventListener("input", async () => {
    state.password = pwIn.value.trim();
    pwPath.textContent = state.password
      ? "이 비밀번호를 넣으면 " + "p/" + (await sha256hex(state.password)).slice(0, 16) + "/ 로 들어갑니다."
      : "";
  });
  const pwWrap = field("비밀번호", pwF.wrap, {
    hint: "비밀번호는 어디에도 저장되지 않아요. 이 글자로 자료 주소를 만들기 때문에, 잊으면 저도 찾아 드릴 수 없습니다."
  });
  const pwPath = el("div");
  pwPath.style.cssText = "font-size:13px;color:var(--muted);margin:-8px 0 18px";
  p2.appendChild(pwWrap);
  p2.appendChild(pwPath);

  const contentBox = el("div");
  const ytIn = input("", "예: https://youtu.be/abc123", "url");
  ytIn.addEventListener("input", () => state.youtube = ytIn.value.trim());
  contentBox.appendChild(field("영상 링크", ytIn, { hint: "유튜브 주소를 넣으면 자료 페이지 안에서 바로 볼 수 있어요. 없으면 비워 두세요." }));

  /* 첨부파일 */
  const fileWrap = el("label", "field");
  const fileLab = el("span", "lab", "첨부 파일");
  fileLab.appendChild(el("span", "hint", "PDF, 압축파일 등을 올릴 수 있어요. 여러 개 고를 수 있습니다."));
  fileWrap.appendChild(fileLab);
  const fileBtn = el("button", "btn btn-secondary btn-sm", "파일 고르기");
  fileBtn.type = "button";
  const fileIn = document.createElement("input");
  fileIn.type = "file"; fileIn.multiple = true; fileIn.style.display = "none";
  const fileUl = el("ul", "file-list");
  fileBtn.addEventListener("click", () => fileIn.click());
  fileIn.addEventListener("change", async () => {
    for (const f of Array.from(fileIn.files || [])) {
      if (f.size > 20 * 1024 * 1024) { alert("“" + f.name + "” 은 20MB가 넘어서 올릴 수 없어요."); continue; }
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1]);
        r.onerror = () => rej(new Error("읽기 실패"));
        r.readAsDataURL(f);
      });
      state.files.push({ name: f.name, base64: b64, size: f.size });
    }
    fileIn.value = "";
    renderFiles();
  });
  function renderFiles() {
    fileUl.innerHTML = "";
    state.files.forEach((f, i) => {
      const li = el("li");
      li.appendChild(el("span", null, f.name + "  (" + Math.round(f.size / 1024) + "KB)"));
      const x = el("button", "btn btn-ghost btn-sm", "빼기");
      x.type = "button";
      x.addEventListener("click", () => { state.files.splice(i, 1); renderFiles(); });
      li.appendChild(x);
      fileUl.appendChild(li);
    });
  }
  fileWrap.appendChild(fileBtn); fileWrap.appendChild(fileIn); fileWrap.appendChild(fileUl);
  contentBox.appendChild(fileWrap);

  const linksIn = textarea("", "한 줄에 하나씩, 이름과 주소를 |로 나눠 주세요.\n예)\n캔바 템플릿 | https://canva.com/...", 3);
  linksIn.addEventListener("input", () => state.links = linksIn.value);
  contentBox.appendChild(field("참고 링크", linksIn, { hint: "예: 캔바 템플릿 | https://..." }));
  p2.appendChild(contentBox);

  function onAccessChange() {
    const a = state.access;
    hrefWrap.style.display = a === "public" || a === "private" ? "block" : "none";
    pwWrap.style.display = a === "protected" ? "block" : "none";
    pwPath.style.display = a === "protected" ? "block" : "none";
    contentBox.style.display = a === "protected" ? "block" : "none";
    if (a === "public") {
      accessNote.innerHTML = "<strong>공개</strong> 누구나 목록에서 눌러 바로 볼 수 있어요.";
    } else if (a === "protected") {
      accessNote.innerHTML = "<strong>일부공개</strong> 비밀번호를 아는 분만 볼 수 있어요. "
        + "본문이나 파일 같은 새 내용을 넣고 저장하면 비밀번호로 만든 주소에 자료 페이지가 만들어집니다. "
        + "제목이나 설명만 고칠 때는 비밀번호를 비워 두세요. 그러면 자료 페이지는 그대로 둡니다.";
    } else {
      accessNote.innerHTML = "<strong>비공개</strong> 사이트에 나타나지 않고 이 관리자 화면에만 보입니다. "
        + "준비가 끝나면 공개로 바꿔 주세요.";
    }
    refreshPreview();
  }
  view.appendChild(p2);

  /* --- 미리보기 --- */
  const p3 = panel("미리보기", "자료 목록에 이렇게 보입니다.");
  const pv = el("div", "pv");
  p3.appendChild(pv);
  view.appendChild(p3);

  function refreshPreview() {
    pv.innerHTML = "";
    if (state.access === "private") {
      pv.innerHTML = '<div style="color:var(--muted);font-size:14.5px;padding:8px 2px">비공개라 사이트에는 나타나지 않아요.</div>';
      return;
    }
    const row = el("div", "pv-row");
    row.appendChild(el("div", "k", state.category));
    const m = el("div", "m");
    m.appendChild(el("strong", null, state.title || "(제목을 입력해 주세요)"));
    m.appendChild(el("span", null, state.sub || ""));
    row.appendChild(m);
    const map = { public: ["open", "공개"], protected: ["locked", "일부공개"] };
    const [cls, lab] = map[state.access] || map.public;
    row.appendChild(el("span", "badge " + cls, lab));
    pv.appendChild(row);
  }
  /* 미리보기 요소가 만들어진 뒤에 불러야 합니다. onAccessChange 안에서 미리보기를 그리거든요. */
  onAccessChange();

  view.appendChild(saveBar(setMsg => saveResource(state, wasId, isNew, wasPrivate, setMsg), renderList));
  showEdit();
}

/* 파일명을 주소로 쓸 수 있게 다듬습니다.
   깃허브 주소에 한글을 쓰면 깨지기 쉬워서, 영문 이름은 살리고 한글 이름은
   자료 이름 + 순번으로 바꿉니다. 화면에 보이는 이름은 원본 그대로 남습니다. */
function safeFileName(name, fallbackBase, index) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = (dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "") || "bin";
  const slug = String(base).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (slug || fallbackBase + "-" + (index + 1)) + "." + ext;
}
function youtubeId(url) {
  const m = String(url || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : "";
}

/* 일부공개 자료 페이지 HTML */
function buildProtectedPage(o) {
  /* 마커는 article-body 안쪽에 둡니다. 어드민 편집기가 이 사이만 갈아 끼워요. */
  const body = '      <div class="article-body">\n      ' + BODY_START + "\n"
    + (o.bodyHtml ? o.bodyHtml + "\n" : "")
    + "      " + BODY_END + "\n      </div>";
  const yt = o.youtubeId
    ? '      <div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + o.youtubeId
      + '" title="영상" allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>'
    : "";
  const files = (o.files || []).length
    ? '      <h2>자료 받기</h2>\n      <ul class="dl">\n'
      + o.files.map(f => '        <li><a href="' + escapeHtml(f.path) + '" download>' + escapeHtml(f.label) + '</a></li>').join("\n")
      + "\n      </ul>"
    : "";
  const links = (o.links || []).length
    ? '      <h2>참고 링크</h2>\n      <ul class="dl">\n'
      + o.links.map(l => '        <li><a href="' + escapeHtml(l.url) + '" target="_blank" rel="noopener">' + escapeHtml(l.label) + '</a></li>').join("\n")
      + "\n      </ul>"
    : "";

  return '<!DOCTYPE html>\n<html lang="ko">\n<head>\n'
    + '<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n'
    + '<meta name="robots" content="noindex, nofollow" />\n'
    + "<title>" + escapeHtml(o.title) + " - 크래빗 아카데미</title>\n"
    + '<link rel="icon" type="image/png" href="../../assets/favicon.png" />\n'
    + '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />\n'
    + '<link rel="stylesheet" href="../../assets/article.css" />\n'
    + "<style>\n"
    + "  :root { --bg:#FFFFFF; --page:#F2F3F6; --card:#F9FAFC; --ink:#16192A; --muted:rgba(22,25,42,0.55); --line:#E8E8E8; --pink:#FB75BB; }\n"
    + "  * { box-sizing:border-box; }\n"
    + '  body { margin:0; background:var(--page); color:var(--ink); line-height:1.7; font-family:"Pretendard Variable",Pretendard,-apple-system,"Apple SD Gothic Neo",sans-serif; -webkit-font-smoothing:antialiased; }\n'
    + "  .wrap { max-width:760px; margin:0 auto; padding:0 24px; }\n"
    + "  header { background:var(--bg); border-bottom:1px solid var(--line); }\n"
    + "  header .wrap { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; }\n"
    + "  header img { height:24px; display:block; }\n"
    + "  header a { font-size:15px; color:var(--muted); text-decoration:none; font-weight:500; }\n"
    + "  header a:hover { color:var(--ink); }\n"
    + "  main { padding:44px 0 72px; }\n"
    + "  .card { background:var(--bg); border-radius:22px; padding:40px; box-shadow:0 1px 4px rgba(22,25,42,0.05); }\n"
    + "  h1 { font-size:26px; font-weight:700; letter-spacing:-0.02em; margin:0 0 10px; line-height:1.35; }\n"
    + "  .lead { font-size:16px; color:var(--muted); margin:0 0 28px; }\n"
    + "  h2 { font-size:18px; font-weight:700; letter-spacing:-0.01em; margin:36px 0 14px; }\n"
    + "  p { font-size:16px; margin:0 0 14px; }\n"
    + "  .video { position:relative; padding-top:56.25%; border-radius:14px; overflow:hidden; background:var(--card); margin:24px 0; }\n"
    + "  .video iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }\n"
    + "  ul.dl { list-style:none; padding:0; margin:0; }\n"
    + "  ul.dl li { margin-bottom:9px; }\n"
    + "  ul.dl a { display:flex; align-items:center; justify-content:space-between; gap:14px; background:var(--card); border:1px solid var(--line); border-radius:12px; padding:15px 18px; text-decoration:none; color:var(--ink); font-size:15.5px; font-weight:600; transition:background 0.15s; }\n"
    + '  ul.dl a:hover { background:#F0F0F0; }\n'
    + '  ul.dl a::after { content:"\\203A"; color:var(--muted); font-size:20px; }\n'
    + "  footer { border-top:1px solid var(--line); padding:28px 0 40px; font-size:13.5px; color:var(--muted); }\n"
    + "  a:focus-visible { outline:2px solid var(--pink); outline-offset:3px; border-radius:4px; }\n"
    + "  @media (max-width:720px) { .card { padding:26px 22px; border-radius:18px; } h1 { font-size:22px; } }\n"
    + "</style>\n</head>\n<body>\n\n"
    + '<header><div class="wrap">\n'
    + '  <img src="../../assets/logo.png" alt="Crabit 아카데미" />\n'
    + '  <a href="../../">홈으로 돌아가기</a>\n'
    + "</div></header>\n\n"
    + '<main class="wrap">\n  <div class="card">\n'
    + "    <h1>" + escapeHtml(o.title) + "</h1>\n"
    + '    <p class="lead">' + escapeHtml(o.sub || "") + "</p>\n"
    + body + "\n"
    + (yt ? yt + "\n" : "")
    + (files ? files + "\n" : "")
    + (links ? links + "\n" : "")
    + "  </div>\n</main>\n\n"
    + '<footer><div class="wrap">(주)크래빗 · 이 페이지는 안내받으신 분만 볼 수 있어요.</div></footer>\n\n'
    + "</body>\n</html>\n";
}
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* 공개 자료의 아티클 페이지 HTML. r/이름.html 로 저장됩니다. */
function buildArticlePage(o) {
  return '<!DOCTYPE html>\n<html lang="ko">\n<head>\n'
    + '<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n'
    + "<title>" + escapeHtml(o.title) + " - 크래빗 아카데미</title>\n"
    + '<meta name="description" content="' + escapeHtml(o.sub || "") + '" />\n'
    + '<link rel="icon" type="image/png" href="../assets/favicon.png" />\n'
    + '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />\n'
    + '<link rel="stylesheet" href="../assets/article.css" />\n'
    + "<style>\n"
    + "  :root { --bg:#FFFFFF; --page:#F2F3F6; --card:#F9FAFC; --ink:#16192A; --muted:rgba(22,25,42,0.55); --line:#E8E8E8; --pink:#FB75BB; }\n"
    + "  * { box-sizing:border-box; }\n"
    + '  body { margin:0; background:var(--page); color:var(--ink); line-height:1.7; font-family:"Pretendard Variable",Pretendard,-apple-system,"Apple SD Gothic Neo",sans-serif; -webkit-font-smoothing:antialiased; }\n'
    + "  .wrap { max-width:760px; margin:0 auto; padding:0 24px; }\n"
    + "  header { background:var(--bg); border-bottom:1px solid var(--line); }\n"
    + "  header .wrap { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; }\n"
    + "  header img { height:24px; display:block; }\n"
    + "  header a { font-size:15px; color:var(--muted); text-decoration:none; font-weight:500; }\n"
    + "  header a:hover { color:var(--ink); }\n"
    + "  main { padding:44px 0 72px; }\n"
    + "  .card { background:var(--bg); border-radius:22px; padding:40px; box-shadow:0 1px 4px rgba(22,25,42,0.05); }\n"
    + "  .eyebrow { display:inline-block; font-size:13px; font-weight:700; letter-spacing:0.06em; color:var(--pink); margin-bottom:10px; }\n"
    + "  h1 { font-size:26px; font-weight:700; letter-spacing:-0.02em; margin:0 0 10px; line-height:1.35; }\n"
    + "  .lead { font-size:16px; color:var(--muted); margin:0 0 28px; }\n"
    + "  footer { border-top:1px solid var(--line); padding:28px 0 40px; font-size:13.5px; color:var(--muted); }\n"
    + "  a:focus-visible { outline:2px solid var(--pink); outline-offset:3px; border-radius:4px; }\n"
    + "  @media (max-width:720px) { .card { padding:26px 22px; border-radius:18px; } h1 { font-size:22px; } }\n"
    + "</style>\n</head>\n<body>\n\n"
    + '<header><div class="wrap">\n'
    + '  <a href="../"><img src="../assets/logo.png" alt="Crabit 아카데미" /></a>\n'
    + '  <a href="../resources">자료 / 인사이트</a>\n'
    + "</div></header>\n\n"
    + '<main class="wrap">\n  <div class="card">\n'
    + (o.category ? '    <span class="eyebrow">' + escapeHtml(o.category) + "</span>\n" : "")
    + "    <h1>" + escapeHtml(o.title) + "</h1>\n"
    + '    <p class="lead">' + escapeHtml(o.sub || "") + "</p>\n"
    + '    <div class="article-body">\n    ' + BODY_START + "\n"
    + (o.bodyHtml ? o.bodyHtml + "\n" : "")
    + "    " + BODY_END + "\n    </div>\n"
    + "  </div>\n</main>\n\n"
    + '<footer><div class="wrap">(주)크래빗 | 크래빗 아카데미</div></footer>\n\n'
    + "</body>\n</html>\n";
}

async function saveResource(state, wasId, isNew, wasPrivate, setMsg) {
  if (!state.title.trim()) throw new Error("제목을 입력해 주세요.");
  if (!state.sub.trim()) throw new Error("한 줄 설명을 입력해 주세요.");

  const key = isNew ? slugify(state.id || state.title) : wasId;
  if (isNew && store.RESOURCES.concat(store.RESOURCES_PRIVATE).some(r => r.id === key)) {
    throw new Error("“" + key + "” 는 이미 있는 이름이에요. 다른 이름을 써 주세요.");
  }

  /* 1. 썸네일 */
  if (state.__upload_thumb) {
    setMsg("썸네일을 올리는 중…");
    const u = state.__upload_thumb;
    const path = "assets/thumbs/" + key + "-" + Date.now().toString(36) + "." + u.ext;
    await gh.writeBinary(path, u.base64, null, "어드민: " + state.title + " 썸네일 추가");
    state.thumb = path;
    delete state.__upload_thumb;
  }

  /* 2. 일부공개면 비밀번호 경로에 자료 페이지를 만듭니다. */
  let href = state.href;
  if (state.access === "protected") {
    const bodyNew = editorBody(state);
    const hasNewContent = !!bodyNew || state.files.length > 0
      || !!String(state.links || "").trim() || !!String(state.youtube || "").trim();

    if (!isNew && !hasNewContent && !state.password) {
      /* 이름이나 설명만 고치는 저장. 자료 페이지는 건드리지 않으니
         비밀번호도 필요 없습니다. */
      href = "";
    } else {
      if (!state.password) {
        throw new Error("일부공개 자료는 비밀번호를 정해 주세요."
          + (isNew ? "" : " (내용을 바꾸지 않을 때는 새 내용을 비우면 비밀번호 없이 저장돼요.)"));
      }
      if (state.password.length < 6) throw new Error("비밀번호는 6자 이상으로 정해 주세요.");
      const hash = (await sha256hex(state.password)).slice(0, 16);
      const dir = "p/" + hash + "/";
      const cur = await gh.read(dir + "index.html");

      if (cur.exists && !hasNewContent) {
        /* 페이지가 이미 있는데 새 내용이 없으면 그대로 둡니다. */
        href = "";
      } else {
        /* 본문: 새로 썼으면 그걸 쓰고, 아니면 기존 페이지의 본문을 살립니다.
           (파일만 추가할 때 글이 날아가지 않게요) */
        let bodyHtml = "";
        if (bodyNew) {
          await uploadEditorImages(state.__editor.area, hash, "../../", setMsg);
          bodyHtml = state.__editor.getHtml();
        } else if (cur.exists) {
          const cut = extractBody(cur.text);
          if (cut) bodyHtml = cut.inner.trim();
        }

        /* 첨부파일을 올립니다. */
        const uploaded = [];
        for (let i = 0; i < state.files.length; i++) {
          const f = state.files[i];
          setMsg("파일을 올리는 중… (" + (i + 1) + "/" + state.files.length + ")");
          const fname = safeFileName(f.name, key, i);
          await gh.writeBinary(dir + fname, f.base64, null, "어드민: " + state.title + " 첨부 " + fname);
          uploaded.push({ path: fname, label: f.name });
        }

        const links = String(state.links || "").split("\n").map(s => s.trim()).filter(Boolean).map(line => {
          const bar = line.indexOf("|");
          return bar === -1
            ? { label: line, url: line }
            : { label: line.slice(0, bar).trim(), url: line.slice(bar + 1).trim() };
        });

        setMsg("자료 페이지를 만드는 중…");
        const html = buildProtectedPage({
          title: state.title.trim(),
          sub: state.sub.trim(),
          bodyHtml,
          youtubeId: youtubeId(state.youtube),
          files: uploaded,
          links
        });
        await gh.writeText(dir + "index.html", html, cur.exists ? cur.sha : null,
          "어드민: " + state.title + " 자료 페이지");
        href = "";   // 일부공개는 목록에서 비밀번호 모달을 띄웁니다.
      }
    }
  } else {
    /* 2-2. 공개·비공개 자료에 본문을 쓰면 아티클 페이지를 만들어 연결합니다. */
    const bodyNew = editorBody(state);
    if (bodyNew && !href) {
      await uploadEditorImages(state.__editor.area, key, "../", setMsg);
      setMsg("아티클 페이지를 만드는 중…");
      const html = buildArticlePage({
        title: state.title.trim(),
        sub: state.sub.trim(),
        category: state.category,
        bodyHtml: state.__editor.getHtml()
      });
      const path = "r/" + key + ".html";
      const cur = await gh.read(path);
      await gh.writeText(path, html, cur.exists ? cur.sha : null,
        "어드민: 아티클 페이지 - " + state.title);
      href = "r/" + key;
    }
  }

  /* 3. 항목 만들기 */
  const item = { id: key, category: state.category, title: state.title.trim(), sub: state.sub.trim() };
  if (state.thumb) item.thumb = state.thumb;
  item.access = state.access === "private" ? "private" : state.access;
  if (href) item.href = href;

  /* 4. 두 목록에서 예전 자리를 빼고 새 자리에 넣습니다. */
  let pub = store.RESOURCES.filter(r => r.id !== key);
  let priv = store.RESOURCES_PRIVATE.filter(r => r.id !== key);
  if (state.access === "private") priv = priv.concat([item]);
  else pub = pub.concat([item]);

  /* 5. 바뀐 파일만 커밋합니다. */
  setMsg("저장하는 중…");
  const pubText = spliceMarker(store.resText, "RESOURCES", "const RESOURCES = " + jsLit(pub, 0) + ";");
  const privBase = store.privText || defaultPrivateFile();
  const privText = spliceMarker(privBase, "RESOURCES_PRIVATE", "const RESOURCES_PRIVATE = " + jsLit(priv, 0) + ";");

  if (pubText !== store.resText) {
    const r = await gh.writeText(RES_FILE, pubText, store.resSha, "어드민: 자료 " + (isNew ? "추가 - " : "수정 - ") + item.title);
    store.resText = pubText; store.resSha = r.sha;
  }
  if (privText !== store.privText) {
    const r = await gh.writeText(RES_PRIV_FILE, privText, store.privSha, "어드민: 비공개 자료 갱신");
    store.privText = privText; store.privSha = r.sha;
  }
  store.RESOURCES = pub;
  store.RESOURCES_PRIVATE = priv;
}

function defaultPrivateFile() {
  return "/* 비공개 자료 보관함. 사이트는 이 파일을 불러오지 않습니다. */\n"
    + "/* @admin:RESOURCES_PRIVATE:start */\nconst RESOURCES_PRIVATE = [];\n/* @admin:RESOURCES_PRIVATE:end */\n";
}

/* ---------------------------------------------------------------
   삭제 (2단계 확인)
   --------------------------------------------------------------- */
let pendingDelete = null;

function confirmDelete(isEvent, id, title, isPrivate) {
  pendingDelete = { isEvent, id, isPrivate };
  document.getElementById("cfTitle").textContent = "정말 지울까요?";
  document.getElementById("cfBody").textContent =
    "“" + (title || id) + "” 를 목록에서 지웁니다. 사이트에서도 사라져요. "
    + (isEvent ? "달력에 올린 일정도 함께 지워집니다." : "이미 올린 파일은 남아 있습니다.");
  document.getElementById("confirmBack").classList.add("show");
}
document.getElementById("cfNo").addEventListener("click", () => {
  document.getElementById("confirmBack").classList.remove("show");
  pendingDelete = null;
});
document.getElementById("confirmBack").addEventListener("click", e => {
  if (e.target.id === "confirmBack") { e.currentTarget.classList.remove("show"); pendingDelete = null; }
});
document.getElementById("cfYes").addEventListener("click", async () => {
  if (!pendingDelete) return;
  const btn = document.getElementById("cfYes");
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span> 지우는 중';
  try {
    if (pendingDelete.isEvent) await deleteEvent(pendingDelete.id);
    else await deleteResource(pendingDelete.id, pendingDelete.isPrivate);
    document.getElementById("confirmBack").classList.remove("show");
    renderList();
  } catch (e) {
    alert("지우지 못했어요.\n\n" + e.message);
  } finally {
    btn.disabled = false; btn.textContent = "삭제";
    pendingDelete = null;
  }
});

async function deleteEvent(id) {
  const db = Object.assign({}, store.EVENTS_DB);
  const title = (db[id] && db[id].title) || id;
  delete db[id];
  const sch = store.SCHEDULE.filter(s => s.id !== id);
  let text = store.eventsText;
  text = spliceMarker(text, "EVENTS_DB", "const EVENTS_DB = " + jsLit(db, 0) + ";");
  text = spliceMarker(text, "SCHEDULE", "const SCHEDULE = " + jsLit(sch, 0) + ";");
  const r = await gh.writeText(EVENT_FILE, text, store.eventsSha, "어드민: 교육 삭제 - " + title);
  store.eventsText = text; store.eventsSha = r.sha; store.EVENTS_DB = db; store.SCHEDULE = sch;
}

async function deleteResource(id, isPrivate) {
  if (isPrivate) {
    const priv = store.RESOURCES_PRIVATE.filter(r => r.id !== id);
    const text = spliceMarker(store.privText || defaultPrivateFile(), "RESOURCES_PRIVATE",
      "const RESOURCES_PRIVATE = " + jsLit(priv, 0) + ";");
    const r = await gh.writeText(RES_PRIV_FILE, text, store.privSha, "어드민: 비공개 자료 삭제");
    store.privText = text; store.privSha = r.sha; store.RESOURCES_PRIVATE = priv;
  } else {
    const pub = store.RESOURCES.filter(r => r.id !== id);
    const text = spliceMarker(store.resText, "RESOURCES", "const RESOURCES = " + jsLit(pub, 0) + ";");
    const r = await gh.writeText(RES_FILE, text, store.resSha, "어드민: 자료 삭제");
    store.resText = text; store.resSha = r.sha; store.RESOURCES = pub;
  }
}

/* ---------------------------------------------------------------
   시작
   --------------------------------------------------------------- */
(async function boot() {
  if (auth.token) {
    try {
      /* 저장된 토큰이 아직 살아 있는지 Supabase에 물어봅니다.
         만료됐으면 sbFetch 안에서 자동으로 갱신을 한 번 시도합니다. */
      const res = await sbFetch(AUTH_URL + "/user");
      if (!res.ok) throw new Error("세션 없음");
      await enterApp();
      return;
    } catch (e) { /* 아래에서 로그인 화면 */ }
  }
  showLogin();
})();

/* ---------------------------------------------------------------
   신청자 현황

   다른 탭과 달리 깃허브가 아니라 Supabase 테이블에서 바로 읽어 옵니다.
   신청자 이름과 전화번호는 개인정보라 public 레포에 둘 수 없어서예요.
   조회 권한은 로그인해서 받은 access token이 결정합니다.
   비로그인(anon)으로는 RLS와 테이블 권한 양쪽에서 막힙니다.
   --------------------------------------------------------------- */

/* 현재 보고 있는 강의 필터. null이면 아직 강의를 고르지 않아 선택 화면을 보여 줍니다.
   빈 문자열이면 전체입니다. */
let apFilter = null;
/* 상태 칩으로 거르는 값. 빈 문자열이면 전체입니다. */
let apStatus = "";

const AP_STATUS = {
  pending:   { cls: "wait",   label: "입금 대기" },
  paid:      { cls: "paid",   label: "입금 확인" },
  cancelled: { cls: "cancel", label: "취소" }
};

function apDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = n => String(n).padStart(2, "0");
  return d.getFullYear() + "." + p(d.getMonth() + 1) + "." + p(d.getDate())
    + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

/* 저장할 때 숫자만 남겨 두었으니 보여 줄 때 다시 하이픈을 넣습니다. */
function apPhone(v) {
  const s = String(v || "");
  if (s.length === 11) return s.slice(0, 3) + "-" + s.slice(3, 7) + "-" + s.slice(7);
  if (s.length === 10) return s.slice(0, 3) + "-" + s.slice(3, 6) + "-" + s.slice(6);
  return s;
}

/* 신청 완료 안내 문자 본문. 줌 링크는 공개 레포에 올리지 않고
   어드민 브라우저(localStorage)에만 저장해 씁니다.
   온라인(줌 링크 있음)이면 줌 안내 톤으로, 아니면 링크 없이 담백하게 나갑니다. */
function apSmsBody(it, link) {
  const ev = store.EVENTS_DB[it.event_id] || {};
  const name = it.name || "";
  const title = it.event_title || ev.title || "";
  const who = name ? name + " 원장님" : "원장님";

  /* 일시 옆에 붙는 진행 방식 라벨. */
  const fmtLabel = {
    online: "온라인 웨비나(줌)",
    hybrid: "온라인 + 오프라인",
    offline: ev.place || "오프라인",
    vod: "녹화본 제공"
  };
  const place = fmtLabel[ev.format] || (link ? "온라인 웨비나(줌)" : "");

  const greet = link
    ? who + ", “" + title + "” 신청이 확인됐어요. 아래 줌 링크 전달드립니다! "
    : who + ", “" + title + "” 신청이 확인됐어요.";

  const mid = [];
  if (ev.date) mid.push("📅 일시: " + ev.date + (place ? " | " + place : ""));
  if (link) mid.push("🔗 줌 참여 링크: " + link);

  const parts = ["[크래빗 아카데미] ", "", greet];
  if (mid.length) parts.push("", mid.join("\n"));
  parts.push("", "궁금한 점은 이 번호로 회신해 주세요.");
  return parts.join("\n");
}

/* 신청자 탭 첫 화면. 강의별 신청 현황을 카드로 보여 주고, 고르면 목록으로 들어갑니다. */
async function renderApplicationPicker(box) {
  box.innerHTML = '<div class="empty">불러오는 중이에요…</div>';
  let rows = [];
  try {
    rows = (await table("/academy_applications?select=event_id,event_title,status&limit=2000")) || [];
  } catch (e) {
    box.innerHTML = "";
    box.appendChild(el("div", "empty", "신청 현황을 불러오지 못했어요. " + (e.message || "")));
    return;
  }

  const byEv = {};
  rows.forEach(r => {
    const k = r.event_id || "unknown";
    const o = byEv[k] = byEv[k] || { title: r.event_title || k, total: 0, pending: 0, paid: 0, cancelled: 0 };
    o.total++;
    if (o[r.status] !== undefined) o[r.status]++;
  });

  /* 강의 목록: EVENTS_DB 전체 + 데이터에만 남아 있는 옛 강의. 최신 일정이 위로. */
  const ids = Object.keys(store.EVENTS_DB);
  Object.keys(byEv).forEach(id => { if (ids.indexOf(id) < 0) ids.push(id); });
  const dkey = id => {
    const d = store.EVENTS_DB[id];
    const m = String((d && (d.startDate || d.date)) || "").match(/(\d{4})[.\-\/]\s?(\d{1,2})[.\-\/]\s?(\d{1,2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : 0;
  };
  ids.sort((a, b) => dkey(b) - dkey(a));

  box.innerHTML = "";
  const bar = el("div", "ap-bar");
  bar.appendChild(el("div", null, "어느 강의의 신청자를 볼까요?"));
  bar.appendChild(el("div", "spacer"));
  const allBtn = el("button", "btn btn-secondary btn-sm", "전체 신청자 보기");
  allBtn.addEventListener("click", () => { apFilter = ""; renderApplications(); });
  bar.appendChild(allBtn);
  box.appendChild(bar);

  const grid = el("div", "ap-pick");
  ids.forEach(id => {
    const d = store.EVENTS_DB[id] || {};
    const c = byEv[id] || { total: 0, pending: 0, paid: 0, cancelled: 0 };
    const card = el("button", "pk");
    card.type = "button";
    card.appendChild(el("div", "pk-t", d.title || c.title || id));
    if (d.date) card.appendChild(el("div", "pk-n", d.date));
    const n = el("div", "pk-n");
    if (c.total) {
      n.appendChild(el("strong", null, "신청 " + c.total + "건"));
      n.appendChild(document.createTextNode("  |  대기 " + c.pending + "  |  확인 " + c.paid + "  |  취소 " + c.cancelled));
    } else {
      n.textContent = "아직 신청자가 없어요";
    }
    card.appendChild(n);
    card.addEventListener("click", () => { apFilter = id; apStatus = ""; renderApplications(); });
    grid.appendChild(card);
  });
  box.appendChild(grid);
  document.querySelector("#listCnt").textContent = rows.length ? "  전체 " + rows.length + "건" : "";
}

async function renderApplications() {
  const box = document.getElementById("list");
  document.querySelector("#listTitle").firstChild.textContent = "신청자";
  document.querySelector("#listCnt").textContent = "";
  if (apFilter === null) return renderApplicationPicker(box);
  box.innerHTML = '<div class="empty">불러오는 중이에요…</div>';

  let items = [];
  try {
    const cols = "id,created_at,event_id,event_title,event_fee,event_price,name,phone,email,org,source,message,status,paid_at,memo";
    const q = "/academy_applications?select=" + cols + "&order=created_at.desc&limit=500"
      + (apFilter ? "&event_id=eq." + encodeURIComponent(apFilter) : "")
      + (apStatus ? "&status=eq." + encodeURIComponent(apStatus) : "");
    items = (await table(q)) || [];
  } catch (e) {
    box.innerHTML = "";
    box.appendChild(el("div", "empty", "신청자를 불러오지 못했어요. " + (e.message || "")));
    return;
  }

  document.querySelector("#listCnt").textContent = items.length ? "  " + items.length + "건" : "";

  /* 무료 강의는 입금이라는 개념이 없어서 입금확인 버튼과 메모 칸을 걷어냅니다. */
  const evFree = !!apFilter && (store.EVENTS_DB[apFilter] || {}).priceType !== "paid";

  /* --- 강의 필터와 CSV 내보내기 --- */
  const bar = el("div", "ap-bar");
  const back = el("button", "btn btn-secondary btn-sm", "← 강의 선택");
  back.addEventListener("click", () => { apFilter = null; apStatus = ""; renderApplications(); });
  bar.appendChild(back);
  const sel = document.createElement("select");
  sel.appendChild(new Option("전체 강의", ""));
  Object.keys(store.EVENTS_DB).forEach(id => {
    sel.appendChild(new Option(store.EVENTS_DB[id].title || id, id));
  });
  sel.value = apFilter;
  sel.addEventListener("change", () => { apFilter = sel.value; renderApplications(); });
  bar.appendChild(sel);
  bar.appendChild(el("div", "spacer"));

  const csv = el("button", "btn btn-secondary btn-sm", "엑셀로 내려받기");
  csv.addEventListener("click", () => exportApplicationsCsv(items));
  bar.appendChild(csv);

  const refresh = el("button", "btn btn-secondary btn-sm", "새로고침");
  refresh.addEventListener("click", () => renderApplications());
  bar.appendChild(refresh);

  /* 특정 강의를 보고 있을 때만 문자 도구를 보여 줍니다. 전체 목록에서
     일괄 문자를 돌리면 다른 강의 신청자에게 엉뚱한 링크가 갈 수 있어서예요. */
  if (apFilter) {
    const zl = el("button", "btn btn-secondary btn-sm", "줌링크 설정");
    zl.title = "문자에 담을 줌 참여 링크를 이 브라우저에 저장해 둡니다";
    zl.addEventListener("click", () => {
      const KEY = "crabit_zoom_" + apFilter;
      const v = prompt("문자에 담을 줌 참여 링크를 넣어 주세요. 비우면 링크 없이 보냅니다.",
        localStorage.getItem(KEY) || "");
      if (v === null) return;
      if (v.trim()) localStorage.setItem(KEY, v.trim()); else localStorage.removeItem(KEY);
    });
    bar.appendChild(zl);

    const copyMsg = el("button", "btn btn-secondary btn-sm", "안내문 복사");
    copyMsg.addEventListener("click", () => {
      const sample = Object.assign({}, items[0] || { event_id: apFilter }, { name: "원장님" });
      navigator.clipboard.writeText(apSmsBody(sample, localStorage.getItem("crabit_zoom_" + apFilter) || ""))
        .then(() => alert("안내문을 복사했어요. 문자나 카톡에 붙여 넣어 쓰세요."));
    });
    bar.appendChild(copyMsg);

    const copyNums = el("button", "btn btn-secondary btn-sm", "연락처 복사");
    copyNums.title = "취소 제외 전원의 번호를 쉼표로 복사합니다";
    copyNums.addEventListener("click", () => {
      const nums = items.filter(i => i.status !== "cancelled" && i.phone).map(i => apPhone(i.phone));
      if (!nums.length) return alert("복사할 연락처가 없어요.");
      navigator.clipboard.writeText(nums.join(", "))
        .then(() => alert(nums.length + "명의 연락처를 복사했어요."));
    });
    bar.appendChild(copyNums);
  }

  /* --- 상태 칩 ---
     숫자만 보여 주는 게 아니라 누르면 그 상태만 걸러 줍니다.
     칩의 숫자는 지금 걸린 상태 필터와 무관하게 항상 전체 기준이라야
     "지금 대기가 몇 건인지"를 볼 수 있어서, 상태 필터가 걸려 있을 때는
     따로 세어 옵니다. */
  let cnt = { pending: 0, paid: 0, cancelled: 0 }, totalCnt = items.length;
  if (apStatus) {
    try {
      const all = await table("/academy_applications?select=status"
        + (apFilter ? "&event_id=eq." + encodeURIComponent(apFilter) : "")) || [];
      totalCnt = all.length;
      all.forEach(i => { cnt[i.status] = (cnt[i.status] || 0) + 1; });
    } catch (e) { /* 실패하면 아래 화면 기준으로 둡니다 */ }
  } else {
    items.forEach(i => { cnt[i.status] = (cnt[i.status] || 0) + 1; });
  }

  const sum = el("div", "ap-sum");
  (evFree
    ? [
        ["", "전체", totalCnt, "dot-all"],
        ["cancelled", "취소", cnt.cancelled, "dot-cancel"]
      ]
    : [
        ["", "전체", totalCnt, "dot-all"],
        ["pending", "입금 대기", cnt.pending, "dot-wait"],
        ["paid", "입금 확인", cnt.paid, "dot-paid"],
        ["cancelled", "취소", cnt.cancelled, "dot-cancel"]
      ]).forEach(([val, label, n, dot]) => {
    const c = el("button", "chip" + (apStatus === val ? " on" : ""));
    c.appendChild(el("span", "dot " + dot));
    c.appendChild(document.createTextNode(label));
    c.appendChild(el("strong", null, String(n)));
    c.addEventListener("click", () => { apStatus = val; renderApplications(); });
    sum.appendChild(c);
  });

  box.innerHTML = "";
  /* 필터와 상태 칩은 카드 밖에 둡니다. 흰 카드가 툴바까지 감싸면
     넓은 화면에서 버튼이 카드 끝으로 밀려 따로 노는 것처럼 보입니다. */
  box.appendChild(bar);
  box.appendChild(sum);

  /* 목록만 카드 한 장으로 감쌉니다. */
  const card = el("div", "list");
  box.appendChild(card);

  if (!items.length) {
    card.appendChild(el("div", "empty",
      (apStatus || apFilter) ? "이 조건에 맞는 신청자가 없어요." : "아직 신청자가 없어요."));
    return;
  }

  /* 목록은 표로 보여 줍니다. 줄을 누르면 상세가 열리고, 오른쪽 버튼은 제외합니다. */
  const wrap = el("div", "ap-tbl-wrap");
  const tbl = el("table", "ap-tbl");
  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  ["상태", "이름", "연락처", "이메일", "학원명과 직책", "유입 경로", "신청 일시"]
    .concat(evFree ? [] : ["메모"]).concat(["관리"]).forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  tbl.appendChild(thead);
  const tbody = document.createElement("tbody");

  items.forEach(it => {
    const tr = document.createElement("tr");
    tr.className = "is-click";
    tr.addEventListener("click", e => {
      if (e.target.closest(".ap-acts") || e.target.tagName === "BUTTON") return;
      openApplicantDetail(it);
    });
    const td = (v, cls) => {
      const c = document.createElement("td");
      if (cls) c.className = cls;
      if (v instanceof Node) c.appendChild(v); else c.textContent = v || "";
      tr.appendChild(c);
      return c;
    };

    const st = (evFree && it.status !== "cancelled")
      ? { cls: "paid", label: "신청 완료" }
      : (AP_STATUS[it.status] || AP_STATUS.pending);
    td(el("span", "badge " + st.cls, st.label));
    td(it.name || "(이름 없음)", "ap-td-name");
    td(apPhone(it.phone), "ap-td-num");
    td(it.email);
    td(it.org);
    td(it.source);
    td(apDate(it.created_at), "ap-td-num");
    if (!evFree) {
      /* 메모 칸은 좁게 자르고, 남긴 말까지 툴팁으로 보여 줍니다. */
      const memoTd = td(it.memo || "", "ap-td-memo");
      const tip = [it.message ? "남긴 말: " + it.message : "", it.memo ? "메모: " + it.memo : ""].filter(Boolean).join("\n");
      if (tip) memoTd.title = tip;
    }

    const acts = el("div", "ap-acts");
    const isPaid = it.status === "paid";
    const isCancelled = it.status === "cancelled";
    if (!evFree) {
      const toggle = el("button", "btn btn-sm " + (isPaid || isCancelled ? "btn-secondary" : "btn-primary"),
        isCancelled ? "취소 되돌리기" : (isPaid ? "대기로" : "입금 확인"));
      toggle.addEventListener("click", async () => {
        toggle.disabled = true;
        try {
          const next = isCancelled ? "pending" : (isPaid ? "pending" : "paid");
          await table("/academy_applications?id=eq." + it.id, {
            method: "PATCH",
            headers: { "Prefer": "return=minimal" },
            body: { status: next, paid_at: next === "paid" ? new Date().toISOString() : null }
          });
          renderApplications();
        } catch (e) {
          alert("변경하지 못했어요. " + (e.message || ""));
          toggle.disabled = false;
        }
      });
      acts.appendChild(toggle);
    } else if (isCancelled) {
      const undo = el("button", "btn btn-secondary btn-sm", "취소 되돌리기");
      undo.addEventListener("click", async () => {
        try {
          await table("/academy_applications?id=eq." + it.id, {
            method: "PATCH",
            headers: { "Prefer": "return=minimal" },
            body: { status: "pending", paid_at: null }
          });
          renderApplications();
        } catch (e) {
          alert("변경하지 못했어요. " + (e.message || ""));
        }
      });
      acts.appendChild(undo);
    }

    if (it.phone) {
      const sms = el("button", "btn btn-secondary btn-sm", "문자");
      sms.title = "메시지 앱을 열어 신청 완료 문자를 보냅니다. 문구는 클립보드에도 복사돼요.";
      sms.addEventListener("click", () => {
        const body = apSmsBody(it, localStorage.getItem("crabit_zoom_" + it.event_id) || "");
        try { navigator.clipboard.writeText(body); } catch (e) { /* 복사 실패해도 발송은 진행 */ }
        window.location.href = "sms:" + String(it.phone) + "&body=" + encodeURIComponent(body);
      });
      acts.appendChild(sms);
    }

    if (!evFree) {
      const memo = el("button", "btn btn-secondary btn-sm", "메모");
      memo.addEventListener("click", async () => {
        const v = prompt("메모를 남겨 주세요. 비우면 지워집니다.", it.memo || "");
        if (v === null) return;
        try {
          await table("/academy_applications?id=eq." + it.id, {
            method: "PATCH",
            headers: { "Prefer": "return=minimal" },
            body: { memo: v.trim().slice(0, 500) || null }
          });
          renderApplications();
        } catch (e) {
          alert("저장하지 못했어요. " + (e.message || ""));
        }
      });
      acts.appendChild(memo);
    }

    if (it.status !== "cancelled") {
      const cancel = el("button", "btn btn-danger btn-sm", "취소");
      cancel.addEventListener("click", async () => {
        if (!confirm(it.name + " 님의 신청을 취소 처리할까요?")) return;
        try {
          await table("/academy_applications?id=eq." + it.id, {
            method: "PATCH",
            headers: { "Prefer": "return=minimal" },
            body: { status: "cancelled", paid_at: null }
          });
          renderApplications();
        } catch (e) {
          alert("변경하지 못했어요. " + (e.message || ""));
        }
      });
      acts.appendChild(cancel);
    }

    td(acts, "ap-td-acts");
    tbody.appendChild(tr);
  });

  tbl.appendChild(tbody);
  wrap.appendChild(tbl);
  card.appendChild(wrap);
}

/* 엑셀에서 바로 열리도록 UTF-8 BOM을 붙입니다.
   BOM이 없으면 한글이 깨져서 나옵니다. */
function exportApplicationsCsv(items) {
  const cols = [
    ["신청일시", i => apDate(i.created_at)],
    ["상태", i => (AP_STATUS[i.status] || AP_STATUS.pending).label],
    ["이름", i => i.name],
    ["연락처", i => apPhone(i.phone)],
    ["이메일", i => i.email],
    ["학원명과 직책", i => i.org],
    ["강의", i => i.event_title || i.event_id],
    ["수강료", i => i.event_fee],
    ["참가 경로", i => i.source],
    ["문의사항", i => i.message],
    ["메모", i => i.memo],
    ["입금 확인 시각", i => apDate(i.paid_at)]
  ];
  const cell = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  const lines = [cols.map(c => cell(c[0])).join(",")]
    .concat(items.map(i => cols.map(c => cell(c[1](i))).join(",")));

  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "크래빗아카데미_신청자_" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------
   대시보드

   집계는 Supabase 뷰 두 개가 대신해 줍니다.
   - academy_event_stats : 강의별 조회수·신청·매출·전환율
   - academy_daily_stats : 최근 90일 일별 추이 (한국 시간 기준)

   차트는 외부 라이브러리 없이 인라인 SVG로 그립니다.
   이 어드민은 의존성이 하나도 없는 구조라 그걸 유지합니다.
   --------------------------------------------------------------- */

let dashRange = 30;      // 추이 차트 기간 (일)
let dashMetric = "applications";

/* 강의가 끝났는지 판단.
   같은 규칙이 assets/events.js 에도 있지만 그 파일은 어드민에서 스크립트로
   불러오지 않고 텍스트로만 읽어 값을 꺼내 씁니다. 그래서 함수는 못 씁니다.
   events.js 의 isEventOver 를 고치면 여기도 같이 맞춰 주세요. */
function dashEventOver(ev) {
  if (!ev || ev.status !== "upcoming") return true;
  const d = new Date();
  const today = d.getFullYear() + "-"
    + String(d.getMonth() + 1).padStart(2, "0") + "-"
    + String(d.getDate()).padStart(2, "0");
  return !!ev.startDate && ev.startDate < today;
}

const won = n => Number(n || 0).toLocaleString("ko-KR") + "원";
const num = n => Number(n || 0).toLocaleString("ko-KR");

/* 값을 부드러운 곡선(캣멀롬 -> 베지어) 패스로 그립니다. 값이 모두 0이면 바닥에 붙습니다.
   제어점 y는 위아래 여백 안으로 눌러서, 뾰족한 값에서 곡선이 바닥 아래로 파고들지 않게 합니다. */
function linePath(vals, w, h, pad) {
  if (!vals.length) return { line: "", area: "" };
  const max = Math.max(1, ...vals);
  const dx = vals.length > 1 ? (w - pad * 2) / (vals.length - 1) : 0;
  const pts = vals.map((v, i) => [pad + dx * i, h - pad - (v / max) * (h - pad * 2)]);
  const cy = v => Math.min(h - pad, Math.max(pad, v));
  let d = "M" + pts[0].map(n => n.toFixed(1)).join(" ");
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, cy(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, cy(p2[1] - (p3[1] - p1[1]) / 6)];
    d += " C" + [c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]].map(n => n.toFixed(1)).join(" ");
  }
  const first = pts[0], last = pts[pts.length - 1];
  return {
    line: d,
    area: d + " L" + last[0].toFixed(1) + " " + (h - pad) + " L" + first[0].toFixed(1) + " " + (h - pad) + " Z",
    max
  };
}

function trendChart(rows) {
  const slice = rows.slice(-dashRange);
  const vals = slice.map(r => Number(r[dashMetric] || 0));
  if (!slice.length || vals.every(v => v === 0)) {
    return '<div class="chart-empty">아직 쌓인 데이터가 없어요.<br />방문과 신청이 들어오면 여기에 그려집니다.</div>';
  }
  /* SVG는 가로로 늘어나며 그려지므로(preserveAspectRatio none) 글자를 SVG 안에
     넣으면 같이 늘어나 뭉개집니다. 라벨은 전부 HTML로 빼서 그립니다. */
  const W = 640, H = 190, P = 14;
  const { line, area, max } = linePath(vals, W, H, P);
  const ticks = [0, Math.floor(slice.length / 2), slice.length - 1];

  return '<div class="chart-wrap">'
    + '<div class="chart-max">최대 ' + (dashMetric === "revenue" ? won(max) : num(max)) + '</div>'
    + '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img">'
    + [0, 0.5, 1].map(f => {
        const y = P + (H - P * 2) * f;
        return '<line class="grid-line" x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '" stroke-dasharray="3 4" vector-effect="non-scaling-stroke" />';
      }).join("")
    + '<path d="' + area + '" fill="#FB75BB" fill-opacity="0.10" />'
    + '<path d="' + line + '" fill="none" stroke="#FB75BB" stroke-width="1.4" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round" />'
    + '</svg>'
    + '<div class="chart-x">'
    + ticks.map(i => '<span>' + String(slice[i].day).slice(5) + '</span>').join("")
    + '</div>'
    + '</div>';
}

async function renderDashboard() {
  const box = document.getElementById("list");
  document.querySelector("#listTitle").firstChild.textContent = "대시보드";
  document.querySelector("#listCnt").textContent = "";
  box.className = "";
  box.innerHTML = '<div class="empty">불러오는 중이에요…</div>';

  let stats = [], daily = [], recent = [];
  try {
    [stats, daily, recent] = await Promise.all([
      table("/academy_event_stats?select=*"),
      table("/academy_daily_stats?select=*&order=day.asc"),
      table("/academy_applications?select=name,org,status,created_at,event_title&order=created_at.desc&limit=5")
    ]);
    stats = stats || []; daily = daily || []; recent = recent || [];
  } catch (e) {
    box.innerHTML = "";
    box.appendChild(el("div", "empty", "대시보드를 불러오지 못했어요. " + (e.message || "")));
    return;
  }

  /* --- 합계 --- */
  const sum = k => stats.reduce((a, r) => a + Number(r[k] || 0), 0);
  const totalApp = sum("applications"), totalPaid = sum("paid"), totalPending = sum("pending");
  const totalViews = sum("views"), totalRevenue = sum("revenue");

  /* 이번 달 매출은 일별 뷰에서 이번 달치만 더합니다. */
  const ym = new Date().toISOString().slice(0, 7);
  const monthRevenue = daily.filter(d => String(d.day).slice(0, 7) === ym)
                            .reduce((a, d) => a + Number(d.revenue || 0), 0);

  /* 진행 예정 강의: 아직 안 지났고 신청 받는 중인 것 */
  const upcoming = Object.keys(store.EVENTS_DB)
    .filter(id => !dashEventOver(store.EVENTS_DB[id])).length;

  const conv = totalViews > 0 ? (totalApp * 100 / totalViews).toFixed(1) + "%" : "-";

  box.innerHTML = "";

  /* --- KPI 타일 --- */
  const kpis = el("div", "kpis");
  [
    ["입금 대기", num(totalPending), totalPending > 0 ? "확인 필요" : "없음", totalPending > 0],
    ["이번 달 매출", won(monthRevenue), "입금 확인 기준", false],
    ["누적 신청", num(totalApp), "입금 완료 " + num(totalPaid) + "건", false],
    ["진행 예정 강의", num(upcoming), "신청 받는 중", false],
    ["조회 대비 신청", conv, "조회 " + num(totalViews) + "회", false]
  ].forEach(([lab, val, sub, alert]) => {
    const c = el("div", "kpi" + (alert ? " alert" : ""));
    c.appendChild(el("div", "k-lab", lab));
    c.appendChild(el("div", "k-num", val));
    c.appendChild(el("div", "k-sub", sub));
    kpis.appendChild(c);
  });
  box.appendChild(kpis);

  const grid = el("div", "dash-grid");
  const left = el("div"), right = el("div");

  /* --- 추이 차트 --- */
  const trend = el("div", "panel-c");
  const th = el("div", "p-head");
  th.appendChild(el("div", "p-title", "추이"));
  const ctrl = el("div");
  ctrl.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  const mSeg = el("div", "seg-mini");
  [["applications", "신청"], ["views", "조회"], ["revenue", "매출"]].forEach(([k, lab]) => {
    const b = el("button", dashMetric === k ? "on" : null, lab);
    b.addEventListener("click", () => { dashMetric = k; renderDashboard(); });
    mSeg.appendChild(b);
  });
  const rSeg = el("div", "seg-mini");
  [[7, "7일"], [30, "30일"], [90, "90일"]].forEach(([d, lab]) => {
    const b = el("button", dashRange === d ? "on" : null, lab);
    b.addEventListener("click", () => { dashRange = d; renderDashboard(); });
    rSeg.appendChild(b);
  });
  ctrl.appendChild(mSeg); ctrl.appendChild(rSeg);
  th.appendChild(ctrl);
  trend.appendChild(th);
  const chartBox = el("div");
  chartBox.innerHTML = trendChart(daily);
  trend.appendChild(chartBox);
  left.appendChild(trend);

  /* --- 강의별 현황 --- */
  const ev = el("div", "panel-c");
  const eh = el("div", "p-head");
  eh.appendChild(el("div", "p-title", "강의별 현황"));
  ev.appendChild(eh);

  const withTitle = stats
    .map(r => ({ ...r, title: (store.EVENTS_DB[r.event_id] || {}).title || r.event_id }))
    .filter(r => r.views > 0 || r.applications > 0)
    .sort((a, b) => b.applications - a.applications || b.views - a.views)
    .slice(0, 8);

  if (!withTitle.length) {
    ev.appendChild(el("div", "chart-empty", "아직 조회나 신청이 없어요."));
  } else {
    const maxV = Math.max(1, ...withTitle.map(r => r.views));
    withTitle.forEach(r => {
      const row = el("div", "ev-row");
      row.appendChild(el("div", "ev-name", r.title));
      const bar = el("div", "ev-bar");
      const i = el("i"); i.style.width = Math.round(r.views / maxV * 100) + "%";
      bar.appendChild(i); row.appendChild(bar);
      row.appendChild(el("div", "ev-num",
        "조회 " + num(r.views) + " · 신청 " + num(r.applications)
        + (r.conversion_rate != null ? " (" + r.conversion_rate + "%)" : "")));
      ev.appendChild(row);
    });
  }
  left.appendChild(ev);

  /* --- 빠른 작업 --- */
  const q = el("div", "panel-c");
  q.appendChild(el("div", "p-title", "빠른 작업"));
  const ql = el("div", "quick");
  ql.style.marginTop = "8px";
  [
    ["events", "새 교육 등록", () => { goTab("events"); setTimeout(() => openEvent(null), 60); }],
    ["applications", "신청자 보기", () => goTab("applications")],
    ["resources", "자료 올리기", () => { goTab("resources"); setTimeout(() => openResource(null, false), 60); }]
  ].forEach(([ic, lab, fn]) => {
    const b = el("button");
    /* 사이드바에 이미 그려 둔 같은 아이콘을 그대로 복제해 씁니다.
       두 곳에서 모양이 어긋나는 일을 막으려는 것입니다. */
    const src = document.querySelector('.nav[data-tab="' + ic + '"] .ic');
    b.appendChild(src ? src.cloneNode(true) : el("span", "ic"));
    b.appendChild(document.createTextNode(lab));
    b.addEventListener("click", fn);
    ql.appendChild(b);
  });
  q.appendChild(ql);
  right.appendChild(q);

  /* --- 최근 신청자 --- */
  const rc = el("div", "panel-c");
  const rh = el("div", "p-head");
  rh.appendChild(el("div", "p-title", "최근 신청자"));
  const more = el("button", "btn btn-ghost btn-sm", "전체 보기");
  more.addEventListener("click", () => goTab("applications"));
  rh.appendChild(more);
  rc.appendChild(rh);

  if (!recent.length) {
    rc.appendChild(el("div", "chart-empty", "아직 신청자가 없어요."));
  } else {
    recent.forEach(r => {
      const row = el("div", "mini-row");
      const m = el("div", "mini-main");
      m.appendChild(el("div", "mini-t", r.name || "(이름 없음)"));
      m.appendChild(el("div", "mini-s",
        [r.org, r.event_title, apDate(r.created_at)].filter(Boolean).join(" · ")));
      row.appendChild(m);
      const st = AP_STATUS[r.status] || AP_STATUS.pending;
      row.appendChild(el("span", "badge " + st.cls, st.label));
      rc.appendChild(row);
    });
  }
  right.appendChild(rc);

  grid.appendChild(left); grid.appendChild(right);
  box.appendChild(grid);
}

/* ---------------------------------------------------------------
   알림톡 (솔라피 연결 예정)

   지금은 "언제 무엇을 보냈는지" 기록을 보여 주고, 발송 버튼 자리를
   잡아 두기만 합니다. 실제 발송은 솔라피 계정이 준비되면
   Edge Function 하나(send-alimtalk)를 얹어 붙입니다.

   버튼을 미리 만들어 두는 이유는, 붙일 때 화면을 다시 안 건드리려는 것입니다.
   Edge Function 이 생기면 sendAlimtalk() 안의 안내창만 실제 호출로 바꾸면 됩니다.
   --------------------------------------------------------------- */

/* 보낼 수 있는 알림 종류. 솔라피 템플릿 승인이 끝나면 templateId를 채웁니다. */
const NOTI_KINDS = [
  { kind: "apply_confirm", label: "접수 확인",  desc: "신청이 들어왔을 때 계좌와 함께 안내" },
  { kind: "payment_guide", label: "입금 안내",  desc: "입금 대기 중인 분에게만" },
  { kind: "reminder",      label: "수강 리마인드", desc: "강의 전날 장소와 준비물 안내" },
  { kind: "followup",      label: "자료 안내",  desc: "강의가 끝난 뒤 자료 링크" }
];

const NOTI_STATUS = {
  sent:    { cls: "paid",   label: "발송 완료" },
  pending: { cls: "wait",   label: "발송 중" },
  failed:  { cls: "cancel", label: "실패" }
};

async function loadNotifications(eventId, eventTitle) {
  const box = document.getElementById("notiBox");
  if (!box) return;

  let rows = [];
  try {
    rows = (await table("/academy_notifications?select=*&event_id=eq."
      + encodeURIComponent(eventId) + "&order=created_at.desc&limit=50")) || [];
  } catch (e) {
    box.innerHTML = "";
    /* 표를 아직 안 만들었으면 여기로 옵니다. 화면이 죽지 않게 안내만 합니다. */
    box.appendChild(el("div", "note",
      "알림톡 기록을 불러오지 못했어요. admin/supabase-notifications.sql 을 실행하셨는지 확인해 주세요."));
    return;
  }

  box.innerHTML = "";

  /* --- 발송 버튼 --- */
  const btns = el("div");
  btns.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px";
  NOTI_KINDS.forEach(k => {
    const b = el("button", "btn btn-secondary btn-sm", k.label + " 보내기");
    b.disabled = true;
    b.title = "솔라피 연결 후 사용할 수 있어요. " + k.desc;
    b.addEventListener("click", () => sendAlimtalk(eventId, eventTitle, k));
    btns.appendChild(b);
  });
  box.appendChild(btns);

  const note = el("div", "note");
  note.innerHTML = "<strong>아직 솔라피가 연결되지 않았어요.</strong> "
    + "버튼은 연결이 끝나면 바로 눌러서 쓸 수 있게 미리 만들어 둔 것입니다. "
    + "지금은 발송 기록만 보여 줍니다.";
  box.appendChild(note);

  /* --- 발송 이력 --- */
  if (!rows.length) {
    box.appendChild(el("div", "empty", "아직 보낸 알림톡이 없어요."));
    return;
  }

  const list = el("div");
  list.style.marginTop = "6px";
  rows.forEach(r => {
    const kind = (NOTI_KINDS.find(k => k.kind === r.kind) || {}).label || r.kind;
    const st = NOTI_STATUS[r.status] || NOTI_STATUS.pending;

    const row = el("div", "mini-row");
    const m = el("div", "mini-main");
    const t = el("div", "mini-t");
    t.appendChild(el("span", "badge " + st.cls, st.label));
    t.appendChild(document.createTextNode(kind));
    m.appendChild(t);

    const parts = [apDate(r.sent_at || r.created_at) + " 발송"];
    parts.push("대상 " + (r.target_count || 0) + "명");
    if (r.fail_count) parts.push("실패 " + r.fail_count + "건");
    m.appendChild(el("div", "mini-s", parts.join(" · ")));

    if (r.error_message) m.appendChild(el("div", "mini-s", "오류: " + r.error_message));
    if (r.message) {
      const msg = el("div", "ap-msg", r.message);
      msg.style.marginTop = "8px";
      m.appendChild(msg);
    }
    row.appendChild(m);
    list.appendChild(row);
  });
  box.appendChild(list);
}

/* 솔라피가 붙으면 이 함수 안만 바꾸면 됩니다.
   화면과 버튼은 이미 자리를 잡아 두었습니다. */
async function sendAlimtalk(eventId, eventTitle, kind) {
  alert("아직 솔라피가 연결되지 않았어요.\n\n"
    + "연결이 끝나면 이 버튼으로 '" + kind.label + "' 알림톡을 보낼 수 있습니다.\n"
    + "(" + kind.desc + ")");
}
