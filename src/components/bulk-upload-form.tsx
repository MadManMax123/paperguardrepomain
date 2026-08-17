"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { validatePdfFile } from "@/lib/validations";
import { formatFileSize } from "@/lib/utils";

interface FilterOptions {
  boards: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  examTypes: { id: string; name: string }[];
}
type School = { id: string; name: string; board: string };

type RowStatus = "idle" | "uploading" | "done" | "error";

interface Row {
  key: string;
  file: File;
  board: string;
  school_id: string;
  class: string;
  subject_id: string;
  exam_type: string;
  year: string;
  full_marks: string;
  status: RowStatus;
  error?: string;
}

// Best-effort guess at a 4-digit year from a filename, e.g. "physics_2023_half_yearly.pdf".
function guessYear(filename: string): string {
  const match = filename.match(/(19|20)\d{2}/);
  return match ? match[0] : "";
}

function newRow(file: File): Row {
  return {
    key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    board: "",
    school_id: "",
    class: "",
    subject_id: "",
    exam_type: "",
    year: guessYear(file.name),
    full_marks: "",
    status: "idle",
  };
}

export function BulkUploadForm({
  filterOptions,
  schools,
  mode = "moderator",
}: {
  filterOptions: FilterOptions;
  schools: School[];
  /** "moderator" publishes immediately; "self" queues each paper for review, like a normal upload. */
  mode?: "moderator" | "self";
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // "Apply to all" bar values — blank means "don't touch that field".
  const [bulkBoard, setBulkBoard] = useState("");
  const [bulkSchool, setBulkSchool] = useState("");
  const [bulkClass, setBulkClass] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkExamType, setBulkExamType] = useState("");
  const [bulkYear, setBulkYear] = useState("");
  const [bulkFullMarks, setBulkFullMarks] = useState("");

  function addFiles(files: FileList | File[]) {
    const accepted: Row[] = [];
    for (const f of Array.from(files)) {
      const err = validatePdfFile(f);
      if (err) {
        toast.error(`${f.name}: ${err}`);
        continue;
      }
      accepted.push(newRow(f));
    }
    if (accepted.length) setRows((prev) => [...prev, ...accepted]);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }, []);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function applyToAll() {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        board: bulkBoard || r.board,
        school_id: bulkSchool || r.school_id,
        class: bulkClass || r.class,
        subject_id: bulkSubject || r.subject_id,
        exam_type: bulkExamType || r.exam_type,
        year: bulkYear || r.year,
        full_marks: bulkFullMarks || r.full_marks,
      }))
    );
    toast.success("Applied to all rows.");
  }

  function rowIsValid(r: Row): string | null {
    if (!r.board) return "Board is required";
    if (!r.school_id) return "School is required";
    if (!r.class) return "Class is required";
    if (!r.subject_id) return "Subject is required";
    if (!r.exam_type) return "Exam type is required";
    const yr = Number(r.year);
    if (!yr || yr < 1990 || yr > new Date().getFullYear() + 1) return "Enter a valid year";
    const fm = Number(r.full_marks);
    if (!fm || fm <= 0) return "Enter valid full marks";
    return null;
  }

  async function submitAll() {
    const pending = rows.filter((r) => r.status !== "done");
    const invalid = pending.find((r) => rowIsValid(r));
    if (invalid) {
      toast.error(`Fix "${invalid.file.name}" before uploading — ${rowIsValid(invalid)}.`);
      return;
    }
    if (pending.length === 0) {
      toast.error("Nothing to upload.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      toast.error("Your session expired. Please sign in again.");
      setSubmitting(false);
      return;
    }

    const CONCURRENCY = 3;
    let cursor = 0;

    async function worker() {
      while (cursor < pending.length) {
        const row = pending[cursor++];
        if (!row) continue;
        updateRow(row.key, { status: "uploading", error: undefined });
        try {
          const objectPath = `${user!.id}/${crypto.randomUUID()}.pdf`;
          const { error: uploadError } = await supabase.storage
            .from("papers")
            .upload(objectPath, row.file, { contentType: "application/pdf", upsert: false });
          if (uploadError) throw uploadError;

          const { error: insertError } = await supabase.from("papers").insert({
            board: row.board,
            school_id: row.school_id,
            class: row.class,
            subject_id: row.subject_id,
            exam_type: row.exam_type,
            year: Number(row.year),
            full_marks: Number(row.full_marks),
            file_path: objectPath,
            file_size: row.file.size,
            original_filename: row.file.name,
            uploaded_by: user!.id,
            ...(mode === "moderator"
              ? { status: "approved" as const, reviewed_by: user!.id, reviewed_at: new Date().toISOString() }
              : {}),
          });
          if (insertError) {
            await supabase.storage.from("papers").remove([objectPath]);
            throw insertError;
          }
          updateRow(row.key, { status: "done" });
        } catch (e: any) {
          updateRow(row.key, { status: "error", error: e.message ?? "Upload failed" });
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
    setSubmitting(false);

    const results = rows.filter((r) => pending.some((p) => p.key === r.key));
    const failedCount = results.filter((r) => r.status === "error").length;
    const doneCount = results.length - failedCount;
    if (doneCount) {
      toast.success(
        mode === "moderator"
          ? `${doneCount} paper${doneCount === 1 ? "" : "s"} published.`
          : `${doneCount} paper${doneCount === 1 ? "" : "s"} submitted for review.`
      );
    }
    if (failedCount) toast.error(`${failedCount} failed — fix and retry below.`);
    if (!failedCount) setRows((prev) => prev.filter((r) => r.status !== "done"));
  }

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-primary bg-accent" : "border-border"
        }`}
      >
        <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Drag and drop any number of PDFs here, or</p>
        <label className="mt-2 cursor-pointer text-sm font-medium text-primary hover:underline">
          browse files
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files?.length && addFiles(e.target.files)}
          />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          {mode === "moderator"
            ? "Uploaded here, papers publish immediately — no separate review step."
            : "Each paper is queued for moderator review, same as a single upload."}
        </p>
      </div>

      {rows.length > 0 && (
        <>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Apply to all rows
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              <Select value={bulkBoard} onChange={(e) => setBulkBoard(e.target.value)} className="text-xs">
                <option value="">Board</option>
                {filterOptions.boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select value={bulkSchool} onChange={(e) => setBulkSchool(e.target.value)} className="text-xs">
                <option value="">School</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Select value={bulkClass} onChange={(e) => setBulkClass(e.target.value)} className="text-xs">
                <option value="">Class</option>
                {filterOptions.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Select value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)} className="text-xs">
                <option value="">Subject</option>
                {filterOptions.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Select value={bulkExamType} onChange={(e) => setBulkExamType(e.target.value)} className="text-xs">
                <option value="">Exam type</option>
                {filterOptions.examTypes.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
              <Input value={bulkYear} onChange={(e) => setBulkYear(e.target.value)} placeholder="Year" className="text-xs" />
              <Input value={bulkFullMarks} onChange={(e) => setBulkFullMarks(e.target.value)} placeholder="Full marks" className="text-xs" />
            </div>
            <button
              onClick={applyToAll}
              className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              Apply to all {rows.length} file{rows.length === 1 ? "" : "s"}
            </button>
          </div>

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.div
                  key={r.key}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-lg border border-border p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate font-medium">{r.file.name}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {formatFileSize(r.file.size)}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <RowStatusBadge status={r.status} error={r.error} />
                      <button
                        onClick={() => removeRow(r.key)}
                        disabled={r.status === "uploading"}
                        aria-label="Remove"
                        className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
                    <Select
                      value={r.board}
                      onChange={(e) => updateRow(r.key, { board: e.target.value })}
                      disabled={r.status === "uploading" || r.status === "done"}
                      className="text-xs"
                    >
                      <option value="">Board</option>
                      {filterOptions.boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </Select>
                    <Select
                      value={r.school_id}
                      onChange={(e) => updateRow(r.key, { school_id: e.target.value })}
                      disabled={r.status === "uploading" || r.status === "done"}
                      className="text-xs"
                    >
                      <option value="">School</option>
                      {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <Select
                      value={r.class}
                      onChange={(e) => updateRow(r.key, { class: e.target.value })}
                      disabled={r.status === "uploading" || r.status === "done"}
                      className="text-xs"
                    >
                      <option value="">Class</option>
                      {filterOptions.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Select
                      value={r.subject_id}
                      onChange={(e) => updateRow(r.key, { subject_id: e.target.value })}
                      disabled={r.status === "uploading" || r.status === "done"}
                      className="text-xs"
                    >
                      <option value="">Subject</option>
                      {filterOptions.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <Select
                      value={r.exam_type}
                      onChange={(e) => updateRow(r.key, { exam_type: e.target.value })}
                      disabled={r.status === "uploading" || r.status === "done"}
                      className="text-xs"
                    >
                      <option value="">Exam type</option>
                      {filterOptions.examTypes.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </Select>
                    <Input
                      value={r.year}
                      onChange={(e) => updateRow(r.key, { year: e.target.value })}
                      disabled={r.status === "uploading" || r.status === "done"}
                      placeholder="Year"
                      className="text-xs"
                    />
                    <Input
                      value={r.full_marks}
                      onChange={(e) => updateRow(r.key, { full_marks: e.target.value })}
                      disabled={r.status === "uploading" || r.status === "done"}
                      placeholder="Full marks"
                      className="text-xs"
                    />
                  </div>
                  {r.status === "error" && r.error && (
                    <p className="mt-1.5 text-xs text-destructive">{r.error}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            onClick={submitAll}
            disabled={submitting || rows.every((r) => r.status === "done")}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Uploading…" : `Upload ${rows.filter((r) => r.status !== "done").length} paper${rows.length === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </div>
  );
}

function RowStatusBadge({ status, error }: { status: RowStatus; error?: string }) {
  if (status === "uploading") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-seal" />;
  if (status === "error") return <AlertCircle className="h-4 w-4 text-destructive" aria-label={error} />;
  return null;
}
