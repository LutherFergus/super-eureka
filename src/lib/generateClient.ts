import { buildMosaicPrompt } from "@/lib/prompt";
import { generateMosaicImage } from "@/lib/xai";
import {
  ASPECT_RATIO_OPTIONS,
  COLOR_COUNT_OPTIONS,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_BACKGROUND_MODE,
  DEFAULT_BLANKET_SIZE,
  DEFAULT_BORDER_MODE,
  DEFAULT_BORDER_THICKNESS,
  DEFAULT_COLOR_COUNT,
  DEFAULT_CORNER_STYLE,
  DEFAULT_DETAIL_LEVEL,
  clampBorderThickness,
  type AspectRatio,
  type BackgroundMode,
  type BlanketSize,
  type BorderMode,
  type ColorCount,
  type CornerStyle,
  type DetailLevel,
  type GenerateOptions,
  type GenerateResponse,
} from "@/lib/types";

function isColorCount(value: unknown): value is ColorCount {
  return (
    typeof value === "number" &&
    COLOR_COUNT_OPTIONS.includes(value as ColorCount)
  );
}

function isAspectRatio(value: unknown): value is AspectRatio {
  return (
    typeof value === "string" &&
    ASPECT_RATIO_OPTIONS.includes(value as AspectRatio)
  );
}

function isDetailLevel(value: unknown): value is DetailLevel {
  return value === "simple" || value === "detailed";
}

function isBlanketSize(value: unknown): value is BlanketSize {
  return value === "small" || value === "large";
}

function isBorderMode(value: unknown): value is BorderMode {
  return value === "none" || value === "tiled" || value === "corners";
}

function isCornerStyle(value: unknown): value is CornerStyle {
  return value === "thin" || value === "thick" || value === "artistic";
}

function isBackgroundMode(value: unknown): value is BackgroundMode {
  return value === "none" || value === "themed";
}

function isDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(value)
  );
}

/** Browser-side generate path for static hosts (GitHub Pages). */
export async function generateMosaicClient(
  input: GenerateOptions & { apiKey: string },
): Promise<GenerateResponse> {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new Error("A text prompt is required.");
  }
  if (prompt.length > 1200) {
    throw new Error("Prompt is too long (max 1200 characters).");
  }

  const colorCount = isColorCount(input.colorCount)
    ? input.colorCount
    : DEFAULT_COLOR_COUNT;
  const aspectRatio = isAspectRatio(input.aspectRatio)
    ? input.aspectRatio
    : DEFAULT_ASPECT_RATIO;
  const detailLevel = isDetailLevel(input.detailLevel)
    ? input.detailLevel
    : DEFAULT_DETAIL_LEVEL;
  const blanketSize = isBlanketSize(input.blanketSize)
    ? input.blanketSize
    : DEFAULT_BLANKET_SIZE;
  const borderMode = isBorderMode(input.borderMode)
    ? input.borderMode
    : DEFAULT_BORDER_MODE;
  const cornerStyle = isCornerStyle(input.cornerStyle)
    ? input.cornerStyle
    : DEFAULT_CORNER_STYLE;
  const borderThickness = clampBorderThickness(
    input.borderThickness ?? DEFAULT_BORDER_THICKNESS,
  );
  const backgroundMode = isBackgroundMode(input.backgroundMode)
    ? input.backgroundMode
    : DEFAULT_BACKGROUND_MODE;

  const imageDataUrl = isDataUrl(input.imageDataUrl)
    ? input.imageDataUrl
    : undefined;

  if (input.imageDataUrl && !imageDataUrl) {
    throw new Error("Optional photo must be a PNG, JPEG, or WebP data URL.");
  }
  if (imageDataUrl && imageDataUrl.length > 8_000_000) {
    throw new Error("Photo is too large. Try a smaller image.");
  }

  const resolvedCornerStyle =
    borderMode === "corners" ? cornerStyle : DEFAULT_CORNER_STYLE;

  const promptUsed = buildMosaicPrompt({
    userPrompt: prompt,
    colorCount,
    aspectRatio,
    detailLevel,
    blanketSize,
    borderMode,
    cornerStyle: resolvedCornerStyle,
    borderThickness,
    backgroundMode,
    hasReferenceImage: Boolean(imageDataUrl),
  });

  const result = await generateMosaicImage({
    prompt: promptUsed,
    imageDataUrl,
    aspectRatio,
    apiKey: input.apiKey,
  });

  return {
    imageBase64: result.imageBase64,
    mimeType: result.mimeType.startsWith("image/")
      ? result.mimeType
      : "image/png",
    promptUsed,
    colorCount,
    aspectRatio,
    detailLevel,
    borderMode,
    cornerStyle: resolvedCornerStyle,
    borderThickness,
    backgroundMode,
  };
}
