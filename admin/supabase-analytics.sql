-- =====================================================================
-- 크래빗 아카데미 성과 측정 (페이지뷰, 아웃바운드 클릭, UTM 링크)
--
-- 프로젝트: 크래빗 아카데미 (ttolvlzubashyhdctbqr, 서울 ap-northeast-2)
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 한 번 실행하세요.
-- 두 번 실행해도 안전합니다. 자세한 순서는 admin/ANALYTICS.md 를 보세요.
--
-- 【이 파일이 만드는 것】
--   1) academy_events     : 방문 기록 한 줄씩 (페이지뷰, 아웃바운드 클릭)
--   2) academy_utm_links  : 어드민 "UTM 링크" 탭에서 만든 링크 목록
--   3) 집계 함수 3개      : 어드민 "성과" 탭이 부릅니다
--   4) 기존 대시보드 뷰    : 옛 academy_pageviews 와 새 academy_events 를 합쳐서 셉니다
--
-- 【개인정보 원칙】
--   - 이름, 연락처, 이메일, IP 원문은 저장하지 않습니다.
--   - visitor_id 는 브라우저가 처음 방문 때 만든 무작위 문자열입니다.
--     사람과 연결할 방법이 없고, 브라우저 저장소를 지우면 새 값이 됩니다.
--   - ip_hash 는 소금(TRACK_SALT)과 날짜를 섞은 해시입니다. 날마다 바뀌어서
--     날짜를 넘어 같은 사람을 이어 붙일 수 없어요. 도배 막는 데만 씁니다.
--   - 유입 주소는 도메인만 남깁니다(검색어 같은 게 섞여 들어오지 않게).
--
-- 【권한】
--   - anon(비로그인 방문자)은 academy_events 에 아무 권한이 없습니다.
--     기록은 Edge Function 'track' 이 service role 로만 넣어요.
--     (비밀 메일함과 같은 방식입니다. 브라우저가 직접 넣게 하면 도배를 못 막아요)
--   - 로그인한 관리자(authenticated)만 읽을 수 있습니다.
-- =====================================================================


-- =====================================================================
-- 1. 방문 기록
-- =====================================================================
create table if not exists public.academy_events (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),

  -- pageview: 페이지를 열었을 때 / outbound: data-track 버튼이나 바깥 링크를 눌렀을 때
  type           text not null,
  -- 사이트 기준 경로. 확장자와 index 는 떼어 냅니다 (예: /r/ai-tools-5, /resources, /)
  path           text not null,
  -- 강의 상세(event.html?id=...)면 강의 키
  event_id       text,
  -- outbound 일 때 버튼 이름 (예: outbound-olkeoni). data-track 이 없으면 outbound-link
  label          text,
  -- outbound 일 때 나간 곳의 도메인 (예: open.kakao.com)
  target_host    text,

  -- 이 방문을 데려온 UTM. 지금 주소에 없으면 같은 탭에서 처음 들어올 때의 값을 이어 씁니다.
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  utm_content    text,
  utm_term       text,

  referrer_host  text,
  visitor_id     text not null,
  ip_hash        text,

  constraint academy_events_type_check check (type in ('pageview', 'outbound')),
  constraint academy_events_len_check check (
    length(path) between 1 and 200
    and (event_id is null or length(event_id) between 1 and 60)
    and (label is null or length(label) between 1 and 60)
    and (target_host is null or length(target_host) <= 120)
    and (utm_source is null or length(utm_source) <= 100)
    and (utm_medium is null or length(utm_medium) <= 100)
    and (utm_campaign is null or length(utm_campaign) <= 100)
    and (utm_content is null or length(utm_content) <= 100)
    and (utm_term is null or length(utm_term) <= 100)
    and (referrer_host is null or length(referrer_host) <= 120)
    and length(visitor_id) between 8 and 40
    and (ip_hash is null or length(ip_hash) <= 64)
  )
);

create index if not exists academy_events_created_idx  on public.academy_events (created_at desc);
create index if not exists academy_events_path_idx     on public.academy_events (path, created_at desc);
create index if not exists academy_events_campaign_idx on public.academy_events (utm_campaign, created_at desc) where utm_campaign is not null;
create index if not exists academy_events_visitor_idx  on public.academy_events (visitor_id);
create index if not exists academy_events_ip_idx       on public.academy_events (ip_hash, created_at desc);

