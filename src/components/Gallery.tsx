"use client";

import { useEffect } from "react";
import type { GalleryItem } from "@/lib/types";
import { downloadPng } from "@/lib/gallery";
import { GALLERY_MAX_ITEMS } from "@/lib/types";

type GalleryProps = {
  items: GalleryItem[];
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onSelect: (item: GalleryItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

export function Gallery({
  items,
  expanded,
  onExpandedChange,
  onSelect,
  onRemove,
  onClear,
}: GalleryProps) {
  useEffect(() => {
    document.body.classList.toggle("gallery-sheet-open", expanded);
    return () => {
      document.body.classList.remove("gallery-sheet-open");
    };
  }, [expanded]);

  function toggle() {
    onExpandedChange(!expanded);
  }

  return (
    <section
      className={`gallery-sheet${expanded ? " is-expanded" : " is-collapsed"}`}
      id="gallery"
      aria-label="Browser gallery"
    >
      <button
        type="button"
        className="gallery-sheet-toggle"
        aria-expanded={expanded}
        aria-controls="gallery-sheet-panel"
        onClick={toggle}
      >
        <span className="gallery-sheet-handle" aria-hidden="true" />
        <span className="gallery-sheet-toggle-copy">
          <span className="gallery-sheet-title">Browser gallery</span>
          <span className="gallery-sheet-meta">
            {items.length === 0
              ? "Empty · tap to open"
              : `${items.length} saved · capped at ${GALLERY_MAX_ITEMS}`}
          </span>
        </span>
        <span className="gallery-sheet-chevron" aria-hidden="true" />
      </button>

      <div
        id="gallery-sheet-panel"
        className="gallery-sheet-panel"
        hidden={!expanded}
      >
        <div className="gallery-sheet-inner">
          <div className="section-head gallery-head">
            <div>
              <h2>Browser gallery</h2>
              <p>
                Saved on this device only — capped at {GALLERY_MAX_ITEMS}{" "}
                designs.
              </p>
            </div>
            {items.length > 0 ? (
              <button type="button" className="text-btn" onClick={onClear}>
                Clear all
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="gallery-empty">
              Generated mosaics land here so you can revisit and re-download
              them.
            </p>
          ) : (
            <ul className="gallery-grid">
              {items.map((item) => (
                <li key={item.id} className="gallery-item">
                  <button
                    type="button"
                    className="gallery-thumb-btn"
                    onClick={() => onSelect(item)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageDataUrl}
                      alt=""
                      className="gallery-thumb"
                    />
                    <span className="gallery-caption">
                      <span className="gallery-caption-prompt">
                        {item.prompt}
                      </span>
                      <span className="gallery-caption-meta">
                        {item.aspectRatio} · {item.detailLevel} ·{" "}
                        {item.backgroundMode === "themed" ? "bg" : "no bg"} ·{" "}
                        {item.colorCount} colors ·{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                  </button>
                  <div className="gallery-actions">
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() =>
                        downloadPng(
                          item.imageDataUrl,
                          `mosaic-${item.colorCount}c-${item.id.slice(0, 8)}.png`,
                        )
                      }
                    >
                      PNG
                    </button>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => onRemove(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
