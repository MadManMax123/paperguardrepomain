import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
  FileSearch,
  PackageOpen,
  School,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Zap,
} from "lucide-react";
import { getHomepageStats, getRecentPapers, getPopularSubjects } from "@/lib/data/papers";
import { HomeSearchBar } from "@/components/home-search-bar";
import { StatCounter } from "@/components/stat-counter";
import { StampMark } from "@/components/brand/stamp-mark";
import { PaperCard } from "@/components/paper-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PaperGuard — Find. Practice. Repeat.",
  description:
      "A fast, modern, community-driven repository of school examination papers — search, preview, and download ICSE/ISC & CBSE papers from any school.",
};

const SUBJECT_GRADIENTS = [
  "from-primary/15 via-primary/5 to-transparent",
  "from-highlight/20 via-highlight/5 to-transparent",
  "from-seal/20 via-seal/5 to-transparent",
];

export default async function HomePage() {
  const [stats, recentPapers, popularSubjects] = await Promise.all([
    getHomepageStats(),
    getRecentPapers(8),
    getPopularSubjects(6),
  ]);

  return (
      <div>
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                              */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden border-b border-border">
          {/* ambient blobs */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-24 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl animate-pulse-soft" />
            <div className="absolute -top-10 right-[-6rem] h-72 w-72 rounded-full bg-highlight/25 blur-3xl animate-pulse-soft [animation-delay:400ms]" />
            <div className="absolute bottom-[-8rem] left-[-6rem] h-80 w-80 rounded-full bg-seal/20 blur-3xl animate-pulse-soft [animation-delay:800ms]" />
            <div
                className="absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage:
                      "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
                  backgroundSize: "26px 26px",
                }}
            />
          </div>

          <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-16 text-center sm:pb-24 sm:pt-24">
            <StampMark size={84} className="mb-6 drop-shadow-sm" />

            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 text-highlight" />
              Community-verified exam papers
            </div>

            <h1 className="text-balance font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              Find. Practice.{" "}
              <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-seal to-highlight bg-clip-text text-transparent">
                Repeat.
              </span>
            </span>
            </h1>

            <p className="mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
              Search, preview, and download real ICSE/ISC &amp; CBSE examination papers
              from schools across the country — organized, verified, and free.
            </p>

            <div className="mt-8 w-full">
              <HomeSearchBar />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Popular:</span>
              {["Physics", "Chemistry", "Mathematics", "Class XII"].map((tag) => (
                  <Link
                      key={tag}
                      href={`/papers?q=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-border bg-card px-3 py-1 font-medium transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
                  >
                    {tag}
                  </Link>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                  href="/papers"
                  className={cn(buttonVariants({ size: "lg" }), "group shadow-md shadow-primary/20")}
              >
                Browse papers
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/upload" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                <UploadCloud className="h-4 w-4" />
                Upload a paper
              </Link>
            </div>
          </div>

          {/* stats strip */}
          <div className="border-t border-border bg-card/60 backdrop-blur">
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
              <StatCounter label="Papers available" value={stats.totalPapers} />
              <StatCounter label="Schools represented" value={stats.totalSchools} />
              <StatCounter label="Subjects covered" value={stats.totalSubjects} />
              <StatCounter label="Years of papers" value={stats.yearsCovered} />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Popular subjects                                                  */}
        {/* ---------------------------------------------------------------- */}
        {popularSubjects.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold sm:text-3xl">Popular subjects</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Jump straight into what students are downloading most.
                  </p>
                </div>
                <Link
                    href="/papers?sort=popular"
                    className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
                >
                  See all popular <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {popularSubjects.map((subject, i) => (
                    <Link
                        key={subject.id}
                        href={`/papers?subject=${subject.id}`}
                        className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${SUBJECT_GRADIENTS[i % SUBJECT_GRADIENTS.length]} p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10`}
                    >
                      <BookOpen className="h-5 w-5 text-primary transition-transform duration-200 group-hover:scale-110" />
                      <p className="mt-3 font-display text-sm font-semibold leading-tight">{subject.name}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{subject.count} papers</p>
                    </Link>
                ))}
              </div>
            </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Recently added                                                    */}
        {/* ---------------------------------------------------------------- */}
        {recentPapers.length > 0 && (
            <section className="border-t border-border bg-muted/30">
              <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
                <div className="mb-8 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold sm:text-3xl">Recently added</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Fresh off the press — the latest papers uploaded by the community.
                    </p>
                  </div>
                  <Link
                      href="/papers"
                      className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
                  >
                    Browse all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {recentPapers.map((paper, i) => (
                      <PaperCard key={paper.id} paper={paper} index={i} />
                  ))}
                </div>

                <div className="mt-8 flex justify-center sm:hidden">
                  <Link href="/papers" className={cn(buttonVariants({ variant: "outline" }))}>
                    Browse all papers <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* How it works / trust                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Built for exam season</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Every paper is checked before it goes live, so you spend less time
              hunting and more time practicing.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Search with precision",
                body: "Filter by board, class, subject, school, year and exam type to find exactly the paper you need.",
                accent: "text-primary bg-primary/10",
              },
              {
                icon: ShieldCheck,
                title: "Verified content",
                body: "Papers from verified schools carry a badge, and every upload is reviewed before publishing.",
                accent: "text-seal bg-seal/10",
              },
              {
                icon: School,
                title: "Community driven",
                body: "Students and teachers upload papers from their own schools, growing the archive for everyone.",
                accent: "text-highlight-foreground bg-highlight/20",
              },
            ].map((item) => (
                <div
                    key={item.title}
                    className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${item.accent} transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
                </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Why us vs. official school website                               */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <div className="mb-10 text-center">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-highlight" />
                Why PaperGuard
              </div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Why use our Papers Website instead of the official school website?
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "Faster & more reliable",
                  body: "Hosted on Vercel for fast global delivery and 99.98% uptime — built to stay accessible even during heavy traffic before exams.",
                  accent: "text-primary bg-primary/10",
                },
                {
                  icon: Sparkles,
                  title: "A better, modern UI",
                  body: "Built specifically for finding and accessing question papers, with a clean, organized interface for browsing years, schools, boards, and exam types.",
                  accent: "text-highlight-foreground bg-highlight/20",
                },
                {
                  icon: FileSearch,
                  title: "Powerful search & filtering",
                  body: "Quickly find exactly the paper you need with filters for year, board, school, exam type, and full marks — no digging through folders or announcements.",
                  accent: "text-seal bg-seal/10",
                },
                {
                  icon: BookOpen,
                  title: "View and access papers directly",
                  body: "Papers are available directly on the platform, so you can preview and identify the right one before downloading — no hopping between pages.",
                  accent: "text-primary bg-primary/10",
                },
                {
                  icon: Download,
                  title: "Direct downloads",
                  body: "Every paper has a direct download option — once you've found it, download it immediately instead of navigating a document system.",
                  accent: "text-highlight-foreground bg-highlight/20",
                },
                {
                  icon: PackageOpen,
                  title: "Download entire collections as ZIP",
                  body: "Filter to exactly what you need — like ICSE/ISC → Class 11 → Physics → 2024–2026 — and download the whole collection at once as a ZIP.",
                  accent: "text-seal bg-seal/10",
                },
              ].map((item) => (
                  <div
                      key={item.title}
                      className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${item.accent} transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* CTA                                                               */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary via-primary to-seal px-6 py-14 text-center shadow-xl shadow-primary/10 sm:px-12">
            <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                      "radial-gradient(white 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
            />
            <h2 className="relative font-display text-2xl font-bold text-primary-foreground sm:text-3xl">
              Have a paper others could use?
            </h2>
            <p className="relative mx-auto mt-2 max-w-md text-sm text-primary-foreground/80">
              Upload your school's papers and help build the largest open archive
              of examination papers.
            </p>
            <div className="relative mt-7">
              <Link
                  href="/upload"
                  className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "border-primary-foreground/30 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  )}
              >
                <UploadCloud className="h-4 w-4" />
                Upload a paper
              </Link>
            </div>
          </div>
        </section>
      </div>
  );
}