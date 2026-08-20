"use client";

import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PdfFullscreenModalProps {
  /** Signed URL (or any embeddable URL) for the PDF. Modal stays closed while null/undefined. */
  url: string | null | undefined;
  /** Used for the iframe title and screen-reader dialog title. */
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Near-viewport-size PDF preview shown in a modal. Escape, click-outside,
 * and the close button all dismiss it (Escape/click-outside are handled by
 * the underlying Dialog primitive).
 */
export function PdfFullscreenModal({ url, title, open, onOpenChange }: PdfFullscreenModalProps) {
  return (
    <Dialog open={open && !!url} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="left-1/2 top-1/2 h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-card p-2 sm:p-3"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {url && <iframe src={url} title={title} className="h-full w-full rounded-md" />}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close fullscreen preview"
          className="absolute right-3 top-3 rounded-md bg-black/70 p-2 text-white backdrop-blur transition-opacity hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </DialogContent>
    </Dialog>
  );
}

interface PdfPreviewProps {
  /** Signed URL (or any embeddable URL) for the PDF. */
  url: string | null | undefined;
  /** Used for the iframe title and screen-reader dialog title. */
  title: string;
  /** Classes applied to the inline preview box (size/shape/border). */
  className?: string;
}

/**
 * Inline PDF preview with a fullscreen toggle. Click the preview (or the
 * "Fullscreen" button that appears on hover/focus) to open the PDF in a
 * near-viewport-size modal.
 */
export function PdfPreview({ url, title, className }: PdfPreviewProps) {
  const [open, setOpen] = useState(false);

  if (!url) {
    return (
      <div className={cn("flex items-center justify-center text-sm text-muted-foreground", className)}>
        Preview unavailable
      </div>
    );
  }

  return (
    <>
      <div className={cn("group relative", className)}>
        <iframe src={url} title={title} className="h-full w-full" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/85 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100"
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          Fullscreen
        </button>
      </div>

      <PdfFullscreenModal url={url} title={title} open={open} onOpenChange={setOpen} />
    </>
  );
}
