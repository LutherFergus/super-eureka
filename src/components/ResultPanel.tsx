"use client";

import type { GalleryItem } from "@/lib/types";
import { downloadPng } from "@/lib/gallery";

type ResultPanelProps = {
  item: GalleryItem | null;
  busy: boolean;
  error: string | null;
};

export function ResultPanel({ item, busy, error }: ResultPanelProps) {
  return (
    <section className="result-panel" aria-live="polite" aria-label="Design">
      <div className="result-stage">
        {busy ? (
          <div className="result-empty">
            <span className="pulse-dot" aria-hidden="true" />
            Creating…
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
                onClick={() =>
                  downloadPng(
                    item.imageDataUrl,
                    `mosaic-${item.aspectRatio.replace(":", "x")}-${item.id.slice(0, 8)}.png`,
                  )
                }
              >
                Download
              </button>
            </div>
          </>
        ) : (
          <div className="result-empty">Your design shows up here.</div>
        )}
      </div>

      {error ? <p className="form-error result-error">{error}</p> : null}
    </section>
  );
}
