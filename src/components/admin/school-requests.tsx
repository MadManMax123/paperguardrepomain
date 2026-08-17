"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { slugify, formatDate } from "@/lib/utils";

interface SchoolRequest {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  board: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export function SchoolRequests() {
  const [rows, setRows] = useState<SchoolRequest[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  async function load() {
    const { data } = await supabase
      .from("school_requests")
      .select("id, name, city, state, board, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setRows((data as any) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(req: SchoolRequest) {
    setBusyId(req.id);
    const { data: userData } = await supabase.auth.getUser();

    // Create the verified school, then mark the request approved and link it.
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .insert({
        slug: `${slugify(req.name)}-${Math.random().toString(36).slice(2, 6)}`,
        name: req.name,
        city: req.city,
        state: req.state,
        board: req.board,
        verified: true,
      })
      .select("id")
      .single();

    if (schoolError || !school) {
      setBusyId(null);
      toast.error("Failed to create school.");
      return;
    }

    const { error } = await supabase
      .from("school_requests")
      .update({ status: "approved", reviewed_by: userData.user?.id, resulting_school_id: school.id })
      .eq("id", req.id);

    setBusyId(null);
    if (error) return toast.error("School created, but failed to update the request.");
    toast.success(`${req.name} added and verified.`);
    setRows((prev) => prev?.filter((r) => r.id !== req.id) ?? null);
  }

  async function reject(id: string) {
    setBusyId(id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("school_requests")
      .update({ status: "rejected", reviewed_by: userData.user?.id })
      .eq("id", id);
    setBusyId(null);
    if (error) return toast.error("Failed to reject.");
    toast.success("Request rejected.");
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  }

  if (rows === null) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No pending school requests.</p>;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 text-sm">
          <div>
            <p className="font-medium">{r.name}</p>
            <p className="text-muted-foreground">
              {r.board.toUpperCase()}{r.city ? ` · ${r.city}` : ""}{r.state ? `, ${r.state}` : ""} · requested {formatDate(r.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              disabled={busyId === r.id}
              onClick={() => approve(r)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Approve & verify
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
      ))}
    </div>
  );
}
