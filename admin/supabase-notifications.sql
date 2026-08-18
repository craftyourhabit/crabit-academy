-- =====================================================================
-- 크래빗 아카데미 알림톡 발송 이력
--
-- 프로젝트: 크래빗 아카데미 (ttolvlzubashyhdctbqr)
-- SQL Editor 에 붙여넣고 한 번 실행하세요. 두 번 실행해도 안전합니다.
--
-- 솔라피(Solapi)로 알림톡을 보낼 때 "언제, 어느 강의 신청자에게, 몇 명한테,
-- 무슨 내용으로" 보냈는지 남기는 표입니다.
--
-- 발송 자체는 아직 붙이지 않았습니다. 표와 화면만 먼저 만들어 두고,
-- 솔라피 계정이 준비되면 Edge Function 하나만 얹으면 됩니다.
--
-- 【중요】 anon 은 이 표에 아무 권한이 없습니다.
-- 발송 이력에는 누구에게 보냈는지가 담기고, 알림톡은 돈이 나가는 일이라
-- 공개 페이지에서 건드릴 수 있으면 안 됩니다.
-- 실제 발송은 Edge Function이 서버 키로만 하게 됩니다.
-- =====================================================================

create table if not exists public.academy_notifications (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- 어느 강의 신청자에게 보냈는지
  event_id      text not null,
  event_title   text,

  -- 어떤 알림인지
  --   apply_confirm  접수 확인
  --   payment_guide  입금 안내
  --   reminder       수강 전 리마인드
  --   followup       종료 후 자료 안내
  --   custom         직접 작성
  kind          text not null,
  -- 솔라피 알림톡 템플릿 아이디 (연결 후 채웁니다)
  template_id   text,
  -- 실제로 보낸 문구. 나중에 "그때 뭐라고 보냈더라"를 확인할 때 씁니다.
  message       text,

  -- 결과
  --   pending  예약했거나 보내는 중
  --   sent     발송 완료
  --   failed   실패
  status        text not null default 'pending',
  target_count  integer not null default 0,
  success_count integer not null default 0,
  fail_count    integer not null default 0,
  -- 솔라피가 돌려주는 그룹 아이디. 문제 생기면 이걸로 추적합니다.
  provider_ref  text,
  error_message text,

  sent_at       timestamptz,
  -- 누가 눌렀는지 (Supabase Auth 사용자)
  sent_by       uuid default auth.uid(),

  constraint academy_notifications_kind_check
    check (kind in ('apply_confirm', 'payment_guide', 'reminder', 'followup', 'custom')),
  constraint academy_notifications_status_check
    check (status in ('pending', 'sent', 'failed')),
  constraint academy_notifications_len_check check (
    length(event_id) between 1 and 60
    and (message is null or length(message) <= 2000)
    and (template_id is null or length(template_id) <= 120)
  )
);

create index if not exists academy_notifications_event_idx
  on public.academy_notifications (event_id, created_at desc);

-- =====================================================================
-- 권한: anon 은 전혀 손댈 수 없습니다. 로그인한 관리자만 읽고 씁니다.
-- =====================================================================
alter table public.academy_notifications enable row level security;

revoke all on table public.academy_notifications from anon, authenticated;
grant select, insert, update on table public.academy_notifications to authenticated;

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'academy_notifications'
  loop
    execute format('drop policy %I on public.academy_notifications', p.policyname);
  end loop;
end $$;

-- anon 을 위한 정책은 하나도 만들지 않습니다. 그러면 RLS가 전부 막습니다.
create policy "authenticated can read notifications"
  on public.academy_notifications for select to authenticated using (true);

create policy "authenticated can write notifications"
  on public.academy_notifications for insert to authenticated with check (true);

create policy "authenticated can update notifications"
  on public.academy_notifications for update to authenticated using (true) with check (true);

comment on table public.academy_notifications is
  '알림톡 발송 이력. 관리자만 접근. 실제 발송은 Edge Function이 담당할 예정.';
