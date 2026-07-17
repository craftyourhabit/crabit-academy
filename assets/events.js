/* ===============================================
   크래빗 아카데미 이벤트 데이터
   - 모든 웨비나·강의·행사의 정보를 여기서 관리합니다.
   - 상세페이지는 event?id=<키> 로 접근합니다.
   - thumb: 썸네일 경로 (사이트 루트 기준).
     실제 이미지로 교체하려면 같은 경로에 파일을 넣고
     경로만 바꾸면 됩니다. (jpg/png 가능)
   - status: "upcoming"(예정) | "closed"(마감) | "replay-soon"(다시보기 준비 중) | "replay"(다시보기 가능)
   - replayUrl: status가 "replay"일 때 영상 링크
   - kind: "교육" | "설명회" — 카드·상세에서 상태 태그 왼쪽에 붙는 분류
   - startDate: "YYYY-MM-DD" — 당일이면 '예정' 대신 '오늘'로 표시.
     날짜가 확정되지 않은 일정은 생략하면 됩니다.
   - speaker / assistant: 연사, 스페셜 조교 (상세 상단에 표시)
   - prep / prepNote / audience: '이런 내용을 다뤄요' 콜아웃 안에 함께 들어갑니다.
   =============================================== */
const EVENTS_DB = {
  "parents-webinar": {
    type: "Webinar",
    category: "학원 운영",
    host: "크래빗",
    kind: "교육",
    title: "2026 학부모 소통전략 웨비나",
    date: "2026",
    thumb: "assets/thumbs/parents-webinar.svg",
    desc: "교육 기관의 신뢰는 소통에서 나옵니다. 학부모와의 소통을 체계화하는 전략과 실제 적용 사례를 다룬 온라인 웨비나입니다.",
    points: [
      "학부모 소통이 학원 신뢰에 미치는 영향",
      "상담·안내·피드백을 체계화하는 소통 프레임",
      "실제 교육 기관의 적용 사례"
    ],
    audience: "교육 기관 운영진",
    status: "replay-soon",
    replayUrl: ""
  },
  "landing-lecture": {
    type: "Lecture",
    category: "마케팅·브랜딩",
    host: "크래빗",
    kind: "교육",
    title: "우리 학원만의 랜딩페이지, 코딩 없이 한 번에 제작하기",
    date: "2026.05",
    thumb: "assets/thumbs/landing-lecture.svg",
    desc: "개발자 없이도 우리 기관을 소개하는 랜딩페이지를 직접 만들 수 있습니다. 기획부터 제작, 공개까지 한 번의 과정으로 완성하는 실습 강의입니다.",
    points: [
      "우리 학원의 강점을 담는 페이지 기획법",
      "코딩 없이 랜딩페이지를 만드는 실습",
      "만든 페이지를 실제로 공개하는 방법"
    ],
    audience: "학원 원장·운영자",
    status: "replay-soon",
    replayUrl: ""
  },
  "claude-code-teachers": {
    type: "Course",
    category: "AI·자동화",
    host: "크래빗",
    kind: "교육",
    title: "모두를 위한 클로드 코드 (Teachers Webinar)",
    date: "2026",
    thumb: "assets/thumbs/claude-code-teachers.svg",
    desc: "선생님과 교육 종사자를 위한 클로드 코드 입문 과정입니다. AI 도구가 처음이어도 수업 준비와 행정 업무에 바로 적용할 수 있게 안내합니다.",
    points: [
      "클로드 코드 설치부터 첫 실행까지",
      "수업 준비·행정 업무에 바로 쓰는 활용법",
      "혼자서도 확장할 수 있는 학습 로드맵"
    ],
    audience: "교사·강사",
    status: "replay-soon",
    replayUrl: ""
  },
  "cardnews-automation": {
    type: "Lecture",
    category: "AI·자동화",
    host: "크래빗",
    kind: "교육",
    title: "클로드 코드로 카드뉴스 자동화 에이전트 만들기",
    date: "2026.07.14 (화) 20:00",
    startDate: "2026-07-14",
    thumb: "assets/thumbs/cardnews-automation.svg",
    desc: "홍보 카드뉴스 제작을 AI 에이전트에게 맡기는 방법을 처음부터 끝까지 실습합니다. 기초 설계부터 자동화 운영까지 가이드북과 함께 진행합니다.",
    points: [
      "카드뉴스 AI 에이전트의 기초와 설계",
      "클로드 코드로 자동화 에이전트 만들기 실습",
      "가이드북 1·2편과 마스터 시트 자료 제공"
    ],
    audience: "마케팅·콘텐츠 담당자",
    status: "upcoming",
    replayUrl: ""
  },
  "daegu-lecture": {
    type: "Lecture",
    category: "AI·자동화",
    host: "크래빗",
    kind: "교육",
    title: "우리 학원만의 AI 마케터 고용하기",
    date: "2026.07.09 (목) 10:00 – 12:00",
    startDate: "2026-07-09",
    place: "대구학원연합회 · 대구 달서구 상화북로 191, 6층",
    placeUrl: "https://naver.me/5vczvOjM",
    thumb: "assets/thumbs/daegu-lecture.jpg",
    desc: "콘텐츠 기획부터 카드뉴스까지, 원장님 대신 일하는 AI 마케터를 직접 구축하는 실습형 강의입니다. 콘텐츠 자동화 시스템을 구축해놓으시면, 매번 무엇을 어떻게 만들지 고민을 아끼실 수 있어요.",
    points: [
      "노션에 한 줄 적으면, AI가 콘텐츠 기획안으로 정리",
      "기획안만 있으면, AI가 학원 카드뉴스를 자동 제작",
      "완성된 결과물을 내 컴퓨터 폴더에 바로 저장",
      "코딩·디자인 지식 Zero여도 따라 할 수 있는 단계별 가이드"
    ],
    speaker: "김현지",
    speakerRole: "크래빗 장학카드 대표",
    prep: ["노트북", "Claude 유료 플랜 (최소 Pro)", "Notion 가입"],
    audience: "대구 지역 학원 원장님",
    status: "closed",
    replayUrl: ""
  },
  "homepage-blog-master": {
    type: "Course",
    category: "마케팅·브랜딩",
    host: "올커니",
    kind: "교육",
    title: "학원 홈페이지형 블로그 마스터 과정",
    date: "2026.07.18 (토) 10:00 – 17:00",
    startDate: "2026-07-18",
    place: "광명 GIDC · 경기도 광명시 일직로 43 C동 1715호 (한경아교육장)",
    thumb: "assets/events/homepage-blog-master/hero.jpg",
    desc: "홈페이지 · 블로그 · SNS를 하나로 연결하는 '홈페이지형 블로그'를 하루 만에 직접 완성하는 올커니 원데이 특강입니다. 검색에서 상담까지 이어지는, 우리 학원만의 평생 온라인 자산을 원장님이 직접 구축하고 이후에도 스스로 운영합니다.",
    /* 세션별 내용은 아래 sessions에서 다루므로, 여기에는 성과 중심으로만 적는다 */
    points: [
      "학부모가 검색해서 찾아오는 학원 온라인 자산 설계하기",
      "바이브 코딩으로 카드뉴스·콘텐츠 제작 자동화하기",
      "홈페이지형 블로그를 그 자리에서 직접 구축하기",
      "수료 후 피드백 Zoom 강의 1회로 끝까지 완성하기"
    ],
    speaker: "MU 조연심 대표 · 크래빗 김현지 대표 · 캐다 최유정 대표",
    assistant: "올커니 조경이 대표 · 캐다 최지호 매니저",
    prep: ["노트북", "학원 로고 이미지 파일 (PNG·JPG 등)"],
    prepNote: "로고 파일이 있으시면 미리 노트북에 저장해 오시면 실습이 더 편합니다. 파일이 없으셔도 괜찮아요 — 로고 사진이나 텍스트만 있어도 AI로 함께 만들 수 있게 준비해두었습니다.",
    audience: "학원 원장·운영자 (오프라인 25명 / 온라인 30명, 선착순)",
    status: "upcoming",
    applyUrl: "https://forms.gle/k6C2iuo5jSQXYL358",
    contact: { name: "조경이 대표", tel: "010-8394-0484" },
    /* 세션별 커리큘럼 — event.html의 커리큘럼 섹션에서 사용 */
    sessions: [
      {
        no: "01",
        title: "검색에서 선택까지, 학원 온라인 자산 전략",
        speaker: "조연심",
        speakerRole: "퍼스널브랜딩그룹 엠유(MU) 대표 · AI 퍼스널 브랜딩 전문가",
        points: ["학부모가 선택하는 학원 브랜딩", "검색되는 기록이 신뢰가 되는 시대"],
        poster: "assets/events/homepage-blog-master/session-01.jpg"
      },
      {
        no: "02",
        title: "바이브 코딩으로 완성하는 콘텐츠 자동화",
        speaker: "김현지",
        speakerRole: "에듀핀테크 회사 크래빗(Crabit) 대표 · 콘텐츠 자동화 시스템 구축 전문가",
        points: ["AI 활용 카드뉴스 자동 제작", "검색되는 블로그 키워드 찾는 방법"],
        poster: "assets/events/homepage-blog-master/session-02.jpg"
      },
      {
        no: "03",
        title: "온라인 자산이 되는 홈페이지형 블로그 만들기 실습",
        speaker: "최유정",
        speakerRole: "브랜드 콘텐츠 스튜디오 캐다(KEDA) 대표 · 브랜드 디자인·콘텐츠 기획자",
        points: ["홈페이지형 블로그 구축 실습", "실무자를 위한 블로그 운영 시스템"],
        poster: "assets/events/homepage-blog-master/session-03.jpg"
      }
    ],
    /* 제공 자료 8종 */
    materials: [
      { name: "홈페이지형 블로그 템플릿 3종", note: "캔바 편집 링크 제공" },
      { name: "홈페이지형 블로그 템플릿별 위젯 코드북" },
      { name: "홈페이지형 블로그 설계 워크북" },
      { name: "홈페이지형 블로그 구축 가이드북" },
      { name: "학원 프로필 소개글 50선 레퍼런스북" },
      { name: "학원 블로그 콘텐츠 AI 프롬프트북" },
      { name: "학원 온라인 광고 교육청 가이드라인", note: "SNS 운영 시 필수 준수사항" },
      { name: "학원 온라인 콘텐츠 브리프", note: "실무자 전달용 기획서" }
    ],
    /* '자세히 보기'로 펼쳐지는 카드뉴스 상세 — alt는 이미지 속 문구를 그대로 담아
       검색엔진·스크린리더에서도 내용이 읽히게 합니다. */
    detailImages: [
      { src: "assets/events/homepage-blog-master/detail-01.jpg", alt: "혹시 지금 블로그 이런 모습인가요? 글만 계속 쌓이고 있다. 학원 소개가 한눈에 보이지 않는다. 홈페이지 대신 쓰기에는 부족하다. 상담까지 연결되지 않는다. 블로그 하나만 바꿔도 학원의 첫인상이 달라집니다." },
      { src: "assets/events/homepage-blog-master/detail-02.jpg", alt: "잘 만든 블로그 하나가 우리 학원의 온라인 허브가 됩니다. 홈페이지, 인스타그램, 유튜브, 카카오톡, 공지사항, 상담을 하나의 블로그에서 연결하는 '홈페이지형 블로그'를 직접 구축합니다." },
      { src: "assets/events/homepage-blog-master/detail-03.jpg", alt: "\"디자인은 할 줄 모르는데요.\" 걱정하지 않으셔도 됩니다. 모든 수강생분들께 홈페이지형 블로그 템플릿 3종 제공. 캔바 편집 링크 제공, 사진만 교체, 텍스트만 수정, 우리 학원 정보만 입력. 복잡한 디자인 작업은 필요 없습니다." },
      { src: "assets/events/homepage-blog-master/detail-04.jpg", alt: "\"코드? 위젯? 그런 건 전혀 모르는데요.\" 그래서 준비했습니다. 홈페이지형 블로그 위젯 코드북. 템플릿별 코드 제공, 링크만 교체, 복사 후 붙여넣기, 새창 열기 및 현재창 이동 버전 제공. 코드를 배우는 과정이 아니라 그대로 사용하는 자료입니다." },
      { src: "assets/events/homepage-blog-master/detail-05.jpg", alt: "\"우리 블로그도 괜찮은 것 같은데...\" 정말 그럴까요? 홈페이지형 블로그 설계 워크북으로 현재 블로그를 진단해보고 부족한 부분, 개선해야 할 부분, 반드시 추가해야 하는 요소를 직접 확인합니다." },
      { src: "assets/events/homepage-blog-master/detail-06.jpg", alt: "\"교육이 끝나면 혼자 다시 할 수 있을까요?\" 물론입니다! 홈페이지형 블로그 구축 가이드북을 수강생 전원에게 제공합니다. 처음부터 끝까지 순서대로 따라 하기만 하면 언제든 다시 구축할 수 있습니다." },
      { src: "assets/events/homepage-blog-master/detail-07.jpg", alt: "프로필 소개글 하나가 학원의 첫인상을 결정합니다. 무슨 말을 써야 할지 고민되셨나요? 그래서 학원 프로필 소개글 레퍼런스북을 제공합니다. 소개글 샘플 50선, AI 프롬프트 포함, 우리 학원 스타일에 맞게 수정 가능." },
      { src: "assets/events/homepage-blog-master/detail-08.jpg", alt: "\"블로그는 만들었는데 계속 운영할 시간이 없습니다.\" 그래서 준비했습니다. 학원 블로그 콘텐츠 AI 프롬프트북. 복사해서 붙여넣기만 하면 학원 소개, 학생 후기, 시험기간 콘텐츠, 설명회 모집, 방학특강, 학부모 콘텐츠까지 하루 10분이면 작성할 수 있습니다." },
      { src: "assets/events/homepage-blog-master/detail-09.jpg", alt: "혹시 알고 계셨나요? 학원 온라인 광고에는 교육청 광고 심의 기준과 반드시 표시해야 하는 내용이 있습니다. 잘못 운영하면 수정 요청이나 행정상 문제가 발생할 수도 있습니다. 그래서 최신 교육청 광고 가이드라인 자료도 함께 제공합니다." },
      { src: "assets/events/homepage-blog-master/detail-10.jpg", alt: "\"실무자가 들어야 하는 교육 아닌가요?\" 아닙니다. 원장님이 방향을 정하면 실무자는 실행하면 됩니다. 학원 온라인 콘텐츠 브리프를 원장님들께 제공합니다. 누구에게, 어떤 내용을, 왜 올리는지, 어떤 CTA를 넣을지 한 장으로 전달할 수 있는 실무자용 콘텐츠 기획서입니다." }
    ],
    replayUrl: ""
  },
  "allkeoni-meetup": {
    type: "Community",
    category: "올커니",
    host: "올커니",
    kind: "교육",
    title: "올커니 커뮤니티 모임",
    date: "2026.07.16 (목) 19:30",
    startDate: "2026-07-16",
    thumb: "assets/thumbs/allkeoni-meetup.svg",
    desc: "올바른 교육 커뮤니티, 올커니의 정기 모임입니다. 원장님들이 서로의 운영 노하우를 나누고 함께 성장하는 자리입니다.",
    points: [
      "원장님들의 학원 운영 노하우 공유",
      "올커니 교육과정 안내",
      "네트워킹과 교류"
    ],
    audience: "올커니 커뮤니티 멤버",
    status: "upcoming",
    replayUrl: ""
  }
};

