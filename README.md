# 크래빗 아카데미

크래빗 아카데미 홍보 사이트입니다. 크래빗과 올커니(올바른 교육 커뮤니티)의 교육 일정, 웨비나 다시보기, 강의 자료를 안내합니다.

- 배포 주소: https://craftyourhabit.github.io/crabit-academy/
- 배포 방식: GitHub Pages (main 브랜치에 푸시하면 1~2분 내 자동 반영)

## 페이지 구성

- 홈(`index.html`): 히어로 배너 → 예정 교육(EVENTS_DB의 upcoming 자동 표시) → 웨비나 다시보기 → 자료/인사이트
- 아카데미 소개(`about.html`): 인트로 타이틀 + 성장 공식 인터랙티브 루프(학생/원장님 토글, 자동 순환) + 마무리 선언문
- 예정 일정(`schedule.html`): 월간 캘린더. 일정 클릭 → 모달 → 상세페이지 이동
- 자료 · 인사이트(`resources.html`): 나브에서 직접 링크
- 행사 상세: `event.html?id=<키>`
- 제휴 업체 페이지는 보류 중 — 필요해지면 git 히스토리의 `partners.html`(커밋 a27538c)을 복원하면 됩니다
- 웨비나 다시보기는 Coming soon 상태 — 오픈하려면 `index.html`의 coming-soon 블록을 카드로 되돌리고, `webinars.html` 스크립트 하단의 주석대로 `renderTabs(); renderRows();`를 복원
- 대구 후속 자료: 미리보기(`daegu-followup.html`, 블러+비밀번호 모달, 비번 `daegu0709`) → 본문(`p/fa217da48e278217/`) = 유튜브 임베드(클릭 차단, youtube-nocookie, iframe pointer-events:none) + 핸드아웃 PDF(`handout.pdf`) 다운로드/미리보기. 영상 교체는 본문 index.html의 `VIDEO_ID` 수정
- 웨비나 다시보기(홈 섹션·콘텐츠 드롭다운)는 삭제됨 — 되살리려면 git 히스토리에서 `id="replay"` 섹션과 콘텐츠 드롭다운 nav를 복원

## 행사 상세페이지와 썸네일

모든 웨비나·강의·행사는 상세페이지가 있습니다: `event.html?id=<이벤트키>`

- 이벤트 정보는 전부 `assets/events.js`의 `EVENTS_DB`에서 관리합니다. 여기에 항목을 추가하면 상세페이지가 자동으로 생깁니다.
- 썸네일은 `assets/thumbs/<이벤트키>.svg`에 있습니다. 실제 이미지(jpg/png)로 바꾸려면 파일을 넣고 `events.js`의 `thumb` 경로만 수정하면 됩니다.
- 홈의 다시보기 카드, 월간 캘린더 일정(모달 경유), 전체보기 목록이 모두 상세페이지로 연결됩니다.

## 일정 수정하는 법

`assets/events.js` 맨 아래의 `SCHEDULE` 배열을 수정합니다. 월간 캘린더(schedule.html)에 자동 반영됩니다.

```js
const SCHEDULE = [
  { date: "2026-07-09", time: "10:00", id: "daegu-lecture" },
];
```

- `date`: `YYYY-MM-DD` / `time`: `HH:MM`
- `id`: `EVENTS_DB`의 키 — 제목·주최·썸네일·설명을 자동으로 가져오고, 클릭 시 모달과 상세페이지로 연결됩니다

## 전체보기 페이지 (공개)

- 웨비나 다시보기 전체: `webinars.html` — `assets/events.js`의 이벤트를 카테고리 탭(AI·자동화 / 학원 운영 / 마케팅·브랜딩 / 올커니)으로 필터링해 보여줍니다.
- 자료 / 인사이트 전체: `resources.html` — 파일 안의 `RESOURCES` 배열로 관리합니다. 카테고리 탭: 강의자료 / 가이드북 / 인사이트.

전체보기 자체는 비밀번호 없이 볼 수 있고, **일부공개(`access: "protected"`)로 설정된 항목을 클릭할 때만** 비밀번호 모달이 뜹니다.

### 인사이트: 원장님을 위한 클로드 코워크 (윈도우 설치 가이드)

- 페이지: `claude-code-windows.html` — 윈도우에서 클로드를 설치하는 방법을 한 단계씩 안내. 방법 A(데스크탑 앱, 터미널 없이) / 방법 B(PowerShell `irm https://claude.ai/install.ps1 | iex`) 두 경로를 다루고, 실제 claude.ai 스크린샷(`assets/guide/`)과 CSS로 재현한 PowerShell·클로드 코드·데스크탑 앱 화면을 함께 담았습니다. 2026년 7월 기준(채팅·코워크 통합 반영). 설치 명령/요건은 공식 문서 code.claude.com/docs 기준이라 버전이 바뀌면 갱신 필요.
- 노출: 홈(`index.html`) 자료/인사이트 섹션 + 전체보기(`resources.html`)의 `RESOURCES` 배열에 `인사이트`(공개) 항목으로 등록됨. 링크는 `claude-code-windows`(확장자 없이).
- 썸네일: `assets/thumbs/claude-cowork-windows.svg` (INSIGHT 라벨 + 터미널 모티프).

