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

function endpointErrorMessage(error: unknown, baseUrl: string): string {
  if (error instanceof TypeError) {
    return [
      `Could not reach Stable Diffusion at ${baseUrl}.`,
      "On your PC: start Automatic1111/Forge with --api --listen, and allow CORS.",
      "On your phone: use your PC’s LAN IP (same Wi‑Fi) or a Cloudflare/Tailscale tunnel URL.",
    ].join(" ");
  }
  if (error instanceof Error) return error.message;
  return "Local Stable Diffusion request failed.";
}

/** Ping A1111-compatible API. */
export async function testSdEndpoint(baseUrl: string): Promise<string> {
  const url = `${baseUrl.replace(/\/+$/, "")}/sdapi/v1/sd-models`;
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(
        `Endpoint responded ${response.status}. Is the WebUI API enabled (--api)?`,
      );
    }
    const models = (await response.json()) as unknown;
    const count = Array.isArray(models) ? models.length : 0;
    return count > 0
      ? `Connected — ${count} model${count === 1 ? "" : "s"} available.`
      : "Connected — API is reachable.";
  } catch (error) {
    throw new Error(endpointErrorMessage(error, baseUrl));
  }
}

export async function generateWithLocalSd(options: {
  baseUrl: string;
  prompt: string;
  aspectRatio: AspectRatio;
  blanketSize: "small" | "large";
  imageCount: number;
}): Promise<LocalSdImage[]> {
  const base = options.baseUrl.replace(/\/+$/, "");
  const { width, height } = sizeForAspect(
    options.aspectRatio,
    options.blanketSize,
  );
  const count = Math.min(4, Math.max(1, Math.round(options.imageCount)));
  const url = `${base}/sdapi/v1/txt2img`;

  try {
    const response = await fetch(url, {
      method: "POST",
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
