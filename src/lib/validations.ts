import { z } from "zod";

const currentYear = new Date().getFullYear();

export const uploadPaperSchema = z.object({
  board: z.string().min(1, "Board is required"),
  school_id: z.string().uuid("Select a valid school"),
  class: z.string().min(1, "Class is required"),
  subject_id: z.string().min(1, "Subject is required"),
  exam_type: z.string().min(1, "Exam type is required"),
  year: z.coerce
    .number()
    .int()
    .min(1990, "Year looks too old")
    .max(currentYear + 1, "Year can't be in the future"),
  full_marks: z.coerce.number().positive("Full marks must be a positive number"),
});

export type UploadPaperInput = z.infer<typeof uploadPaperSchema>;

// Same shape as upload — editing a pending/rejected paper touches the same fields.
export const editPaperSchema = uploadPaperSchema;
export type EditPaperInput = z.infer<typeof editPaperSchema>;

// Validated separately since File isn't a plain JSON value.
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export function validatePdfFile(file: File): string | null {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "File must be a PDF.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File must be smaller than ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`;
  }
  if (file.size === 0) {
    return "File appears to be empty.";
  }
  return null;
}

export const addSchoolSchema = z.object({
  name: z.string().min(2, "School name is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  board: z.string().min(1, "Board is required"),
});

export type AddSchoolInput = z.infer<typeof addSchoolSchema>;

export const addSubjectSchema = z.object({
  name: z.string().min(2, "Subject name is required").max(80, "Keep it under 80 characters"),
});

export type AddSubjectInput = z.infer<typeof addSubjectSchema>;

export const reportPaperSchema = z.object({
  paper_id: z.string().uuid(),
  reason: z.enum([
    "wrong_metadata",
    "duplicate",
    "corrupted_pdf",
    "wrong_paper",
    "copyright",
    "other",
  ]),
  details: z.string().max(1000).optional(),
});

export type ReportPaperInput = z.infer<typeof reportPaperSchema>;

export const paperSearchSchema = z.object({
  board: z.string().optional(),
  year: z.coerce.number().int().optional(),
  class: z.string().optional(),
  subject: z.string().optional(),
  school: z.string().optional(),
  exam: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["newest", "oldest", "popular", "relevance"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
});

export type PaperSearchInput = z.infer<typeof paperSearchSchema>;

export const helpRequestSchema = z.object({
  subject: z.string().min(3, "Give it a short subject").max(120, "Keep the subject under 120 characters"),
  message: z.string().min(10, "Add a few more details").max(2000, "Keep it under 2000 characters"),
});

export type HelpRequestInput = z.infer<typeof helpRequestSchema>;
