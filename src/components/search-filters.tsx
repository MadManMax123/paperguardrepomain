"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { PaperSearchInput } from "@/lib/validations";

interface FilterOptions {
  boards: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  examTypes: { id: string; name: string }[];
  years: number[];
}

export function SearchFilters({
  filterOptions,
  schools,
  current,
}: {
  filterOptions: FilterOptions;
  schools: { id: string; name: string; board: string }[];
  current: PaperSearchInput;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams?.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page"); // reset pagination whenever filters change
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  return (
    <aside className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        <button onClick={clearAll} className="text-xs text-primary hover:underline">Clear all</button>
      </div>

      <FilterField label="Board">
        <Select value={current.board ?? ""} onChange={(e) => updateFilter("board", e.target.value)}>
          <option value="">All boards</option>
          {filterOptions.boards.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
      </FilterField>

      <FilterField label="Year">
        <Select value={current.year?.toString() ?? ""} onChange={(e) => updateFilter("year", e.target.value)}>
          <option value="">All years</option>
          {filterOptions.years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </FilterField>

      <FilterField label="Class">
        <Select value={current.class ?? ""} onChange={(e) => updateFilter("class", e.target.value)}>
          <option value="">All classes</option>
          {filterOptions.classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </FilterField>

      <FilterField label="Subject">
        <Select value={current.subject ?? ""} onChange={(e) => updateFilter("subject", e.target.value)}>
          <option value="">All subjects</option>
          {filterOptions.subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </FilterField>

      <FilterField label="School">
        <Select value={current.school ?? ""} onChange={(e) => updateFilter("school", e.target.value)}>
          <option value="">All schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </FilterField>

      <FilterField label="Exam type">
        <Select value={current.exam ?? ""} onChange={(e) => updateFilter("exam", e.target.value)}>
          <option value="">All exam types</option>
          {filterOptions.examTypes.map((e2) => (
            <option key={e2.id} value={e2.id}>{e2.name}</option>
          ))}
        </Select>
      </FilterField>

      <FilterField label="Sort by">
        <Select value={current.sort} onChange={(e) => updateFilter("sort", e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="popular">Most downloaded</option>
          <option value="relevance">Relevance</option>
        </Select>
      </FilterField>
    </aside>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
