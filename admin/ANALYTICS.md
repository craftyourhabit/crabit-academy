# 크래빗 아카데미 성과 측정

아티클 조회수, UTM 유입, 아웃바운드 클릭(올커니 버튼 등)을 재서 어드민 "성과" 탭과 "UTM 링크" 탭에 보여 주는 구조입니다.

## 1. 왜 GA4 가 아니라 Supabase 인가

- 이 사이트에는 GA4 태그가 없습니다. 크래빗 GA4 속성 3개(학생앱, 티처스, craftyourhabit.com)에도 아카데미는 들어 있지 않아요.
- 이미 Supabase(ttolvlzubashyhdctbqr)에 조회수 기록(`academy_pageviews`)과 대시보드 뷰가 있고, 어드민 로그인도 Supabase Auth 입니다. 새 GA4 속성, 서비스계정 권한, Data API 를 붙이는 것보다 기존 구조를 넓히는 쪽이 움직이는 부품이 적습니다.
- 퍼널(인스타 유입, 아티클 조회, 올커니 클릭)을 같은 방문자 id 로 이어 세야 하는데, GA4 Data API 로는 방문자 단위 이어 붙이기가 번거롭고 1~2일 지연이 있어요. Supabase 는 SQL 한 번에 바로 나옵니다.
- 마케팅 어드민(crabit-mkt-admin)의 UTM 성과는 티처스 GA4 BigQuery 의 `first_visit` 만 봅니다. 아카데미 방문은 거기에 안 잡히니 중복 측정이 아닙니다.

## 2. 구조

```
방문자 브라우저
  assets/track.js  (페이지뷰 + data-track 클릭, localhost 는 콘솔만)
      │  POST text/plain JSON
      ▼
Edge Function track  (verify_jwt=false, 허용 사이트, 봇, 1분 120건 제한)
      │  service role
      ▼
academy_events 표  (anon 권한 없음)
      │  집계 함수 (security invoker, 로그인한 관리자만)
      ▼
admin.html  성과 탭 / UTM 링크 탭  (admin-analytics.js)
              └─ academy_utm_links 표 (링크 목록)
```