alter table public.academy_events enable row level security;
revoke all on table public.academy_events from anon, authenticated;
grant select on table public.academy_events to authenticated;
-- Edge Function(track)이 service role로 기록하고 도배 제한을 세려면 필요합니다. 이 프로젝트는 새 표에 자동 grant가 없어요.
grant select, insert on table public.academy_events to service_role;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'academy_events'
  loop execute format('drop policy %I on public.academy_events', p.policyname); end loop;
end $$;

-- anon 정책은 일부러 만들지 않습니다. 정책이 없으면 RLS가 전부 막습니다.
create policy "authenticated can read events"
  on public.academy_events for select to authenticated using (true);

comment on table public.academy_events is
  '아카데미 방문 기록(페이지뷰, 아웃바운드 클릭). 개인 식별 정보 없음. anon 권한 없음, 기록은 Edge Function track(service role)만.';


-- =====================================================================
-- 2. UTM 링크 목록
--    마케팅 어드민 시트(UTM_Links 탭)와 같은 칸 순서를 따릅니다.
--    나중에 시트로 옮기거나 동기화할 때 그대로 붙일 수 있게요.
-- =====================================================================
create table if not exists public.academy_utm_links (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  created_by    text default (auth.jwt() ->> 'email'),

  name          text not null,           -- 캠페인명(한글 표시용). 예: [인스타 캡션] 10.01 AI 툴 5가지 아티클 링크
  target_kind   text not null default 'article',  -- article | external
  target_label  text,                    -- 대상 이름 (아티클 제목, 올커니 입장 링크 등)
  base_url      text not null,
  utm_source    text not null,
  utm_medium    text not null,
  utm_campaign  text not null,
  utm_content   text,
  utm_url       text not null,
  memo          text,
  sheet_synced_at timestamptz,           -- KPI 시트로 옮긴 시각(동기화 붙이면 사용)

  constraint academy_utm_links_kind_check check (target_kind in ('article', 'external')),
  constraint academy_utm_links_val_check check (
    utm_source ~ '^[a-z0-9_-]{1,100}$'
    and utm_medium ~ '^[a-z0-9_-]{1,100}$'
    and utm_campaign ~ '^[a-z0-9_-]{1,100}$'
    and (utm_content is null or utm_content ~ '^[a-z0-9_-]{1,100}$')
  ),
  constraint academy_utm_links_len_check check (
    length(name) between 1 and 120
    and (target_label is null or length(target_label) <= 120)
    and length(base_url) between 1 and 500
    and length(utm_url) between 1 and 1000
    and (memo is null or length(memo) <= 300)
  )
);

create index if not exists academy_utm_links_created_idx on public.academy_utm_links (created_at desc);

alter table public.academy_utm_links enable row level security;
revoke all on table public.academy_utm_links from anon, authenticated;
grant select, insert, delete on table public.academy_utm_links to authenticated;
grant update (name, memo, sheet_synced_at) on table public.academy_utm_links to authenticated;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'academy_utm_links'
  loop execute format('drop policy %I on public.academy_utm_links', p.policyname); end loop;
end $$;

create policy "authenticated can read utm links"   on public.academy_utm_links for select to authenticated using (true);
create policy "authenticated can add utm links"    on public.academy_utm_links for insert to authenticated with check (true);
create policy "authenticated can edit utm links"   on public.academy_utm_links for update to authenticated using (true) with check (true);
create policy "authenticated can delete utm links" on public.academy_utm_links for delete to authenticated using (true);

comment on table public.academy_utm_links is
  '아카데미 어드민에서 만든 UTM 링크. 마케팅 어드민 시트 UTM_Links 와 같은 칸 구성.';


-- =====================================================================
-- 3. 집계 함수 (어드민 "성과" 탭)
--    p_days 가 null 이면 전체 기간입니다.
--    security invoker 라서 부른 사람 권한으로 읽습니다(로그인한 관리자만 통과).
-- =====================================================================

-- 3-0. 기간 전체 요약 (성과 탭 맨 위 숫자 4개)
create or replace function public.academy_overview(p_days int default null)
returns table (
  views bigint,
  visitors bigint,
  utm_visitors bigint,
  outbound_clicks bigint
)
language sql stable security invoker set search_path = public as $$
  select
    count(*) filter (where type = 'pageview'),
    count(distinct visitor_id) filter (where type = 'pageview'),
    count(distinct visitor_id) filter (where utm_source is not null),
    count(*) filter (where type = 'outbound')
  from public.academy_events
  where p_days is null or created_at >= now() - make_interval(days => p_days);
