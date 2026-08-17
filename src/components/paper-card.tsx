"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, BadgeCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";

type PaperCardData = {
  id: string;
  year: number;
  board: string;
  class: string;
  exam_type: string;
  full_marks: number;
  download_count?: number;
  created_at: string;
  subjects: { id: string; name: string } | null;
  schools: { id: string; slug: string; name: string; verified: boolean } | null;
};

const EXAM_TYPE_LABELS: Record<string, string> = {
  "unit-test": "Unit Test",
  "periodic-test": "Periodic Test",
  "term-1": "Term 1",
  "term-2": "Term 2",
  "half-yearly": "Half-Yearly Examination",
  annual: "Annual Examination",
  "pre-board": "Pre-Board",
  "board-examination": "Board Examination",
  other: "Other",
};

export function PaperCard({ paper, selectable, selected, onToggleSelect, index = 0 }: {
  paper: PaperCardData;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  index?: number;
}) {
  const examLabel = EXAM_TYPE_LABELS[paper.exam_type] ?? paper.exam_type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Card className="flex h-full flex-col transition-shadow duration-200 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-lg font-semibold leading-tight">{paper.subjects?.name ?? "Unknown subject"}</p>
              <p className="text-sm text-muted-foreground">{examLabel}</p>
            </div>
            {selectable && (
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
                checked={!!selected}
                onChange={() => onToggleSelect?.(paper.id)}
                aria-label="Select paper"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-2 pb-2">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium">{paper.schools?.name ?? "Unknown school"}</span>
            {paper.schools?.verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-seal" aria-label="Verified school" />
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="font-mono text-[10px] tracking-wide">{paper.board.toUpperCase()}</Badge>
            <Badge variant="secondary" className="font-mono text-[10px] tracking-wide">Class {paper.class.toUpperCase()}</Badge>
            <Badge variant="secondary" className="font-mono text-[10px] tracking-wide">{paper.year}</Badge>
          </div>
          <p className="font-mono text-xs text-muted-foreground">Full Marks: {paper.full_marks}</p>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2.5 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="truncate">{formatDate(paper.created_at)}{typeof paper.download_count === "number" ? ` · ${paper.download_count} downloads` : ""}</span>
          <div className="flex gap-2">
            <Link
              href={`/paper/${paper.id}`}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md border border-border px-2 text-xs font-medium transition-colors hover:bg-accent"
            >
              <Eye className="h-3.5 w-3.5 shrink-0" />Preview
            </Link>
            <a
              href={`/api/download/${paper.id}`}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground transition-transform hover:opacity-90 active:scale-95"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />Download
            </a>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
