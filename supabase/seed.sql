-- Seed reference data. Safe to re-run.

insert into boards (id, name) values
  ('isc', 'ISC'),
  ('cbse', 'CBSE')
on conflict (id) do nothing;

insert into classes (id, name, sort_order) values
  ('xi', 'XI', 1),
  ('xii', 'XII', 2)
on conflict (id) do nothing;

insert into exam_types (id, name, sort_order) values
  ('unit-test', 'Unit Test', 1),
  ('periodic-test', 'Periodic Test', 2),
  ('term-1', 'Term 1', 3),
  ('term-2', 'Term 2', 4),
  ('half-yearly', 'Half-Yearly', 5),
  ('annual', 'Annual', 6),
  ('pre-board', 'Pre-Board', 7),
  ('board-examination', 'Board Examination', 8),
  ('other', 'Other', 9)
on conflict (id) do nothing;

insert into subjects (id, name) values
  ('physics', 'Physics'),
  ('chemistry', 'Chemistry'),
  ('mathematics', 'Mathematics'),
  ('biology', 'Biology'),
  ('computer-science', 'Computer Science'),
  ('english', 'English'),
  ('economics', 'Economics'),
  ('accounts', 'Accounts'),
  ('business-studies', 'Business Studies'),
  ('history', 'History'),
  ('geography', 'Geography')
on conflict (id) do nothing;

-- A couple of example verified schools so the UI has something to show pre-launch.
insert into schools (slug, name, city, state, board, verified) values
  ('dps-newtown', 'DPS Newtown', 'Kolkata', 'West Bengal', 'cbse', true),
  ('la-martiniere-kolkata', 'La Martiniere for Boys', 'Kolkata', 'West Bengal', 'isc', true)
on conflict (slug) do nothing;
