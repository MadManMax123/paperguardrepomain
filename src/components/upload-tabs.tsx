"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadForm } from "@/components/upload-form";
import { BulkUploadForm } from "@/components/bulk-upload-form";

interface FilterOptions {
  boards: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  examTypes: { id: string; name: string }[];
}
type School = { id: string; name: string; board: string };

export function UploadTabs({
  filterOptions,
  schools,
}: {
  filterOptions: FilterOptions;
  schools: School[];
}) {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  return (
    <div>
      <div className="mb-5 inline-flex rounded-md border border-border p-1 text-sm">
        {(["single", "bulk"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`relative rounded px-4 py-1.5 font-medium transition-colors ${
              mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {mode === m && (
              <motion.span
                layoutId="upload-mode-pill"
                className="absolute inset-0 rounded bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{m === "single" ? "One paper" : "Multiple papers"}</span>
          </button>
        ))}
      </div>

      {mode === "single" ? (
        <UploadForm filterOptions={filterOptions} schools={schools} />
      ) : (
        <BulkUploadForm filterOptions={filterOptions} schools={schools} mode="self" />
      )}
    </div>
  );
}
