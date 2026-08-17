"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { addSchoolSchema } from "@/lib/validations";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function AddSchoolDialog({
  open,
  onOpenChange,
  boards,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boards: { id: string; name: string }[];
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [board, setBoard] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const parsed = addSchoolSchema.safeParse({ name, city, state, board });
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
    const { error } = await supabase.from("school_requests").insert({
      name, city: city || null, state: state || null, board, requested_by: userData.user.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit request.");
      return;
    }
    toast.success("School requested! A moderator will review and verify it.");
    onOpenChange(false);
    setName(""); setCity(""); setState(""); setBoard("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Request a school</DialogTitle>
        <DialogDescription>Not in the directory yet? A moderator will verify it before it appears in filters.</DialogDescription>
        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="School name" />
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
          <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
          <Select value={board} onChange={(e) => setBoard(e.target.value)}>
            <option value="">Select board</option>
            {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