| 파일 | 하는 일 |
|---|---|
| `assets/track.js` | 페이지뷰, 아웃바운드 클릭 수집. 모든 공개 페이지에 붙어 있음 |
| `supabase/functions/track/index.ts` | 기록 접수, 검증, 도배 제한 후 저장 |
| `supabase/config.toml` | `[functions.track] verify_jwt = false` |
| `admin/supabase-analytics.sql` | 표 2개, 집계 함수 5개, 기존 대시보드 뷰 갱신 |
| `admin-analytics.js` | 성과 탭, UTM 링크 탭 화면 |
| `admin.html` | 사이드바 "마케팅" 그룹, 탭 연결 |
| `admin-forms.js` | 새 아티클(r/*.html) 생성 템플릿에 track.js 한 줄 추가 |

## 3. 배포 순서 (현지님이 할 일)

순서가 중요합니다. 사이트(track.js)를 먼저 올리면 함수가 없어서 그 사이 조회수가 비어요.

1. **SQL 실행**: Supabase 대시보드 > SQL Editor 에 `admin/supabase-analytics.sql` 전체를 붙여 넣고 실행. 두 번 실행해도 안전합니다.
   - 끝에 주석 처리된 확인 쿼리를 돌려 `academy_events` 에 anon 이 없는지 봅니다.
2. **시크릿 설정** (Supabase > Edge Functions > Secrets, 또는 CLI)
   ```
   npx supabase secrets set ALLOWED_ORIGIN=https://craftyourhabit.github.io TRACK_SALT=<아무 긴 무작위 문자열>
   ```
   - `ALLOWED_ORIGIN` 은 비밀 메일함과 같은 이름이라 이미 있으면 그대로 둡니다.
   - `TRACK_SALT` 는 한 번 정하면 바꾸지 않는 게 좋아요(바꾸면 그날 도배 제한 기준만 초기화되고, 집계에는 영향 없음).
3. **함수 배포**
   ```
   cd ~/Desktop/CRABIT/MKT/crabit-academy
   npx supabase functions deploy track
   ```
   - 확인: `curl -i -X POST https://ttolvlzubashyhdctbqr.supabase.co/functions/v1/track -H "Origin: https://craftyourhabit.github.io" -H "User-Agent: Mozilla/5.0" -d '{"type":"pageview","path":"/__deploy-check","visitor_id":"deploycheck000000"}'` 가 204 면 정상. 확인 줄은 SQL Editor 에서 `delete from academy_events where path = '/__deploy-check';` 로 지웁니다.
4. **사이트 반영**: 변경 파일을 커밋하고 push (GitHub Pages 1~2분).
5. **r/ai-tools-5.html** 은 다른 작업과 겹쳐 이번 변경에서 손대지 않았습니다. 아래 "6. 이번 편 적용" 을 보고 직접 넣어 주세요.
6. (일주일 뒤, 선택) 기록이 잘 쌓이면 SQL 파일 5번 구획의 주석을 풀어 옛 `academy_pageviews` 의 익명 쓰기를 닫습니다.

GA4 권한 작업은 필요 없습니다.

## 4. 이벤트 스키마 (`academy_events`)

| 칸 | 내용 |
|---|---|
| `type` | `pageview` 또는 `outbound` |
| `path` | 사이트 기준 경로. `.html` 과 `index` 를 뗌. 예: `/r/ai-tools-5`, `/resources`, `/` |
| `event_id` | 강의 상세(`/event?id=`)일 때 강의 키 |
| `label` | outbound 일 때 버튼 이름. `data-track` 값, 없으면 `outbound-link` |
| `target_host` | outbound 일 때 나간 곳 도메인 |
| `utm_source` ~ `utm_term` | 소문자로 통일. 지금 주소에 없으면 같은 탭에서 처음 들어올 때 값을 이어 씀 |
| `referrer_host` | 바깥에서 왔을 때 도메인만 |
| `visitor_id` | 브라우저 localStorage 의 무작위 24자 |
| `ip_hash` | 소금 + 날짜 + IP 해시 앞 32자. 도배 제한 전용 |
| `created_at` | 서버 시각 |

### 버튼에 측정 붙이기

```html
<a href="https://올커니-입장-주소" target="_blank" rel="noopener" data-track="outbound-olkeoni">올커니 입장하기</a>
```

- `data-track` 값은 영문 소문자, 숫자, `-`, `_` 만 씁니다. 퍼널 카드는 `outbound-olkeoni` 를 셉니다.
- 이름 없이 사이트 밖으로 나가는 링크도 `outbound-link` 로 자동 기록돼요.
- 스크립트에서 남기려면 `window.crabitTrack("outbound-olkeoni")`.

### 로컬 확인

- `localhost`, `127.0.0.1` 에서는 보내지 않고 콘솔에 `[track:mock] pageview {...}` 로만 찍습니다.
- 실제 사이트에서도 주소 끝에 `?track=mock` 을 붙이면 보내지 않습니다.
- 어드민 화면은 `http://localhost:4174/admin.html?mock=1&tab=analytics` (또는 `tab=utm`) 로 가짜 숫자를 넣어 볼 수 있어요. localhost 에서만 동작합니다.

## 5. 개인정보 원칙

- 이름, 연락처, 이메일, IP 원문, 쿠키는 저장하지 않습니다.
- 방문자 id 는 사람과 연결할 방법이 없는 무작위 값이고, 브라우저 저장소를 지우면 바뀝니다.
- IP 해시는 날마다 소금이 바뀌는 구조라 날짜를 넘어 같은 사람을 이어 붙일 수 없어요. 도배 제한에만 씁니다.
- 유입 주소는 도메인만 남깁니다. 검색어가 섞인 전체 URL 은 버립니다.
- 브라우저의 "추적 안 함(Do Not Track)" 설정은 존중해 기록하지 않습니다.
- `academy_events` 는 anon 권한이 전혀 없고, 로그인한 관리자만 읽습니다.
- 바뀐 점: 예전 track.js 는 방문자 id 를 남기지 않았습니다. 퍼널을 방문자 단위로 이어 세기 위해 무작위 id 를 추가했어요. 개인정보처리방침(policy.html)에 "서비스 이용 통계를 위한 익명 식별값" 한 줄을 넣을지 확인이 필요합니다.

## 6. 이번 편 적용 (칼퇴지킴이 01 AI 툴 5개)

| 어디 | source | medium | campaign | content |
|---|---|---|---|---|
| 인스타 캡션 속 아티클 링크 | instagram | social | ai-tools-5 | caption |
| 매니챗 DM 속 아티클 링크 | instagram | social | ai-tools-5 | manychat-dm |
| 아티클 안 올커니 버튼 | crabit-academy | article | ai-tools-5 | olkeoni-cta |

UTM 링크 탭 맨 위 버튼 3개가 이 값으로 채워 줍니다.

`r/ai-tools-5.html` 에 넣을 것:

1. 맨 아래 조회수 로더(`if (!/^(localhost|...)/.test(location.hostname)) { var s = ... track.js?v=202608191626 ... }`)를 지우고 `</script>` 뒤에 아래 한 줄로 바꿉니다. 지금 로더도 실제 사이트에서는 새 track.js 를 불러오지만, 캐시 버전이 옛 값이고 로컬 확인이 안 됩니다.
   ```html
   <script src="../assets/track.js?v=202610011800" defer></script>
   ```
2. 올커니 버튼에 `data-track="outbound-olkeoni"` 를 붙이고, href 는 UTM 링크 탭에서 만든 "아티클 안 올커니 버튼" 주소를 씁니다.

## 7. 마케팅 어드민 시트와 이중 관리 줄이기

마케팅 어드민(crabit-mkt-admin `/campaign`)은 링크를 KPI 시트 `UTM_Links` 탭에 두고, 성과는 티처스 GA4 BigQuery 에서 읽습니다. 아카데미 링크를 두 곳에 손으로 적으면 어긋나기 쉬워요. 제안은 단계별입니다.

1. **지금**: 아카데미 UTM 탭의 "시트용 복사" 로 `UTM_Links` 칸 순서(A 생성일 ~ H utmUrl)에 맞춘 줄을 복사해 붙입니다. `academy_utm_links` 칸 구성이 시트와 같아서 그대로 들어가요.
2. **다음**: 마케팅 어드민 `/api/utm` POST 가 baseUrl 이 `craftyourhabit.github.io/crabit-academy` 일 때 `academy_utm_links` 에도 한 줄 넣게 하거나, 반대로 이 탭이 저장할 때 Edge Function 하나가 시트에 append 하게 합니다. 시트 쓰기용 서비스계정(sheets-bot) 키는 함수 시크릿에 둡니다. `sheet_synced_at` 칸을 이 용도로 비워 뒀어요.
3. **장기**: 링크 저장소를 하나로 정합니다. 마케팅 어드민이 이미 "시트 유지"로 확정했으니 시트가 원본이 되고, 아카데미 탭은 시트를 읽기만 하는 쪽이 자연스럽습니다. 성과는 각자(티처스는 GA4, 아카데미는 Supabase) 같은 utm 조합 키로 조인하면 됩니다.

## 8. 알아 둘 한계

- 올커니 입장 수(오픈채팅 실제 입장)는 잴 수 없습니다. 버튼 클릭까지가 우리가 셀 수 있는 끝이에요.
- 인스타 앱 안 브라우저와 사파리는 탭마다 저장소가 따로라, 같은 분이 인스타로 보고 나중에 사파리로 다시 오면 두 명으로 잡힙니다.
- 같은 탭에서 같은 페이지를 다시 열면 페이지뷰를 한 번만 셉니다.
- 광고 차단기가 supabase.co 요청을 막으면 그 방문은 빠집니다.
