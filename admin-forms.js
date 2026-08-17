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

  const plc = input(state.place, "예: 광명 GIDC, 경기도 광명시 일직로 43 C동 1715호");
  plc.addEventListener("input", () => state.place = plc.value);
  p2.appendChild(field("장소", plc));
  const plcU = input(state.placeUrl, "예: https://naver.me/...", "url");
  plcU.addEventListener("input", () => state.placeUrl = plcU.value);
  p2.appendChild(field("장소 지도 링크", plcU, { hint: "네이버 지도 공유 링크를 넣으면 장소를 눌러 열 수 있어요." }));
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
    try { await api("/api/ping"); await enterApp(); return; } catch (e) { /* 아래에서 로그인 화면 */ }
  }
  showLogin();
})();
