/*
  Migration: Technique Notes Module
  Date: 2026-04-17
  Description:
  - Create technique_note_documents table (user-owned descriptive note documents)
  - Create technique_note_rows table (rows within a document)
  - RLS policies: users can only access their own documents and rows
*/

-- ============================================================
-- technique_note_documents
-- ============================================================

create table if not exists public.technique_note_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_technique_note_documents_user_id
  on public.technique_note_documents(user_id);

alter table public.technique_note_documents enable row level security;

create policy "Users can read own technique_note_documents"
  on public.technique_note_documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own technique_note_documents"
  on public.technique_note_documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own technique_note_documents"
  on public.technique_note_documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own technique_note_documents"
  on public.technique_note_documents for delete
  using (auth.uid() = user_id);

-- ============================================================
-- technique_note_rows
-- ============================================================

create table if not exists public.technique_note_rows (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.technique_note_documents(id) on delete cascade,
  order_index integer not null,
  person_1_text text not null default '',
  person_2_text text not null default '',
  direction text not null default '1->2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_technique_note_rows_document_id
  on public.technique_note_rows(document_id);

alter table public.technique_note_rows enable row level security;

-- Rows are accessible to the owner of the parent document
create policy "Users can read own technique_note_rows"
  on public.technique_note_rows for select
  using (
    exists (
      select 1 from public.technique_note_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users can insert own technique_note_rows"
  on public.technique_note_rows for insert
  with check (
    exists (
      select 1 from public.technique_note_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users can update own technique_note_rows"
  on public.technique_note_rows for update
  using (
    exists (
      select 1 from public.technique_note_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.technique_note_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users can delete own technique_note_rows"
  on public.technique_note_rows for delete
  using (
    exists (
      select 1 from public.technique_note_documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );
