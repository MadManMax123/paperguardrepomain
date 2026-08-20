import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPaperById } from "@/lib/data/papers";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatFileSize } from "@/lib/utils";
import { ReportButton } from "@/components/report-button";

const EXAM_TYPE_LABELS: Record<string, string> = {
  "unit-test": "Unit Test",
  "periodic-test": "Periodic Test",
  "term-1": "Term 1",
  "term-2": "Term 2",
  "half-yearly": "Half-Yearly Examination",
  annual: "Annual Examination",
  "pre-board": "Pre-Board",
  "board-examination": "Board Examination",
  other: "Other",
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const paper = await getPaperById(params.id);
  if (!paper || paper.status !== "approved") return { title: "Paper not found" };

  const subject = (paper.subjects as any)?.name ?? "Paper";
  const school = (paper.schools as any)?.name ?? "";
  const examLabel = EXAM_TYPE_LABELS[paper.exam_type] ?? paper.exam_type;
  const title = `${subject} ${examLabel} ${paper.year} — Class ${paper.class.toUpperCase()} — ${paper.board.toUpperCase()} — ${school}`;

  return {
    title,
    description: `Download the ${title} examination paper on PaperGuard. Full marks: ${paper.full_marks}.`,
  };
}

export default async function PaperDetailPage({ params }: { params: { id: string } }) {
  const paper = await getPaperById(params.id);
  if (!paper) notFound();

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const isOwner = false; // owners viewing their own pending paper is handled on /upload "my uploads"

  if (paper.status !== "approved" && !isOwner) {
    // Non-approved papers should not resolve publicly (avoid broken/leaked links).
    notFound();
  }

  const { data: signed } = await supabase.storage.from("papers").createSignedUrl(paper.file_path, 60 * 10);

  const subject = (paper.subjects as any)?.name ?? "Unknown subject";
  const school = paper.schools as any;
  const examLabel = EXAM_TYPE_LABELS[paper.exam_type] ?? paper.exam_type;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{subject}</h1>
              <p className="text-muted-foreground">{examLabel}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/api/download/${paper.id}`}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Download PDF
              </a>
              <ReportButton paperId={paper.id} isAuthenticated={!!userData.user} />
            </div>
          </div>

          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-muted">
            {signed?.signedUrl ? (
              <iframe src={signed.signedUrl} title={`${subject} preview`} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Preview unavailable
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border p-5">
            <h2 className="mb-3 font-semibold">Details</h2>
            <dl className="space-y-2 text-sm">
              <Row label="School" value={school?.name ?? "Unknown"} />
              <Row label="Board" value={paper.board.toUpperCase()} />
              <Row label="Class" value={paper.class.toUpperCase()} />
              <Row label="Year" value={String(paper.year)} />
              <Row label="Exam type" value={examLabel} />
              <Row label="Full marks" value={String(paper.full_marks)} />
              <Row label="File size" value={formatFileSize(paper.file_size)} />
              <Row label="Uploaded" value={formatDate(paper.created_at)} />
              <Row label="Downloads" value={String(paper.download_count)} />
            </dl>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{paper.board.toUpperCase()}</Badge>
            <Badge variant="secondary">Class {paper.class.toUpperCase()}</Badge>
            <Badge variant="secondary">{paper.year}</Badge>
            {school?.verified && <Badge variant="success">Verified school</Badge>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
