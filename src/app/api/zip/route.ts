import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import { PassThrough } from "stream";
import { createAdminClient } from "@/lib/supabase/admin";
import { paperSearchSchema } from "@/lib/validations";
import { safeFilenamePart } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

// Server-side ZIP generation for a set of papers, either explicitly selected
// or matching the current filters. Uses the service-role client to fetch the
// approved-only files; the service role key never leaves this route.
//
// NOTE on scale: this streams a ZIP synchronously, which is fine for the
// typical few-dozen-paper case described in the spec. If matching sets grow
// very large (hundreds of PDFs), swap this for a queued job (e.g. a Supabase
// Edge Function + storage bucket for the finished ZIP + a "ready" email/poll)
// so we don't block an HTTP request for minutes.
const MAX_PAPERS_PER_ZIP = 200;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const admin = createAdminClient();

  let paperIds: string[] | null = null;
  let zipNameParts: string[] = ["PaperGuard"];

  if (Array.isArray(body.paperIds) && body.paperIds.length > 0) {
    paperIds = body.paperIds.slice(0, MAX_PAPERS_PER_ZIP);
  } else if (body.filters) {
    const filters = paperSearchSchema.partial().parse(body.filters);
    let query = admin
      .from("papers")
      .select("id, board, class, subject_id, exam_type, year")
      .eq("status", "approved")
      .limit(MAX_PAPERS_PER_ZIP);

    if (filters.board) query = query.eq("board", filters.board);
    if (filters.year) query = query.eq("year", filters.year);
    if (filters.class) query = query.eq("class", filters.class);
    if (filters.subject) query = query.eq("subject_id", filters.subject);
    if (filters.exam) query = query.eq("exam_type", filters.exam);
    if (filters.school) query = query.eq("school_id", filters.school);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    paperIds = (data ?? []).map((p) => p.id);

    zipNameParts = [
      filters.board?.toUpperCase(),
      filters.class?.toUpperCase(),
      filters.subject,
      filters.exam,
      filters.year?.toString(),
    ].filter(Boolean) as string[];
  }

  if (!paperIds || paperIds.length === 0) {
    return NextResponse.json({ error: "No papers matched the request." }, { status: 400 });
  }

  const { data: papers, error } = await admin
    .from("papers")
    .select(
      `id, file_path, year, board, class, exam_type,
       subjects:subject_id ( name ),
       schools:school_id ( name )`
    )
    .in("id", paperIds)
    .eq("status", "approved"); // hard guarantee: never zip a non-approved paper

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!papers || papers.length === 0) {
    return NextResponse.json({ error: "No approved papers matched the request." }, { status: 404 });
  }

  const zipFilename = `${zipNameParts.length ? zipNameParts.join("_") : "PaperGuard_Selection"}.zip`;

  const archive = archiver("zip", { zlib: { level: 9 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  const usedNames = new Set<string>();

  (async () => {
    try {
      for (const paper of papers) {
        const { data: signed } = await admin.storage.from("papers").createSignedUrl(paper.file_path, 60);
        if (!signed?.signedUrl) continue;
        const res = await fetch(signed.signedUrl);
        if (!res.ok || !res.body) continue;

        const schoolName = safeFilenamePart((paper.schools as any)?.name ?? "Unknown_School");
        let entryName = `${schoolName}.pdf`;
        let counter = 2;
        while (usedNames.has(entryName)) {
          entryName = `${schoolName}_${counter}.pdf`;
          counter++;
        }
        usedNames.add(entryName);

        const buffer = Buffer.from(await res.arrayBuffer());
        archive.append(buffer, { name: `${zipFilename.replace(/\.zip$/, "")}/${entryName}` });
      }
    } finally {
      archive.finalize();
    }
  })();

  return new NextResponse(passthrough as any, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFilename}"`,
      "Cache-Control": "no-store",
    },
  });
}
