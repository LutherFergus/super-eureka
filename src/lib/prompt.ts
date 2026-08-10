import { evaluateMosaicDesign } from "@/lib/mosaic-brain";
import type {
  AspectRatio,
  BackgroundMode,
  BorderMode,
  BorderThickness,
  ColorCount,
  CornerStyle,
  DetailLevel,
} from "./types";

export type PromptBuildInput = {
  userPrompt: string;
  colorCount: ColorCount;
  /** Named yarn colors — length should match colorCount. */
  palette?: { name: string; hex: string }[];
  aspectRatio: AspectRatio;
  detailLevel: DetailLevel;
  borderMode: BorderMode;
  cornerStyle: CornerStyle;
  borderThickness: BorderThickness;
  backgroundMode: BackgroundMode;
  hasReferenceImage: boolean;
};

function colorInstruction(
  colorCount: ColorCount,
  palette?: { name: string; hex: string }[],
): string {
  const hardCap = [
    `HARD COLOR CAP: the finished image may use exactly ${colorCount} solid flat colors — no more and no less in practice than ${colorCount} distinct RGB fills.`,
    "Count every region: subject, outlines, eyes, belly, cheeks, border, background, and ornaments.",
    "Forbidden extras: tints, shades, mid-tones, highlights, lowlights, gray helpers, off-white accents, black linework as a bonus ink, or a near-match third green/blue/etc.",
    "If a shape needs separation, flip between the allowed colors or use negative space from those same colors — never invent another color.",
    "Anti-aliased edge greys count as illegal extra colors — keep edges hard and fills perfectly flat.",
  ].join(" ");

  const named =
    palette && palette.length === colorCount
      ? [
          `Palette: EXACTLY these ${colorCount} yarn colors — use only them, matched as closely as flat fills allow:`,
          palette
            .map(
              (color, index) =>
                `Color ${index + 1}: ${color.name} (${color.hex})`,
            )
            .join("; ") + ".",
          "Do not invent extra colors outside this named set.",
        ].join(" ")
      : null;

  if (named) {
    return [named, hardCap].join(" ");
  }

  if (colorCount === 2) {
    return [
      "Palette: EXACTLY 2 yarn colors for the entire canvas (Color A + Color B only).",
      "Pick two high-contrast colors. Every pixel must be Color A or Color B.",
      "Outlines, eyes, borders, and backgrounds must reuse Color A or Color B — never black, white, grey, cream, or a blush/belly tint as a third color.",
      "Classic two-color graphic: dark silhouette shapes on a light field, or light shapes on a dark field — still only those two colors.",
      hardCap,
    ].join(" ");
  }

  return [
    `Palette: EXACTLY ${colorCount} flat solid yarn colors for the entire canvas.`,
    `Choose a cohesive high-contrast ${colorCount}-color set and use only those colors everywhere.`,
    hardCap,
  ].join(" ");
}

function detailInstruction(detailLevel: DetailLevel): string {
  if (detailLevel === "simple") {
    return [
      "Detail level: SIMPLE (preferred for mosaic blankets).",
      "One clear focal subject, large bold silhouettes, almost no secondary ornament.",
      "Prefer big readable shapes and generous negative space. No tiny linework.",
    ].join(" ");
  }

  return [
    "Detail level: DETAILED — still stitch-scale.",
    "A richer scene with only a few supporting LARGE shapes around the subject.",
    "More content does NOT mean finer detail. No tiny patterns, no busy filler.",
  ].join(" ");
}

function thicknessMatchRule(pct: BorderThickness): string {
  const examplePx = pct * 20;
  return [
    `Border thickness target: roughly ${pct}% of the canvas width.`,
    `Example: on a 2000px-wide canvas, border thickness ≈ ${examplePx}px (about ${pct}%).`,
    "Thickness rule: the top border band and the bottom border band must match each other in thickness exactly. Left and right sides should feel balanced with that same visual weight.",
  ].join(" ");
}

function borderInstruction(
  borderMode: BorderMode,
  cornerStyle: CornerStyle,
  borderThickness: BorderThickness,
): string {
  if (borderMode === "none") {
    return [
      "Border: NONE.",
      "No frame, no decorative edge band, no vignette, no corner ornaments.",
    ].join(" ");
  }

  const stitchSafe = [
    "Border motifs must stay stitch-readable: large chunky shapes only.",
    "Forbidden: dense mini-icons, tiny repeats, filigree, or dozens of small ornaments.",
  ].join(" ");
  const thickness = thicknessMatchRule(borderThickness);

  if (borderMode === "tiled") {
    return [
      "Border: TILED.",
      "Wrap the artwork in a continuous tiled border band made of a few LARGE repeating tile blocks.",
      "Tiles should be big and simple (think oversized squares, diamonds, or block motifs) — not a tiny mosaic grid.",
      "Keep tile count modest so each tile remains chartable in yarn.",
      thickness,
      "Top and bottom tiled bands must be the same thickness.",
      stitchSafe,
    ].join(" ");
  }

  // corners
  if (cornerStyle === "thin") {
    return [
      "Border: CORNERS — THIN.",
      "Add light corner accents and/or a slender frame line at the target thickness.",
      "Keep ornament minimal and clean — line-like, not heavy filled blocks.",
      thickness,
      "Top and bottom edge treatments must match at that thickness.",
      stitchSafe,
    ].join(" ");
  }

  if (cornerStyle === "thick") {
    return [
      "Border: CORNERS — THICK.",
      "Add a strong corner/frame treatment as a solid chunky band at the target thickness.",
      "Use solid corner blocks or a bold frame — still simple and flat.",
      thickness,
      "Top and bottom thick borders must match at that thickness.",
      stitchSafe,
    ].join(" ");
  }

  return [
    "Border: CORNERS — ARTISTIC.",
    "Create an artistic but SIMPLE corner border: elegant, hand-designed feeling, still easy to chart.",
    "Allowed: gentle waves, curved corner flourishes, or varied artistic strokes — as long as shapes stay large and few.",
    "Keep it simple: decorative, not busy. No dense lace, no tiny repeats.",
    thickness,
    "Whatever thickness you choose for the top edge must match the bottom edge exactly.",
    stitchSafe,
  ].join(" ");
}

