"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Moon, Sun, Upload, Menu, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/database.types";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Papers", href: "/papers" },
  { label: "Popular", href: "/papers?sort=popular" },
];

export function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle().then(({ data: profile }) => {
          setRole(profile?.role ?? null);
        });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setRole(null);
      if (session?.user) {
        supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle().then(({ data: profile }) => {
          setRole(profile?.role ?? null);
        });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const isModerator = role === "moderator" || role === "admin";

  // Small "things waiting for you" badge next to Admin — pending uploads,
  // open reports, and open help requests, in one glance from anywhere.
  useEffect(() => {
    if (!isModerator) return;
    const supabase = createClient();
    let cancelled = false;
    Promise.all([
      supabase.from("papers").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("help_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]).then(([pending, reports, help]) => {
      if (cancelled) return;
      setAlertCount((pending.count ?? 0) + (reports.count ?? 0) + (help.count ?? 0));
    });
    return () => {
      cancelled = true;
    };
  }, [isModerator]);

  // Close the mobile menu automatically whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary transition-transform group-hover:-rotate-6">
            <span className="font-display text-[11px] font-bold">PG</span>
          </span>
          PaperGuard
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="transition-colors hover:text-primary">
              {l.label}
            </Link>
          ))}
          {isModerator && (
            <Link href="/admin" className="flex items-center gap-1 transition-colors hover:text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
              {alertCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[10px] font-semibold text-highlight-foreground">
                  {alertCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            <motion.span
              key={isDark ? "sun" : "moon"}
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.span>
          </Button>

          {/* Upload / sign-in stay visible on all sizes since they're the primary actions */}
          {user ? (
            <>
              <Link
                href="/upload"
                className="hidden h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-accent sm:inline-flex"
              >
                <Upload className="h-4 w-4" />Upload
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:inline-flex">
                Sign out
              </Button>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-transform hover:opacity-90 active:scale-95 sm:inline-flex"
            >
              Sign in
            </Link>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3 text-sm font-medium">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="rounded-md px-2 py-2.5 transition-colors hover:bg-accent"
                >
                  {l.label}
                </Link>
              ))}
              {isModerator && (
                <Link href="/admin" className="flex items-center gap-1.5 rounded-md px-2 py-2.5 hover:bg-accent">
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                  {alertCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[10px] font-semibold text-highlight-foreground">
                      {alertCount}
                    </span>
                  )}
                </Link>
              )}
              <div className="my-1.5 border-t border-border" />
              {user ? (
                <>
                  <Link href="/upload" className="flex items-center gap-1.5 rounded-md px-2 py-2.5 hover:bg-accent">
                    <Upload className="h-4 w-4" />Upload
                  </Link>
                  <button onClick={signOut} className="rounded-md px-2 py-2.5 text-left text-destructive hover:bg-accent">
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-md bg-primary px-2 py-2.5 text-center font-medium text-primary-foreground"
                >
                  Sign in
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
