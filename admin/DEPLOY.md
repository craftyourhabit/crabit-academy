# 어드민 배포 안내

크래빗 아카데미 관리자 페이지는 **Supabase 하나**로 돌아갑니다.
예전에는 Cloudflare Worker도 함께 썼지만 관리 대상을 줄이려고 전부 옮겼습니다.

## 구조

```
어머님 → admin.html
           │ Supabase Auth 로그인 (이메일과 비밀번호)
           ├─→ Edge Function 'github'  → 깃허브 커밋 → Pages 자동 배포
           └─→ academy_applications 테이블 (신청자 조회와 입금 확인)

신청자 → event.html 신청 폼 → academy_applications 테이블 (INSERT만)
```

레포가 public 이라 어드민 페이지에 깃허브 토큰을 넣으면 전 세계에 공개됩니다.
그래서 토큰은 Edge Function 시크릿에만 두고, 로그인한 사람의 요청만 넘겨 줍니다.

프로젝트: **크래빗 아카데미** (`ttolvlzubashyhdctbqr`, 서울 ap-northeast-2)

---

## 00. 준비물

- Supabase 계정 (프로젝트 접근 권한)
- 깃허브 계정 (crabit-academy 레포에 쓰기 권한)
- 터미널

---

## 01. 테이블 만들기

이미 하셨다면 넘어가세요.

1. Supabase 대시보드 → **SQL Editor**
2. `admin/supabase-schema.sql` 내용을 붙여넣고 **Run**

두 번 실행해도 안전합니다.

이 스키마는 anon(비로그인)에게 **INSERT 권한만, 그것도 지정한 칼럼에만** 줍니다.
`status`, `paid_at`, `memo` 는 아예 못 건드립니다. 조회는 RLS와 권한 양쪽에서 막힙니다.

---

## 02. 관리자 계정 만들기

1. Supabase 대시보드 → **Authentication → Users → Add user**
2. 이메일과 비밀번호를 넣습니다. **12자 이상**으로 정해 주세요
3. 쓰실 분마다 하나씩 만듭니다 (현지님, 어머님)

`Auto Confirm User` 를 켜 두면 메일 인증 없이 바로 로그인됩니다.

> 계정 삭제로 접근을 끊을 수 있습니다. 비밀번호를 잊으면 같은 화면에서 재설정하세요.

---

## 03. 깃허브 토큰 발급

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

## 04. Edge Function 배포

터미널에서 레포 폴더로 들어갑니다.

```bash
cd ~/Desktop/CRABIT/MKT/crabit-academy
```

Supabase에 로그인하고 프로젝트를 연결합니다.

```bash
npx supabase login
```

```bash
npx supabase link --project-ref ttolvlzubashyhdctbqr
```

시크릿 4개를 등록합니다. `GITHUB_TOKEN` 자리에 03에서 만든 토큰을 넣으세요.

```bash
npx supabase secrets set GITHUB_TOKEN=붙여넣기 GH_REPO=craftyourhabit/crabit-academy GH_BRANCH=main ALLOWED_ORIGIN=https://craftyourhabit.github.io
```

배포합니다.

```bash
npx supabase functions deploy github
```

> `SUPABASE_` 로 시작하는 이름은 예약어라 쓸 수 없어서 `GH_` 접두어를 씁니다.
> `SUPABASE_URL` 과 `SUPABASE_ANON_KEY` 는 Supabase가 자동으로 넣어 줍니다.

---

## 05. 확인

1. https://craftyourhabit.github.io/crabit-academy/admin.html 접속
2. 02에서 만든 이메일과 비밀번호로 로그인
3. 교육 목록이 뜨면 Edge Function이 깃허브를 잘 읽고 있는 것입니다
4. **신청자** 탭을 눌러 목록이 뜨는지 확인합니다

로그인은 되는데 목록이 안 뜨면 시크릿 이름과 깃허브 토큰 권한을 확인하세요.
함수 로그는 Supabase 대시보드 → Edge Functions → github → Logs 에서 봅니다.

---

## 06. Cloudflare Worker 정리

위 확인이 끝나면 예전 Worker는 필요 없습니다. 지우셔도 됩니다.

```bash
cd ~/Desktop/CRABIT/MKT/crabit-academy/admin && npx wrangler delete
```

지우고 나면 이 폴더의 `worker.js` 와 `wrangler.toml` 도 삭제하세요.
**확인이 끝나기 전에는 지우지 마세요.** 되돌릴 자리가 없어집니다.

---

## 07. 알아 두실 것

**로그인 유지 시간**
access token은 한 시간이면 만료되지만 자동으로 갱신됩니다.
저장 도중 끊기는 일은 없어요. 로그아웃을 누르면 완전히 끊깁니다.

**신청자 개인정보**
`academy_applications` 테이블에만 있고 깃허브에는 절대 올라가지 않습니다.
public 레포라 한 번 커밋되면 지우기 어렵기 때문입니다.
내려받으실 때는 어드민 신청자 탭의 **엑셀로 내려받기** 를 쓰세요.

**publishable 키**
`admin.html` 과 `event.html` 에 그대로 적혀 있습니다. 공개용이라 괜찮습니다.
다만 이 키가 안전한 이유는 테이블 권한과 RLS가 제대로 걸려 있기 때문입니다.
`supabase-schema.sql` 의 정책을 함부로 고치지 마세요.

**어드민이 건드릴 수 있는 경로**
Edge Function의 `ALLOWED_PATHS` 에 적힌 파일만 고칠 수 있습니다.
`.github/workflows` 같은 곳은 막혀 있어서, 세션이 새더라도 토큰을 빼내는
워크플로를 심는 일은 불가능합니다.