$$;

-- 3-1. 페이지별 조회수
create or replace function public.academy_page_stats(p_days int default null)
returns table (
  path text,
  views bigint,
  visitors bigint,
  utm_visitors bigint,
  outbound_clicks bigint,
  outbound_visitors bigint
)
language sql stable security invoker set search_path = public as $$
  with e as (
    select * from public.academy_events
    where p_days is null or created_at >= now() - make_interval(days => p_days)
  )
  select
    e.path,
    count(*) filter (where e.type = 'pageview')                                              as views,
    count(distinct e.visitor_id) filter (where e.type = 'pageview')                          as visitors,
    count(distinct e.visitor_id) filter (where e.type = 'pageview' and e.utm_source is not null) as utm_visitors,
    count(*) filter (where e.type = 'outbound')                                              as outbound_clicks,
    count(distinct e.visitor_id) filter (where e.type = 'outbound')                          as outbound_visitors
  from e
  group by e.path
  order by views desc;
$$;

-- 3-2. UTM별 유입 (source, medium, campaign, content 조합 하나가 한 줄)
create or replace function public.academy_utm_stats(p_days int default null)
returns table (
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  visitors bigint,
  pageviews bigint,
  outbound_clicks bigint,
  outbound_visitors bigint,
  olkeoni_clicks bigint,
  olkeoni_visitors bigint,
  first_seen timestamptz,
  last_seen timestamptz
)
language sql stable security invoker set search_path = public as $$
  select
    e.utm_source, e.utm_medium, e.utm_campaign, e.utm_content,
    count(distinct e.visitor_id)                                                     as visitors,
    count(*) filter (where e.type = 'pageview')                                      as pageviews,
    count(*) filter (where e.type = 'outbound')                                      as outbound_clicks,
    count(distinct e.visitor_id) filter (where e.type = 'outbound')                  as outbound_visitors,
    count(*) filter (where e.type = 'outbound' and e.label = 'outbound-olkeoni')     as olkeoni_clicks,
    count(distinct e.visitor_id) filter (where e.type = 'outbound' and e.label = 'outbound-olkeoni') as olkeoni_visitors,
    min(e.created_at), max(e.created_at)
  from public.academy_events e
  where e.utm_source is not null
    and (p_days is null or e.created_at >= now() - make_interval(days => p_days))
  group by 1, 2, 3, 4
  order by visitors desc;
$$;

-- 3-2b. UTM 조합별로 어느 페이지를 봤는지 (아티클 조회 칸에 씁니다)
create or replace function public.academy_utm_paths(p_days int default null)
returns table (
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  path text,
  views bigint,
  visitors bigint
)
language sql stable security invoker set search_path = public as $$
  select
    e.utm_source, e.utm_medium, e.utm_campaign, e.utm_content, e.path,
    count(*), count(distinct e.visitor_id)
  from public.academy_events e
  where e.type = 'pageview'
    and e.utm_source is not null
    and (p_days is null or e.created_at >= now() - make_interval(days => p_days))
  group by 1, 2, 3, 4, 5;
$$;

