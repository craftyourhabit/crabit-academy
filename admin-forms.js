/* =====================================================================
   크래빗 아카데미 어드민 - 편집 폼과 저장 로직
   admin.html 에서 불러 씁니다. (admin.html 의 도우미 함수들을 그대로 사용)
   ===================================================================== */

/* ---------------------------------------------------------------
   교육 / 설명회 편집
   --------------------------------------------------------------- */
function openEvent(id) {
  const isNew = !id;
  const src = isNew ? {} : store.EVENTS_DB[id];

  /* 폼이 다루는 값만 state 로 복사합니다. 고급 항목은 src 에 남겨 두고
     저장할 때 그대로 되돌려 넣습니다. */
  const state = {
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
    replayUrl: src.replayUrl || ""
  };
  /* 캘린더 등록 여부 */
  const sched = store.SCHEDULE.find(s => s.id === id);
  state.__onCalendar = !!sched;
  state.__time = sched ? sched.time : "10:00";

  const view = document.getElementById("editView");
  view.innerHTML = "";

  const head = el("div", "head-row");
  head.appendChild(el("h2", null, isNew ? "새 교육 / 설명회" : "교육 / 설명회 수정"));
  view.appendChild(head);

  /* 고급 항목이 붙어 있으면 알려 줍니다. */
  const adv = ADVANCED_KEYS.filter(k => src[k]);
  if (adv.length) {
    const names = { sessions: "커리큘럼", materials: "제공 자료", detailImages: "상세 이미지", contact: "문의처" };
    const n = el("div", "note");
    n.innerHTML = "<strong>" + adv.map(k => names[k]).join(", ") + "</strong> 이 등록돼 있어요. "
      + "이 화면에서는 수정할 수 없지만 저장해도 <strong>그대로 유지됩니다.</strong> 바꾸시려면 알려 주세요.";
    view.appendChild(n);
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

  /* 3. EVENTS_DB 갱신. 고급 항목은 원본에서 그대로 가져옵니다. */
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
  ADVANCED_KEYS.forEach(k => { if (prev[k]) next[k] = prev[k]; });
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
    /* 일부공개 상세페이지용 */
    password: "",
    intro: "",
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
  const pwIn = input("", "수강생에게 안내할 비밀번호");
  pwIn.addEventListener("input", async () => {
    state.password = pwIn.value.trim();
    pwPath.textContent = state.password
      ? "이 비밀번호를 넣으면 " + "p/" + (await sha256hex(state.password)).slice(0, 16) + "/ 로 들어갑니다."
      : "";
  });
  const pwWrap = field("비밀번호", pwIn, {
    hint: "비밀번호는 어디에도 저장되지 않아요. 이 글자로 자료 주소를 만들기 때문에, 잊으면 저도 찾아 드릴 수 없습니다."
  });
  const pwPath = el("div");
  pwPath.style.cssText = "font-size:13px;color:var(--muted);margin:-8px 0 18px";
  p2.appendChild(pwWrap);
  p2.appendChild(pwPath);

  const contentBox = el("div");
  const introIn = textarea("", "자료를 받는 분께 안내할 말을 적어 주세요. 엔터로 문단을 나눕니다.", 4);
  introIn.addEventListener("input", () => state.intro = introIn.value);
  contentBox.appendChild(field("안내 글", introIn));

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
        + "저장하면 비밀번호로 만든 주소에 자료 페이지가 함께 만들어집니다.";
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
  const paras = String(o.intro || "").split("\n").map(s => s.trim()).filter(Boolean)
    .map(s => "      <p>" + escapeHtml(s) + "</p>").join("\n");
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
    + (paras ? paras + "\n" : "")
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
    if (!state.password) throw new Error("일부공개 자료는 비밀번호를 정해 주세요.");
    if (state.password.length < 6) throw new Error("비밀번호는 6자 이상으로 정해 주세요.");
    const hash = (await sha256hex(state.password)).slice(0, 16);
    const dir = "p/" + hash + "/";

    /* 첨부파일 먼저 올립니다. */
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
      intro: state.intro,
      youtubeId: youtubeId(state.youtube),
      files: uploaded,
      links
    });
    /* 이미 있으면 덮어써야 하므로 sha를 먼저 확인합니다. */
    const cur = await gh.read(dir + "index.html");
    await gh.writeText(dir + "index.html", html, cur.exists ? cur.sha : null,
      "어드민: " + state.title + " 자료 페이지");
    href = "";   // 일부공개는 목록에서 비밀번호 모달을 띄웁니다.
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

