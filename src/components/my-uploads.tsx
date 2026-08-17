"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { EditPaperDialog, type EditablePaper } from "@/components/edit-paper-dialog";
import type { PaperStatus } from "@/lib/database.types";

interface Row extends EditablePaper {
  created_at: string;
  rejection_reason: string | null;
  subjects: { name: string } | null;
}

interface FilterOptions {
  boards: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  examTypes: { id: string; name: string }[];
}

const STATUS_VARIANT: Record<PaperStatus, "warning" | "success" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

const SELECT_FIELDS = `
  id, year, board, class, subject_id, exam_type, full_marks, school_id, status,
  file_path, original_filename, rejection_reason, created_at, subjects:subject_id ( name )
`;

export function MyUploads({
  filterOptions,
  schools,
}: {
  filterOptions: FilterOptions;
  schools: { id: string; name: string; board: string }[];
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return setRows([]);
    const { data } = await supabase
      .from("papers")
      .select(SELECT_FIELDS)
      .eq("uploaded_by", userData.user.id)
      .order("created_at", { ascending: false });
    setRows((data as any) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (rows === null) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">You haven&apos;t uploaded any papers yet.</p>;

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const canEdit = r.status === "pending" || r.status === "rejected";
        return (
          <div key={r.id} className="rounded-md border border-border px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-medium">{r.subjects?.name ?? "Unknown subject"}</span>
                <span className="ml-2 text-muted-foreground">
                  {r.board.toUpperCase()} · Class {r.class.toUpperCase()} · {r.year} · {formatDate(r.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                {canEdit && (
                  <button
                    onClick={() => setEditing(r)}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                )}
              </div>
            </div>
            {r.status === "rejected" && r.rejection_reason && (
              <p className="mt-1.5 text-xs text-destructive">
                Reason: {r.rejection_reason}
                <span className="ml-1.5 text-muted-foreground">— fix it and resubmit above.</span>
              </p>
            )}
          </div>
        );
      })}

      <EditPaperDialog
        paper={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        filterOptions={filterOptions}
        schools={schools}
        onSaved={load}
      />
    </div>
  );
}
