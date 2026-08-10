import {
  FORBIDDEN_VISUALS,
  MOSAIC_BLANKET_FACTS,
  POSSIBLE_VISUALS,
  backgroundMotifsForSubject,
  detectThemeFamily,
} from "./knowledge";
import type {
  AspectRatio,
  BackgroundMode,
  BlanketSize,
  BorderMode,
  BorderThickness,
  ColorCount,
  CornerStyle,
  DetailLevel,
} from "@/lib/types";

export type DesignEvaluationInput = {
  subject: string;
  colorCount: ColorCount;
  aspectRatio: AspectRatio;
  detailLevel: DetailLevel;
  blanketSize: BlanketSize;
  borderMode: BorderMode;
  cornerStyle: CornerStyle;
  borderThickness: BorderThickness;
  backgroundMode: BackgroundMode;
  hasReferenceImage: boolean;
};

export type DesignPreference = "ideal" | "ok" | "risky";

export type DesignEvaluation = {
  preference: DesignPreference;
  notes: string[];
  directives: string[];
  themeFamily: ReturnType<typeof detectThemeFamily>;
  backgroundMotifs: string[];
};

function scorePreference(flags: {
  colorCount: ColorCount;
  detailLevel: DetailLevel;
  borderMode: BorderMode;
  cornerStyle: CornerStyle;
  backgroundMode: BackgroundMode;
}): DesignPreference {
  let risk = 0;

  if (flags.colorCount >= 5) risk += 1;
  if (flags.colorCount >= 4 && flags.detailLevel === "detailed") risk += 1;
  if (flags.detailLevel === "detailed" && flags.backgroundMode === "themed") {
    risk += 1;
  }
  if (
    flags.borderMode === "tiled" &&
    flags.detailLevel === "detailed" &&
    flags.backgroundMode === "themed"
  ) {
    risk += 1;
  }
  if (
    flags.borderMode === "corners" &&
    flags.cornerStyle === "artistic" &&
    flags.detailLevel === "detailed" &&
    flags.backgroundMode === "themed"
  ) {
    risk += 1;
  }

  if (risk >= 3) return "risky";
  if (risk >= 1) return "ok";
  return "ideal";
}

/**
 * Mosaic blanket design brain: checks options against what yarn charts can
 * actually carry, then emits prompt directives that keep every generation
 * inside that envelope.
 */
