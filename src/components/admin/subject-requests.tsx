"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { slugify, formatDate, findMostSimilar } from "@/lib/utils";

interface SubjectRequest {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface ExistingSubject {
  id: string;
  name: string;
}

export function SubjectRequests({ existingSubjects }: { existingSubjects: ExistingSubject[] }) {
  const [rows, setRows] = useState<SubjectRequest[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("subject_requests")
      .select("id, name, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setRows((data as any) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(req: SubjectRequest) {
    setBusyId(req.id);
    const { data: userData } = await supabase.auth.getUser();

    // Create the subject, then mark the request approved and link it.
    const slug = `${slugify(req.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .insert({ id: slug, name: req.name })
      .select("id")
      .single();

    if (subjectError || !subject) {
      setBusyId(null);
      toast.error("Failed to create subject.");
      return;
    }

    const { error } = await supabase
      .from("subject_requests")
      .update({ status: "approved", reviewed_by: userData.user?.id, resulting_subject_id: subject.id })
      .eq("id", req.id);

    setBusyId(null);
    if (error) return toast.error("Subject created, but failed to update the request.");
    toast.success(`${req.name} added.`);
    setRows((prev) => prev?.filter((r) => r.id !== req.id) ?? null);
  }

  async function reject(id: string) {
    setBusyId(id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("subject_requests")
      .update({ status: "rejected", reviewed_by: userData.user?.id })
      .eq("id", id);
    setBusyId(null);
    if (error) return toast.error("Failed to reject.");
    toast.success("Request rejected.");
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  }

  if (rows === null) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No pending subject requests.</p>;

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        // Flag likely duplicates for the moderator too — a person may not have seen (or may
        // have dismissed) the same suggestion the upload form shows.
        const match = findMostSimilar(r.name, existingSubjects, 0.6);
        return (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 text-sm">
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-muted-foreground">requested {formatDate(r.created_at)}</p>
              {match && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Possibly similar to existing subject &quot;{match.item.name}&quot; — consider rejecting as a duplicate.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                disabled={busyId === r.id}
                onClick={() => approve(r)}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={busyId === r.id}
                onClick={() => reject(r.id)}
                className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