-- 3-3. 퍼널: 유입 -> 아티클 조회 -> 버튼 클릭 (방문자 수 기준)
--   p_source          : 유입 utm_source (예: instagram)
--   p_campaign_prefix : utm_campaign 앞부분 (예: ai-tools-5 면 ai-tools-5, ai-tools-5-v2 모두 포함)
--   p_path            : 아티클 경로 (예: /r/ai-tools-5)
--   p_label           : 버튼 이름 (예: outbound-olkeoni)
create or replace function public.academy_funnel(
  p_source text,
  p_campaign_prefix text,
  p_path text,
  p_label text,
  p_days int default null
)
returns table (
  inflow_visitors bigint,      -- 1단계: 해당 UTM 으로 들어온 방문자
  article_visitors bigint,     -- 2단계: 그중 아티클을 본 방문자
  click_visitors bigint,       -- 3단계: 그중 버튼을 누른 방문자
  click_total bigint,          -- 3단계 클릭 수(같은 사람이 여러 번 누른 것 포함)
  all_article_visitors bigint, -- 참고: 유입 경로와 상관없이 아티클을 본 방문자
  all_click_visitors bigint    -- 참고: 유입 경로와 상관없이 버튼을 누른 방문자
)
language sql stable security invoker set search_path = public as $$
  with e as (
    select * from public.academy_events
    where p_days is null or created_at >= now() - make_interval(days => p_days)
  ),
  inflow as (
    select distinct visitor_id from e
    where utm_source = p_source
      and utm_campaign like replace(replace(p_campaign_prefix, '_', '\_'), '%', '\%') || '%'
  ),
  art as (
    select distinct e.visitor_id from e join inflow using (visitor_id)
    where e.type = 'pageview' and e.path = p_path
  ),
  clk as (
    select e.visitor_id, count(*) as n from e join art using (visitor_id)
    where e.type = 'outbound' and e.label = p_label
    group by e.visitor_id
  )
  select
    (select count(*) from inflow),
    (select count(*) from art),
    (select count(*) from clk),
    (select coalesce(sum(n), 0) from clk)::bigint,
    (select count(distinct visitor_id) from e where type = 'pageview' and path = p_path),
    (select count(distinct visitor_id) from e where type = 'outbound' and label = p_label);
$$;

revoke all on function public.academy_overview(int)    from public, anon;
revoke all on function public.academy_page_stats(int)  from public, anon;
revoke all on function public.academy_utm_stats(int)   from public, anon;
revoke all on function public.academy_utm_paths(int)   from public, anon;
revoke all on function public.academy_funnel(text, text, text, text, int) from public, anon;
grant execute on function public.academy_overview(int)    to authenticated;
grant execute on function public.academy_page_stats(int)  to authenticated;
grant execute on function public.academy_utm_stats(int)   to authenticated;
grant execute on function public.academy_utm_paths(int)   to authenticated;
grant execute on function public.academy_funnel(text, text, text, text, int) to authenticated;


-- =====================================================================
-- 4. 기존 대시보드 뷰가 새 기록도 세도록
--
-- track.js 는 이제 academy_pageviews 대신 Edge Function 'track' 으로 보냅니다.
-- 대시보드의 강의별 조회수와 일별 추이가 끊기지 않도록 옛 표와 새 표를 합친
-- academy_pageviews_all 을 만들고, 기존 두 뷰가 그걸 읽게 바꿉니다.
-- (academy_pageviews 표가 없으면 이 구획은 supabase-pageviews.sql 을 먼저 실행하세요)
-- =====================================================================
create or replace view public.academy_pageviews_all
with (security_invoker = on) as
  select created_at, event_id, path, referrer_host from public.academy_pageviews
  union all
  select created_at, event_id, path, referrer_host from public.academy_events where type = 'pageview';

create or replace view public.academy_event_stats
with (security_invoker = on) as
with v as (
  select event_id, count(*)::bigint as views
  from public.academy_pageviews_all
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
  case when coalesce(v.views, 0) > 0
       then round(coalesce(a.applications, 0)::numeric * 100 / v.views, 1)
  end                                   as conversion_rate
from v full outer join a on v.event_id = a.event_id;

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
  from public.academy_pageviews_all group by 1
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

grant select on public.academy_pageviews_all to authenticated;
grant select on public.academy_event_stats   to authenticated;
grant select on public.academy_daily_stats   to authenticated;


-- =====================================================================
-- 5. (나중에, 선택) 옛 조회수 표의 익명 쓰기 닫기
--
-- 새 track.js 가 배포되고 일주일쯤 지나 academy_events 에 기록이 잘 쌓이는 걸
-- 확인했으면, 아래 두 줄의 주석을 풀고 실행하세요. 그 뒤로는 누구도 브라우저에서
-- academy_pageviews 에 직접 쓸 수 없습니다. 옛 기록은 그대로 남고 계속 집계됩니다.
-- =====================================================================
-- revoke insert on table public.academy_pageviews from anon;
-- drop policy if exists "anon can log pageview" on public.academy_pageviews;


-- 확인용(선택): academy_events 결과에 anon 이 나오면 안 됩니다.
-- select table_name, grantee, privilege_type from information_schema.role_table_grants
-- where table_name in ('academy_events', 'academy_utm_links') order by 1, 2;
