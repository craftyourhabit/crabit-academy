/* ===============================================
   크래빗 아카데미 이벤트 데이터
   - 모든 웨비나와 강의, 행사의 정보를 여기서 관리합니다.
   - 상세페이지는 event?id=<키> 로 접근합니다.
   - thumb: 썸네일 경로 (사이트 루트 기준).
     실제 이미지로 교체하려면 같은 경로에 파일을 넣고
     경로만 바꾸면 됩니다. (jpg/png 가능)
   - status: "upcoming"(예정) | "closed"(마감) | "replay-soon"(다시보기 준비 중) | "replay"(다시보기 가능)
   - replayUrl: status가 "replay"일 때 영상 링크
   - kind: "교육" | "설명회" - 카드와 상세에서 상태 태그 왼쪽에 붙는 분류
   - category: 주제 분류. 학원 운영 | AI·자동화 | 마케팅·브랜딩 | 세무·노무
     이 네 가지 중 하나만 씁니다. 새 주제가 필요하면 여기 목록부터 늘리세요.
   - startDate: "YYYY-MM-DD" - 당일이면 '예정' 대신 '오늘'로 표시.
     날짜가 확정되지 않은 일정은 생략하면 됩니다.
   - speaker / assistant: 연사, 스페셜 조교 (상세 상단에 표시)
   - prep / audience: '이런 내용을 다뤄요' 콜아웃 안에 함께 들어갑니다.
   - format: "offline"(오프라인) | "online"(온라인) | "vod"(녹화본) | "hybrid"(동시 진행).
     생략하면 place 유무로 추정합니다.
   - onlineUrl: 줌 등 참여 링크. format이 online 또는 hybrid일 때만 씁니다.
     ★ 이 값은 공개 페이지에 절대 노출하지 않습니다. 링크를 아는 사람은
       누구나 들어올 수 있기 때문입니다. 신청하고 결제까지 마친 분에게만
       알림톡으로 따로 보냅니다.
   - provision: 서비스 제공 방식과 기간. 유료 강의에는 반드시 적습니다.
     전자상거래법상 제공 기간을 알려야 하고, 카카오페이 가맹 심사도
     상세페이지에서 이 항목을 확인합니다.
   - refundNote: 이 강의에만 적용되는 환불 안내. 생략하면 날짜 기준
     기본 문구가 나갑니다. 녹화본처럼 시작일이 없는 상품은 반드시 적습니다.
     날짜 기준 문구가 그대로 나가면 규정과 실제가 어긋나 분쟁이 생깁니다.
   - priceType: "free"(무료) | "paid"(유료). 생략하면 무료로 봅니다.
   - price: 수강료 숫자만 (예: 330000). priceType이 "paid"일 때만 씁니다.
     결제 연동(카카오페이 등)에 그대로 넘길 값이라 반드시 숫자로 둡니다.
     쉼표나 "원" 같은 글자를 넣으면 안 됩니다.
   - feeNote: 금액 아래에 붙는 짧은 부연 (예: "교재비와 다과 포함"). 선택 사항.
     "VAT 포함" 같은 조건도 여기에 적습니다.
   - fee: 예전에 쓰던 자유 입력 수강료 문구. 새로 쓰지 마세요.
     priceType과 price가 없을 때만 표시용으로 쓰입니다.
   - applyUrl: 비워 두는 것이 기본입니다.
     비워 두면 상세페이지 안의 신청 폼으로 직접 받습니다.
     공동 주최라 상대 쪽 폼으로 받아야 할 때만 그 주소를 넣으세요.
     주소를 넣으면 내장 폼 대신 그 링크로 보냅니다.

   입금 계좌는 이 파일에도 사이트에도 두지 않습니다.
   공개 레포라 검색에 노출되기 때문에, 계좌는 신청한 분에게만 따로 안내합니다.
   =============================================== */
