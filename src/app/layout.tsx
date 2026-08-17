import type { Metadata } from "next";
import { Lexend, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { NavBar } from "@/components/nav-bar";
import { PageTransition } from "@/components/page-transition";
import { HelpWidget } from "@/components/help-widget";

// Lexend: designed and validated to increase reading proficiency — the body
// face students will spend the most time with.
const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

// Space Grotesk: a geometric, slightly technical display face for headings —
// reads like print set for a paper header, not another rounded UI sans.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// JetBrains Mono: for paper codes, years, roll-number-style data — the
// tabular, exam-form register.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "PaperGuard — Find. Practice. Repeat.", template: "%s — PaperGuard" },
  description:
    "A fast, modern, community-driven repository of school examination papers — search, preview, and download ISC & CBSE papers from any school.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${lexend.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <script
          // Avoids flash-of-wrong-theme before React hydrates.
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <NavBar />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <Toaster richColors position="top-center" />
        <HelpWidget />
      </body>
    </html>
  );
}
