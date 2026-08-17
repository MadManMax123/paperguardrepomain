"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { addSubjectSchema } from "@/lib/validations";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { findMostSimilar, stringSimilarity } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

type Subject = { id: string; name: string };

export function AddSubjectDialog({
  open,
  onOpenChange,
  subjects,
  onSelectExisting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  /** Called when the person picks an existing subject instead of requesting a new one. */
  onSelectExisting?: (subject: Subject) => void;
}) {
  const [name, setName] = useState("");
  const [acknowledgedDifferent, setAcknowledgedDifferent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const match = useMemo(() => findMostSimilar(name, subjects, 0.6), [name, subjects]);
  const isExactMatch = !!match && stringSimilarity(name, match.item.name) >= 0.98;
  // Show the suggestion whenever there's a decent match the person hasn't already dismissed —
  // an exact match always blocks submission (no point requesting a duplicate).
  const showSuggestion = !!match && (isExactMatch || !acknowledgedDifferent);

  function reset() {
    setName("");
    setAcknowledgedDifferent(false);
  }

  function useExisting() {
    if (!match) return;
    onSelectExisting?.(match.item);
    toast.success(`Using existing subject "${match.item.name}".`);
    onOpenChange(false);
    reset();
  }

  async function submit() {
    if (showSuggestion) return; // must resolve the suggestion first
    const parsed = addSubjectSchema.safeParse({ name });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please check the form.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Please sign in first.");
      setSubmitting(false);
      return;
    }
    const { error } = await supabase
      .from("subject_requests")
      .insert({ name: parsed.data.name, requested_by: userData.user.id });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit request.");
      return;
    }
    toast.success("Subject requested! A moderator will review it.");
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogTitle>Request a subject</DialogTitle>
        <DialogDescription>
          Not in the list yet? A moderator will review and add it before it appears in filters.
        </DialogDescription>
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setAcknowledgedDifferent(false); }}
            placeholder="Subject name"
            autoFocus
          />

          {showSuggestion && match && (
            <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-accent p-3 text-xs">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <div className="flex-1">
                {isExactMatch ? (
                  <p>
                    <span className="font-medium">{match.item.name}</span> already exists — please use it
                    instead of requesting a duplicate.
                  </p>
                ) : (
                  <p>
                    Did you mean <span className="font-medium">{match.item.name}</span>?
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={useExisting}
                    className="rounded-md bg-primary px-2.5 py-1 font-medium text-primary-foreground hover:opacity-90"
                  >
                    Use &quot;{match.item.name}&quot;
                  </button>
                  {!isExactMatch && (
                    <button
                      type="button"
                      onClick={() => setAcknowledgedDifferent(true)}
                      className="rounded-md border border-border px-2.5 py-1 font-medium hover:bg-muted"
                    >
                      No, mine is different
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={submitting || !name.trim() || showSuggestion}>
            {submitting ? "Submitting…" : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
