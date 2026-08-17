// Hand-authored types matching supabase/migrations/0001_init.sql.
// In a real project, regenerate with:
//   supabase gen types typescript --project-id <id> > src/lib/database.types.ts

export type PaperStatus = "pending" | "approved" | "rejected";
export type UserRole = "student" | "moderator" | "admin";
export type ReportReason =
  | "wrong_metadata"
  | "duplicate"
  | "corrupted_pdf"
  | "wrong_paper"
  | "copyright"
  | "other";
export type ReportStatus = "open" | "resolved" | "dismissed";
export type SchoolRequestStatus = "pending" | "approved" | "rejected";
export type SubjectRequestStatus = "pending" | "approved" | "rejected";
export type HelpRequestStatus = "open" | "resolved";

export interface Database {
  public: {
    Tables: {
      boards: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id: string; name: string };
        Update: Partial<{ id: string; name: string }>;
        Relationships: [];
      };
      classes: {
        Row: { id: string; name: string; sort_order: number };
        Insert: { id: string; name: string; sort_order?: number };
        Update: Partial<{ id: string; name: string; sort_order: number }>;
        Relationships: [];
      };
      exam_types: {
        Row: { id: string; name: string; sort_order: number };
        Insert: { id: string; name: string; sort_order?: number };
        Update: Partial<{ id: string; name: string; sort_order: number }>;
        Relationships: [];
      };
      subjects: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id: string; name: string };
        Update: Partial<{ id: string; name: string }>;
        Relationships: [];
      };
      profiles: {
        Row: { id: string; display_name: string | null; role: UserRole; created_at: string };
        Insert: { id: string; display_name?: string | null; role?: UserRole };
        Update: Partial<{ display_name: string | null; role: UserRole }>;
        Relationships: [];
      };
      schools: {
        Row: {
          id: string; slug: string; name: string; city: string | null; state: string | null;
          board: string; verified: boolean; created_at: string;
        };
        Insert: {
          slug: string; name: string; city?: string | null; state?: string | null;
          board: string; verified?: boolean;
        };
        Update: Partial<{
          slug: string; name: string; city: string | null; state: string | null;
          board: string; verified: boolean;
        }>;
        Relationships: [];
      };
      school_requests: {
        Row: {
          id: string; name: string; city: string | null; state: string | null; board: string;
          status: SchoolRequestStatus; requested_by: string | null; reviewed_by: string | null;
          resulting_school_id: string | null; created_at: string;
        };
        Insert: {
          name: string; city?: string | null; state?: string | null; board: string;
          requested_by?: string | null;
        };
        Update: Partial<{
          status: SchoolRequestStatus; reviewed_by: string | null; resulting_school_id: string | null;
        }>;
        Relationships: [];
      };
      subject_requests: {
        Row: {
          id: string; name: string; status: SubjectRequestStatus; requested_by: string | null;
          reviewed_by: string | null; resulting_subject_id: string | null; created_at: string;
        };
        Insert: { name: string; requested_by?: string | null };
        Update: Partial<{
          status: SubjectRequestStatus; reviewed_by: string | null; resulting_subject_id: string | null;
        }>;
        Relationships: [];
      };
      papers: {
        Row: {
          id: string; year: number; board: string; school_id: string; class: string;
          subject_id: string; exam_type: string; full_marks: number; file_path: string;
          file_size: number; original_filename: string | null; uploaded_by: string | null;
          status: PaperStatus; download_count: number; rejection_reason: string | null;
          reviewed_by: string | null; reviewed_at: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          year: number; board: string; school_id: string; class: string; subject_id: string;
          exam_type: string; full_marks: number; file_path: string; file_size: number;
          original_filename?: string | null; uploaded_by: string; status?: PaperStatus;
          reviewed_by?: string | null; reviewed_at?: string | null;
        };
        Update: Partial<{
          year: number; board: string; school_id: string; class: string; subject_id: string;
          exam_type: string; full_marks: number; file_path: string; file_size: number;
          original_filename: string | null; status: PaperStatus; rejection_reason: string | null;
          reviewed_by: string | null; reviewed_at: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "papers_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "papers_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      help_requests: {
        Row: {
          id: string; user_id: string | null; subject: string; message: string;
          status: HelpRequestStatus; admin_response: string | null; resolved_by: string | null;
          created_at: string; updated_at: string;
        };
        Insert: { user_id: string; subject: string; message: string };
        Update: Partial<{ status: HelpRequestStatus; admin_response: string | null; resolved_by: string | null }>;
        Relationships: [];
      };
      paper_downloads: {
        Row: { id: number; paper_id: string; user_id: string | null; created_at: string };
        Insert: { paper_id: string; user_id?: string | null };
        Update: never;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string; paper_id: string; reason: ReportReason; details: string | null;
          reported_by: string | null; status: ReportStatus; resolved_by: string | null; created_at: string;
        };
        Insert: {
          paper_id: string; reason: ReportReason; details?: string | null; reported_by: string;
        };
        Update: Partial<{ status: ReportStatus; resolved_by: string | null }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_download_count: {
        Args: { p_paper_id: string };
        Returns: void;
      };
    };
  };
}

// Convenience joined shape used throughout the UI.
export interface PaperWithRelations {
  id: string;
  year: number;
  board: string;
  class: string;
  exam_type: string;
  full_marks: number;
  file_size: number;
  status: PaperStatus;
  download_count: number;
  created_at: string;
  subjects: { id: string; name: string } | null;
  schools: { id: string; slug: string; name: string; verified: boolean } | null;
}
