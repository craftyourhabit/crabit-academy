/* ===============================================
   자료 / 인사이트 데이터

   이 파일은 어드민(admin.html)이 자동으로 고쳐 씁니다.
   손으로 고쳐도 되지만 아래 형식을 지켜 주세요.

   - id       고유 키. 중복되면 안 됩니다.
   - category "강의자료" | "가이드북" | "인사이트"
   - title    제목
   - sub      한 줄 설명
   - thumb    썸네일 경로 (사이트 루트 기준)
   - access   "public"    공개 - 누구나 바로 열람
              "protected" 일부공개 - 비밀번호를 아는 사람만 열람
              "soon"      공개 예정 - 목록에는 보이지만 클릭 불가
   - href     이동할 경로. 비워 두면 비밀번호 모달이 뜹니다.

   비공개(private) 항목은 이 파일에 들어오지 않습니다.
   assets/resources-private.js 에 따로 보관하고, 사이트는 그 파일을
   불러오지 않으므로 방문자에게는 존재 자체가 보이지 않습니다.
   =============================================== */
/* @admin:RESOURCES:start - 이 줄과 아래 end 줄 사이는 어드민이 통째로 갈아 끼웁니다. */
const RESOURCES = [
  {
    id: "blog-followup",
    category: "강의자료",
    title: "학원 홈페이지형 블로그 마스터 과정 후속 자료",
    sub: "강의 실습 프롬프트, 템플릿, 워크북, 가이드북 등 전체 자료를 전달",
    thumb: "assets/thumbs/blog-master-followup.svg",
    access: "protected",
    href: "blog-followup"
  },
  {
    id: "daegu-followup",
    category: "강의자료",
    title: "[대구학원연합회] 우리 학원만의 AI 마케터 고용하기 후속 자료",
    sub: "강의 자료, 프롬프트 모음집, 핵심 자료 파일 전부 전달",
    thumb: "assets/thumbs/ai-marketer-followup.svg",
    access: "protected",
    href: "daegu-followup"
  },
  {
    id: "claude-code-windows",
    category: "인사이트",
    title: "원장님을 위한 클로드 코워크 시작하기 - 설치 가이드",
    sub: "가장 강력한 AI 도구 클로드 코워크, 맥과 윈도우 설치가 막막하셨다면 화면 그대로 한 단계씩",
    thumb: "assets/thumbs/claude-cowork-windows.svg",
    access: "public",
    href: "claude-code-windows"
  },
  {
    id: "daegu-prompts30",
    category: "강의자료",
    title: "학원에서 필요한 랜딩페이지 아이디어 30선 + 프롬프트집",
    sub: "모집, 상담, 수업, 관리까지 학원 운영 전 영역의 랜딩페이지 프롬프트 30개",
    thumb: "assets/thumbs/daegu-prompts30.svg",
    access: "protected",
    href: ""
  },
  {
    id: "daegu-prompts3",
    category: "강의자료",
    title: "바이브코딩으로 우리 학원 랜딩페이지 제작 프롬프트 3종",
    sub: "설명회 모집, 오늘의 수업 퀴즈, 학생 학습리포트. 복사해서 붙여넣으면 완성되는 실전 프롬프트",
    thumb: "assets/thumbs/daegu-prompts3.svg",
    access: "public",
    href: "daegu-prompts"
  }
];
/* @admin:RESOURCES:end */

/* 자료 카드에 붙는 공개 상태 배지. index.html과 resources.html이 함께 씁니다. */
function resourceBadge(r) {
  if (r.access === "protected") return { text: "일부공개", cls: "locked" };
  if (r.access === "soon") return { text: "공개 예정", cls: "soon" };
  return { text: "공개", cls: "open" };
}

/* 사이트에 노출할 항목만 반환.
   비공개 항목은 애초에 이 파일에 없지만, 혹시 섞여 들어와도 여기서 한 번 더 걸러집니다. */
function visibleResources() {
  /* 최근에 추가한 자료가 먼저 보이도록 역순으로 반환합니다 (배열 끝 = 최신). */
  return RESOURCES.filter(r => r.access !== "private").slice().reverse();
}
