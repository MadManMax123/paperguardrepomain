"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LifeBuoy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { helpRequestSchema, type HelpRequestInput } from "@/lib/validations";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import type { HelpRequestStatus } from "@/lib/database.types";

interface PastRequest {
  id: string;
  subject: string;
  message: string;
  status: HelpRequestStatus;
  admin_response: string | null;
  created_at: string;
}

export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pastRequests, setPastRequests] = useState<PastRequest[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HelpRequestInput>({ resolver: zodResolver(helpRequestSchema) });

  async function loadPastRequests() {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("help_requests")
      .select("id, subject, message, status, admin_response, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setPastRequests((data as any) ?? []);
  }

  useEffect(() => {
    if (open && user) loadPastRequests();
  }, [open, user]);

  async function onSubmit(values: HelpRequestInput) {
    if (!user) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("help_requests").insert({
      user_id: user.id,
      subject: values.subject,
      message: values.message,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't send that. Please try again.");
      return;
    }
    toast.success("Sent — a moderator will get back to you here.");
    reset();
    loadPastRequests();
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        aria-label="Get help"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 22 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-card text-primary shadow-lg hover:bg-accent"
      >
        <LifeBuoy className="h-5 w-5" />
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Get help</DialogTitle>

          {checking ? null : !user ? (
            <>
              <DialogDescription>Sign in to send a message to the moderators.</DialogDescription>
              <DialogFooter>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Sign in
                </Link>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogDescription>
                For a problem with a specific paper, use <span className="font-medium text-foreground">Report Paper</span> on
                its page instead — this is for anything else: account issues, a stuck upload, general questions.
              </DialogDescription>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <Input placeholder="Subject" {...register("subject")} />
                  {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject.message}</p>}
                </div>
                <div>
                  <textarea
                    placeholder="What's going on?"
                    rows={4}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    {...register("message")}
                  />
                  {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
                </div>
                <Button type="submit" size="sm" disabled={submitting} className="w-full">
                  {submitting ? "Sending…" : "Send to moderators"}
                </Button>
              </form>

              {pastRequests && pastRequests.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Your requests</p>
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {pastRequests.map((r) => (
                      <div key={r.id} className="rounded-md border border-border p-2.5 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{r.subject}</p>
                          <Badge variant={r.status === "resolved" ? "success" : "warning"}>{r.status}</Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground">{formatDate(r.created_at)}</p>
                        {r.admin_response && (
                          <p className="mt-1.5 rounded bg-muted px-2 py-1.5 text-foreground">{r.admin_response}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
