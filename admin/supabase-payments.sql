-- =====================================================================
-- 크래빗 아카데미 카카오페이 결제 테이블
--
-- 프로젝트: crabit-academy-payments (iwitqfnhlyseuxxndvny, 서울 ap-northeast-2)
-- 신청폼이 쓰는 '크래빗 아카데미' 프로젝트와는 다른 프로젝트입니다.
-- 결제는 돈이 오가는 일이라 따로 떼어 두었고, 나중에 수강생 계정(Auth)을
-- 붙일 때도 이 프로젝트가 본체가 됩니다.
--
-- 이 파일은 기록용 사본입니다. 실제 적용은 CLI(db push)로 이미 했고,
-- 다시 실행해도 안전하게 작성했습니다.
--
-- 【이 파일이 지키려는 것】
-- 결제 금액은 절대 브라우저가 정하면 안 됩니다. 금액의 원본은 products 표이고,
-- Edge Function(pay)이 서버에서만 읽어 카카오페이에 넘깁니다.
-- 그래서 anon 과 authenticated 는 두 표 모두에 아무 권한이 없습니다.
-- 접근은 Edge Function의 service role 키로만 합니다.
-- =====================================================================

-- 판매 상품. events.js 의 유료 강의와 event_id 로 짝을 맞춥니다.
-- 가격을 여기 한 번 더 두는 이유: events.js 는 공개 레포의 공개 파일이라
-- 결제 금액의 근거로 쓸 수 없습니다. 결제에 쓰는 금액은 이 표가 유일한 원본입니다.
create table if not exists public.products (
  event_id    text primary key,
  title       text not null,
  price       integer not null check (price > 0),
  -- 판매 중단 시 false. 행을 지우면 과거 주문의 짝이 사라지니 끄기만 합니다.
  active      boolean not null default true,

  -- 결제 완료 화면에서 바로 보여줄 제공 정보.
  -- 시청 페이지가 아직 없으면 비워 둡니다. 비어 있으면 완료 화면이
  -- "따로 안내드립니다"로 나가고, 채우는 즉시 자동 안내로 바뀝니다.
  access_url      text,
  access_password text,
  access_note     text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 주문. ready 호출 때 만들어지고 approve 성공 때 approved 가 됩니다.
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  event_id      text not null references public.products (event_id),
  -- 주문 시점의 제목과 금액을 그대로 박아 둡니다.
  -- 나중에 상품 정보를 고쳐도 "그때 얼마에 샀는지"가 남아야 하니까요.
  title         text not null,
  amount        integer not null check (amount > 0),

  buyer_name    text not null,
  buyer_phone   text not null,
  buyer_email   text,
  buyer_org     text,

  -- 나중에 수강생 계정을 붙일 때 채웁니다. 지금은 항상 비어 있습니다.
  user_id       uuid,

  status        text not null default 'ready',
  -- 카카오페이 거래 번호. ready 응답으로 받고 approve 때 다시 씁니다.
  tid           text,
  cid           text not null,
  -- approve 응답 전문. 정산 대사나 분쟁 때 원본이 필요합니다.
  pg_payload    jsonb,
  approved_at   timestamptz,
  canceled_at   timestamptz,
  -- 실패나 취소 사유를 사람이 읽을 수 있게 남깁니다.
  memo          text,

  constraint orders_status_check
    check (status in ('ready', 'approved', 'canceled', 'failed'))
);

create index if not exists orders_event_id_idx on public.orders (event_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- 두 겹 방어. 공개 키로는 아무것도 못 하게 합니다.
alter table public.products enable row level security;
alter table public.orders enable row level security;
revoke all on public.products from anon, authenticated;
revoke all on public.orders from anon, authenticated;

-- 지금 판매 중인 상품. 가격은 VAT 포함 원 단위입니다.
insert into public.products (event_id, title, price)
values ('math-academy-top1', '지역 1등 수학학원 만들기 프로젝트 (녹화본)', 90000)
on conflict (event_id) do update
  set title = excluded.title, price = excluded.price, updated_at = now();
