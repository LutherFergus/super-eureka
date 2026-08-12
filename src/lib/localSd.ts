import type { AspectRatio } from "@/lib/types";

export type LocalSdImage = {
  imageBase64: string;
  mimeType: string;
};

const MOSAIC_NEGATIVE = [
  "photorealistic",
  "photo",
  "3d render",
  "gradient",
  "shadow",
  "glow",
  "texture",
  "noise",
  "blur",
  "watercolor",
  "pixel art",
  "mosaic tiles",
  "cross stitch",
  "bead art",
  "lego",
  "text",
  "watermark",
  "extra colors",
  "soft shading",
].join(", ");

/** Map canvas aspect to SD width/height (multiples of 64). */
export function sizeForAspect(
  aspectRatio: AspectRatio,
  blanketSize: "small" | "large",
): { width: number; height: number } {
  const long = blanketSize === "large" ? 1024 : 768;
  const [wPart, hPart] = aspectRatio.split(":").map(Number);
  if (!wPart || !hPart) return { width: long, height: long };

  let width: number;
  let height: number;
  if (wPart >= hPart) {
    width = long;
    height = Math.round((long * hPart) / wPart);
  } else {
    height = long;
    width = Math.round((long * wPart) / hPart);
  }

  const snap = (n: number) => Math.max(512, Math.round(n / 64) * 64);
  return { width: snap(width), height: snap(height) };
}

type Txt2ImgResponse = {
  images?: string[];
  detail?: string | { msg?: string }[];
  error?: string;
};

/** GitHub Pages is HTTPS — browsers block fetch() to http:// LAN IPs. */
export function mixedContentBlockReason(baseUrl: string): string | null {
  if (typeof window === "undefined") return null;
  if (window.location.protocol !== "https:") return null;
  try {
    const url = new URL(baseUrl);
    if (url.protocol === "http:") {
      return [
        "Blocked by the browser: this Mosaic page is HTTPS, so it cannot call an http:// PC address (mixed content).",
        "Fix: give Mosaic an https:// URL to your WebUI — easiest is a Cloudflare Tunnel to port 7860 — then Test again.",
        "Stability Matrix launch args still need: --api --listen --cors-allow-origins=https://lutherfergus.github.io",
      ].join(" ");
    }
  } catch {
    return null;
  }
  return null;
}

const TEST_TIMEOUT_MS = 12_000;

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")) ||
    (error instanceof Error &&
      (error.name === "AbortError" ||
        error.name === "TimeoutError" ||
        /aborted|timed?\s*out/i.test(error.message)))
  );
}

function endpointErrorMessage(error: unknown, baseUrl: string): string {
  const mixed = mixedContentBlockReason(baseUrl);
  if (mixed) return mixed;

  if (isAbortError(error)) {
    return [
      `Timed out after ${TEST_TIMEOUT_MS / 1000}s reaching ${baseUrl}.`,
      "Open that same URL with Open WebUI — if the page does not load, Funnel/Serve or WebUI is not up.",
      "If WebUI loads but Test hangs: add --cors-allow-origins=https://lutherfergus.github.io and restart.",
      "Tailscale Serve only works from devices on your Tailnet; use Funnel for a normal phone browser.",
    ].join(" ");
  }

  if (error instanceof TypeError) {
    return [
      `Could not reach Stable Diffusion at ${baseUrl}.`,
      "Checklist: WebUI running in Stability Matrix; args include --api --listen;",
      "CORS includes https://lutherfergus.github.io;",
      "use Tailscale Funnel/Serve https URL (or Cloudflare Tunnel);",
      "Windows Firewall allows the WebUI port.",
    ].join(" ");
  }
  if (error instanceof Error) return error.message;
  return "Local Stable Diffusion request failed.";
}

async function probeApi(base: string, path: string): Promise<Response> {
  const signal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? AbortSignal.timeout(TEST_TIMEOUT_MS)
      : undefined;
  return fetch(`${base}${path}`, {
    method: "GET",
    mode: "cors",
    cache: "no-store",
    signal,
  });
}

/** Ping A1111/Forge-compatible API. */
export async function testSdEndpoint(baseUrl: string): Promise<string> {
  const base = baseUrl.replace(/\/+$/, "");
  const mixed = mixedContentBlockReason(base);
  if (mixed) throw new Error(mixed);

  const paths = ["/sdapi/v1/sd-models", "/sdapi/v1/options", "/sdapi/v1/progress"];

  let lastError: unknown;
  for (const path of paths) {
    try {
      const response = await probeApi(base, path);
      if (response.ok) {
        if (path.endsWith("sd-models")) {
          const models = (await response.json()) as unknown;
          const count = Array.isArray(models) ? models.length : 0;
          return count > 0
            ? `Connected — ${count} model${count === 1 ? "" : "s"} available.`
            : "Connected — API is reachable.";
        }
        return `Connected — API responded OK (${path}).`;
      }
      if (response.status === 404) {
        lastError = new Error(
          `API path missing (${path}). Use Automatic1111 or Forge in Stability Matrix with --api (ComfyUI uses a different API).`,
        );
        continue;
      }
      throw new Error(
        `Endpoint responded ${response.status}. Is the WebUI API enabled (--api)?`,
      );
    } catch (error) {
      lastError = error;
      // Try next probe path only for 404-style misses; network/CORS fail immediately.
      if (
        error instanceof Error &&
        error.message.includes("API path missing")
      ) {
        continue;
      }
      throw new Error(endpointErrorMessage(error, base));
    }
  }

  throw new Error(endpointErrorMessage(lastError, base));
}

export async function generateWithLocalSd(options: {
  baseUrl: string;
  prompt: string;
  aspectRatio: AspectRatio;
  blanketSize: "small" | "large";
  imageCount: number;
}): Promise<LocalSdImage[]> {
  const base = options.baseUrl.replace(/\/+$/, "");
  const mixed = mixedContentBlockReason(base);
  if (mixed) throw new Error(mixed);

  const { width, height } = sizeForAspect(
    options.aspectRatio,
    options.blanketSize,
  );
  const count = Math.min(4, Math.max(1, Math.round(options.imageCount)));
  const url = `${base}/sdapi/v1/txt2img`;

  try {
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: options.prompt,
        negative_prompt: MOSAIC_NEGATIVE,
        width,
        height,
        steps: options.blanketSize === "large" ? 28 : 22,
        cfg_scale: 6.5,
        batch_size: 1,
        n_iter: count,
        sampler_name: "Euler a",
        restore_faces: false,
        enable_hr: false,
      }),
    });

    const payload = (await response.json()) as Txt2ImgResponse;
    if (!response.ok) {
      const detail =
        typeof payload.detail === "string"
          ? payload.detail
          : Array.isArray(payload.detail)
            ? payload.detail.map((d) => d.msg).filter(Boolean).join("; ")
            : payload.error;
      throw new Error(
        detail || `Stable Diffusion failed with status ${response.status}`,
      );
    }

    const images = payload.images ?? [];
    if (images.length === 0) {
      throw new Error("Stable Diffusion returned no images.");
    }

    return images.slice(0, count).map((imageBase64) => ({
      imageBase64,
      mimeType: "image/png",
    }));
  } catch (error) {
    throw new Error(endpointErrorMessage(error, base));
  }
}
