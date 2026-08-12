"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CreatorForm,
  type LocalGenerateRequest,
} from "@/components/CreatorForm";
import { Gallery } from "@/components/Gallery";
import { ResultPanel } from "@/components/ResultPanel";
import { SdEndpointGate } from "@/components/SdEndpointGate";
import {
  addToGallery,
  clearGallery,
  loadGallery,
  removeFromGallery,
  toImageDataUrl,
} from "@/lib/gallery";
import { generateWithLocalSd } from "@/lib/localSd";
import { loadSdEndpoint } from "@/lib/sdEndpoint";
import type { GalleryItem } from "@/lib/types";

export function MosaicApp() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [current, setCurrent] = useState<GalleryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [sdEndpoint, setSdEndpoint] = useState("");
  const [endpointOpen, setEndpointOpen] = useState(false);
  const [galleryExpanded, setGalleryExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await loadGallery();
      if (cancelled) return;
      setItems(loaded);
      if (loaded[0]) setCurrent(loaded[0]);
      setSdEndpoint(loadSdEndpoint());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerateImages(request: LocalGenerateRequest) {
    const endpoint = sdEndpoint.trim() || loadSdEndpoint();
    if (!endpoint) {
      setError("Set your PC Stable Diffusion URL first (SD PC).");
      setEndpointOpen(true);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const images = await generateWithLocalSd({
        baseUrl: endpoint,
        prompt: request.prompt,
        aspectRatio: request.aspectRatio,
        blanketSize: request.blanketSize,
        imageCount: request.imageCount,
      });

      let nextGallery = await loadGallery();
      let latest: GalleryItem | null = null;

      for (const image of images) {
        const imageDataUrl = toImageDataUrl(image.imageBase64, image.mimeType);
        nextGallery = await addToGallery({
          prompt: request.subject,
          colorCount: request.colorCount,
          aspectRatio: request.aspectRatio,
          detailLevel: request.detailLevel,
          borderMode: request.borderMode,
          cornerStyle: request.cornerStyle,
          borderThickness: request.borderThickness,
          backgroundMode: request.backgroundMode,
          imageDataUrl,
        });
        latest = nextGallery[0] ?? null;
      }

      startTransition(() => {
        setItems(nextGallery);
        setCurrent(latest);
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Generation failed.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <SdEndpointGate
        open={endpointOpen}
        onSave={(endpoint) => {
          setSdEndpoint(endpoint);
          setEndpointOpen(false);
          setError(null);
        }}
        onClose={() => setEndpointOpen(false)}
      />

      <main className="studio">
        <CreatorForm
          busy={busy || pending}
          onGenerateImages={handleGenerateImages}
          onOpenEndpoint={() => setEndpointOpen(true)}
        />
        <ResultPanel item={current} busy={busy} error={error} />
      </main>

      <Gallery
        items={items}
        expanded={galleryExpanded}
        onExpandedChange={setGalleryExpanded}
        onSelect={(item) => {
          setCurrent(item);
          setGalleryExpanded(false);
        }}
        onRemove={(id) => {
          void (async () => {
            const next = await removeFromGallery(id);
            setItems(next);
            setCurrent((prev) => {
              if (!prev || prev.id !== id) return prev;
              return next[0] ?? null;
            });
          })();
        }}
        onClear={() => {
          void (async () => {
            await clearGallery();
            setItems([]);
            setCurrent(null);
          })();
        }}
      />
    </div>
  );
}
