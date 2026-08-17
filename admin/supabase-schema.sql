-- =====================================================================
-- 크래빗 아카데미 강의 신청자 테이블
--
-- 프로젝트: 크래빗 아카데미 (ttolvlzubashyhdctbqr, 서울 ap-northeast-2)
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 한 번 실행하세요.
-- 두 번 실행해도 안전합니다.
--
-- 【이 파일이 지키려는 것】
-- 신청 폼은 공개 사이트에 있고 publishable 키도 공개돼 있습니다.
-- 그래서 "아무나 신청은 넣을 수 있지만, 아무도 남의 신청을 읽을 수 없다"를
-- 데이터베이스 차원에서 강제해야 합니다. 방어를 두 겹으로 겁니다.
--
--   1겹 grant : anon 에게 INSERT 권한만, 그것도 지정한 칼럼에만 줍니다.
--   2겹 RLS   : anon 에게 INSERT 정책만 만들고 SELECT 정책은 만들지 않습니다.
--
-- 둘 중 하나만 뚫려도 나머지가 막습니다.
-- 특히 status, paid_at, memo 는 anon 이 아예 쓸 수 없습니다.
-- 그래야 남이 자기 신청을 '입금 확인'으로 바꾸는 일이 불가능합니다.
-- =====================================================================

create table if not exists public.academy_applications (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),

  -- 어느 강의에 넣은 신청인지
  event_id     text not null,
  -- 신청 시점의 제목과 금액을 그대로 박아 둡니다.
  -- 나중에 강의 정보를 고쳐도 "그때 얼마로 신청했는지"가 남아야 하니까요.
  event_title  text,
  event_fee    text,
  event_price  integer,

  -- 신청자 정보
  name         text not null,
  phone        text not null,
  email        text,
  org          text,          -- 학원명과 직책
  source       text,          -- 참가 경로
  message      text,          -- 문의사항

  -- 개인정보 수집·이용 동의. 동의 없이는 행 자체가 안 만들어집니다.
  consent      boolean not null default false,

  -- 입금 관리. 여기부터는 관리자만 건드립니다.
  status       text not null default 'pending',
  paid_at      timestamptz,
  memo         text,

  constraint academy_applications_status_check
    check (status in ('pending', 'paid', 'cancelled')),
  constraint academy_applications_consent_check
    check (consent = true),
  -- 길이 제한을 DB에서도 겁니다. 브라우저 검증은 우회될 수 있으니까요.
  constraint academy_applications_len_check check (
    length(name) between 1 and 40
    and length(phone) between 9 and 11
    and (email is null or length(email) <= 120)
    and (org is null or length(org) <= 120)
    and (source is null or length(source) <= 120)
    and (message is null or length(message) <= 1000)
    and length(event_id) between 1 and 60
  ),
  -- 전화번호는 숫자만 저장합니다.
  constraint academy_applications_phone_digits check (phone ~ '^[0-9]+$')
);

create index if not exists academy_applications_event_created_idx
  on public.academy_applications (event_id, created_at desc);

create index if not exists academy_applications_status_idx
  on public.academy_applications (status);

-- 같은 강의에 같은 번호로 중복 신청하는 걸 막습니다.
-- 취소된 건은 다시 신청할 수 있어야 하므로 pending, paid 만 막아요.
create unique index if not exists academy_applications_dedupe_idx
  on public.academy_applications (event_id, phone)
  where status in ('pending', 'paid');

-- =====================================================================
-- 권한 (1겹)
-- =====================================================================
alter table public.academy_applications enable row level security;

-- 먼저 전부 회수하고 필요한 것만 다시 줍니다.
revoke all on table public.academy_applications from anon, authenticated;

-- anon 은 신청자가 직접 채우는 칼럼에만 INSERT 할 수 있습니다.
-- status, paid_at, memo, created_at, id 는 목록에 없으므로 건드릴 수 없습니다.
grant insert (
  event_id, event_title, event_fee, event_price,
  name, phone, email, org, source, message, consent
) on table public.academy_applications to anon;

-- 관리자(로그인한 사용자)는 읽고 고칠 수 있습니다.
grant select, update on table public.academy_applications to authenticated;

-- =====================================================================
-- RLS 정책 (2겹)
-- =====================================================================

-- 이전에 만든 정책이 남아 있으면 지웁니다.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'academy_applications'
  loop
    execute format('drop policy %I on public.academy_applications', p.policyname);
  end loop;
end $$;

-- anon 은 넣기만 됩니다. 동의했고 상태가 기본값일 때만 통과합니다.
create policy "anon can insert application"
  on public.academy_applications
  for insert to anon
  with check (consent = true and status = 'pending' and paid_at is null and memo is null);

-- anon 을 위한 select 정책은 일부러 만들지 않습니다.
-- 정책이 없으면 RLS가 전부 막습니다. 이 줄을 지우지 마세요.

-- 로그인한 관리자만 목록을 봅니다.
create policy "authenticated can read applications"
  on public.academy_applications
  for select to authenticated
  using (true);

create policy "authenticated can update applications"
  on public.academy_applications
  for update to authenticated
  using (true) with check (true);

comment on table public.academy_applications is
  '크래빗 아카데미 강의 신청자. 개인정보 포함. anon 은 INSERT만, 조회는 로그인 필요.';

-- =====================================================================
-- 확인용 (선택)
-- 아래를 실행하면 anon 에게 select 권한이 없다는 걸 눈으로 볼 수 있습니다.
-- 결과에 select 가 나오면 안 됩니다.
-- =====================================================================
-- select grantee, privilege_type, column_name
-- from information_schema.column_privileges
-- where table_name = 'academy_applications' and grantee = 'anon'
-- order by privilege_type, column_name;
