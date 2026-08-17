import { paperSearchSchema } from "@/lib/validations";
import { searchPapers, getFilterOptions, getSchoolsForFilter } from "@/lib/data/papers";
import { SearchFilters } from "@/components/search-filters";
import { PapersResults } from "@/components/papers-results";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Papers",
  description: "Search and filter ICSE/ISC & CBSE examination papers by board, year, class, subject, school and exam type.",
};

export default async function PapersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const parsed = paperSearchSchema.parse({
    board: firstOf(searchParams.board),
    year: firstOf(searchParams.year),
    class: firstOf(searchParams.class),
    subject: firstOf(searchParams.subject),
    school: firstOf(searchParams.school),
    exam: firstOf(searchParams.exam),
    q: firstOf(searchParams.q),
    sort: firstOf(searchParams.sort) ?? "newest",
    page: firstOf(searchParams.page) ?? "1",
  });

  const [{ papers, total, pageSize }, filterOptions, schools] = await Promise.all([
    searchPapers(parsed),
    getFilterOptions(),
    getSchoolsForFilter(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Browse papers</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <SearchFilters filterOptions={filterOptions} schools={schools} current={parsed} />
        <PapersResults papers={papers} total={total} pageSize={pageSize} current={parsed} />
      </div>
    </div>
  );
}

function firstOf(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
