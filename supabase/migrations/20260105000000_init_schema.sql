/*
  Migration: Complete Schema Initialization
  Date: 2026-01-05
  Description: Consolidated migration that initializes the complete Evolync database schema.
  Includes ENUMs, Tables, RLS Policies, Indexes, Triggers, Auth integration, and RPC functions.
*/

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. Data Types (ENUMs)
-- -----------------------------------------------------------------------------

create type public.member_status as enum ('offline', 'pending', 'active', 'archived', 'rejected');
create type public.priority_level as enum ('normal', 'high');
create type public.order_status as enum ('placed', 'paid', 'processing', 'ready_for_pickup', 'completed');
create type public.payment_status as enum ('paid', 'pending', 'cancelled');
create type public.payment_method as enum ('cash', 'transfer', 'other');
create type public.attendance_status as enum ('present', 'absent', 'excused');

-- 2. Tables
-- -----------------------------------------------------------------------------

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2.1. Users and Organizations

-- Table: organizations
create table public.organizations (
  id uuid not null default gen_random_uuid() primary key,
  owner_id uuid not null references auth.users(id),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.organizations enable row level security;

create trigger on_organizations_updated
  before update on public.organizations
  for each row execute procedure public.handle_updated_at();

-- Table: organization_roles
create table public.organization_roles (
  id uuid not null default gen_random_uuid() primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_system_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.organization_roles enable row level security;

create trigger on_organization_roles_updated
  before update on public.organization_roles
  for each row execute procedure public.handle_updated_at();

-- Table: schools
create table public.schools (
  id uuid not null default gen_random_uuid() primary key,
  organization_id uuid not null references public.organizations(id),
  name text not null,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.schools enable row level security;

create trigger on_schools_updated
  before update on public.schools
  for each row execute procedure public.handle_updated_at();

-- Table: school_invites
create table public.school_invites (
  id uuid not null default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id),
  role_id uuid references public.organization_roles(id),
  code text not null unique,
  expires_at timestamptz not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.school_invites enable row level security;

create trigger on_school_invites_updated
  before update on public.school_invites
  for each row execute procedure public.handle_updated_at();

-- Table: school_members
create table public.school_members (
  id uuid not null default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id),
  user_id uuid references auth.users(id), -- Nullable for Shadow Users
  role_id uuid references public.organization_roles(id),
  display_name text, -- For Shadow Users or Cache
  email text, -- For linking
  status public.member_status default 'pending',
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  constraint check_user_or_name check (user_id is not null or display_name is not null)
);

alter table public.school_members enable row level security;

create trigger on_school_members_updated
  before update on public.school_members
  for each row execute procedure public.handle_updated_at();

-- 2.2. 3D Engine (Core)

-- Table: techniques
create table public.techniques (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  title text not null,
  description text,
  body_part text not null,
  rotation_data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.techniques enable row level security;

create trigger on_techniques_updated
  before update on public.techniques
  for each row execute procedure public.handle_updated_at();

-- Table: sequences
create table public.sequences (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  title text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.sequences enable row level security;

create trigger on_sequences_updated
  before update on public.sequences
  for each row execute procedure public.handle_updated_at();

-- Table: sequence_steps
create table public.sequence_steps (
  id uuid not null default gen_random_uuid() primary key,
  sequence_id uuid references public.sequences(id) on delete cascade,
  order_index integer not null,
  duration_ms integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.sequence_steps enable row level security;

create trigger on_sequence_steps_updated
  before update on public.sequence_steps
  for each row execute procedure public.handle_updated_at();

-- Table: step_techniques
create table public.step_techniques (
  id uuid not null default gen_random_uuid() primary key,
  step_id uuid references public.sequence_steps(id) on delete cascade,
  technique_id uuid references public.techniques(id),
  model_slot integer default 0, -- 0=Main, 1=Partner
  root_position jsonb default '{"x":0,"y":0,"z":0}',
  root_rotation jsonb default '{"x":0,"y":0,"z":0,"w":1}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.step_techniques enable row level security;

create trigger on_step_techniques_updated
  before update on public.step_techniques
  for each row execute procedure public.handle_updated_at();

-- Table: training_plans
create table public.training_plans (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  title text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.training_plans enable row level security;

create trigger on_training_plans_updated
  before update on public.training_plans
  for each row execute procedure public.handle_updated_at();

-- Table: plan_sequences
create table public.plan_sequences (
  id uuid not null default gen_random_uuid() primary key,
  training_plan_id uuid references public.training_plans(id) on delete cascade,
  sequence_id uuid references public.sequences(id),
  order_index integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.plan_sequences enable row level security;

create trigger on_plan_sequences_updated
  before update on public.plan_sequences
  for each row execute procedure public.handle_updated_at();

-- 2.3. Polymorphism (Tags and Comments)

-- Table: tags
create table public.tags (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  name text not null,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.tags enable row level security;

create trigger on_tags_updated
  before update on public.tags
  for each row execute procedure public.handle_updated_at();

-- Table: taggables
create table public.taggables (
  id uuid not null default gen_random_uuid() primary key,
  tag_id uuid references public.tags(id) on delete cascade,
  taggable_id uuid not null,
  taggable_type text check (taggable_type in ('technique', 'sequence', 'step', 'plan')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.taggables enable row level security;

create trigger on_taggables_updated
  before update on public.taggables
  for each row execute procedure public.handle_updated_at();

-- Table: comments
create table public.comments (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id),
  content text not null,
  commentable_id uuid not null,
  commentable_type text check (commentable_type in ('technique', 'sequence', 'step', 'plan')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.comments enable row level security;

create trigger on_comments_updated
  before update on public.comments
  for each row execute procedure public.handle_updated_at();

-- 2.4. E-commerce and Warehouse

-- Table: products
create table public.products (
  id uuid not null default gen_random_uuid() primary key,
  organization_id uuid not null references public.organizations(id),
  name text not null,
  description text,
  price numeric(10,2) not null default 0 check (price >= 0),
  currency text default 'PLN',
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.products enable row level security;

create trigger on_products_updated
  before update on public.products
  for each row execute procedure public.handle_updated_at();

-- Table: orders
create table public.orders (
  id uuid not null default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id),
  school_member_id uuid not null references public.school_members(id),
  status public.order_status default 'placed',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.orders enable row level security;

create trigger on_orders_updated
  before update on public.orders
  for each row execute procedure public.handle_updated_at();

-- Table: order_items
create table public.order_items (
  id uuid not null default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  currency text default 'PLN',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.order_items enable row level security;

create trigger on_order_items_updated
  before update on public.order_items
  for each row execute procedure public.handle_updated_at();

-- 2.5. Finance and Attendance

-- Table: payments
create table public.payments (
  id uuid not null default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id),
  school_member_id uuid not null references public.school_members(id),
  amount numeric(10,2) not null check (amount >= 0),
  currency text default 'PLN',
  period_start date,
  period_end date,
  status public.payment_status default 'pending',
  payment_date timestamptz,
  method public.payment_method default 'cash',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.payments enable row level security;

create trigger on_payments_updated
  before update on public.payments
  for each row execute procedure public.handle_updated_at();

-- Table: attendance
create table public.attendance (
  id uuid not null default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id),
  school_member_id uuid not null references public.school_members(id),
  date date not null,
  status public.attendance_status default 'absent',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.attendance enable row level security;

create trigger on_attendance_updated
  before update on public.attendance
  for each row execute procedure public.handle_updated_at();

-- 2.6. Communication

-- Table: announcements
create table public.announcements (
  id uuid not null default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id),
  author_id uuid not null references auth.users(id),
  title text not null,
  content text not null,
  priority public.priority_level default 'normal',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.announcements enable row level security;

create trigger on_announcements_updated
  before update on public.announcements
  for each row execute procedure public.handle_updated_at();

-- Table: announcement_reads
create table public.announcement_reads (
  id uuid not null default gen_random_uuid() primary key,
  announcement_id uuid references public.announcements(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  read_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.announcement_reads enable row level security;

create trigger on_announcement_reads_updated
  before update on public.announcement_reads
  for each row execute procedure public.handle_updated_at();


-- 3. Indexes
-- -----------------------------------------------------------------------------

-- Foreign Keys
create index idx_organizations_owner_id on public.organizations(owner_id);
create index idx_schools_organization_id on public.schools(organization_id);
create index idx_school_invites_school_id on public.school_invites(school_id);
create index idx_school_invites_created_by on public.school_invites(created_by);
create index idx_school_members_school_id on public.school_members(school_id);
create index idx_school_members_user_id on public.school_members(user_id);
create index idx_techniques_user_id on public.techniques(user_id);
create index idx_sequences_user_id on public.sequences(user_id);
create index idx_sequence_steps_sequence_id on public.sequence_steps(sequence_id);
create index idx_step_techniques_step_id on public.step_techniques(step_id);
create index idx_step_techniques_technique_id on public.step_techniques(technique_id);
create index idx_training_plans_user_id on public.training_plans(user_id);
create index idx_plan_sequences_training_plan_id on public.plan_sequences(training_plan_id);
create index idx_plan_sequences_sequence_id on public.plan_sequences(sequence_id);
create index idx_tags_user_id on public.tags(user_id);
create index idx_taggables_tag_id on public.taggables(tag_id);
create index idx_comments_user_id on public.comments(user_id);
create index idx_products_organization_id on public.products(organization_id);
create index idx_orders_school_id on public.orders(school_id);
create index idx_orders_user_id on public.orders(school_member_id);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_order_items_product_id on public.order_items(product_id);
create index idx_payments_school_id on public.payments(school_id);
create index idx_payments_user_id on public.payments(school_member_id);
create index idx_attendance_school_id on public.attendance(school_id);
create index idx_attendance_user_id on public.attendance(school_member_id);
create index idx_announcements_school_id on public.announcements(school_id);
create index idx_announcements_author_id on public.announcements(author_id);
create index idx_announcement_reads_announcement_id on public.announcement_reads(announcement_id);
create index idx_announcement_reads_user_id on public.announcement_reads(user_id);

-- WatermelonDB Sync (updated_at)
create index idx_organizations_updated_at on public.organizations(updated_at);
create index idx_schools_updated_at on public.schools(updated_at);
create index idx_school_invites_updated_at on public.school_invites(updated_at);
create index idx_school_members_updated_at on public.school_members(updated_at);
create index idx_techniques_updated_at on public.techniques(updated_at);
create index idx_sequences_updated_at on public.sequences(updated_at);
create index idx_sequence_steps_updated_at on public.sequence_steps(updated_at);
create index idx_step_techniques_updated_at on public.step_techniques(updated_at);
create index idx_training_plans_updated_at on public.training_plans(updated_at);
create index idx_plan_sequences_updated_at on public.plan_sequences(updated_at);
create index idx_tags_updated_at on public.tags(updated_at);
create index idx_taggables_updated_at on public.taggables(updated_at);
create index idx_comments_updated_at on public.comments(updated_at);
create index idx_products_updated_at on public.products(updated_at);
create index idx_orders_updated_at on public.orders(updated_at);
create index idx_order_items_updated_at on public.order_items(updated_at);
create index idx_payments_updated_at on public.payments(updated_at);
create index idx_attendance_updated_at on public.attendance(updated_at);
create index idx_announcements_updated_at on public.announcements(updated_at);
create index idx_announcement_reads_updated_at on public.announcement_reads(updated_at);

-- Polymorphism
create index idx_taggables_type_id on public.taggables(taggable_type, taggable_id);
create index idx_comments_type_id on public.comments(commentable_type, commentable_id);

-- Business Logic
create index idx_school_invites_code on public.school_invites(code);
create index idx_attendance_school_date on public.attendance(school_id, date);
create index idx_payments_user_period_end on public.payments(school_member_id, period_end);


-- 4. RLS Policies
-- -----------------------------------------------------------------------------

-- Helper function to check if user is a member of a school in the organization
create or replace function public.is_member_of_org_school(org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.schools s
    join public.school_members sm on s.id = sm.school_id
    where s.organization_id = org_id
    and sm.user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Helper function to check if user is a member of a specific school (Fixed ambiguous column)
create or replace function public.is_member_of_school(check_school_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.school_members sm
    where sm.school_id = check_school_id
    and sm.user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Helper function to check if user is the owner of the organization owning the school
create or replace function public.is_school_owner(check_school_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.schools s
    join public.organizations o on s.organization_id = o.id
    where s.id = check_school_id
    and o.owner_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Helper function to check if user is the owner of the organization
create or replace function public.is_org_owner(check_org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.organizations o
    where o.id = check_org_id
    and o.owner_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 4.1. Organizations
-- ALL: Owner
create policy "Organizations are viewable by owner"
  on public.organizations for all
  to authenticated
  using (owner_id = auth.uid());

-- SELECT: Members of schools in the organization
create policy "Organizations are viewable by school members"
  on public.organizations for select
  to authenticated
  using (public.is_member_of_org_school(id));

-- 4.2. Schools
-- ALL: Organization Owner
create policy "Schools are manageable by organization owner"
  on public.schools for all
  to authenticated
  using (public.is_org_owner(organization_id));

-- SELECT: School Members (Restricted to Owners as requested)
create policy "Schools are viewable by Owner"
  on public.schools for select
  to authenticated
  using (public.is_school_owner(id));

-- 4.3. School Invites
-- ALL: Organization Owner / Instructor (who created it)
create policy "Invites are manageable by creator or org owner"
  on public.school_invites for all
  to authenticated
  using (
    created_by = auth.uid() or
    public.is_school_owner(school_id)
  );

-- SELECT: Public (needed to validate code)
create policy "Invites are viewable by authenticated users"
  on public.school_invites for select
  to authenticated
  using (true);

-- 4.4. School Members
-- SELECT: User sees own membership
create policy "Users can see own memberships"
  on public.school_members for select
  to authenticated
  using (user_id = auth.uid());

-- ALL: Organization Owner (manage members)
create policy "Org owners can manage members"
  on public.school_members for all
  to authenticated
  using (public.is_school_owner(school_id));

-- INSERT: Users can join
create policy "Users can join schools"
  on public.school_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- 4.5. 3D Resources (Techniques, Sequences, Steps, Plans)
-- Techniques
create policy "Techniques are private to user"
  on public.techniques for all
  to authenticated
  using (user_id = auth.uid());

-- Sequences
create policy "Sequences are private to user"
  on public.sequences for all
  to authenticated
  using (user_id = auth.uid());

-- Sequence Steps
create policy "Steps are private via sequence"
  on public.sequence_steps for all
  to authenticated
  using (exists (
    select 1 from public.sequences s
    where s.id = sequence_id
    and s.user_id = auth.uid()
  ));

-- Step Techniques
create policy "Step techniques are private via step"
  on public.step_techniques for all
  to authenticated
  using (exists (
    select 1 from public.sequence_steps ss
    join public.sequences s on ss.sequence_id = s.id
    where ss.id = step_id
    and s.user_id = auth.uid()
  ));

-- Training Plans
create policy "Training plans are private to user"
  on public.training_plans for all
  to authenticated
  using (user_id = auth.uid());

-- Plan Sequences
create policy "Plan sequences are private via plan"
  on public.plan_sequences for all
  to authenticated
  using (exists (
    select 1 from public.training_plans tp
    where tp.id = training_plan_id
    and tp.user_id = auth.uid()
  ));

-- 4.6. Polymorphism (Tags, Taggables, Comments)

-- Tags
create policy "Tags are private to user"
  on public.tags for all
  to authenticated
  using (user_id = auth.uid());

-- Taggables
create policy "Taggables are private via tag"
  on public.taggables for all
  to authenticated
  using (exists (
    select 1 from public.tags t
    where t.id = tag_id
    and t.user_id = auth.uid()
  ));

-- Comments
create policy "Comments are private to user"
  on public.comments for all
  to authenticated
  using (user_id = auth.uid());

-- 4.7. Products
-- ALL: Org Owner
create policy "Products manageable by org owner"
  on public.products for all
  to authenticated
  using (public.is_org_owner(organization_id));

-- SELECT: School Members
create policy "Products viewable by school members"
  on public.products for select
  to authenticated
  using (public.is_member_of_org_school(organization_id));

-- 4.8. Orders
-- SELECT: User (own orders via member) OR Org Owner
create policy "Orders viewable by user or org owner"
  on public.orders for select
  to authenticated
  using (
    exists (
      select 1 from public.school_members sm
      where sm.id = school_member_id
      and sm.user_id = auth.uid()
    ) or
    public.is_school_owner(school_id)
  );

-- INSERT: User (via member)
create policy "Users can create orders"
  on public.orders for insert
  to authenticated
  with check (
    exists (
      select 1 from public.school_members sm
      where sm.id = school_member_id
      and sm.user_id = auth.uid()
    )
  );

-- UPDATE: Org Owner (status)
create policy "Org owner can update orders"
  on public.orders for update
  to authenticated
  using (public.is_school_owner(school_id));

-- 4.9. Order Items
-- Inherit access from Order
create policy "Order items access via order"
  on public.order_items for all
  to authenticated
  using (exists (
    select 1 from public.orders ord
    where ord.id = order_id
    and (
      exists (
        select 1 from public.school_members sm
        where sm.id = ord.school_member_id
        and sm.user_id = auth.uid()
      )
      or
      public.is_school_owner(ord.school_id)
    )
  ));

-- 4.10. Payments
-- SELECT: User (own) OR Org Owner
create policy "Payments viewable by user or org owner"
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1 from public.school_members sm
      where sm.id = school_member_id
      and sm.user_id = auth.uid()
    )
    or
    public.is_school_owner(school_id)
  );

-- 4.11. Attendance
-- SELECT: User (own) OR Org Owner
create policy "Attendance viewable by user or org owner"
  on public.attendance for select
  to authenticated
  using (
    exists (
      select 1 from public.school_members sm
      where sm.id = school_member_id
      and sm.user_id = auth.uid()
    )
    or
    public.is_school_owner(school_id)
  );

-- INSERT/UPDATE: Org Owner
create policy "Org owner can manage attendance"
  on public.attendance for all
  to authenticated
  using (public.is_school_owner(school_id));

-- 4.12. Announcements
-- ALL: Org Owner / Author (Instructor)
create policy "Announcements manageable by author or org owner"
  on public.announcements for all
  to authenticated
  using (
    author_id = auth.uid() or
    public.is_school_owner(school_id)
  );

-- SELECT: School Members
create policy "Announcements viewable by school members"
  on public.announcements for select
  to authenticated
  using (public.is_member_of_school(school_id));

-- 4.13. Announcement Reads
-- ALL: User (mark as read)
create policy "Users can manage own read status"
  on public.announcement_reads for all
  to authenticated
  using (user_id = auth.uid());


-- 5. Auth Integration
-- -----------------------------------------------------------------------------

-- Function to handle new user signup (creates organization for instructors)
create or replace function public.handle_new_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_school_id uuid;
  v_organization_name text;
  v_school_name text;
begin
  raise notice 'Trigger called for user: %', new.id;

  -- Extract organization and school names from user metadata
  v_organization_name := new.raw_user_meta_data->>'organization_name';
  v_school_name := new.raw_user_meta_data->>'school_name';

  raise notice 'Organization name: %, School name: %', v_organization_name, v_school_name;

  -- Only create organization if metadata is present (instructor signup)
  if v_organization_name is not null and v_school_name is not null then
    raise notice 'Creating organization...';

    -- Create organization
    insert into public.organizations (
      owner_id,
      name
    ) values (
      new.id,
      v_organization_name
    )
    returning id into v_organization_id;

    raise notice 'Organization created with ID: %', v_organization_id;

    -- Create default roles
    insert into public.organization_roles (organization_id, name, is_system_default)
    values
      (v_organization_id, 'Owner', true),
      (v_organization_id, 'Instructor', true),
      (v_organization_id, 'Student', true);

    raise notice 'Roles created';

    -- Create first school
    insert into public.schools (
      organization_id,
      name
    ) values (
      v_organization_id,
      v_school_name
    )
    returning id into v_school_id;

    raise notice 'School created with ID: %', v_school_id;
  else
    raise notice 'Skipping organization creation - missing metadata';
  end if;

  return new;
exception
  when others then
    raise notice 'ERROR in trigger: %', SQLERRM;
    raise;
end;
$$;

-- Create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_signup();

-- Grant necessary permissions for trigger
grant usage on schema public to supabase_auth_admin;
grant all on all tables in schema public to supabase_auth_admin;
grant all on all sequences in schema public to supabase_auth_admin;
grant insert, select on table public.organizations to supabase_auth_admin;
grant insert on table public.organization_roles to supabase_auth_admin;
grant insert on table public.schools to supabase_auth_admin;
grant execute on function public.handle_new_user_signup() to supabase_auth_admin;
alter function public.handle_new_user_signup() security definer;

comment on function public.handle_new_user_signup() is
'Automatically creates organization and school when a new instructor signs up via Supabase Auth. Looks for organization_name and school_name in user metadata. Includes debug logging.';


-- 6. RPC Functions
-- -----------------------------------------------------------------------------

-- RPC function to setup instructor after signup
-- This can be called directly from the client after signup completes
create or replace function public.setup_instructor_organization(
  p_user_id uuid,
  p_organization_name text,
  p_school_name text,
  p_full_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_school_id uuid;
  v_owner_role_id uuid;
begin
  -- Verify the user exists and matches the caller
  if p_user_id != auth.uid() then
    raise exception 'Unauthorized';
  end if;

  -- Check if organization already exists for this user
  select id into v_organization_id
  from public.organizations
  where owner_id = p_user_id
  limit 1;

  if v_organization_id is not null then
    raise exception 'Organization already exists for this user';
  end if;

  -- Create organization
  insert into public.organizations (
    owner_id,
    name
  ) values (
    p_user_id,
    p_organization_name
  )
  returning id into v_organization_id;

  -- Create default roles
  insert into public.organization_roles (organization_id, name, is_system_default)
  values
    (v_organization_id, 'Owner', true),
    (v_organization_id, 'Instructor', true),
    (v_organization_id, 'Student', true);

  -- Create first school
  insert into public.schools (
    organization_id,
    name
  ) values (
    v_organization_id,
    p_school_name
  )
  returning id into v_school_id;

  -- Return the created IDs
  return jsonb_build_object(
    'organization_id', v_organization_id,
    'school_id', v_school_id,
    'success', true
  );

exception
  when others then
    raise exception 'Failed to setup organization: %', SQLERRM;
end;
$$;

comment on function public.setup_instructor_organization is
'Creates organization, roles, and school for a newly registered instructor. Must be called by the user themselves.';
