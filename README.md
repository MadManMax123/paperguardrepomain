# PaperVault

A fast, modern, community-driven repository of school examination papers — search, preview,
and download ISC & CBSE papers from any school. Built with Next.js (App Router), TypeScript,
Tailwind, and Supabase (Postgres + Auth + Storage + RLS).

## Architecture

```
Next.js App Router (RSC by default, client components only where interactive)
├── src/app/                     Pages & API routes
│   ├── page.tsx                 Homepage (stats, recent, popular subjects — all live from DB)
│   ├── papers/                  Search & filter page (URL-driven, server-rendered results)
│   ├── paper/[id]/              Paper detail + embedded PDF preview (signed URL)
│   ├── schools/[slug]/          Per-school stats & paper browsing
│   ├── upload/                  Auth-gated upload form + "my uploads" status
│   ├── admin/                   Moderator dashboard (pending, school requests, reports, stats)
│   ├── login/, auth/callback/   OAuth sign-in (Google, GitHub) — no email/password
│   ├── api/download/[id]/       Signed download + download-count tracking
│   ├── api/zip/                 Server-side ZIP generation (selected or filtered papers)
│   └── sitemap.ts, robots.ts    SEO
├── src/components/               Reusable UI (shadcn-style primitives + feature components)
├── src/lib/
│   ├── supabase/                browser client, server (SSR/cookies) client, admin (service-role) client
│   ├── data/papers.ts           Server-only query helpers (search, filters, stats)
│   ├── validations.ts           Zod schemas (upload, search, reports, school requests)
│   └── database.types.ts        Hand-authored types mirroring the SQL schema
└── src/middleware.ts             Refreshes the Supabase auth session cookie on each request
```

**Why this structure:** Postgres is the single source of truth for all metadata (including
`file_path`); Storage just holds bytes. Every "public" read goes through Supabase's anon key
and is constrained entirely by Row Level Security — the app has no separate authorization layer
to keep in sync. The `SUPABASE_SERVICE_ROLE_KEY` is only ever read inside `src/lib/supabase/admin.ts`
(marked `server-only`) and only used in two places that need to bypass RLS deliberately: signing
download URLs and building ZIPs of already-approved papers.

## Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine to start)
- (Optional but recommended) the [Supabase CLI](https://supabase.com/docs/guides/cli) for running
  migrations and local dev

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migrations in order:
   - `supabase/migrations/0001_init.sql` (schema, indexes, RLS, storage policies)
   - `supabase/migrations/0002_owner_edits_and_help_requests.sql` (owner edit/resubmit, help requests table)
   - `supabase/seed.sql` (boards, classes, subjects, exam types, example schools)

   Or, with the CLI, from the project root:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   psql "$(supabase db remote commit --dry-run 2>/dev/null)" # or just paste seed.sql into the SQL editor
   ```
3. **Enable OAuth providers.** In Supabase Dashboard → Authentication → Providers, enable
   **Google** (and/or **GitHub**) and fill in the OAuth client ID/secret from that provider's
   console. Set the redirect URL they give you to:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   PaperVault only supports OAuth sign-in (no email/password, no magic links) — this keeps
   account creation frictionless and avoids running an email service.
4. **Promote your own account to moderator/admin** once you've signed in once (so `profiles`
   has a row for you):
   ```sql
   update profiles set role = 'admin' where id = '<your-user-uuid>';
   ```
   Find your UUID under Authentication → Users.

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → `service_role` secret.
  **Never** commit this or prefix it with `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` for local dev, your production URL later.

## 3. Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Sign in via `/login`, upload a paper, then approve it from
`/admin` (once your account has the `moderator` or `admin` role — see step 1.4).

## Deployment (Vercel + Supabase)

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the same environment variables from `.env.local` in Vercel's Project Settings →
   Environment Variables (all three Supabase vars, plus `NEXT_PUBLIC_SITE_URL` set to your
   production domain).
4. In Supabase Dashboard → Authentication → URL Configuration, add your production domain
   to **Redirect URLs** (e.g. `https://your-domain.com/auth/callback`).
5. Deploy. Vercel will build with `next build`; no further config is needed since Supabase
   is fully managed.

## Key implementation notes

- **RLS is the authorization system.** Public/anon users can only `select` `papers` where
  `status = 'approved'`. Owners can read/edit their own paper while it's `pending`. Only
  `profiles.role in ('moderator','admin')` can approve/reject/delete/edit any paper, verify
  schools, or resolve reports. See `supabase/migrations/0001_init.sql` for every policy.
- **Storage policies** restrict uploads to a `{user_id}/...` path prefix per user, so one
  user can never overwrite or delete another's file; only moderators (or the uploader, while
  still pending) can delete an object.
- **Downloads** go through `/api/download/[id]`, which checks `status = 'approved'` server-side,
  mints a short-lived signed URL, logs a row to `paper_downloads`, and atomically increments
  `papers.download_count` via the `increment_download_count` Postgres function — so "Most
  downloaded" sorting is always cheap (an indexed column) rather than a live `count(*)` join.
- **ZIP downloads** (`/api/zip`) run entirely server-side using the service-role client so the
  key never reaches the browser, and always re-filter to `status = 'approved'` even if a
  stale/tampered paper ID list is sent from the client. For the scale described in the spec
  (a school's papers, a subject across years, etc.) this streams synchronously; if paper counts
  grow into the hundreds-plus-per-request range, swap this route for a queued background job
  (e.g. a Supabase Edge Function that writes the finished ZIP to a private bucket and notifies
  the user) rather than holding an HTTP connection open.
- **Search** (`/papers`) is fully server-rendered from `searchParams`, so every filter
  combination is a shareable, indexable URL, and no dataset is ever shipped to the client
  to filter in-browser — everything is a scoped Postgres query using the composite index
  `(status, board, class, year, subject_id, exam_type)`.
- **Subjects, boards, classes, exam types** are all rows in lookup tables (not hard-coded
  enums in the UI), so adding e.g. "ICSE" or "Class X" later is a data change, not a code
  change — the schema comments in `0001_init.sql` call out exactly where.
- **Owners can edit their own papers** while `pending`, and can edit a `rejected` paper to
  fix it and resubmit — the RLS `with check` clause forces the edited row back to `pending`
  regardless of which state it started in, so this can't be used to bypass review. Once a
  paper is `approved`, only moderators can touch it; owners go through **Reports** instead.
  See `0002_owner_edits_and_help_requests.sql`.
- **Help requests** are a general "contact a moderator" channel (account issues, a stuck
  upload, questions) distinct from per-paper **Reports**. The floating help button is
  available site-wide; moderators reply from the **Help requests** tab in `/admin`, and the
  reply shows up back in the same widget for the user — there's no email step.

## What's intentionally deferred (see "Future-proofing" in the spec)

The schema and RLS already accommodate these without a rewrite; only UI/routes would need
to be added: ICSE / state boards, Class IX/X, practical papers, answer keys, marking schemes,
notes, syllabus PDFs. Add rows to `boards`/`classes`/a new `resource_type` alongside `papers`,
and the existing filter/search machinery picks them up automatically.
#   p a p e r g u a r d  
 