/* ===============================================
   상태 태그 (예정 / 오늘 / 마감)
   - 접속한 사람의 현지 날짜를 기준으로 판단합니다.
   - startDate가 없는 일정은 '오늘'이 될 수 없습니다.
   =============================================== */
function todayStr() {
  const n = new Date();
  return n.getFullYear() + "-"
    + String(n.getMonth() + 1).padStart(2, "0") + "-"
    + String(n.getDate()).padStart(2, "0");
}

function isEventToday(ev) {
  return !!(ev && ev.startDate) && ev.startDate === todayStr();
}

/* 일정이 끝났는지 판단.
   status를 손으로 "closed"로 바꾸지 않아도, startDate가 지나면 자동으로 마감 처리한다.
   (안 그러면 교육 다음 날에도 '예정'으로 남아 신청을 받는 것처럼 보인다) */
function isEventOver(ev) {
  if (ev.status !== "upcoming") return true;
  return !!ev.startDate && ev.startDate < todayStr();
}

/* 카드·상세가 공통으로 쓰는 상태 라벨. { text, cls } 반환. */
function eventStatusTag(ev) {
  if (isEventOver(ev)) return { text: "마감", cls: "closed" };
  return isEventToday(ev) ? { text: "오늘", cls: "today" } : { text: "예정", cls: "upcoming" };
}

/* ===============================================
   예정 일정 (schedule.html 먼슬리 캘린더에서 사용)
   - id가 EVENTS_DB에 있으면 제목·주최·썸네일을 자동으로 가져옵니다.
   - date: YYYY-MM-DD / time: HH:MM
   =============================================== */
const SCHEDULE = [
  { date: "2026-07-09", time: "10:00", id: "daegu-lecture" },
  { date: "2026-07-18", time: "10:00", id: "homepage-blog-master" },
];
