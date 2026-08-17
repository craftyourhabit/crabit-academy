-- =====================================================================
-- 크래빗 아카데미 조회수 집계
--
-- 프로젝트: 크래빗 아카데미 (ttolvlzubashyhdctbqr)
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 한 번 실행하세요.
-- 두 번 실행해도 안전합니다.
--
-- 【개인정보를 남기지 않습니다】
-- IP, 쿠키, 방문자 식별자를 저장하지 않습니다.
-- 유입 주소도 도메인만 남기고 전체 URL은 버립니다.
-- 검색어나 개인 정보가 URL에 섞여 들어오는 걸 막기 위해서예요.
-- 그래서 "누가 봤는지"는 알 수 없고 "몇 번 봤는지"만 압니다.
-- 우리가 필요한 건 강의별 조회수와 전환율이라 이걸로 충분합니다.
-- =====================================================================

create table if not exists public.academy_pageviews (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  -- 강의 상세페이지면 강의 키, 그 외 페이지면 비어 있습니다.
  event_id       text,
  -- 어떤 페이지인지 (예: /crabit-academy/event.html)
  path           text not null,
  -- 유입 도메인만 (예: google.com, instagram.com). 직접 방문이면 비어 있습니다.
  referrer_host  text,

  constraint academy_pageviews_len_check check (
    (event_id is null or length(event_id) between 1 and 60)
    and length(path) between 1 and 200
    and (referrer_host is null or length(referrer_host) <= 120)
  )
);

create index if not exists academy_pageviews_event_idx
  on public.academy_pageviews (event_id, created_at desc)
  where event_id is not null;

create index if not exists academy_pageviews_created_idx
  on public.academy_pageviews (created_at desc);

-- =====================================================================
-- 권한: 아무나 한 줄 넣을 수 있지만, 읽는 건 로그인한 관리자만
-- =====================================================================
alter table public.academy_pageviews enable row level security;

revoke all on table public.academy_pageviews from anon, authenticated;

grant insert (event_id, path, referrer_host) on table public.academy_pageviews to anon;
grant select on table public.academy_pageviews to authenticated;

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'academy_pageviews'
  loop
    execute format('drop policy %I on public.academy_pageviews', p.policyname);
  end loop;
end $$;

create policy "anon can log pageview"
  on public.academy_pageviews for insert to anon with check (true);

create policy "authenticated can read pageviews"
  on public.academy_pageviews for select to authenticated using (true);

-- =====================================================================
-- 집계 뷰
--
-- security_invoker = on 이 중요합니다.
-- 이걸 켜지 않으면 뷰가 만든 사람 권한으로 돌아서 RLS를 통째로 우회합니다.
-- 켜 두면 뷰를 부른 사람의 권한으로 원본 테이블을 읽습니다.
-- =====================================================================

-- 강의별 요약: 조회수, 신청수, 입금완료, 매출, 전환율
create or replace view public.academy_event_stats
with (security_invoker = on) as
with v as (
  select event_id, count(*)::bigint as views
  from public.academy_pageviews
  where event_id is not null
  group by event_id
),
a as (
  select
    event_id,
    count(*)::bigint                                          as applications,
    count(*) filter (where status = 'paid')::bigint           as paid,
    count(*) filter (where status = 'pending')::bigint        as pending,
    count(*) filter (where status = 'cancelled')::bigint      as cancelled,
    coalesce(sum(event_price) filter (where status = 'paid'), 0)::bigint as revenue
  from public.academy_applications
  group by event_id
)
select
  coalesce(v.event_id, a.event_id)      as event_id,
  coalesce(v.views, 0)                  as views,
  coalesce(a.applications, 0)           as applications,
  coalesce(a.paid, 0)                   as paid,
  coalesce(a.pending, 0)                as pending,
  coalesce(a.cancelled, 0)              as cancelled,
  coalesce(a.revenue, 0)                as revenue,
  -- 조회 대비 신청 전환율 (%). 조회가 0이면 계산하지 않고 비워 둡니다.
  case when coalesce(v.views, 0) > 0
       then round(coalesce(a.applications, 0)::numeric * 100 / v.views, 1)
  end                                   as conversion_rate
from v full outer join a on v.event_id = a.event_id;

-- 날짜별 추이: 조회수, 신청수, 매출
create or replace view public.academy_daily_stats
with (security_invoker = on) as
with days as (
  select generate_series(
    (now() at time zone 'Asia/Seoul')::date - interval '89 days',
    (now() at time zone 'Asia/Seoul')::date,
    interval '1 day'
  )::date as day
),
v as (
  select (created_at at time zone 'Asia/Seoul')::date as day, count(*)::bigint as views
  from public.academy_pageviews group by 1
),
a as (
  select
    (created_at at time zone 'Asia/Seoul')::date as day,
    count(*)::bigint as applications,
    coalesce(sum(event_price) filter (where status = 'paid'), 0)::bigint as revenue
  from public.academy_applications group by 1
)
select
  days.day,
  coalesce(v.views, 0)        as views,
  coalesce(a.applications, 0) as applications,
  coalesce(a.revenue, 0)      as revenue
from days
left join v on v.day = days.day
left join a on a.day = days.day
order by days.day;

grant select on public.academy_event_stats  to authenticated;
grant select on public.academy_daily_stats  to authenticated;

comment on table public.academy_pageviews is
  '아카데미 페이지 조회 기록. 개인 식별 정보 없음. anon은 INSERT만.';