function backgroundInstruction(
  backgroundMode: BackgroundMode,
  motifs: string[],
): string {
  if (backgroundMode === "none") {
    return [
      "Background: NONE.",
      "Keep only the main subject (plus border if requested) on a clean solid field.",
      "Do not add scenery, props, weather, or thematic filler behind the subject.",
    ].join(" ");
  }

  return [
    "Background: THEMED.",
    "Add a sparse background of concrete props that belong to the subject’s world — the kind of things you’d actually see with that subject.",
    "Example intent: a cow might have a barn, lean-to, tractor, hay bale, or fence — not random shapes.",
    `Preferred background props for this subject: ${motifs.join("; ")}.`,
    "Use at most 1–3 background elements total. They must be oversized, flat, quieter than the subject, and clearly recognizable objects or scenery.",
    "Forbidden in the background: abstract circles, arcs, disks, blobs, floating geometric blocks, decorative filler shapes, or anything unrelated to the subject’s theme.",
    "No busy landscapes, no tiny distant objects, no textured ground fills.",
  ].join(" ");
}

/**
 * Expands a short user subject into a full Imagine prompt.
 * The mosaic-brain engine always injects stitch-feasibility constraints.
 */
export function buildMosaicPrompt(input: PromptBuildInput): string {
  const subject = input.userPrompt.trim();
  const evaluation = evaluateMosaicDesign({
    subject,
    colorCount: input.colorCount,
    aspectRatio: input.aspectRatio,
    detailLevel: input.detailLevel,
    borderMode: input.borderMode,
    cornerStyle: input.cornerStyle,
    borderThickness: input.borderThickness,
    backgroundMode: input.backgroundMode,
    hasReferenceImage: input.hasReferenceImage,
  });

  const referenceLine = input.hasReferenceImage
    ? "Reference image provided: use it only for subject identity, pose, and silhouette. Redraw as crisp vector art — not a photo, not a filtered photo. Simplify small photo details into large flat shapes."
    : "No reference image. Invent an original illustration from the subject words.";

  const colorLock = colorInstruction(input.colorCount, input.palette);

  return [
    "You are generating finished artwork for Mosaic Image Creator.",
    `NON-NEGOTIABLE: use exactly ${input.colorCount} solid flat colors in the whole image.`,
    "Exclusive output type: mosaic-blanket-ready flat vector illustration (for later yarn/graphghan charting).",
    "The user prompt may be only a few words. Treat those words as the SUBJECT, then complete a polished illustration without asking for more detail.",
    `Subject: ${subject}`,
    `Canvas aspect ratio: ${input.aspectRatio}. Compose intentionally for this frame.`,
    "House style: clean flat vector art; razor-sharp edges; smooth curves; solid color fills only.",
    "No gradients, textures, grain, noise, shadows, glow, 3D, photorealism, blur, or watercolor.",
    "Do NOT make the image look like a mosaic, pixels, tiles, beads, cross-stitch, graphghan, Lego, embroidery chart, or 8-bit/16-bit pixel art.",
    "Keep shapes bold and easy to read at a glance. Prefer fewer larger forms over many small ones. Simple is usually better.",
    "Color obedience is mandatory: never exceed the requested color count. Extra 'accent' colors are rejected.",
    ...evaluation.directives,
    colorLock,
    detailInstruction(input.detailLevel),
    borderInstruction(
      input.borderMode,
      input.cornerStyle,
      input.borderThickness,
    ),
    backgroundInstruction(input.backgroundMode, evaluation.backgroundMotifs),
    referenceLine,
    "Deliver one cohesive finished illustration that a crocheter could chart into a blanket without losing the idea.",
    `FINAL COLOR CHECK: before finishing, recount fills — there must be exactly ${input.colorCount} distinct solid colors and zero soft edge greys.`,
    colorLock,
  ].join(" ");
}

export function getDesignNotes(input: PromptBuildInput) {
  return evaluateMosaicDesign({
    subject: input.userPrompt,
    colorCount: input.colorCount,
    aspectRatio: input.aspectRatio,
    detailLevel: input.detailLevel,
    borderMode: input.borderMode,
    cornerStyle: input.cornerStyle,
    borderThickness: input.borderThickness,
    backgroundMode: input.backgroundMode,
    hasReferenceImage: input.hasReferenceImage,
  });
}
