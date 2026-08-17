"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface HelpRequest {
  id: string;
  subject: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
  profiles: { display_name: string | null } | null;
}

export function HelpRequestsQueue() {
  const [rows, setRows] = useState<HelpRequest[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("help_requests")
      .select("id, subject, message, status, created_at, profiles:user_id ( display_name )")
      .eq("status", "open")
      .order("created_at", { ascending: true });
    setRows((data as any) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id: string) {
    const response = drafts[id]?.trim();
    if (!response) {
      toast.error("Add a reply before marking it resolved.");
      return;
    }
    setBusyId(id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("help_requests")
      .update({ status: "resolved", admin_response: response, resolved_by: userData.user?.id })
      .eq("id", id);
    setBusyId(null);
    if (error) return toast.error("Failed to resolve.");
    toast.success("Marked resolved — the user will see your reply.");
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  }

  if (rows === null) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No open help requests. Nice and tidy.</p>;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-lg border border-border p-4 text-sm">
          <p className="font-medium">{r.subject}</p>
          <p className="mt-1 text-muted-foreground">{r.message}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            From {r.profiles?.display_name ?? "unknown"} · {formatDate(r.created_at)}
          </p>
          <textarea
            value={drafts[r.id] ?? ""}
            onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
            placeholder="Write a reply…"
            rows={2}
            className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <div className="mt-2 flex justify-end">
            <button
              disabled={busyId === r.id}
              onClick={() => resolve(r.id)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Send reply & resolve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
