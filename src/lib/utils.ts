import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(iso));
}

// Plain Levenshtein edit distance (no deps) — fine for short strings like subject names.
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

// 0 (nothing alike) .. 1 (identical) similarity between two names, case/whitespace-insensitive.
// Containment (e.g. "math" inside "mathematics") is boosted since abbreviations/typos of an
// existing subject are the most common near-duplicate case here.
export function stringSimilarity(a: string, b: string): number {
  const x = a.trim().toLowerCase().replace(/\s+/g, " ");
  const y = b.trim().toLowerCase().replace(/\s+/g, " ");
  if (!x || !y) return 0;
  if (x === y) return 1;
  const maxLen = Math.max(x.length, y.length);
  const editScore = 1 - levenshtein(x, y) / maxLen;
  const containmentScore = x.includes(y) || y.includes(x) ? 0.85 : 0;
  return Math.max(editScore, containmentScore);
}

// Finds the closest existing entry by name, if any, above the given threshold.
export function findMostSimilar<T extends { name: string }>(
  name: string,
  candidates: T[],
  threshold = 0.6
): { item: T; score: number } | null {
  let best: { item: T; score: number } | null = null;
  for (const item of candidates) {
    const score = stringSimilarity(name, item.name);
    if (!best || score > best.score) best = { item, score };
  }
  return best && best.score >= threshold ? best : null;
}

// Sanitizes a name for safe use inside a ZIP entry / filename.
export function safeFilenamePart(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/_+/g, "_");
}
