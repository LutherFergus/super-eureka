"use client";

import { useState } from "react";
import { NamePrompt } from "@/components/NamePrompt";
import {
  blanketTypeLabel,
  buildDownloadBaseName,
  downloadOrSharePdf,
  imageDataUrlToPdfBlob,
} from "@/lib/downloadPdf";
import type { GalleryItem } from "@/lib/types";

type ResultPanelProps = {
  item: GalleryItem | null;
  busy: boolean;
  error: string | null;
};

export function ResultPanel({ item, busy, error }: ResultPanelProps) {
  const [nameOpen, setNameOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleNamedDownload(name: string) {
    if (!item) return;
    setNameOpen(false);
    setPdfBusy(true);
    setLocalError(null);

    try {
      const baseName = buildDownloadBaseName(name, item.aspectRatio);
      const blob = await imageDataUrlToPdfBlob(item.imageDataUrl, baseName);
      const result = await downloadOrSharePdf(blob, `${baseName}.pdf`);
      if (result === "aborted") {
        setLocalError(null);
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not build the PDF.",
      );
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <section className="result-panel" aria-live="polite" aria-label="Design">
      {item ? (
        <NamePrompt
          open={nameOpen}
          initialName={item.prompt}
          blanketType={blanketTypeLabel(item.aspectRatio)}
          onConfirm={(name) => {
            void handleNamedDownload(name);
          }}
          onClose={() => setNameOpen(false)}
        />
      ) : null}

      <div className="result-stage">
        {busy || pdfBusy ? (
          <div className="result-empty">
            <span className="pulse-dot" aria-hidden="true" />
            {pdfBusy ? "Preparing PDF…" : "Creating…"}
          </div>
        ) : item ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="result-image"
              src={item.imageDataUrl}
              alt={item.prompt}
            />
            <div className="result-toolbar">
              <p className="result-prompt">{item.prompt}</p>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setNameOpen(true)}
              >
                Download PDF
              </button>
            </div>
          </>
        ) : (
          <div className="result-empty">Your design shows up here.</div>
        )}
      </div>

      {localError || error ? (
        <p className="form-error result-error">{localError || error}</p>
      ) : null}
    </section>
  );
}
