"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDate, formatFileSize } from "@/lib/utils";

interface PendingPaper {
  id: string;
  year: number;
  board: string;
  class: string;
  full_marks: number;
  file_path: string;
  file_size: number;
  original_filename: string | null;
  created_at: string;
  subjects: { name: string } | null;
  schools: { name: string } | null;
  profiles: { display_name: string | null } | null;
}

export function PendingUploads() {
  const [rows, setRows] = useState<PendingPaper[] | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("papers")
      .select(
        `id, year, board, class, full_marks, file_path, file_size, original_filename, created_at,
         subjects:subject_id ( name ), schools:school_id ( name ), profiles:uploaded_by ( display_name )`
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setRows((data as any) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function preview(path: string) {
    const { data } = await supabase.storage.from("papers").createSignedUrl(path, 300);
    setPreviewUrl(data?.signedUrl ?? null);
  }

  async function approve(id: string) {
    setBusyId(id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("papers")
      .update({ status: "approved", reviewed_by: userData.user?.id, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    setBusyId(null);
    if (error) return toast.error("Failed to approve.");
    toast.success("Paper approved.");
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  }

  async function reject(id: string) {
    const reason = window.prompt("Reason for rejection (shown to the uploader):");
    if (reason === null) return;
    setBusyId(id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("papers")
      .update({
        status: "rejected",
        rejection_reason: reason || "Did not meet quality guidelines.",
        reviewed_by: userData.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    setBusyId(null);
    if (error) return toast.error("Failed to reject.");
    toast.success("Paper rejected.");
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  }

  async function remove(id: string, filePath: string) {
    if (!window.confirm("Permanently delete this upload?")) return;
    setBusyId(id);
    await supabase.storage.from("papers").remove([filePath]);
    const { error } = await supabase.from("papers").delete().eq("id", id);
    setBusyId(null);
    if (error) return toast.error("Failed to delete.");
    toast.success("Deleted.");
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  }

  if (rows === null) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No pending uploads. Nice and tidy.</p>;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="text-sm">
              <p className="font-medium">
                {r.subjects?.name ?? "Unknown subject"} — {r.schools?.name ?? "Unknown school"}
              </p>
              <p className="text-muted-foreground">
                {r.board.toUpperCase()} · Class {r.class.toUpperCase()} · {r.year} · Full marks {r.full_marks}
              </p>
              <p className="text-muted-foreground">
                {formatFileSize(r.file_size)} · uploaded by {r.profiles?.display_name ?? "unknown"} · {formatDate(r.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => preview(r.file_path)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                Preview
              </button>
              <button
                disabled={busyId === r.id}
                onClick={() => approve(r.id)}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={busyId === r.id}
                onClick={() => reject(r.id)}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                disabled={busyId === r.id}
                onClick={() => remove(r.id, r.file_path)}
                className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="h-[85vh] w-full max-w-2xl rounded-lg bg-card p-2" onClick={(e) => e.stopPropagation()}>
            <iframe src={previewUrl} className="h-full w-full rounded-md" title="Pending paper preview" />
          </div>
        </div>
      )}
    </div>
  );
}
