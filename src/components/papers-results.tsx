"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PaperCard } from "@/components/paper-card";
import { toast } from "sonner";
import type { PaperSearchInput } from "@/lib/validations";
import type { PaperWithRelations } from "@/lib/database.types";

export function PapersResults({
  papers,
  total,
  pageSize,
  current,
}: {
  papers: PaperWithRelations[];
  total: number;
  pageSize: number;
  current: PaperSearchInput;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [zipping, setZipping] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  async function downloadZip(mode: "selected" | "filtered") {
    setZipping(true);
    try {
      const body =
        mode === "selected"
          ? { paperIds: Array.from(selected) }
          : { filters: current };

      const res = await fetch("/api/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to build ZIP");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? "paperguard.zip";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong building the ZIP.");
    } finally {
      setZipping(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{total.toLocaleString("en-IN")} papers found</p>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button
              disabled={zipping}
              onClick={() => downloadZip("selected")}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              {zipping ? "Zipping…" : `Download ${selected.size} selected as ZIP`}
            </button>
          )}
          {total > 0 && (
            <button
              disabled={zipping}
              onClick={() => downloadZip("filtered")}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {zipping ? "Zipping…" : "Download all matching as ZIP"}
            </button>
          )}
        </div>
      </div>

      {papers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="font-medium">No papers found.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try removing a filter or upload the first paper for this category.</p>
          <Link href="/upload" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Upload a paper
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {papers.map((p) => (
              <PaperCard
                key={p.id}
                paper={p as any}
                selectable
                selected={selected.has(p.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`h-8 w-8 rounded-md text-sm ${
                    p === current.page ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
