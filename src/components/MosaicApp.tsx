"use client";

import { useEffect, useState, useTransition } from "react";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { CreatorForm } from "@/components/CreatorForm";
import { Gallery } from "@/components/Gallery";
import { ResultPanel } from "@/components/ResultPanel";
import { loadApiKey, saveApiKey } from "@/lib/apiKey";
import {
  addToGallery,
  clearGallery,
  loadGallery,
  removeFromGallery,
  toImageDataUrl,
  toPngDataUrl,
} from "@/lib/gallery";
import { generateMosaicClient } from "@/lib/generateClient";
import { lockToExactColorCount } from "@/lib/quantizeExact";
import type {
  GalleryItem,
  GenerateOptions,
  GenerateResponse,
} from "@/lib/types";

const isGithubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

function isApiKeyError(message: string): boolean {
  return /api key|xai_api_key|unauthorized|invalid.*key|authentication|401/i.test(
    message,
  );
}

export function MosaicApp() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [current, setCurrent] = useState<GalleryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [pendingGenerate, setPendingGenerate] =
    useState<GenerateOptions | null>(null);
  const [galleryExpanded, setGalleryExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const loaded = await loadGallery();
      if (cancelled) return;
      setItems(loaded);
      if (loaded[0]) setCurrent(loaded[0]);
      setApiKey(loadApiKey());
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function runGenerate(input: GenerateOptions, key: string) {
    setBusy(true);
    setError(null);

    try {
      let payload: GenerateResponse;

      if (isGithubPages) {
        payload = await generateMosaicClient({ ...input, apiKey: key });
      } else {
        const response = await fetch(`${basePath}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-xai-api-key": key,
          },
          body: JSON.stringify(input),
        });

        const body = (await response.json()) as GenerateResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(body.error || "Generation failed.");
        }

        payload = body;
      }

      const rawDataUrl = toImageDataUrl(
        payload.imageBase64,
        payload.mimeType,
      );
      const pngDataUrl = await toPngDataUrl(rawDataUrl);
      const imageDataUrl = await lockToExactColorCount(
        pngDataUrl,
        payload.colorCount,
      );
      const next = await addToGallery({
        prompt: input.prompt,
        colorCount: payload.colorCount,
        aspectRatio: payload.aspectRatio,
        detailLevel: payload.detailLevel,
        borderMode: payload.borderMode,
        cornerStyle: payload.cornerStyle,
        borderThickness: payload.borderThickness,
        backgroundMode: payload.backgroundMode,
        imageDataUrl,
      });

      startTransition(() => {
        setItems(next);
        setCurrent(next[0] ?? null);
      });
      setPendingGenerate(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Generation failed.";
      if (isApiKeyError(message)) {
        setPendingGenerate(input);
        setKeyModalOpen(true);
        setError("That API key didn’t work. Enter a valid xAI key.");
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  function handleSaveKey(key: string) {
    saveApiKey(key);
    setApiKey(key);
    setKeyModalOpen(false);
    setError(null);

    if (pendingGenerate) {
      void runGenerate(pendingGenerate, key);
    }
  }

  async function handleGenerate(input: GenerateOptions) {
    setError(null);

    const key = apiKey.trim() || loadApiKey();
    if (!key) {
      setPendingGenerate(input);
      setKeyModalOpen(true);
      return;
    }

    await runGenerate(input, key);
  }

  return (
    <div className="app-shell">
      <ApiKeyGate
        open={keyModalOpen}
        initialKey={apiKey}
        allowDismiss
        onSave={handleSaveKey}
        onClose={() => {
          setKeyModalOpen(false);
          setPendingGenerate(null);
        }}
      />

      <main className="studio">
        <CreatorForm busy={busy || pending} onGenerate={handleGenerate} />
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
