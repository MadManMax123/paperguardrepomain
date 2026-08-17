-- =========================================================
-- 0003: subject requests (student-submitted, moderator-reviewed)
--
-- Subjects were previously moderator-only (see 0001_init.sql policy
-- "subjects writable by moderators"). This adds a request/review queue
-- for subjects, mirroring school_requests, so any authenticated user
-- can propose a subject that isn't in the list yet without being able
-- to write directly into the live `subjects` table.
-- =========================================================

create type subject_request_status as enum ('pending', 'approved', 'rejected');

create table subject_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status subject_request_status not null default 'pending',
  requested_by uuid references profiles(id) on delete set null,
  reviewed_by uuid references profiles(id) on delete set null,
  resulting_subject_id text references subjects(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_subject_requests_status on subject_requests(status);

-- Trigram index so the UI (or an admin tool) can ask Postgres for
-- similarly-named pending requests/subjects, not just exact matches.
create index idx_subject_requests_name_trgm on subject_requests using gin (name gin_trgm_ops);

alter table subject_requests enable row level security;

create policy "subject requests readable by owner or moderator"
  on subject_requests for select
  using (auth.uid() = requested_by or is_moderator());

create policy "subject requests insertable by authenticated users"
  on subject_requests for insert
  with check (auth.uid() = requested_by);

create policy "subject requests updatable by moderator"
  on subject_requests for update
  using (is_moderator())
  with check (is_moderator());
