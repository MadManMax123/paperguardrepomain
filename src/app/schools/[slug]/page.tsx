import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: school } = await supabase.from("schools").select("name, city, state, board").eq("slug", params.slug).maybeSingle();
  if (!school) return { title: "School not found" };
  return {
    title: `${school.name} — Papers`,
    description: `Browse examination papers from ${school.name}${school.city ? `, ${school.city}` : ""}.`,
  };
}

export default async function SchoolPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("id, name, city, state, board, verified")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!school) notFound();

  const { data: papers } = await supabase
    .from("papers")
    .select("id, year, subject_id, subjects:subject_id ( id, name )")
    .eq("school_id", school.id)
    .eq("status", "approved");

  const total = papers?.length ?? 0;
  const subjectCounts = new Map<string, { name: string; count: number }>();
  const years = new Set<number>();
  for (const p of papers ?? []) {
    years.add(p.year);
    const subj = p.subjects as unknown as { id: string; name: string } | null;
    if (!subj) continue;
    const existing = subjectCounts.get(subj.id);
    if (existing) existing.count++;
    else subjectCounts.set(subj.id, { name: subj.name, count: 1 });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-bold">{school.name}</h1>
        {school.verified && <BadgeCheck className="h-5 w-5 text-primary" aria-label="Verified" />}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{school.board.toUpperCase()}</Badge>
        {school.city && <Badge variant="outline">{school.city}{school.state ? `, ${school.state}` : ""}</Badge>}
        <Badge variant={school.verified ? "success" : "warning"}>{school.verified ? "Verified" : "Unverified"}</Badge>
      </div>

      <p className="mb-6 text-lg font-semibold">{total} Papers</p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from(subjectCounts.entries()).map(([id, s]) => (
          <Link
            key={id}
            href={`/papers?school=${school.id}&subject=${id}`}
            className="flex items-center justify-between rounded-md border border-border px-4 py-2.5 text-sm hover:bg-accent"
          >
            <span>{s.name}</span>
            <span className="text-muted-foreground">{s.count}</span>
          </Link>
        ))}
      </div>

      <div className="mb-2 text-sm font-medium text-muted-foreground">Available years</div>
      <div className="flex flex-wrap gap-2">
        {Array.from(years).sort((a, b) => b - a).map((y) => (
          <Link key={y} href={`/papers?school=${school.id}&year=${y}`}>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">{y}</Badge>
          </Link>
        ))}
      </div>

      <Link
        href={`/papers?school=${school.id}`}
        className="mt-8 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Browse all papers from {school.name}
      </Link>
    </div>
  );
}
