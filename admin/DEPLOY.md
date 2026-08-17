# 어드민 배포 안내

크래빗 아카데미 관리자 페이지를 실제로 쓰려면 Cloudflare Worker 하나를 올려야 합니다.
한 번만 하면 되고, 비용은 들지 않아요. 전체 30분 정도 걸립니다.

## 왜 Worker가 필요한가

레포가 public 이라 어드민 페이지에 깃허브 토큰을 넣으면 전 세계에 공개됩니다.
Worker는 토큰을 자기 안에만 두고, 비밀번호로 로그인한 사람의 요청만 깃허브로 넘겨 줍니다.
데이터베이스도 서버도 아니고, 토큰을 감춰 주는 중계기입니다.

```
어머님 → admin.html (비밀번호 로그인) → Worker (토큰 보관) → 깃허브 커밋 → Pages 자동 배포
```

## 00. 준비물

- Cloudflare 계정 (무료)
- 깃허브 계정 (crabit-academy 레포에 쓰기 권한)
- 터미널

---

## 01. 깃허브 토큰 발급

1. https://github.com/settings/personal-access-tokens/new 접속
2. 아래대로 설정합니다.

| 항목 | 값 |
|---|---|
| Token name | `crabit-academy-admin` |
| Expiration | 1년 (달력에 갱신 일정을 적어 두세요) |
| Repository access | Only select repositories → `craftyourhabit/crabit-academy` |
| Permissions → Contents | **Read and write** |

3. 다른 권한은 켜지 마세요. Contents 하나면 충분합니다.
4. `Generate token` 을 누르고 나온 값을 복사해 둡니다. 이 화면을 벗어나면 다시 볼 수 없어요.

---

## 02. Worker 배포

터미널에서 이 폴더로 들어갑니다.

```bash
cd ~/Desktop/CRABIT/MKT/crabit-academy/admin
```

Cloudflare에 로그인합니다.

```bash
npx wrangler login
```

시크릿 3개를 등록합니다. 명령을 하나씩 실행하면 값을 물어봅니다.

```bash
npx wrangler secret put ADMIN_PASSWORD
```

어머님이 쓰실 로그인 비밀번호입니다. **12자 이상**으로 정해 주세요.
Worker에는 무차별 대입을 늦추는 지연만 있고 횟수 제한은 없으므로, 길이가 곧 보안입니다.

```bash
npx wrangler secret put GITHUB_TOKEN
```

01에서 만든 깃허브 토큰을 붙여 넣습니다.

```bash
npx wrangler secret put SESSION_SECRET
```

로그인 세션에 서명할 임의 문자열입니다. 아래 명령으로 만들어 붙여 넣으세요.

```bash
openssl rand -hex 32
```

이제 배포합니다.

```bash
npx wrangler deploy
```

성공하면 `https://crabit-academy-admin.<계정이름>.workers.dev` 같은 주소가 나옵니다.
이 주소를 복사해 두세요.

---

## 03. 어드민에 Worker 주소 넣기

`admin.html` 을 열어 `API` 값을 02에서 받은 실제 주소로 바꿉니다.

```js
const API = localStorage.getItem("crabit_admin_api") || "https://여기에-실제-주소.workers.dev";
```

그리고 커밋해서 올립니다.

```bash
cd ~/Desktop/CRABIT/MKT/crabit-academy
git add -A
git commit -m "어드민 페이지 추가"
git push
```

1~2분 뒤 아래 주소로 들어갈 수 있습니다.

```
https://craftyourhabit.github.io/crabit-academy/admin.html
```

---

## 04. 확인

1. 위 주소를 열어 비밀번호로 로그인합니다.
2. 교육 목록과 자료 목록이 뜨면 성공입니다.
3. 아무 항목이나 열어 제목 끝에 글자를 하나 넣고 저장한 뒤, 1~2분 뒤 사이트에서 바뀌었는지 봅니다.
4. 확인했으면 원래대로 되돌려 두세요.

---

## 05. 알아 두실 것

**저장하면 1~2분 뒤에 반영됩니다.** 깃허브에 커밋이 올라가고 GitHub Pages가 다시 배포하는 시간이에요.
바로 안 바뀐다고 여러 번 저장하지 않아도 됩니다.

**로그인은 12시간 유지됩니다.** 그 뒤에는 다시 비밀번호를 넣어야 해요.

**두 사람이 동시에 고치면** 나중에 저장한 쪽이 "다른 곳에서 먼저 수정됐어요" 안내를 받습니다.
덮어쓰지 않고 막아 주니, 새로고침한 뒤 다시 고치면 됩니다.

**어드민이 건드릴 수 있는 경로는 정해져 있습니다.** worker.js 의 `ALLOWED_PATHS` 에 있는
자료 파일과 이미지, 첨부 폴더뿐이에요. `.github/workflows` 같은 곳에는 쓸 수 없으므로,
설령 세션이 새더라도 토큰을 빼내는 코드를 심을 수는 없습니다.

**모든 변경은 깃 히스토리에 남습니다.** 실수로 지워도 복구할 수 있으니 알려 주세요.

---

## 06. 비용

| 항목 | 무료 한도 | 실제 사용량 |
|---|---|---|
| Cloudflare Workers | 하루 10만 요청 | 하루 수십 건 |
| GitHub Pages | 월 100GB 전송 | 훨씬 적음 |

무료 한도 안에서 충분히 돌아갑니다.

---

## 07. 토큰을 새로 발급해야 할 때

깃허브 토큰은 1년 뒤 만료됩니다. 만료되면 어드민에서 저장이 안 되고 "저장 실패" 가 뜹니다.
01번을 다시 해서 새 토큰을 만든 뒤 아래 명령만 실행하면 됩니다.

```bash
cd ~/Desktop/CRABIT/MKT/crabit-academy/admin && npx wrangler secret put GITHUB_TOKEN
```

## 08. 비밀번호를 바꾸고 싶을 때

```bash
cd ~/Desktop/CRABIT/MKT/crabit-academy/admin && npx wrangler secret put ADMIN_PASSWORD
```

바꾸면 기존 로그인 세션은 12시간 안에 자연히 끊깁니다. 즉시 끊으려면 `SESSION_SECRET` 도 함께 바꾸세요.