export function evaluateMosaicDesign(
  input: DesignEvaluationInput,
): DesignEvaluation {
  const subject = input.subject.trim() || "subject";
  const themeFamily = detectThemeFamily(subject);
  const backgroundMotifs = backgroundMotifsForSubject(subject);
  const notes: string[] = [];
  const directives: string[] = [];

  directives.push(MOSAIC_BLANKET_FACTS.medium);
  directives.push(
    `This image must remain chartable as a mosaic blanket / graphghan: ${MOSAIC_BLANKET_FACTS.hardLimits.join(" ")}`,
  );
  directives.push(
    `Prefer what works in yarn: ${POSSIBLE_VISUALS.join("; ")}.`,
  );
  directives.push(`Never include: ${FORBIDDEN_VISUALS.join("; ")}.`);
  directives.push(
    "Bias toward SIMPLE. Extra ornaments must earn their place as large, high-contrast shapes — otherwise omit them.",
  );
  directives.push(
    "Think like a chart designer: closed silhouettes, thick joins, clear color separations, and generous negative space.",
  );

  if (input.colorCount === 2) {
    notes.push("2 colors = strongest mosaic contrast and easiest yarn work.");
    directives.push(
      "STRICT 2-COLOR LOCK: only two solid colors may appear anywhere in the image. No third tint for belly, cheeks, flower centers, highlights, outlines, or a separate white/cream paper field.",
    );
    directives.push(
      "With 2 colors, use bold silhouette contrast (Color A vs Color B). Mid-tone accents, grey edge AA, and black keylines are failures.",
    );
  } else if (input.colorCount >= 4) {
    notes.push(
      "More colors add yarn changes — keep shapes fewer and larger so the chart stays clean.",
    );
    directives.push(
      `Using ${input.colorCount} flat colors: assign each to large regions only. Do not use extra colors for tiny accents. Never exceed ${input.colorCount} colors.`,
    );
  } else {
    directives.push(
      `STRICT ${input.colorCount}-COLOR LOCK: use exactly ${input.colorCount} solid colors total across subject, border, and background — no extra tints.`,
    );
  }

  if (input.detailLevel === "detailed") {
    if (input.blanketSize === "large") {
      notes.push(
        "Detailed + large (twin+) allows denser palette-contrast detail in subject and themed props.",
      );
      directives.push(
        `DETAIL=DETAILED, SIZE=LARGE (twin and above): pack the subject with many contrasting ${input.colorCount}-color regions — markings, panels, facial/body parts, held objects — as flat interlocking shapes.`,
      );
      directives.push(
        "Large charts can hold medium features; do not default to an empty silhouette. Still no hairline work or extra colors.",
      );
      if (input.backgroundMode === "themed") {
        directives.push(
          "DETAILED + LARGE + THEMED: enrich each background prop with several internal contrast parts while keeping 1–3 props total.",
        );
      }
    } else {
      notes.push(
        "Detailed + small (throw and below) adds clear subject markings but keeps shapes chunky.",
      );
      directives.push(
        `DETAIL=DETAILED, SIZE=SMALL (throw down to smallest): add clear internal subject contrast with the ${input.colorCount} colors, but keep feature count moderate and shapes oversized.`,
      );
      directives.push(
        "Do not fake detail with thin lines, gradients, or extra colors — only hard flips between the locked palette colors.",
      );
      if (input.backgroundMode === "themed") {
        directives.push(
          "DETAILED + SMALL + THEMED: 1–2 concrete props with simple contrast only.",
        );
      }
    }
  } else {
    notes.push("Simple detail is usually best for stitch translation.");
    directives.push(
      `DETAIL=SIMPLE, SIZE=${input.blanketSize.toUpperCase()}: keep the subject as a bold silhouette with minimal internal breakup.`,
    );
  }

  if (input.borderMode === "tiled") {
    notes.push(
      `Tiled borders use a few large repeating blocks at ~${input.borderThickness}% thickness — not tiny tile grids.`,
    );
    directives.push(
      `Tiled border: large stitch-safe tiles only. Border thickness ≈ ${input.borderThickness}% of canvas width. Top and bottom must match.`,
    );
  } else if (input.borderMode === "corners") {
    if (input.cornerStyle === "thin") {
      notes.push(
        `Thin corners: slender accents at ~${input.borderThickness}% thickness, matching top/bottom weight.`,
      );
      directives.push(
        `Thin corner border thickness ≈ ${input.borderThickness}% of canvas width; top equals bottom.`,
      );
    } else if (input.cornerStyle === "thick") {
      notes.push(
        `Thick corners: about ${input.borderThickness}% of canvas width, top and bottom matched.`,
      );
      directives.push(
        `Thick corner border thickness ≈ ${input.borderThickness}% of canvas width; top equals bottom.`,
      );
    } else {
      notes.push(
        `Artistic corners stay simple at ~${input.borderThickness}% thickness — wavy/decorative is fine if shapes stay large.`,
      );
      directives.push(
        `Artistic corners: simple decorative forms only; thickness ≈ ${input.borderThickness}% of canvas width; top/bottom must match.`,
      );
    }
  }

  if (input.backgroundMode === "themed") {
    notes.push(
      "Themed backgrounds use a few concrete props from the subject’s world — not abstract filler.",
    );
    directives.push(
      `Background mode: THEMED for theme family "${themeFamily}". Prefer these concrete props: ${backgroundMotifs.join("; ")}.`,
    );
    directives.push(
      "Background props must be recognizable objects/scenery tied to the subject (barn, fence, tractor, nest, boat, etc.). Forbidden: abstract circles, arcs, disks, blobs, or unrelated geometric blocks.",
    );
    directives.push(
      "Keep at most 1–3 background elements, quieter than the subject, never a busy landscape.",
    );
  } else {
    directives.push(
      "Background mode: NONE. Leave a clean solid field behind the main subject. Do not invent scenery, props, or environmental filler.",
    );
  }

  if (input.hasReferenceImage) {
    notes.push(
      "Photos get simplified to silhouettes — small photo details will be dropped.",
    );
    directives.push(
      "Reference photo constraint: extract only large silhouette information. Drop freckles, fabric weave, eyelashes, and other stitch-scale impossibilities.",
    );
  }

  if (
    input.detailLevel === "detailed" &&
    input.backgroundMode === "themed" &&
    input.borderMode !== "none"
  ) {
    notes.push(
      "Detailed + themed background + border is a lot — simpler settings usually chart better.",
    );
  }

  const preference = scorePreference(input);

  return {
    preference,
    notes,
    directives,
    themeFamily,
    backgroundMotifs,
  };
}
