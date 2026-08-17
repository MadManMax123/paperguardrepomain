-- =========================================================
-- 0002: owner edits (incl. resubmit-after-rejection) + help requests
-- =========================================================

-- ---------------------------------------------------------
-- PAPERS: widen the existing "owner can edit while pending" policy so an
-- owner can also edit a REJECTED paper of theirs — the edit must bring it
-- back to 'pending' (checked below), which re-queues it for review. This
-- turns rejection into "fix and resubmit" instead of a dead end, without
-- giving owners any way to touch an already-approved paper (those still
-- require going through Reports -> moderator, unchanged).
-- ---------------------------------------------------------
drop policy if exists "owner can edit own pending paper" on papers;

create policy "owner can edit own pending paper or resubmit rejected"
  on papers for update
  using (auth.uid() = uploaded_by and status in ('pending', 'rejected'))
  with check (auth.uid() = uploaded_by and status = 'pending');

-- ---------------------------------------------------------
-- HELP REQUESTS (general "contact an admin" mechanism, distinct from
-- per-paper Reports — e.g. "my upload has been pending for two weeks",
-- account issues, questions about the site).
-- ---------------------------------------------------------
create type help_request_status as enum ('open', 'resolved');

create table help_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  subject text not null,
  message text not null,
  status help_request_status not null default 'open',
  admin_response text,
  resolved_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_help_requests_status on help_requests(status);
create index idx_help_requests_user on help_requests(user_id);
create index idx_help_requests_created on help_requests(created_at desc);

-- Reuses the set_updated_at() helper defined for papers in 0001_init.sql.
create trigger help_requests_set_updated_at
  before update on help_requests
  for each row execute procedure set_updated_at();

alter table help_requests enable row level security;

create policy "help requests insertable by authenticated users"
  on help_requests for insert
  with check (auth.uid() = user_id);

create policy "help requests readable by owner or moderator"
  on help_requests for select
  using (auth.uid() = user_id or is_moderator());

create policy "help requests updatable by moderator"
  on help_requests for update
  using (is_moderator())
  with check (is_moderator());