/* 현재 보고 있는 강의 필터. 빈 문자열이면 전체입니다. */
let apFilter = "";
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

async function renderApplications() {
  const box = document.getElementById("list");
  document.querySelector("#listTitle").firstChild.textContent = "신청자";
  document.querySelector("#listCnt").textContent = "";
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

  /* --- 강의 필터와 CSV 내보내기 --- */
  const bar = el("div", "ap-bar");
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
  [
    ["", "전체", totalCnt, "dot-all"],
    ["pending", "입금 대기", cnt.pending, "dot-wait"],
    ["paid", "입금 확인", cnt.paid, "dot-paid"],
    ["cancelled", "취소", cnt.cancelled, "dot-cancel"]
  ].forEach(([val, label, n, dot]) => {
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

  items.forEach(it => {
    const row = el("div", "ap-row");
    const main = el("div", "ap-main");

    const st = AP_STATUS[it.status] || AP_STATUS.pending;
    const name = el("div", "ap-name");
    name.appendChild(el("span", "badge " + st.cls, st.label));
    name.appendChild(document.createTextNode(it.name || "(이름 없음)"));
    main.appendChild(name);

    const meta = [
      apPhone(it.phone),
      it.email,
      it.org,
      it.event_title || it.event_id,
      it.event_fee,
      apDate(it.created_at) + " 신청"
    ].filter(Boolean).join("  |  ");
    main.appendChild(el("div", "ap-meta", meta));

    if (it.source) main.appendChild(el("div", "ap-meta", "경로: " + it.source));
    if (it.message) main.appendChild(el("div", "ap-msg", it.message));
    if (it.memo) main.appendChild(el("div", "ap-msg", "메모: " + it.memo));

    row.appendChild(main);

    /* --- 입금 확인 토글과 메모 --- */
    const acts = el("div", "ap-acts");
    /* 취소된 건은 곧바로 '입금 확인'으로 넘기지 않습니다.
       취소를 되돌리는 건 '대기'로 돌아오는 것이지 돈이 들어온 게 아니니까요.
       대기 -> 입금 확인 -> 대기 는 서로 오갑니다. */
    const isPaid = it.status === "paid";
    const isCancelled = it.status === "cancelled";
    const toggle = el("button", "btn btn-sm " + (isPaid || isCancelled ? "btn-secondary" : "btn-primary"),
      isCancelled ? "취소 되돌리기" : (isPaid ? "대기로 되돌리기" : "입금 확인"));
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

    if (it.status !== "cancelled") {
      const cancel = el("button", "btn btn-danger btn-sm", "취소 처리");
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

    row.appendChild(acts);
    card.appendChild(row);
  });
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

/* 꺾은선 하나를 SVG 패스로 그립니다. 값이 모두 0이면 바닥에 붙습니다. */
function linePath(vals, w, h, pad) {
  if (!vals.length) return { line: "", area: "" };
  const max = Math.max(1, ...vals);
  const dx = vals.length > 1 ? (w - pad * 2) / (vals.length - 1) : 0;
  const pt = i => [pad + dx * i, h - pad - (vals[i] / max) * (h - pad * 2)];
  const d = vals.map((_, i) => (i ? "L" : "M") + pt(i).map(n => n.toFixed(1)).join(" ")).join(" ");
  const first = pt(0), last = pt(vals.length - 1);
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
  const W = 640, H = 210, P = 26;
  const { line, area, max } = linePath(vals, W, H, P);
  const ticks = [0, Math.floor(slice.length / 2), slice.length - 1];

  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img">'
    + [0, 0.5, 1].map(f => {
        const y = P + (H - P * 2) * f;
        return '<line class="grid-line" x1="' + P + '" y1="' + y + '" x2="' + (W - P) + '" y2="' + y + '" stroke-dasharray="3 4" />';
      }).join("")
    + '<path d="' + area + '" fill="#FB75BB" fill-opacity="0.12" />'
    + '<path d="' + line + '" fill="none" stroke="#FB75BB" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />'
    + ticks.map(i => {
        const x = P + ((W - P * 2) / Math.max(1, slice.length - 1)) * i;
        const anchor = i === 0 ? "start" : (i === slice.length - 1 ? "end" : "middle");
        return '<text class="axis-t" x="' + x + '" y="' + (H - 6) + '" text-anchor="' + anchor + '">'
          + String(slice[i].day).slice(5) + '</text>';
      }).join("")
    + '<text class="axis-t" x="' + P + '" y="' + (P - 8) + '">최대 '
      + (dashMetric === "revenue" ? won(max) : num(max)) + '</text>'
    + '</svg>';
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
