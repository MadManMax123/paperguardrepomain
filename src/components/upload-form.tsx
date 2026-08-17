"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { uploadPaperSchema, validatePdfFile, type UploadPaperInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileText } from "lucide-react";
import { AddSchoolDialog } from "@/components/add-school-dialog";
import { AddSubjectDialog } from "@/components/add-subject-dialog";

interface FilterOptions {
  boards: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  examTypes: { id: string; name: string }[];
}

export function UploadForm({
  filterOptions,
  schools,
}: {
  filterOptions: FilterOptions;
  schools: { id: string; name: string; board: string }[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addSchoolOpen, setAddSchoolOpen] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UploadPaperInput>({ resolver: zodResolver(uploadPaperSchema) });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  }, []);

  function handleFile(f: File) {
    const err = validatePdfFile(f);
    setFileError(err);
    setFile(err ? null : f);
  }

  async function onSubmit(values: UploadPaperInput) {
    if (!file) {
      setFileError("Please attach a PDF file.");
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

    try {
      const objectPath = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("papers")
        .upload(objectPath, file, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("papers").insert({
        board: values.board,
        school_id: values.school_id,
        class: values.class,
        subject_id: values.subject_id,
        exam_type: values.exam_type,
        year: values.year,
        full_marks: values.full_marks,
        file_path: objectPath,
        file_size: file.size,
        original_filename: file.name,
        uploaded_by: user.id,
      });

      if (insertError) {
        // Roll back the orphaned storage object if metadata insert fails.
        await supabase.storage.from("papers").remove([objectPath]);
        throw insertError;
      }

      toast.success("Paper submitted for review!");
      router.refresh();
      setFile(null);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-lg border border-border p-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-primary bg-accent" : "border-border"
        }`}
      >
        {file ? (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-5 w-5 text-primary" />
            {file.name}
          </div>
        ) : (
          <>
            <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag and drop a PDF here, or</p>
          </>
        )}
        <label className="mt-2 cursor-pointer text-sm font-medium text-primary hover:underline">
          browse files
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
        {fileError && <p className="mt-2 text-xs text-destructive">{fileError}</p>}
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
          <button
            type="button"
            onClick={() => setAddSubjectOpen(true)}
            className="mt-1.5 text-xs text-primary hover:underline"
          >
            Can&apos;t find your subject? Add it
          </button>
        </Field>

        <Field label="Exam type" error={errors.exam_type?.message}>
          <Select {...register("exam_type")}>
            <option value="">Select exam type</option>
            {filterOptions.examTypes.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
        </Field>

        <Field label="Year" error={errors.year?.message}>
          <Input type="number" {...register("year")} placeholder="2025" />
        </Field>

        <Field label="Full marks" error={errors.full_marks?.message}>
          <Input type="number" {...register("full_marks")} placeholder="70" />
        </Field>

        <div className="sm:col-span-2">
          <Field label="School" error={errors.school_id?.message}>
            <Select {...register("school_id")}>
              <option value="">Select school</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <button
            type="button"
            onClick={() => setAddSchoolOpen(true)}
            className="mt-1.5 text-xs text-primary hover:underline"
          >
            Can&apos;t find your school? Add/request it
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Uploading…" : "Submit paper for review"}
      </button>

      <AddSchoolDialog
        open={addSchoolOpen}
        onOpenChange={setAddSchoolOpen}
        boards={filterOptions.boards}
      />

      <AddSubjectDialog
        open={addSubjectOpen}
        onOpenChange={setAddSubjectOpen}
        subjects={filterOptions.subjects}
        onSelectExisting={(subject) => setValue("subject_id", subject.id, { shouldValidate: true })}
      />
    </form>
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
