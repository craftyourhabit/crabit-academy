/* ===============================================
   크래빗 아카데미 코스(강의 다시보기) 데이터
   - 코스 페이지는 course?id=<키> 로 접근합니다.
   - videoId: 유튜브 영상 ID 문자열 (예: "dQw4w9WgXcQ").
     null이면 "영상 준비 중" 플레이스홀더가 표시되고,
     ID를 넣는 순간 임베드 플레이어가 활성화됩니다.
   - lessons[].id 는 코스 안에서 고유해야 합니다.
     (localStorage 진도 체크의 키로 쓰입니다 — 바꾸면 수강생 진도가 초기화됩니다)
   =============================================== */
window.COURSES = {
  "homepage-blog-master": {
    title: "학원 홈페이지형 블로그 마스터 과정",
    date: "2026.07.18",
    sections: [
      {
        title: "검색에서 선택까지, 학원 온라인 자산 전략",
        instructor: "조연심 · 퍼스널브랜딩그룹 엠유(MU) 대표",
        lessons: [
          { id: "s1", title: "검색에서 선택까지, 학원 온라인 자산 전략 (풀강의)", duration: "1:07:17", videoId: "zoM-HDKK4CI" }
        ]
      },
      {
        title: "우리 학원만의 AI 마케터 고용하기",
        instructor: "김현지 · 크래빗 대표",
        lessons: [
          { id: "s2", title: "우리 학원만의 AI 마케터 고용하기 (풀강의)", duration: "54:55", videoId: "CoTD5erEp8g" }
        ]
      },
      {
        title: "온라인 자산이 되는 홈페이지형 블로그 만들기",
        instructor: "최유정 · 캐다(KEDA) 대표",
        lessons: [
          { id: "s3p1", title: "PART 1. 온라인 설계도 그리기 (STEP 1~4)", duration: "58:06", videoId: "cRRsFC_YpnQ" },
          { id: "s3p2", title: "PART 2. 홈페이지형 블로그 구축 실습 (STEP 5~6)", duration: "1:14:20", videoId: "at4Ih6o_bBQ" },
          { id: "s3p3", title: "PART 3. AI 블로그 콘텐츠 실습", duration: "준비 중", videoId: null }
        ]
      }
    ]
  }
};