/* @admin:EVENTS_DB:start - 이 줄과 아래 end 줄 사이는 어드민이 통째로 갈아 끼웁니다. 밖에 주석을 다세요. */
const EVENTS_DB = {
  "holic-time-0821": {
    type: "Lecture",
    category: "학원 운영",
    host: "한경아 × 올커니 × 매쓰홀릭",
    kind: "교육",
    title: "HOLIC TIME | 대형강의 전환 스토리와 2학기 내신대비 LIVE",
    date: "2026.08.21 (금) 오전 11시 유튜브 라이브 | 밤 10:30 줌 라이브",
    startDate: "2026-08-21",
    thumb: "assets/events/holic-time-0821/hero.jpg",
    format: "online",
    priceType: "free",
    provision: "참가비 없이 진행합니다. 신청폼을 제출하시면 참여 링크를 보내드려요. 오전 11시 유튜브 라이브는 올커니 조경이 대표가, 밤 10시 30분 줌 라이브는 한경아 이승현 부대표가 진행합니다. 두 시간대 중 편한 쪽으로 오시면 됩니다.",
    desc: "한경아와 올커니, 매쓰홀릭이 함께 여는 온라인 특강입니다. 1부는 1:1 개별진도를 접고 20명 대형강의로 학원 구조를 바꾼 원장님의 실제 전환 이야기를 듣고, 2부는 2학기 중간고사 내신대비 프로세스를 라이브로 풀어드립니다. 이론이 아니라 이번 중간고사에 바로 써먹을 수 있는 것만 다룹니다.",
    points: [
      "개별진도에서 대형강의로 수업 구조를 바꾸는 과정 듣기",
      "2학기 중간고사 내신대비 프로세스를 통째로 가져가기",
      "매쓰홀릭 프리미엄 8주 무상 체험으로 바로 적용해 보기"
    ],
    audience: "학원 원장님과 운영자",
    status: "upcoming",
    /* 매쓰홀릭 쪽 신청폼으로 함께 받는 행사라 우리 신청 페이지 대신 이 주소로 보낸다. */
    applyUrl: "https://matholic.typeform.com/to/ul982c0E",
    materialsTitle: "참여 혜택",
    materialsSub: "신청하고 참여하신 원장님께 드리는 혜택입니다.",
    materials: [
      { name: "매쓰홀릭 프리미엄 8주 무상 체험" },
      { name: "교재 제본 쿠폰 5만원", note: "1주차 미션 완료 시" },
      { name: "장학금 카드 5만원", note: "2주차 미션 완료 시" }
    ],
    curriculumIntro: {
      eyebrow: "한경아 × 올커니 × 매쓰홀릭이 함께 준비했습니다",
      question: "2학기 중간고사,\n무엇부터 준비하고 계신가요?",
      pains: [
        "잘 가르치려 할수록 선생님 시간만 사라지는 학원",
        "내신대비 교재를 매번 새로 만드느라 지치는 학원",
        "학생이 어디까지 했는지 확인할 방법이 마땅치 않은 학원"
      ]
    },
    sessions: [
      {
        no: "1부 특강",
        title: "내가 소수 개별진도를 버리고 대형강의로 갈아탄 이유",
        sub: "목동 개별첨삭학원에서 20명 대형강의 시스템까지, GQ 시스템 창업의 리얼 전환 스토리",
        speaker: "성공학원 원장님",
        points: [
          "1:1 티칭의 배신, 좋은 수업이 왜 잔소리 수업이 되는가",
          "에듀테크 전환, 선생님의 시간을 복제하는 방법",
          "GQ 시스템, GREAT QUESTION이 탄생한 이유",
          "20명 대형강의, 1인학원이 대형학원의 수익구조를 가져오는 법"
        ]
      },
      {
        no: "2부 라이브",
        title: "2학기 내신대비, 이것만 따라하면 무조건 성공한다",
        sub: "100점 만점 비결 핵심 토크와 신청 절차 안내",
        speaker: "올커니 조경이, 매쓰홀릭 이채은",
        points: [
          "어떤 교재를 만들어야 하는지",
          "학생들에게 어떻게 학습시켜야 하는지",
          "학습 현황을 어떻게 확인해야 하는지",
          "시험 직전까지 어떻게 끌고 가야 하는지"
        ]
      }
    ]
  },
  "math-academy-top1": {
    type: "Course",
    category: "학원 운영",
    host: "올커니",
    kind: "교육",
    title: "지역 1등 수학학원 만들기 프로젝트 (녹화본)",
    date: "온라인 강의 3회차 녹화본, 신청 후 바로 시청",
    thumb: "assets/events/math-academy-top1/hero.jpg",
    format: "vod",
    priceType: "paid",
    price: 90000,
    feeNote: "회차당 30,000원, 3회차 묶음입니다. 강의자료는 현장 참가자와 똑같이 전부 드려요.",
    provision: "결제를 마치시면 시청 페이지 주소와 비밀번호, 강의자료를 바로 보내드립니다. 결제하신 날부터 7일 동안 사이트에서 영상을 시청하실 수 있고, 같은 기간에 영상 파일을 내려받으실 수 있습니다. 받아두신 파일은 기간 제한 없이 보실 수 있어요. 8월 29일 오프라인 현장탐방은 녹화본에 포함되지 않습니다.",
    refundNote: "시청용 비밀번호를 받기 전까지는 전액 환불해 드립니다. 비밀번호를 받으신 뒤에는 영상 전체를 이미 보실 수 있는 상태라 환불이 어렵습니다.",
    desc: "AI 시대, 살아남는 학원이 아니라 선택받는 학원을 만드는 실전 프로젝트입니다. 4년 만에 지점 7개까지 늘린 올마이티캠퍼스 여호원 대표가 지역 1등 수학학원의 성장 시스템을 공개합니다. 온라인으로 진행한 3회차 강의를 녹화본으로 만나보세요. 오프라인 현장탐방은 포함되지 않지만, 제공 자료는 현장 참가자와 똑같이 전부 드립니다.",
    /* 상세 본문. 어드민에서 블록 단위로 쓴다.
       type: p(문단) | h(소제목) | ul(불릿) | quote(인용) | img(사진)
       글 안에서 **이렇게** 감싸면 굵게 나온다. */
    article: [
      { type: "h", icon: "target", text: "학원이 커질수록, 원장님 시간은 왜 더 줄어들까요" },
      { type: "p", text: "수업을 잘하면 학생이 늘고, 학생이 늘면 학원이 큰다고 배웠습니다. 그런데 막상 해보면 반대예요. 학생이 늘수록 원장님이 붙잡고 있어야 할 일이 같이 늘어납니다." },
      { type: "ul", items: [
        "상담도, 수업도, 관리도 결국 원장님이 마지막에 확인해야 끝난다",
        "선생님이 늘어도 기준이 없으니 매번 다시 설명하게 된다",
        "학생 수는 늘었는데 통장에 남는 돈은 그대로다"
      ] },
      { type: "p", text: "여호원 대표도 같은 자리에 있었습니다. 다른 점은 **사람을 더 쓰는 대신 시스템을 먼저 만들었다는 것**입니다. 4년 만에 지점 7개까지 늘리는 동안, 원장이 자리를 비워도 굴러가는 구조를 하나씩 세웠습니다." },
      { type: "quote", text: "잘 가르치는 것만으로\n지역 1등이 될 수 있을까요?" },
      { type: "h", icon: "gift", text: "이 강의에서 가져가시는 것" },
      { type: "p", text: "이론 강의가 아닙니다. 실제로 쓰고 있는 관리 시트와 체크리스트, 상담 스크립트를 그대로 드립니다. 3회차를 다 보시면 **우리 학원에 무엇부터 손대야 하는지**가 정리됩니다." },
      { type: "img", src: "assets/events/math-academy-top1/hero.jpg",
        alt: "지역 1등 수학학원 만들기 프로젝트 포스터",
        caption: "온라인으로 진행한 3회차 강의를 녹화본으로 만나보실 수 있어요." }
    ],
    points: [
      "AI가 바꾸는 학원의 미래와 원장의 역할 이해하기",
      "원장이 없어도 굴러가는 관리 시스템 만들기",
      "모집부터 상담까지 등록률을 높이는 구조 세우기"
    ],
    speaker: "여호원",
    speakerRole: "올마이티캠퍼스 대표, 서울대 쌍둥이",
    audience: "수학학원 원장님과 운영자",
    status: "upcoming",
    materials: [
      { name: "온라인 강의 3회차 녹화영상", note: "결제 후 7일간 시청, 기간 안에 내려받으면 계속 보실 수 있어요" },
      { name: "전 회차 강의자료", note: "현장 참가자와 동일하게 제공" },
      { name: "재무회계 엑셀시트" },
      { name: "평가보상시스템 엑셀시트" },
      { name: "강사 및 조교 업무 체크리스트" },
      { name: "학부모가 반응하는 유튜브 채널 주제 키워드 50개" },
      { name: "학부모 신뢰를 만드는 상담 스크립트" },
      { name: "AI 활용 수학문제 제작 프롬프트" }
    ],
    /* 커리큘럼은 이미지가 아니라 데이터로 둔다.
       이미지로 만들면 가로로 늘릴 때 글씨가 흐려지고, 화면 폭에 맞춰
       다시 짤 수도 없다. 글로 두면 어느 폭에서도 선명하고 검색도 된다.
       intro: 커리큘럼 맨 앞에 서는 도입 배너. */
    curriculumIntro: {
      eyebrow: "4년 만에 지점 7개까지 늘린 노하우 전격 공개",
      question: "잘 가르치는 것만으로\n지역 1등이 될 수 있을까요?",
      pains: [
        "수업은 잘하는데 성장이 멈춘 학원",
        "원장이 모든 일을 떠안고 있는 학원",
        "학생은 있는데 매출은 늘지 않는 학원"
      ]
    },
    sessions: [
      {
        no: "1강",
        title: "5년 뒤에도 살아남는 수학학원의 조건",
        sub: "AI가 바꾸는 학원의 미래와 원장의 역할",
        points: [
          "AI는 학원을 어떻게 바꾸고 있는가",
          "종이교재에서 AI 기반 디지털 학습으로",
          "디지털교과서 시대, 수학학원의 대응 전략",
          "AI를 활용한 학생 맞춤 학습관리 시스템",
          "AI 시대, 선생님의 역할은 어떻게 달라지는가",
          "학생보다 학부모가 먼저 선택하는 학원",
          "AI 시대에도 성장하는 학원의 공통점",
          "앞으로 없어질 학원과 살아남는 학원"
        ],
        gifts: ["강의안", "강사 업무 체크리스트", "조교 업무 체크리스트", "연간 설명회 주제 리스트", "온라인 학생관리 매뉴얼"]
      },
      {
        no: "2강",
        title: "원장이 없어도 성장하는 학원 시스템 벤치마킹",
        sub: "원장의 역할은 무엇이어야 하는가",
        points: [
          "지표 기반 관리 시스템 구축",
          "학생 관리 시스템",
          "강사 및 직원 관리 시스템",
          "평가 및 보상 시스템",
          "재무 및 회계 관리 시스템",
          "다수 지점 운영 관리 노하우",
          "운영 실적 월간 리뷰 및 성장 전략 수립",
          "질의응답 및 운영 고민 상담"
        ],
        gifts: ["강의자료", "재무회계 엑셀시트", "평가보상시스템 엑셀시트", "학생관리 체크리스트", "강사 및 관리자 성과평가 템플릿"]
      },
      {
        no: "3강",
        title: "모집부터 상담까지, 등록률을 높이는 성장 시스템",
        sub: "학생이 찾아오고 학부모가 등록하는 학원의 비밀",
        points: [
          "같은 수업인데 더 비싼 학원이 선택되는 이유",
          "우리 학원만의 차별화 포인트 만들기",
          "상담 문의를 늘리는 마케팅 전략",
          "설명회 하나로 등록을 만드는 구조",
          "블로그, 유튜브, SNS 운영 전략",
          "학부모가 공유하는 콘텐츠 만들기",
          "등록률을 높이는 상담 프로세스",
          "상담 후 등록으로 이어지는 관리법",
          "학부모 신뢰를 만드는 상담 스크립트"
        ],
        gifts: ["강의자료", "학부모가 반응하는 유튜브 채널 주제 키워드 50개", "상담 스크립트"]
      }
    ]
  },
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
      "상담과 안내, 피드백을 체계화하는 소통 프레임",
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
    audience: "학원 원장님과 운영자",
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
      "수업 준비와 행정 업무에 바로 쓰는 활용법",
      "혼자서도 확장할 수 있는 학습 로드맵"
    ],
    audience: "교사와 강사",
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
      "가이드북 1편과 2편, 마스터 시트 자료 제공"
    ],
    audience: "마케팅과 콘텐츠 담당자",
    status: "upcoming",
    replayUrl: ""
  },
  "daegu-lecture": {
    type: "Lecture",
    category: "AI·자동화",
    host: "크래빗",
    kind: "교육",
    title: "우리 학원만의 AI 마케터 고용하기",
    date: "2026.07.09 (목) 10:00 - 12:00",
    startDate: "2026-07-09",
    place: "대구학원연합회, 대구 달서구 상화북로 191, 6층",
    placeUrl: "https://naver.me/5vczvOjM",
    thumb: "assets/thumbs/daegu-lecture.jpg",
    desc: "콘텐츠 기획부터 카드뉴스까지, 원장님 대신 일하는 AI 마케터를 직접 구축하는 실습형 강의입니다. 콘텐츠 자동화 시스템을 구축해놓으시면, 매번 무엇을 어떻게 만들지 고민을 아끼실 수 있어요.",
    points: [
      "노션에 한 줄 적으면, AI가 콘텐츠 기획안으로 정리",
      "기획안만 있으면, AI가 학원 카드뉴스를 자동 제작",
      "완성된 결과물을 내 컴퓨터 폴더에 바로 저장",
      "코딩과 디자인 지식이 Zero여도 따라 할 수 있는 단계별 가이드"
    ],
    speaker: "김현지",
    speakerRole: "크래빗 장학카드 대표",
    prep: ["노트북", "Claude 유료 플랜 (최소 Pro)", "Notion 가입"],
    audience: "대구 지역 학원 원장님",
    provision: "참가비 없이 진행합니다. 신청서를 내시면 확정 안내를 보내드리고, 교육 당일 현장에서 실습 자료를 함께 드립니다.",
    status: "closed",
    replayUrl: ""
  },
  "homepage-blog-master": {
    type: "Course",
    category: "마케팅·브랜딩",
    host: "올커니",
    kind: "교육",
    title: "학원 홈페이지형 블로그 마스터 과정",
    date: "2026.07.18 (토) 10:00 - 17:00",
    startDate: "2026-07-18",
    place: "광명 GIDC, 경기도 광명시 일직로 43 C동 1715호 (한경아교육장)",
    thumb: "assets/events/homepage-blog-master/hero.jpg",
    desc: "홈페이지와 블로그, SNS를 하나로 연결하는 '홈페이지형 블로그'를 하루 만에 직접 완성하는 올커니 원데이 특강입니다. 검색에서 상담까지 이어지는, 우리 학원만의 평생 온라인 자산을 원장님이 직접 구축하고 이후에도 스스로 운영합니다.",
    /* 세션별 내용은 아래 sessions에서 다루므로, 여기에는 성과 중심으로만 적는다 */
    points: [
      "학부모가 검색해서 찾아오는 학원 온라인 자산 설계하기",
      "바이브 코딩으로 카드뉴스와 콘텐츠 제작 자동화하기",
      "홈페이지형 블로그를 그 자리에서 직접 구축하기",
      "수료 후 피드백 Zoom 강의 1회로 끝까지 완성하기"
    ],
    speaker: "MU 조연심, 크래빗 김현지, 캐다 최유정",
    assistant: "올커니 조경이, 캐다 최지호",
    prep: ["노트북", "학원 로고 이미지 파일 (PNG, JPG 등)"],
    audience: "학원 원장님과 운영자 (오프라인 25명 / 온라인 30명, 선착순)",
    provision: "참가비 없이 진행합니다. 신청서를 내시면 확정 안내와 준비물을 메일로 보내드리고, 교육 당일 현장에서 자료를 함께 드립니다.",
    status: "upcoming",
    applyUrl: "https://forms.gle/k6C2iuo5jSQXYL358",
    contact: { name: "조경이 대표", tel: "010-8394-0484" },
    /* 세션별 커리큘럼 - event.html의 커리큘럼 섹션에서 사용 */
    sessions: [
      {
        no: "01",
        title: "검색에서 선택까지, 학원 온라인 자산 전략",
        speaker: "조연심",
        speakerRole: "퍼스널브랜딩그룹 엠유(MU) 대표, AI 퍼스널 브랜딩 전문가",
        points: ["학부모가 선택하는 학원 브랜딩", "검색되는 기록이 신뢰가 되는 시대"],
        poster: "assets/events/homepage-blog-master/session-01.jpg"
      },
      {
        no: "02",
        title: "바이브 코딩으로 완성하는 콘텐츠 자동화",
        speaker: "김현지",
        speakerRole: "에듀핀테크 회사 크래빗(Crabit) 대표, 콘텐츠 자동화 시스템 구축 전문가",
        points: ["AI 활용 카드뉴스 자동 제작", "검색되는 블로그 키워드 찾는 방법"],
        poster: "assets/events/homepage-blog-master/session-02.jpg"
      },
      {
        no: "03",
        title: "온라인 자산이 되는 홈페이지형 블로그 만들기 실습",
        speaker: "최유정",
        speakerRole: "브랜드 콘텐츠 스튜디오 캐다(KEDA) 대표, 브랜드 디자인과 콘텐츠 기획자",
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
    /* '자세히 보기'로 펼쳐지는 카드뉴스 상세 - alt는 이미지 속 문구를 그대로 담아
       검색엔진과 스크린리더에서도 내용이 읽히게 합니다. */
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
  },
  "ai-ace-webinar": {
    type: "Webinar",
    category: "AI·자동화",
    host: "크래빗",
    kind: "설명회",
    title: "AI 적성진로 교육전문가(AI ACE) 과정 온라인 웨비나",
    date: "2026.09.03 (목) 오전 10:30 · 온라인 웨비나(줌)",
    startDate: "2026-09-03",
    thumb: "assets/events/ai-ace-webinar/hero.jpg?v=2",
    /* 일러스트 위 글자는 AI가 그린 글자 대신 실제 프리텐다드로 얹는다. assets/events.js 주석 규칙 참고. */
    coverOverlay: {
      theme: "navy",
      logo: "assets/events/ai-ace-webinar/aptimizer-logo.svg",
      shift: true,
      lines: [
        { text: "AI-ACE", size: "title" },
        { text: "적성진로", size: "title" },
        { text: "교육 전문가 과정", size: "title" }
      ]
    },
    format: "online",
    priceType: "free",
    provision: "참가비 없이 온라인 줌으로 진행합니다. 신청서를 제출하시면 웨비나 참여 링크를 신청하신 연락처로 따로 보내드려요.",
    desc: "요즘 상담실에서 학부모님들의 첫 질문이 달라지고 있습니다. \"성적 얼마나 올려주시나요\"에서 \"우리 아이가 뭘 잘하고, 어느 방향으로 가야 하나요\"로요. 고교학점제와 2028 대입 개편, 무전공 확대가 만든 이 흐름 속에서, 크래빗이 서울대학교 기술지주 자회사 앱티마이저의 AI 적성진로 교육전문가(AI ACE) 과정을 무료 웨비나로 먼저 소개해 드립니다.",
    article: [
      { type: "h", icon: "target", text: "학부모님의 첫 질문이 달라지고 있습니다" },
      { type: "p", text: "\"성적 얼마나 올려주시나요\"에서 \"우리 아이가 뭘 잘하고, 어느 방향으로 가야 하나요\"로. 이 변화는 우연이 아니라 ==제도가 만들어낸 흐름==입니다." },
      { type: "p", text: "고1부터 시작되는 **고교학점제**는 학생이 192학점을 직접 선택해 채우게 하고, **2028 대입 개편**은 학생이 진로·적성에 따라 이수한 교과 내역을 대학이 정면으로 평가하게 만듭니다. 여기에 **무전공(자유전공) 확대**까지 겹치면서, \"일찍 진로를 정하라\"는 신호와 \"전공 없이 뽑는다\"는 신호가 동시에 나와 학부모의 혼란은 커지고 있습니다." },
      { type: "quote", text: "\"성적 얼마나 올려주시나요\"에서\n\"우리 아이가 뭘 잘하고, 어느 방향으로 가야 하나요\"로" },
      { type: "h", icon: "bulb", text: "앱티핏(Aptifit), 감이 아니라 데이터로 답하는 상담" },
      { type: "p", text: "서울대학교 기술지주 자회사 앱티마이저가 개발한 AI 적성진단 서비스 **앱티핏(Aptifit)**은 ==약 20분 진단==으로 학생의 학습 성향과 강·약점을 분석하고, 적합한 전공과 학습 방향까지 제안합니다. 이 진단을 학원 상담에 실제로 접목하는 법을 배우는 과정이 바로 AI 적성진로교육전문가과정(AI ACE)입니다." },
      { type: "h", icon: "list", text: "웨비나는 이렇게 진행돼요" },
      { type: "table",
        head: ["구분", "주제", "주요 내용"],
        rows: [
          ["1부", "왜 지금 적성 기반 진로교육인가", "고교학점제와 2028 대입 개편, 무전공 확대가 만든 학원 상담의 변화"],
          ["2부", "앱티핏과 AI ACE 과정 소개", "약 20분 진단으로 강약점부터 적합 전공까지, 상담에 접목하는 방법"],
          ["3부", "먼저 도입한 학원들의 성과", "송파·판교, 광교, 대치동부터 전북 전주까지 실제 도입 사례"],
          ["4부", "정식과정 안내와 Q&A", "커리큘럼과 참가비, 수료 혜택 안내, 실시간 질의응답"]
        ] },
      { type: "p", text: "정식과정을 수료하면 ==멤버십 학원(AI 적성진로교육학원) 자격과 1년간 특별가격 도입 혜택==이 주어집니다. 우리 학원에 맞는 과정인지, 이 웨비나에서 먼저 확인해 보세요." },
      { type: "link", text: "이전 기수 진행 기사 보기", href: "https://news.unn.net/news/articleView.html?idxno=581840" }
    ],
    points: [
      "왜 지금 \"적성 기반 진로 상담\"이 학원 경쟁력인지",
      "앱티핏 AI 적성진단이 상담과 등록률을 바꾸는 원리",
      "송파·판교, 광교, 대치동까지 이어진 실제 도입 학원 성과",
      "9월 AI ACE 정식과정 커리큘럼과 수료 혜택 미리보기"
    ],
    speaker: "크래빗 아카데미팀",
    speakerRole: "AI ACE 과정 소개와 학원 도입 사례 공유",
    audience: "학원 원장님과 진로·적성 상담 담당자",
    status: "upcoming",
    contact: { name: "크래빗", tel: "010-5957-2483" },
    replayUrl: ""
  },
  "daegu-landing-lecture": {
    type: "Lecture",
    category: "AI·자동화",
    host: "크래빗",
    kind: "교육",
    title: "원장님이 직접 만드는 우리 학원 랜딩페이지",
    date: "2026.09.01 (화) 10:00 - 12:00",
    startDate: "2026-09-01",
    place: "대구학원연합회, 대구 달서구 상화북로 191, 6층",
    placeUrl: "https://naver.me/5vczvOjM",
    thumb: "assets/events/daegu-landing-lecture/hero.jpg?v=4",
    /* 일러스트 위 글자는 AI가 그린 글자 대신 실제 프리텐다드로 얹는다. */
    coverOverlay: {
      theme: "white",
      eyebrow: "실습 강의",
      lines: [
        { text: "원장님이", size: "mid" },
        { text: "직접 만드는", size: "mid" },
        { text: "우리 학원 랜딩페이지", size: "mid", accent: true }
      ]
    },
    format: "offline",
    priceType: "free",
    desc: "아직도 카드뉴스로만 학원을 홍보하고, 설명회 공지와 신청도 구글폼으로만 받고 계신가요? 이제는 AI를 활용해 원장님이 필요할 때마다 우리 학원만의 페이지를 직접 만들어 쓸 수 있습니다. 이번 강의에서는 젠스파크를 활용해 실제 우리 학원 랜딩페이지를 처음부터 끝까지 직접 만들어보는 실습을 진행합니다.",
    article: [
      { type: "h", icon: "target", text: "카드뉴스와 구글폼만으로 충분하셨나요" },
      { type: "p", text: "설명회 공지는 카드뉴스로, 신청은 구글폼으로. 여기까지가 익숙한 방식이었다면 이제 한 걸음 더 나아가 볼 차례입니다. AI를 활용하면 원장님이 필요할 때마다 우리 학원만의 페이지를 직접 만들어 쓸 수 있습니다." },
      { type: "quote", text: "노트북 하나만 가져오시면\n기획부터 디자인, 실제 페이지 제작까지\n직접 따라오실 수 있습니다" },
      { type: "h", icon: "bulb", text: "젠스파크로 직접 만드는 우리 학원 페이지" },
      { type: "p", text: "이번 강의에서는 AI 웹 제작 도구 **젠스파크(GenSpark)**를 활용해 실제 우리 학원 랜딩페이지를 처음부터 끝까지 직접 만들어보는 실습을 진행합니다. 코딩을 전혀 몰라도 괜찮습니다." },
      { type: "p", text: "예를 들어, 이런 페이지를 원장님이 직접 만들 수 있습니다." },
      { type: "ul", items: [
        "여름방학 특강 모집 페이지",
        "우리 학원 프로그램·커리큘럼 안내 페이지",
        "신규 학부모 상담 신청 페이지",
        "마켓데이·중간고사 응원 이벤트 페이지"
      ] },
      { type: "p", text: "당일 실습은 이 순서로 진행됩니다." },
      { type: "ul", items: [
        "우리 학원에 필요한 페이지 기획하기",
        "젠스파크로 디자인과 구성 잡기",
        "실제 페이지로 완성해서 바로 활용하기"
      ] },
      { type: "p", text: "글과 이미지를 AI로 만들어보신 적은 있어도, 원장님이 상상한 것을 직접 페이지로 구현해보신 적은 없으실 거예요. 이번엔 한 단계 더 나아가 보세요." }
    ],
    points: [
      "여름방학 특강 모집 페이지 직접 만들기",
      "우리 학원 프로그램·커리큘럼 안내 페이지 직접 만들기",
      "신규 학부모 상담 신청 페이지 직접 만들기",
      "마켓데이·중간고사 응원 이벤트 페이지 직접 만들기"
    ],
    speaker: "김현지",
    speakerRole: "크래빗 장학카드 대표",
    prep: ["노트북", "젠스파크 계정 (무료 계정으로도 테스트 가능)"],
    audience: "대구 지역 학원 원장님",
    provision: "참가비 없이 진행합니다. 신청서를 내시면 확정 안내를 보내드리고, 교육 당일 현장에서 실습 자료를 함께 드립니다.",
    status: "upcoming",
    replayUrl: ""
  }
};
/* @admin:EVENTS_DB:end */

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

/* 카드에 들어가는 소개 문구를 짧게 줄인다.
   desc는 상세 페이지 기준으로 길게 쓰기 때문에, 카드에 그대로 넣으면
   카드 하나만 길어져서 목록이 들쭉날쭉해진다.

   자를 때는 되도록 문장이 끝나는 자리를 찾는다. 말이 중간에 끊기면
   읽는 사람이 뒤에 뭐가 더 있나 싶어 답답해지기 때문이다.
   문장 끝을 못 찾으면 그때만 말줄임표를 붙인다. */
function cardDesc(text, max) {
  const s = String(text || "").trim();
  const limit = max || 100;
  if (s.length <= limit) return s;

  const cut = s.slice(0, limit);
  /* 마지막 마침표까지만 살린다. 너무 앞이면 한 문장도 안 되니 그때는 포기한다. */
  const dot = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"));
  if (dot >= 30) return cut.slice(0, dot + 1);

  const sp = cut.lastIndexOf(" ");
  return (sp > 30 ? cut.slice(0, sp) : cut).replace(/[,\s]+$/, "") + "…";
}

/* 카드와 상세가 공통으로 쓰는 상태 라벨. { text, cls } 반환. */
function eventStatusTag(ev) {
  if (isEventOver(ev)) return { text: "마감", cls: "closed" };
  return isEventToday(ev) ? { text: "오늘", cls: "today" } : { text: "예정", cls: "upcoming" };
}

/* 진행 방식을 한 곳에서 판단한다. { kind, label, isOnline, isOffline } 반환.
   format을 아직 안 정한 예전 데이터는 place 유무로 추정한다. */
function eventFormat(ev) {
  const f = ev.format || (ev.place ? "offline" : "online");
  const map = {
    /* vod 는 정해진 시각이 없다. 참여 링크 안내가 나가면 안 되므로 isOnline 을 켜지 않는다. */
    vod:     { kind: "vod",     label: "VOD",      isOffline: false, isOnline: false },
    offline: { kind: "offline", label: "오프라인", isOffline: true,  isOnline: false },
    online:  { kind: "online",  label: "온라인",   isOffline: false, isOnline: true  },
    hybrid:  { kind: "hybrid",  label: "오프라인 + 온라인 동시", isOffline: true, isOnline: true }
  };
  return map[f] || map.offline;
}

/* 수강료 정보를 한 곳에서 판단한다. { paid, amount, text, note } 반환.
   - paid: 유료 여부
   - amount: 숫자 금액. 결제 연동에 그대로 넘길 값이라 숫자로만 둔다.
   - text: 화면에 보여 줄 문구
   예전에 쓰던 자유 입력 fee 값도 계속 읽어 준다. 그 경우 amount는 없다. */
function eventPriceInfo(ev) {
  const amount = Number(ev.price);
  const note = ev.feeNote || "";

  if (ev.priceType === "paid" && Number.isFinite(amount) && amount > 0) {
    return { paid: true, incomplete: false, amount, text: amount.toLocaleString("ko-KR") + "원", note };
  }
  /* 유료로 정해 놓고 금액을 아직 안 넣은 상태.
     여기서 '무료'로 보여 주면 실제로 돈을 받는 강의가 무료로 나가 버린다.
     그래서 금액을 안내하지 않고 수강료 영역 자체를 감춘다. */
  if (ev.priceType === "paid") {
    return { paid: true, incomplete: true, amount: null, text: "", note };
  }
  /* priceType을 아직 안 정한 예전 데이터. fee 문구가 있으면 유료로 본다. */
  if (!ev.priceType && ev.fee) {
    return { paid: true, incomplete: false, amount: null, text: String(ev.fee), note };
  }
  return { paid: false, incomplete: false, amount: 0, text: "무료", note };
}

/* ===============================================
   예정 일정 (schedule.html 먼슬리 캘린더에서 사용)
   - id가 EVENTS_DB에 있으면 제목과 주최, 썸네일을 자동으로 가져옵니다.
   - date: YYYY-MM-DD / time: HH:MM
   =============================================== */
/* @admin:SCHEDULE:start */
const SCHEDULE = [
  { date: "2026-07-09", time: "10:00", id: "daegu-lecture" },
  { date: "2026-07-18", time: "10:00", id: "homepage-blog-master" },
  { date: "2026-09-03", time: "10:30", id: "ai-ace-webinar" },
  { date: "2026-09-01", time: "10:00", id: "daegu-landing-lecture" }
];
/* @admin:SCHEDULE:end */
