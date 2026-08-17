"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Report {
  id: string;
  paper_id: string;
  reason: string;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  papers: { id: string; subjects: { name: string } | null; schools: { name: string } | null } | null;
}

const REASON_LABELS: Record<string, string> = {
  wrong_metadata: "Wrong metadata",
  duplicate: "Duplicate",
  corrupted_pdf: "Corrupted PDF",
  wrong_paper: "Wrong paper",
  copyright: "Copyright concern",
  other: "Other",
};

export function ReportsQueue() {
  const [rows, setRows] = useState<Report[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("reports")
      .select(
        `id, paper_id, reason, details, status, created_at,
         papers:paper_id ( id, subjects:subject_id ( name ), schools:school_id ( name ) )`
      )
      .eq("status", "open")
      .order("created_at", { ascending: true });
    setRows((data as any) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: "resolved" | "dismissed") {
    setBusyId(id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("reports")
      .update({ status, resolved_by: userData.user?.id })
      .eq("id", id);
    setBusyId(null);
    if (error) return toast.error("Failed to update report.");
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  }

  if (rows === null) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No open reports.</p>;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-lg border border-border p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {REASON_LABELS[r.reason] ?? r.reason} —{" "}
                <Link href={`/paper/${r.paper_id}`} className="text-primary hover:underline">
                  {r.papers?.subjects?.name ?? "Paper"} ({r.papers?.schools?.name ?? "Unknown school"})
                </Link>
              </p>
              {r.details && <p className="mt-1 text-muted-foreground">{r.details}</p>}
              <p className="mt-1 text-xs text-muted-foreground">Reported {formatDate(r.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <button
                disabled={busyId === r.id}
                onClick={() => updateStatus(r.id, "resolved")}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Mark resolved
              </button>
              <button
                disabled={busyId === r.id}
                onClick={() => updateStatus(r.id, "dismissed")}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
