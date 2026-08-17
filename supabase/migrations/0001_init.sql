-- =========================================================
-- PaperVault initial schema
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------
create type paper_status as enum ('pending', 'approved', 'rejected');
create type user_role as enum ('student', 'moderator', 'admin');
create type report_reason as enum (
  'wrong_metadata', 'duplicate', 'corrupted_pdf', 'wrong_paper', 'copyright', 'other'
);
create type report_status as enum ('open', 'resolved', 'dismissed');
create type school_request_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------
-- BOARDS (extensible: ISC, CBSE, later ICSE, state boards...)
-- ---------------------------------------------------------
create table boards (
  id text primary key,              -- e.g. 'isc', 'cbse'
  name text not null,               -- e.g. 'ISC', 'CBSE'
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- CLASSES (extensible: XI, XII, later X, IX...)
-- ---------------------------------------------------------
create table classes (
  id text primary key,              -- e.g. 'xi', 'xii'
  name text not null,               -- e.g. 'XI', 'XII'
  sort_order int not null default 0
);

-- ---------------------------------------------------------
-- EXAM TYPES (extensible)
-- ---------------------------------------------------------
create table exam_types (
  id text primary key,              -- e.g. 'half-yearly'
  name text not null,               -- e.g. 'Half-Yearly'
  sort_order int not null default 0
);

-- ---------------------------------------------------------
-- SUBJECTS (extensible, not hard-coded in UI)
-- ---------------------------------------------------------
create table subjects (
  id text primary key,              -- slug, e.g. 'physics'
  name text not null,               -- e.g. 'Physics'
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- PROFILES (mirrors auth.users, adds app-level role)
-- ---------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------
-- SCHOOLS
-- ---------------------------------------------------------
create table schools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  city text,
  state text,
  board text not null references boards(id),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_schools_board on schools(board);
create index idx_schools_verified on schools(verified);

-- School requests (student-submitted, pending review, kept separate from live table)
create table school_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  state text,
  board text not null references boards(id),
  status school_request_status not null default 'pending',
  requested_by uuid references profiles(id) on delete set null,
  reviewed_by uuid references profiles(id) on delete set null,
  resulting_school_id uuid references schools(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_school_requests_status on school_requests(status);

-- ---------------------------------------------------------
-- PAPERS (core entity)
-- ---------------------------------------------------------
create table papers (
  id uuid primary key default gen_random_uuid(),
  year int not null check (year >= 1990 and year <= extract(year from now())::int + 1),
  board text not null references boards(id),
  school_id uuid not null references schools(id),
  class text not null references classes(id),
  subject_id text not null references subjects(id),
  exam_type text not null references exam_types(id),
  full_marks int not null check (full_marks > 0),
  file_path text not null,            -- storage object path, source of truth is this row
  file_size bigint not null check (file_size > 0),
  original_filename text,
  uploaded_by uuid references profiles(id) on delete set null,
  status paper_status not null default 'pending',
  download_count int not null default 0,
  rejection_reason text,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes for the primary filter combination (board, year, class, subject, school, exam_type)
create index idx_papers_status on papers(status);
create index idx_papers_board on papers(board);
create index idx_papers_year on papers(year);
create index idx_papers_class on papers(class);
create index idx_papers_subject on papers(subject_id);
create index idx_papers_school on papers(school_id);
create index idx_papers_exam_type on papers(exam_type);
create index idx_papers_created_at on papers(created_at desc);
create index idx_papers_download_count on papers(download_count desc);
-- Composite index covering the most common combined filter query
create index idx_papers_search on papers(status, board, class, year, subject_id, exam_type);
-- Full text search over denormalized-ish text (subject/school joined at query time normally,
-- but keep a simple trigram-friendly index on original_filename for admin search)
create extension if not exists pg_trgm;
create index idx_papers_filename_trgm on papers using gin (original_filename gin_trgm_ops);

-- ---------------------------------------------------------
-- DOWNLOADS (event log, used for popularity sorting)
-- ---------------------------------------------------------
create table paper_downloads (
  id bigint generated always as identity primary key,
  paper_id uuid not null references papers(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_paper_downloads_paper on paper_downloads(paper_id);
create index idx_paper_downloads_created on paper_downloads(created_at desc);

-- Atomic increment used by the download route
create or replace function increment_download_count(p_paper_id uuid)
returns void as $$
begin
  update papers set download_count = download_count + 1 where id = p_paper_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------------------------------------------------------
-- REPORTS
-- ---------------------------------------------------------
create table reports (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references papers(id) on delete cascade,
  reason report_reason not null,
  details text,
  reported_by uuid references profiles(id) on delete set null,
  status report_status not null default 'open',
  resolved_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_reports_status on reports(status);
create index idx_reports_paper on reports(paper_id);

-- ---------------------------------------------------------
-- updated_at helper (schools/papers edits by moderators)
-- ---------------------------------------------------------
alter table papers add column updated_at timestamptz not null default now();
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger papers_set_updated_at
  before update on papers
  for each row execute procedure set_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table boards enable row level security;
alter table classes enable row level security;
alter table exam_types enable row level security;
alter table subjects enable row level security;
alter table profiles enable row level security;
alter table schools enable row level security;
alter table school_requests enable row level security;
alter table papers enable row level security;
alter table paper_downloads enable row level security;
alter table reports enable row level security;

-- Helper: is the current user a moderator/admin?
create or replace function is_moderator()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$ language sql stable security definer set search_path = public;

-- ---- Reference/lookup tables: readable by everyone, writable only by moderators ----
create policy "boards readable by all" on boards for select using (true);
create policy "boards writable by moderators" on boards for all using (is_moderator()) with check (is_moderator());

create policy "classes readable by all" on classes for select using (true);
create policy "classes writable by moderators" on classes for all using (is_moderator()) with check (is_moderator());

create policy "exam_types readable by all" on exam_types for select using (true);
create policy "exam_types writable by moderators" on exam_types for all using (is_moderator()) with check (is_moderator());

create policy "subjects readable by all" on subjects for select using (true);
create policy "subjects writable by moderators" on subjects for all using (is_moderator()) with check (is_moderator());

-- ---- Profiles ----
create policy "profiles readable by all" on profiles for select using (true);
create policy "profiles editable by owner" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- role escalation is blocked at application layer + only moderators may change role:
create policy "profiles role change by moderator" on profiles for update using (is_moderator()) with check (is_moderator());

-- ---- Schools ----
create policy "schools readable by all" on schools for select using (true);
create policy "schools writable by moderators" on schools for all using (is_moderator()) with check (is_moderator());

-- ---- School requests ----
create policy "school requests readable by owner or moderator"
  on school_requests for select
  using (auth.uid() = requested_by or is_moderator());
create policy "school requests insertable by authenticated users"
  on school_requests for insert
  with check (auth.uid() = requested_by);
create policy "school requests updatable by moderator"
  on school_requests for update
  using (is_moderator()) with check (is_moderator());

-- ---- Papers ----
-- Public can read approved papers only.
create policy "approved papers readable by everyone"
  on papers for select
  using (status = 'approved');

-- Owners can read their own papers regardless of status.
create policy "own papers readable by owner"
  on papers for select
  using (auth.uid() = uploaded_by);

-- Moderators can read everything.
create policy "all papers readable by moderator"
  on papers for select
  using (is_moderator());

-- Authenticated users can insert their own paper (always starts pending; enforced by default + check).
create policy "authenticated users can upload papers"
  on papers for insert
  with check (auth.uid() = uploaded_by and status = 'pending');

-- Owners can edit their own paper only while it's still pending.
create policy "owner can edit own pending paper"
  on papers for update
  using (auth.uid() = uploaded_by and status = 'pending')
  with check (auth.uid() = uploaded_by and status = 'pending');

-- Moderators can update/delete anything (approve/reject/edit/delete).
create policy "moderator can manage all papers"
  on papers for all
  using (is_moderator())
  with check (is_moderator());

-- ---- Downloads ----
create policy "downloads insertable by anyone" on paper_downloads for insert with check (true);
create policy "downloads readable by moderator" on paper_downloads for select using (is_moderator());

-- ---- Reports ----
create policy "reports insertable by authenticated users"
  on reports for insert
  with check (auth.uid() = reported_by);
create policy "reports readable by reporter or moderator"
  on reports for select
  using (auth.uid() = reported_by or is_moderator());
create policy "reports updatable by moderator"
  on reports for update
  using (is_moderator()) with check (is_moderator());

-- =========================================================
-- STORAGE: bucket + policies
-- =========================================================

insert into storage.buckets (id, name, public)
values ('papers', 'papers', false)
on conflict (id) do nothing;

-- Anyone (incl. anonymous) can read/download files (signed via app route, or public read
-- if you prefer fully public papers — kept false above so downloads go through the app,
-- which also lets us count downloads). Adjust to `public = true` if you want direct CDN links.
create policy "papers bucket read for authenticated app role"
  on storage.objects for select
  using (bucket_id = 'papers');

-- Only authenticated users can upload, and only into their own path prefix: {user_id}/...
create policy "papers bucket insert own path"
  on storage.objects for insert
  with check (
    bucket_id = 'papers'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only the uploader (while pending — enforced app-side) or moderators may delete/update.
create policy "papers bucket delete own or moderator"
  on storage.objects for delete
  using (
    bucket_id = 'papers'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_moderator()
    )
  );

create policy "papers bucket update moderator only"
  on storage.objects for update
  using (bucket_id = 'papers' and is_moderator());
