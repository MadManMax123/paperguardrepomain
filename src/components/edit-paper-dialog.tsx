"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileText, RefreshCw, UploadCloud } from "lucide-react";
import { editPaperSchema, validatePdfFile, type EditPaperInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { PaperStatus } from "@/lib/database.types";

export interface EditablePaper {
  id: string;
  year: number;
  board: string;
  class: string;
  subject_id: string;
  exam_type: string;
  full_marks: number;
  school_id: string;
  status: PaperStatus;
  file_path: string;
  original_filename: string | null;
}

interface FilterOptions {
  boards: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  examTypes: { id: string; name: string }[];
}

export function EditPaperDialog({
  paper,
  open,
  onOpenChange,
  filterOptions,
  schools,
  onSaved,
}: {
  paper: EditablePaper | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterOptions: FilterOptions;
  schools: { id: string; name: string; board: string }[];
  onSaved: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditPaperInput>({ resolver: zodResolver(editPaperSchema) });

  // Re-seed the form whenever a different paper is opened for editing.
  useEffect(() => {
    if (paper) {
      reset({
        board: paper.board,
        school_id: paper.school_id,
        class: paper.class,
        subject_id: paper.subject_id,
        exam_type: paper.exam_type,
        year: paper.year,
        full_marks: paper.full_marks,
      });
      setFile(null);
      setFileError(null);
    }
  }, [paper, reset]);

  function handleFile(f: File) {
    const err = validatePdfFile(f);
    setFileError(err);
    setFile(err ? null : f);
  }

  async function onSubmit(values: EditPaperInput) {
    if (!paper) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      toast.error("Your session expired. Please sign in again.");
      setSubmitting(false);
      return;
    }

    try {
      let fileFields: { file_path: string; file_size: number; original_filename: string } | null = null;

      if (file) {
        const objectPath = `${user.id}/${crypto.randomUUID()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("papers")
          .upload(objectPath, file, { contentType: "application/pdf", upsert: false });
        if (uploadError) throw uploadError;
        fileFields = { file_path: objectPath, file_size: file.size, original_filename: file.name };
      }

      const wasRejected = paper.status === "rejected";

      const { error: updateError } = await supabase
        .from("papers")
        .update({
          board: values.board,
          school_id: values.school_id,
          class: values.class,
          subject_id: values.subject_id,
          exam_type: values.exam_type,
          year: values.year,
          full_marks: values.full_marks,
          status: "pending",
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
          ...(fileFields ?? {}),
        })
        .eq("id", paper.id);

      if (updateError) {
        // Roll back the newly-uploaded file if the metadata update failed.
        if (fileFields) await supabase.storage.from("papers").remove([fileFields.file_path]);
        throw updateError;
      }

      // Best-effort cleanup of the old file now that the row points at the new one.
      if (fileFields) {
        await supabase.storage.from("papers").remove([paper.file_path]);
      }

      toast.success(wasRejected ? "Resubmitted for review!" : "Changes saved.");
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Couldn't save your changes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Edit paper</DialogTitle>
        <DialogDescription>
          {paper?.status === "rejected"
            ? "Fix what the moderator flagged and this goes straight back into the review queue."
            : "This is still pending review — changes are saved instantly, no need to re-upload."}
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-md border border-dashed border-border p-3">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{file ? file.name : paper?.original_filename ?? "Current file"}</span>
            </div>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <UploadCloud className="h-3.5 w-3.5" />
              {file ? "Choose a different file" : "Replace PDF (optional)"}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
            {fileError && <p className="mt-1 text-xs text-destructive">{fileError}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Board" error={errors.board?.message}>
              <Select {...register("board")}>
                <option value="">Select board</option>
                {filterOptions.boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Field>

            <Field label="Class" error={errors.class?.message}>
              <Select {...register("class")}>
                <option value="">Select class</option>
                {filterOptions.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>

            <Field label="Subject" error={errors.subject_id?.message}>
              <Select {...register("subject_id")}>
                <option value="">Select subject</option>
                {filterOptions.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>

            <Field label="Exam type" error={errors.exam_type?.message}>
              <Select {...register("exam_type")}>
                <option value="">Select exam type</option>
                {filterOptions.examTypes.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </Field>

            <Field label="Year" error={errors.year?.message}>
              <Input type="number" {...register("year")} />
            </Field>

            <Field label="Full marks" error={errors.full_marks?.message}>
              <Input type="number" {...register("full_marks")} />
            </Field>

            <div className="sm:col-span-2">
              <Field label="School" error={errors.school_id?.message}>
                <Select {...register("school_id")}>
                  <option value="">Select school</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? (
                "Saving…"
              ) : paper?.status === "rejected" ? (
                <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Resubmit for review</span>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
