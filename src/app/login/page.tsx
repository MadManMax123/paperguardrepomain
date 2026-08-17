"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { StampMark } from "@/components/brand/stamp-mark";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [submitting, setSubmitting] = useState<"google" | "discord" | null>(null);
  const searchParams = useSearchParams();

  async function signInWith(provider: "google" | "discord") {
    setSubmitting(provider);
    const supabase = createClient();
    const next = searchParams.get("next") ?? "/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      toast.error(error.message);
      setSubmitting(null);
    }
    // On success, Supabase redirects the browser away — nothing else to do here.
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center text-center"
      >
        <StampMark size={64} />
        <h1 className="mt-4 font-display text-2xl font-bold">Sign in</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          Sign in to upload papers, track your submissions, and report issues.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
        className="space-y-3"
      >
        <button
          onClick={() => signInWith("google")}
          disabled={submitting !== null}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card py-2.5 text-sm font-medium transition-colors hover:bg-accent active:scale-[0.98] disabled:opacity-50"
        >
          <GoogleIcon />
          {submitting === "google" ? "Redirecting…" : "Continue with Google"}
        </button>

        <button
          onClick={() => signInWith("discord")}
          disabled={submitting !== null}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card py-2.5 text-sm font-medium transition-colors hover:bg-accent active:scale-[0.98] disabled:opacity-50"
        >
          <DiscordIcon />
          {submitting === "discord" ? "Redirecting…" : "Continue with Discord"}
        </button>
      </motion.div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Browsing, searching, previewing, and downloading don&apos;t require an account —
        sign in is only needed to upload or report a paper.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#5865F2">
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.26a18.27 18.27 0 0 0-5.48 0 12.6 12.6 0 0 0-.62-1.26.08.08 0 0 0-.08-.04c-1.7.29-3.36.8-4.89 1.52a.07.07 0 0 0-.03.03C.53 8.83-.32 13.15.1 17.42a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1 0-.13c.13-.09.25-.19.37-.28a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.19.37.28a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.11c.36.7.78 1.37 1.23 2a.08.08 0 0 0 .08.03 19.85 19.85 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-4.94-.83-9.22-3.5-13.02a.06.06 0 0 0-.03-.03zM8.02 14.79c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z" />
    </svg>
  );
}