## 카카오톡 채널 행사 알림

행사·설명회 알림은 **카카오톡 채널 친구 추가 방식**으로 운영합니다. 사이트에는 백엔드가 없으므로, 알림 신청 = 채널 친구 추가이고 발송은 채널 관리자센터에서 직접 합니다.

### 사이트에 있는 알림 신청 버튼

- 예정 일정(`schedule.html`): 캘린더 아래 "카카오톡으로 일정 안내 알림받기" 버튼 하나. 누르면 채널 친구 추가 화면(`https://pf.kakao.com/_nutkG/friend`)이 열립니다.
- 채널이 바뀌면 이 버튼과 각 페이지 푸터의 채널 링크를 함께 수정하세요.

### 알림 보내는 법 (채널 관리자센터)

1. [카카오톡 채널 관리자센터](https://center-pf.kakao.com) 접속 → 크래빗 채널 선택
2. **메시지 → 메시지 작성**에서 행사 안내 작성 (이미지 + 행사 상세페이지 링크 `event.html?id=<키>` 첨부 권장)
3. 대상은 채널 친구 전체입니다. 즉시 발송 또는 **예약 발송**(예: 행사 전날 오전)을 설정
4. 발송량: 채널 메시지는 월 무료 발송량을 초과하면 유료입니다. 관리자센터의 발송량 안내를 확인하세요.

행사별 타겟 발송(신청자에게만)이 필요해지면 알림톡(전화번호 기반, 발송업체 연동 + 백엔드 필요)으로 확장해야 합니다.

## 별도 공유용 페이지 (사이트에서 링크되지 않음)

- `daegu-guide.html` — 대구 원장님 대상 강의 사전 준비가이드. 아카데미 어느 페이지에서도 링크하지 않은 독립 페이지라, 이 링크만 받은 분은 다른 페이지를 볼 수 없습니다. 추후 대구 강의 상세페이지에 연결 예정.

## 현재 비밀번호 목록

| 콘텐츠 | 비밀번호 | 경로 |
|---|---|---|
| [대구학원연합회] AI 마케터 고용하기 후속 자료 | `daegu0709` | 미리보기 `daegu-followup.html` → 본문 `p/fa217da48e278217/` |
| [올커니] 학원 홈페이지형 블로그 마스터 과정 강의자료 | `blog0718` | 미리보기 `blog-followup.html` → 본문 `p/613f8991d4d7111e/` (본문 내용 준비 중 — 강의 후 자료 업로드) |

## 비밀번호 자료 페이지 만드는 법

비밀번호의 SHA-256 해시 앞 16자리를 폴더 이름으로 사용합니다. 경로가 코드에 남지 않아, 비밀번호를 모르면 접근할 수 없습니다.

1. 비밀번호를 정하고 해시를 계산합니다.

   ```bash
   printf '%s' "비밀번호" | shasum -a 256 | cut -c1-16
   ```

2. `p/<해시16자리>/index.html`에 자료 페이지를 만듭니다. (기존 대구 강의 페이지를 복사해서 수정하면 됩니다)

3. `index.html`의 자료/인사이트 섹션에 항목을 추가합니다. `js-locked` 클래스가 있는 버튼이면 비밀번호 모달이 자동으로 연결됩니다.

   ```html
   <button class="res-row js-locked" type="button" data-title="자료 이름">
     ...
   </button>
   ```

주의: 해시된 경로도 레포가 public이면 GitHub에서 폴더 목록으로는 보입니다. 민감한 자료라면 레포를 private으로 전환해도 GitHub Pages 배포는 유지됩니다(조직 플랜에 따라 다름).

## 작업 규칙

`~/Desktop/CRABIT/브랜드가이드.md`를 따른다. 핵심:

- 배경 `#FFFFFF` / 텍스트 `#16192A` / 보조 텍스트 55% / 카드 배경 `#F9FAFC` / 보더 `#E8E8E8` / 다크 섹션 `#16192A`
- 브랜드 핑크 `#FB75BB`는 포인트 전용 (CTA 버튼은 다크가 기본)
- 폰트 Pretendard Variable, 굵기 최대 700
- 버튼: Primary 다크(hover `#333333`) / Secondary 흰 배경+보더(hover `#F0F0F0`) / Ghost는 hover 시 배경만 변경
- 이모티콘 사용 최소화
