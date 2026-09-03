-- =====================================================================
-- 크래빗 아카데미 - 신청자에게 나간 안내(문자·알림톡) 기록
--
-- 프로젝트: 크래빗 아카데미 (ttolvlzubashyhdctbqr, 서울 ap-northeast-2)
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 한 번 실행하세요.
-- 두 번 실행해도 안전합니다.
--
-- 왜 필요한가: "누구에게 언제 어떤 문자를 보냈는지"를 남겨,
-- 상세 화면에서 확인하고 중복 발송을 피하기 위해서입니다.
-- 이 표에는 개인정보(번호·문구)가 들어가므로, anon 은 아무 권한도 없습니다.
-- 로그인한 관리자만 읽고 쓸 수 있습니다.
-- =====================================================================

create table if not exists public.academy_messages (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),

  -- 어느 신청 건에 보냈는지 (신청이 지워지면 함께 정리)
  application_id uuid references public.academy_applications(id) on delete cascade,
  event_id       text,

  phone          text,
  channel        text not null default 'sms',   -- 'sms' 또는 'alimtalk'
  text           text,                          -- 실제로 보낸 내용
  status         text not null default 'ok',    -- 'ok' 또는 'fail'
  error          text,                          -- 실패 시 사유

  constraint academy_messages_channel_check check (channel in ('sms', 'alimtalk')),
  constraint academy_messages_status_check  check (status in ('ok', 'fail'))
);

create index if not exists academy_messages_app_idx
  on public.academy_messages (application_id, created_at desc);

create index if not exists academy_messages_event_idx
  on public.academy_messages (event_id, status);

-- =====================================================================
-- 권한: 로그인한 관리자만. anon 은 접근 불가.
-- =====================================================================
alter table public.academy_messages enable row level security;

revoke all on table public.academy_messages from anon, authenticated;
grant select, insert on table public.academy_messages to authenticated;

-- 이전 정책 정리
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'academy_messages'
  loop
    execute format('drop policy %I on public.academy_messages', p.policyname);
  end loop;
end $$;

create policy "authenticated can read messages"
  on public.academy_messages
  for select to authenticated
  using (true);

create policy "authenticated can insert messages"
  on public.academy_messages
  for insert to authenticated
  with check (true);

comment on table public.academy_messages is
  '신청자에게 나간 안내 문자·알림톡 기록. 개인정보 포함. 로그인한 관리자만 접근.';
