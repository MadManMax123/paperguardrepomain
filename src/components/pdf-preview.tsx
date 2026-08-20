"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Download, Maximize2, X } from "lucide-react";

interface PdfPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
  downloadHref?: string;
}

/**
 * Full-screen (viewport-covering) PDF preview. Built directly on Radix Dialog
 * rather than the shared <DialogContent> since that component is sized for
 * small confirmation dialogs, not document viewing.
 */
export function PdfPreviewModal({ open, onOpenChange, url, title, downloadHref }: PdfPreviewModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col bg-background outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4">
            <p className="truncate text-sm font-medium">{title}</p>
            <div className="flex shrink-0 items-center gap-2">
              {downloadHref && (
                <a
                  href={downloadHref}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              )}
              <DialogPrimitive.Close
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close full-screen preview"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-muted">
            {open && <iframe src={url} title={title} className="h-full w-full" />}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Inline PDF preview (the same aspect-[3/4] embed used on the paper detail
 * page) with a button that expands it into the full-screen modal above.
 */
export function PdfPreview({ url, title, downloadHref }: { url: string; title: string; downloadHref?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-muted">
        <iframe src={url} title={`${title} preview`} className="h-full w-full" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open full-screen preview"
          title="Full-screen preview"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <PdfPreviewModal open={open} onOpenChange={setOpen} url={url} title={title} downloadHref={downloadHref} />
    </>
  );
}
