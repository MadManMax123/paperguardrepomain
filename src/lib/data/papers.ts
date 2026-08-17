import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaperSearchInput } from "@/lib/validations";

const PAGE_SIZE = 24;

export async function searchPapers(params: PaperSearchInput) {
  const supabase = createClient();

  let query = supabase
    .from("papers")
    .select(
      `id, year, board, class, exam_type, full_marks, file_size, status, download_count, created_at,
       subjects:subject_id ( id, name ),
       schools:school_id ( id, slug, name, verified )`,
      { count: "exact" }
    )
    .eq("status", "approved");

  if (params.board) query = query.eq("board", params.board);
  if (params.year) query = query.eq("year", params.year);
  if (params.class) query = query.eq("class", params.class);
  if (params.subject) query = query.eq("subject_id", params.subject);
  if (params.exam) query = query.eq("exam_type", params.exam);
  if (params.school) query = query.eq("school_id", params.school);

  switch (params.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "popular":
      query = query.order("download_count", { ascending: false });
      break;
    case "newest":
    case "relevance": // no full text query yet -> fall back to newest
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const from = (params.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { papers: data ?? [], total: count ?? 0, pageSize: PAGE_SIZE };
}

export async function getPaperById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("papers")
    .select(
      `id, year, board, class, exam_type, full_marks, file_path, file_size, original_filename,
       status, download_count, created_at,
       subjects:subject_id ( id, name ),
       schools:school_id ( id, slug, name, city, state, verified )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getFilterOptions() {
  const supabase = createClient();
  const [{ data: boards }, { data: classes }, { data: subjects }, { data: examTypes }, { data: years }] =
    await Promise.all([
      supabase.from("boards").select("id, name").order("name"),
      supabase.from("classes").select("id, name").order("sort_order"),
      supabase.from("subjects").select("id, name").order("name"),
      supabase.from("exam_types").select("id, name").order("sort_order"),
      supabase.from("papers").select("year").eq("status", "approved").order("year", { ascending: false }),
    ]);

  const distinctYears = Array.from(new Set((years ?? []).map((r) => r.year)));

  return {
    boards: boards ?? [],
    classes: classes ?? [],
    subjects: subjects ?? [],
    examTypes: examTypes ?? [],
    years: distinctYears,
  };
}

export async function getSchoolsForFilter() {
  const supabase = createClient();
  const { data } = await supabase.from("schools").select("id, name, board").order("name");
  return data ?? [];
}

export async function getHomepageStats() {
  const supabase = createClient();
  const [{ count: totalPapers }, { count: totalSchools }, { count: totalSubjects }, { data: years }] =
    await Promise.all([
      supabase.from("papers").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("schools").select("id", { count: "exact", head: true }),
      supabase.from("subjects").select("id", { count: "exact", head: true }),
      supabase.from("papers").select("year").eq("status", "approved"),
    ]);

  const distinctYears = new Set((years ?? []).map((r) => r.year));

  return {
    totalPapers: totalPapers ?? 0,
    totalSchools: totalSchools ?? 0,
    totalSubjects: totalSubjects ?? 0,
    yearsCovered: distinctYears.size,
  };
}

export async function getRecentPapers(limit = 8) {
  const supabase = createClient();
  const { data } = await supabase
    .from("papers")
    .select(
      `id, year, board, class, exam_type, full_marks, created_at,
       subjects:subject_id ( id, name ),
       schools:school_id ( id, slug, name, verified )`
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getPopularSubjects(limit = 6) {
  const supabase = createClient();
  // Aggregation kept simple for the MVP: fetch approved papers' subject ids and
  // count client-side. For large datasets, replace with a SQL view/materialized
  // view (e.g. `popular_subjects`) refreshed periodically.
  const { data } = await supabase
    .from("papers")
    .select("subject_id, subjects:subject_id ( id, name )")
    .eq("status", "approved");

  const counts = new Map<string, { id: string; name: string; count: number }>();
  for (const row of data ?? []) {
    const subj = row.subjects as unknown as { id: string; name: string } | null;
    if (!subj) continue;
    const existing = counts.get(subj.id);
    if (existing) existing.count++;
    else counts.set(subj.id, { id: subj.id, name: subj.name, count: 1 });
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
