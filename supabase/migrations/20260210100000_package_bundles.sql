-- Package Bundles: group multiple packages into a single purchasable bundle
-- with optional discount pricing.

-- =============================================================================
-- PACKAGE BUNDLES
-- =============================================================================

create table if not exists public.package_bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  badge text, -- 'Best Value', 'Save 30%'
  price_cents int not null default 0,
  compare_at_cents int, -- original total price (for strikethrough)
  stripe_product_id text,
  stripe_price_id text,
  icon_url text,
  banner_url text,
  features jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index idx_package_bundles_slug on public.package_bundles(slug);
create index idx_package_bundles_published on public.package_bundles(is_published, sort_order);

-- =============================================================================
-- PACKAGE BUNDLE ITEMS (join table)
-- =============================================================================

create table if not exists public.package_bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.package_bundles(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(bundle_id, package_id)
);

create index idx_bundle_items_bundle on public.package_bundle_items(bundle_id, sort_order);

-- =============================================================================
-- ADD package_bundle kind to offers CHECK constraint
-- =============================================================================

-- Drop and recreate the check constraint to add 'package_bundle'
alter table public.offers drop constraint if exists offers_kind_check;
alter table public.offers add constraint offers_kind_check
  check (kind in ('membership', 'course', 'bundle', 'order_bump', 'package_bundle'));

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

alter table public.package_bundles enable row level security;
alter table public.package_bundle_items enable row level security;

-- Public can view published bundles
create policy "Anyone can view published package bundles"
  on public.package_bundles for select
  using (is_published = true);

-- Public can view bundle items for published bundles
create policy "Anyone can view package bundle items"
  on public.package_bundle_items for select
  using (
    exists (
      select 1 from public.package_bundles
      where id = bundle_id and is_published = true
    )
  );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

create trigger package_bundles_updated_at
  before update on public.package_bundles
  for each row
  execute function update_updated_at_column();
