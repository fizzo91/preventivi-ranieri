-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create app_role enum
create type public.app_role as enum ('admin', 'user');

-- ============================================
-- PROFILES TABLE
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  company_name text,
  phone text,
  website text,
  vat_number text,
  tax_code text,
  address text,
  notes text,
  logo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- USER ROLES TABLE (create first)
-- ============================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles (CREATE BEFORE POLICIES)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Now create RLS policies that use has_role
create policy "User roles viewable by authenticated users"
  on public.user_roles for select
  to authenticated
  using (true);

create policy "Only admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CLIENTS TABLE
-- ============================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  company text,
  address text,
  vat_number text,
  fiscal_code text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients enable row level security;

create policy "Users can manage own clients"
  on public.clients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_clients_user_id on public.clients(user_id);
create index idx_clients_name on public.clients(name);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  price_em numeric not null default 0,
  price_dt numeric not null default 0,
  category text not null,
  unit text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Users can manage own products"
  on public.products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_products_user_id on public.products(user_id);
create index idx_products_category on public.products(category);

-- ============================================
-- QUOTES TABLE
-- ============================================
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  quote_number text not null,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  client_email text,
  client_phone text,
  client_company text,
  client_address text,
  client_vat_number text,
  client_fiscal_code text,
  date timestamptz not null,
  validity_days integer not null default 30,
  sections jsonb not null default '[]',
  payment_terms text,
  notes text,
  total_amount numeric not null default 0,
  status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, quote_number)
);

alter table public.quotes enable row level security;

create policy "Users can manage own quotes"
  on public.quotes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_quotes_user_id on public.quotes(user_id);
create index idx_quotes_client_id on public.quotes(client_id);
create index idx_quotes_status on public.quotes(status);
create index idx_quotes_date on public.quotes(date desc);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_clients_updated_at before update on public.clients
  for each row execute function public.update_updated_at_column();

create trigger update_products_updated_at before update on public.products
  for each row execute function public.update_updated_at_column();

create trigger update_quotes_updated_at before update on public.quotes
  for each row execute function public.update_updated_at_column();