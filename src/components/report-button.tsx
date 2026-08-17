"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { ReportReason } from "@/lib/database.types";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "wrong_metadata", label: "Wrong metadata" },
  { value: "duplicate", label: "Duplicate" },
  { value: "corrupted_pdf", label: "Corrupted PDF" },
  { value: "wrong_paper", label: "Wrong paper" },
  { value: "copyright", label: "Copyright concern" },
  { value: "other", label: "Other" },
];

export function ReportButton({ paperId, isAuthenticated }: { paperId: string; isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("wrong_metadata");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleOpen() {
    if (!isAuthenticated) {
      toast.error("Please sign in to report a paper.");
      return;
    }
    setOpen(true);
  }

  async function submit() {
    setSubmitting(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Please sign in to report a paper.");
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from("reports").insert({
      paper_id: paperId,
      reason,
      details: details || null,
      reported_by: userData.user.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit your report. Try again.");
      return;
    }
    toast.success("Thanks — our moderators will take a look.");
    setOpen(false);
    setDetails("");
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-accent"
      >
        <Flag className="h-3.5 w-3.5" />
        Report Paper
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Report this paper</DialogTitle>
          <div className="space-y-3">
            <Select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
