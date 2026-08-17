"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-md border border-border bg-muted px-4 py-3 font-mono text-xs leading-relaxed">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        aria-label="Copy to clipboard"
        className="absolute right-2 top-2 rounded-md border border-border bg-card p-1.5 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-seal" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary font-mono text-xs font-semibold text-primary">
        {n}
      </span>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">{title}</p>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function AdminGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adding schools, subjects, classes & exam types</CardTitle>
          <CardDescription>
            No SQL needed for this — use the <span className="font-medium text-foreground">Taxonomy</span> tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Step n={1} title="Schools">
            Filled in directly and marked verified immediately — this bypasses the student-facing{" "}
            <span className="font-medium text-foreground">School requests</span> queue, since you&apos;re adding
            it yourself.
          </Step>
          <Step n={2} title="Subjects, classes, exam types">
            Each gets a display name (shown to users) and an identifier (used internally in URLs and filters,
            auto-generated from the name). The identifier can&apos;t be changed after creation — only the display
            name can be edited later, using the pencil icon next to each entry.
          </Step>
          <Step n={3} title="No delete, by design">
            Existing entries can be renamed but not deleted here, since papers may already reference them and
            removing one would break those papers&apos; listings. If something was added by mistake and has no
            papers attached, it can be removed directly in Supabase Dashboard → Table Editor.
          </Step>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Owner edits & resubmits</CardTitle>
          <CardDescription>
            Students can now fix their own submissions from{" "}
            <span className="font-medium text-foreground">/upload</span> — nothing for you to do, but worth
            knowing about when you&apos;re reviewing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Step n={1} title="While pending">
            The uploader can edit any field, or swap the PDF, any time before you approve or reject it. This
            doesn&apos;t create a new row or notify you — it just updates in place.
          </Step>
          <Step n={2} title="After you reject">
            A <span className="font-medium text-foreground">rejected</span> paper isn&apos;t a dead end: the
            uploader can edit it to address your reason and it automatically goes back to{" "}
            <span className="font-medium text-foreground">pending</span>, landing in your queue again like a
            fresh submission.
          </Step>
          <Step n={3} title="Approved papers are untouchable by owners">
            Once approved, only you can edit or delete it — an uploader spotting a mistake after approval
            still has to go through <span className="font-medium text-foreground">Reports</span> (they&apos;ll
            report their own paper), same as anyone else.
          </Step>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responding to help requests</CardTitle>
          <CardDescription>
            The <span className="font-medium text-foreground">Help requests</span> tab is a general inbox —
            anything a user couldn&apos;t resolve with{" "}
            <span className="font-medium text-foreground">Report Paper</span>, since that&apos;s scoped to one
            paper.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Step n={1} title="Write a reply, then resolve">
            Type your answer in the box under their message and hit{" "}
            <span className="font-medium text-foreground">Send reply &amp; resolve</span> — there&apos;s no
            separate &quot;dismiss without reply&quot;, since every message deserves a response.
          </Step>
          <Step n={2} title="They'll see it in the same widget">
            Your reply appears under their request the next time they open the help button (bottom-right on
            any page) — there&apos;s no email notification, so a quick reply matters more than a thorough one.
          </Step>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk uploading papers</CardTitle>
          <CardDescription>
            The <span className="font-medium text-foreground">Bulk upload</span> tab is for adding many papers at
            once — useful for digitizing a stack of papers from one school, or seeding a subject&apos;s archive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Step n={1} title="Drop in every file at once">
            Drag and drop as many PDFs as you have — each gets its own row with its own board, school, class,
            subject, exam type, year, and full marks fields to fill in.
          </Step>
          <Step n={2} title="Use “Apply to all” for shared fields">
            If a batch of files shares the same school, board, or year, set those once in the “Apply to all” bar
            and it fills every row — then just adjust the fields that differ per file, like subject.
          </Step>
          <Step n={3} title="These publish immediately">
            Unlike the regular <span className="font-medium text-foreground">/upload</span> page (which queues
            student submissions as pending), papers added here go straight to{" "}
            <span className="font-medium text-foreground">approved</span> — no separate review step, since a
            moderator is doing the adding.
          </Step>
          <Step n={4} title="Regular users can bulk upload too">
            The <span className="font-medium text-foreground">/upload</span> page now has the same &quot;Multiple
            papers&quot; option for signed-in students — theirs still queue as{" "}
            <span className="font-medium text-foreground">pending</span> and show up in your{" "}
            <span className="font-medium text-foreground">Pending uploads</span> tab like any other submission.
          </Step>
          <Step n={5} title="Failed rows stay put">
            If a row fails (bad file, missing field), it stays in the list with the error shown so you can fix it
            and re-submit without re-picking every other file.
          </Step>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Granting moderator or admin access</CardTitle>
          <CardDescription>
            User roles are managed directly in Supabase, not in this app — there&apos;s no in-app &quot;make
            admin&quot; button by design, to keep it a deliberate action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Step n={1} title="Find the person's user ID">
            They need to have signed in at least once. Look them up under Supabase Dashboard →
            Authentication → Users, or run:
            <CodeBlock code={`select id, email from auth.users where email = 'someone@example.com';`} />
          </Step>
          <Step n={2} title="Set their role">
            Run this in Supabase Dashboard → SQL Editor, swapping in the ID from step 1:
            <CodeBlock code={`update profiles set role = 'moderator' where id = '<user-id>';\n-- or role = 'admin' for full access`} />
          </Step>
          <Step n={3} title="Know the difference">
            <span className="font-medium text-foreground">Moderators</span> can review pending uploads, school
            requests, and reports. <span className="font-medium text-foreground">Admins</span> can additionally
            change other users&apos; roles and access every part of this dashboard. Everyone starts as{" "}
            <code className="font-mono">student</code>.
          </Step>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What each tab does</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Pending uploads", desc: "New paper submissions waiting for review before they appear publicly." },
            { label: "Bulk upload", desc: "Add many papers at once, straight to published — see below." },
            { label: "Taxonomy", desc: "Add schools, subjects, classes, and exam types — see below." },
            { label: "School requests", desc: "Requests to add a school that isn't in the directory yet." },
            { label: "Reports", desc: "Flags from users about wrong metadata, duplicates, or bad files on a specific paper." },
            { label: "Help requests", desc: "General messages from users (account issues, stuck uploads, questions) — not tied to one paper. Reply and it shows up for them." },
            { label: "Statistics", desc: "Live counts across papers, schools, users, and downloads." },
          ].map((t) => (
            <div key={t.label} className="rounded-md border border-border p-3">
              <p className="text-sm font-medium">{t.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setting up Discord sign-in</CardTitle>
          <CardDescription>
            One-time setup for whoever owns the Supabase project. Regular admins don&apos;t need to repeat this.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Step n={1} title="Create a Discord application">
            Go to the{" "}
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Discord Developer Portal
            </a>{" "}
            → New Application → give it a name (e.g. &quot;PaperGuard&quot;).
          </Step>
          <Step n={2} title="Get the client ID and secret">
            In the app&apos;s <span className="font-medium text-foreground">OAuth2</span> page, copy the{" "}
            <span className="font-medium text-foreground">Client ID</span> and generate a{" "}
            <span className="font-medium text-foreground">Client Secret</span>.
          </Step>
          <Step n={3} title="Add the Supabase redirect URL">
            Still on the OAuth2 page, under <span className="font-medium text-foreground">Redirects</span>, add:
            <CodeBlock code={`https://<your-project-ref>.supabase.co/auth/v1/callback`} />
          </Step>
          <Step n={4} title="Enable Discord in Supabase">
            Supabase Dashboard → Authentication → Providers → Discord → toggle it on, and paste in the
            Client ID and Client Secret from step 2.
          </Step>
          <Step n={5} title="Done">
            No app code or environment variables need to change — the &quot;Continue with Discord&quot; button
            on the sign-in page will start working as soon as the provider is enabled in Supabase.
          </Step>
        </CardContent>
      </Card>
    </div>
  );
}
