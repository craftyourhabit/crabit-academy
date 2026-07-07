/* ===============================================
   크래빗 아카데미 이벤트 데이터
   - 모든 웨비나·강의·행사의 정보를 여기서 관리합니다.
   - 상세페이지는 event.html?id=<키> 로 접근합니다.
   - thumb: 썸네일 경로 (사이트 루트 기준).
     실제 이미지로 교체하려면 같은 경로에 파일을 넣고
     경로만 바꾸면 됩니다. (jpg/png 가능)
   - status: "upcoming"(예정) | "replay-soon"(다시보기 준비 중) | "replay"(다시보기 가능)
   - replayUrl: status가 "replay"일 때 영상 링크
   =============================================== */
const EVENTS_DB = {
  "parents-webinar": {
    type: "Webinar",
    category: "학원 운영",
    host: "크래빗",
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
    title: "클로드 코드로 카드뉴스 자동화 에이전트 만들기",
    date: "2026.07.14 (화) 20:00",
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
    title: "우리 학원만의 AI 마케터 고용하기",
    date: "2026.07.09 (목) 10:00 – 12:00",
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
    prep: ["노트북", "Claude 유료 플랜 (최소 Pro)", "Notion 가입", "Figma 가입"],
    audience: "대구 지역 학원 원장님",
    status: "upcoming",
    replayUrl: ""
  },
  "allkeoni-meetup": {
    type: "Community",
    category: "올커니",
    host: "올커니",
    title: "올커니 커뮤니티 모임",
    date: "2026.07.16 (목) 19:30",
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
   예정 일정 (schedule.html 먼슬리 캘린더에서 사용)
   - id가 EVENTS_DB에 있으면 제목·주최·썸네일을 자동으로 가져옵니다.
   - date: YYYY-MM-DD / time: HH:MM
   =============================================== */
const SCHEDULE = [
  { date: "2026-07-09", time: "10:00", id: "daegu-lecture" },
  { date: "2026-07-14", time: "20:00", id: "cardnews-automation" },
  { date: "2026-07-16", time: "19:30", id: "allkeoni-meetup" },
];
