"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { MosaicMark } from "@/components/MosaicMark";
import { PromptModal } from "@/components/PromptModal";
import { APP_VERSION_LABEL } from "@/lib/appVersion";
import { buildMosaicPrompt } from "@/lib/prompt";
import {
  BLANKET_SIZE_OPTIONS,
  BORDER_MODE_OPTIONS,
  BORDER_THICKNESS_MAX,
  BORDER_THICKNESS_MIN,
  COLOR_COUNT_OPTIONS,
  CORNER_STYLE_OPTIONS,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_BACKGROUND_MODE,
  DEFAULT_BLANKET_SIZE,
  DEFAULT_BORDER_MODE,
  DEFAULT_BORDER_THICKNESS,
  DEFAULT_COLOR_COUNT,
  DEFAULT_CORNER_STYLE,
  DEFAULT_DETAIL_LEVEL,
  DEFAULT_IMAGE_COUNT,
  DEFAULT_ORIENTATION,
  IMAGE_COUNT_OPTIONS,
  ORIENTATION_OPTIONS,
  PROPORTION_OPTIONS,
  clampBorderThickness,
  defaultAspectForOrientation,
  orientationForAspect,
  type AspectRatio,
  type BackgroundMode,
  type BlanketSize,
  type BorderMode,
  type BorderThickness,
  type ColorCount,
  type CornerStyle,
  type DetailLevel,
  type ImageCount,
  type Orientation,
} from "@/lib/types";
import {
  DEFAULT_COLOR_IDS,
  YARN_COLORS,
  resolveYarnColor,
  resizePaletteIds,
} from "@/lib/yarnColors";

export type LocalGenerateRequest = {
  prompt: string;
  subject: string;
  colorCount: ColorCount;
  aspectRatio: AspectRatio;
  detailLevel: DetailLevel;
  blanketSize: BlanketSize;
  borderMode: BorderMode;
  cornerStyle: CornerStyle;
  borderThickness: BorderThickness;
  backgroundMode: BackgroundMode;
  imageCount: ImageCount;
};

type CreatorFormProps = {
  busy?: boolean;
  onGenerateImages: (request: LocalGenerateRequest) => Promise<void>;
  onOpenEndpoint: () => void;
};

function OptionGroup<T extends string | number>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  const groupId = useId();
  return (
    <div className="field">
      <label id={groupId}>{label}</label>
      <div className="option-pills" role="group" aria-labelledby={groupId}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className={
              option.value === value ? "option-pill is-active" : "option-pill"
            }
            onClick={() => onChange(option.value)}
            disabled={disabled}
            aria-pressed={option.value === value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CreatorForm({
  busy = false,
  onGenerateImages,
  onOpenEndpoint,
}: CreatorFormProps) {
  const promptId = useId();
  const colorId = useId();
  const imagesId = useId();
  const thicknessId = useId();

  const [prompt, setPrompt] = useState("");
  const [colorCount, setColorCount] = useState<ColorCount>(DEFAULT_COLOR_COUNT);
  const [paletteIds, setPaletteIds] = useState<string[]>(
    () => DEFAULT_COLOR_IDS[DEFAULT_COLOR_COUNT],
  );
  const [orientation, setOrientation] =
    useState<Orientation>(DEFAULT_ORIENTATION);
  const [aspectRatio, setAspectRatio] =
    useState<AspectRatio>(DEFAULT_ASPECT_RATIO);
  const [detailLevel, setDetailLevel] =
    useState<DetailLevel>(DEFAULT_DETAIL_LEVEL);
  const [blanketSize, setBlanketSize] =
    useState<BlanketSize>(DEFAULT_BLANKET_SIZE);
  const [borderMode, setBorderMode] = useState<BorderMode>(DEFAULT_BORDER_MODE);
  const [cornerStyle, setCornerStyle] = useState<CornerStyle>(
    DEFAULT_CORNER_STYLE,
  );
  const [borderThickness, setBorderThickness] = useState<BorderThickness>(
    DEFAULT_BORDER_THICKNESS,
  );
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(
    DEFAULT_BACKGROUND_MODE,
  );
  const [imageCount, setImageCount] = useState<ImageCount>(DEFAULT_IMAGE_COUNT);
  const [localError, setLocalError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPrompt, setModalPrompt] = useState("");
  const [modalImageCount, setModalImageCount] =
    useState<ImageCount>(DEFAULT_IMAGE_COUNT);
  const [subjectForGenerate, setSubjectForGenerate] = useState("");

  useEffect(() => {
    const allowed = PROPORTION_OPTIONS[orientation].map((item) => item.value);
    if (!allowed.includes(aspectRatio)) {
      setAspectRatio(defaultAspectForOrientation(orientation));
    }
  }, [orientation, aspectRatio]);

  useEffect(() => {
    setPaletteIds((current) => resizePaletteIds(current, colorCount));
  }, [colorCount]);

  const resolvedCornerStyle =
    borderMode === "corners" || borderMode === "border"
      ? cornerStyle
      : DEFAULT_CORNER_STYLE;

  const palette = paletteIds.slice(0, colorCount).map((id) => {
    const color = resolveYarnColor(id);
    return { name: color.name, hex: color.hex };
  });

  function assemblePrompt(subject: string) {
    return buildMosaicPrompt({
      userPrompt: subject,
      colorCount,
      palette,
      aspectRatio,
      detailLevel,
      blanketSize,
      borderMode,
      cornerStyle: resolvedCornerStyle,
      borderThickness,
      backgroundMode,
      // Photo upload is shelved for now.
      hasReferenceImage: false,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const trimmed = prompt.trim();
    if (!trimmed) {
      setLocalError("Enter a short subject.");
      return;
    }

    setModalPrompt(assemblePrompt(trimmed));
    setModalImageCount(imageCount);
    setSubjectForGenerate(trimmed);
    setModalOpen(true);
  }

  async function handleGenerateFromModal(assembled: string) {
    // Dismiss prompt sheet immediately so Generate / SD settings aren't buried under it.
    setModalOpen(false);
    await onGenerateImages({
      prompt: assembled,
      subject: subjectForGenerate,
      colorCount,
      aspectRatio,
      detailLevel,
      blanketSize,
      borderMode,
      cornerStyle: resolvedCornerStyle,
      borderThickness,
      backgroundMode,
      imageCount: modalImageCount,
    });
  }

  function handleOpenEndpointFromModal() {
    setModalOpen(false);
    onOpenEndpoint();
  }

  return (
    <>
      <form className="creator-form" onSubmit={handleSubmit}>
        <div className="studio-brand">
          <MosaicMark className="studio-brand-mark" />
          <div className="studio-brand-text">
            <span>Mosaic</span>
            <span className="app-version" title="App version">
              {APP_VERSION_LABEL}
            </span>
          </div>
          <button
            type="button"
            className="text-btn sd-settings-btn"
            onClick={onOpenEndpoint}
          >
            SD PC
          </button>
        </div>

        <div className="field">
          <label htmlFor={promptId}>Subject</label>
          <textarea
            id={promptId}
            name="prompt"
            rows={2}
            maxLength={1200}
            placeholder="sleepy fox"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            required
          />
        </div>

        <OptionGroup
          label="Orientation"
          value={orientation}
          options={ORIENTATION_OPTIONS}
          onChange={(next) => {
            setOrientation(next);
            setAspectRatio(defaultAspectForOrientation(next));
          }}
        />

        <OptionGroup
          label="Proportion"
          value={aspectRatio}
          options={PROPORTION_OPTIONS[orientation]}
          onChange={(next) => {
            setAspectRatio(next);
            setOrientation(orientationForAspect(next));
          }}
        />

        <div className="field-row">
          <OptionGroup
            label="Detail"
            value={detailLevel}
            options={[
              { value: "simple", label: "Simple" },
              { value: "detailed", label: "Detailed" },
            ]}
            onChange={setDetailLevel}
          />
          <OptionGroup
            label="Size"
            value={blanketSize}
            options={BLANKET_SIZE_OPTIONS}
            onChange={setBlanketSize}
          />
        </div>
        <p className="field-hint size-hint">
          {blanketSize === "large"
            ? "Large: twin size and above — more detail can survive."
            : "Small: throws down to the smallest blankets — keep shapes chunky."}
        </p>

        <OptionGroup
          label="Background"
          value={backgroundMode}
          options={[
            { value: "none", label: "None" },
            { value: "themed", label: "Themed" },
          ]}
          onChange={setBackgroundMode}
        />

        <OptionGroup
          label="Border"
          value={borderMode}
          options={BORDER_MODE_OPTIONS}
          onChange={setBorderMode}
        />

        {borderMode === "corners" || borderMode === "border" ? (
          <OptionGroup
            label={borderMode === "corners" ? "Corners" : "Style"}
            value={cornerStyle}
            options={CORNER_STYLE_OPTIONS}
            onChange={setCornerStyle}
          />
        ) : null}

        {borderMode !== "none" ? (
          <div className="field">
            <div className="field-label-row">
              <label htmlFor={thicknessId}>Thickness</label>
              <span className="field-value" aria-live="polite">
                {borderThickness}%
              </span>
            </div>
            <input
              id={thicknessId}
              className="thickness-slider"
              type="range"
              min={BORDER_THICKNESS_MIN}
              max={BORDER_THICKNESS_MAX}
              step={1}
              value={borderThickness}
              onChange={(event) =>
                setBorderThickness(
                  clampBorderThickness(event.target.valueAsNumber),
                )
              }
            />
            <div className="thickness-ends" aria-hidden="true">
              <span>1%</span>
              <span>5%</span>
            </div>
          </div>
        ) : null}

        <div className="field">
          <label id={colorId}>Colors</label>
          <div className="color-pills" role="group" aria-labelledby={colorId}>
            {COLOR_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                className={
                  count === colorCount ? "color-pill is-active" : "color-pill"
                }
                onClick={() => setColorCount(count)}
                aria-pressed={count === colorCount}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="palette-fields" role="group" aria-label="Color names">
          {paletteIds.slice(0, colorCount).map((id, index) => {
            const selectId = `palette-color-${index + 1}`;
            const selected = resolveYarnColor(id);
            return (
              <div className="field palette-field" key={selectId}>
                <label htmlFor={selectId}>Color {index + 1}</label>
                <div className="palette-select-row">
                  <span
                    className="palette-swatch"
                    style={{ background: selected.hex }}
                    aria-hidden="true"
                  />
                  <select
                    id={selectId}
                    className="palette-select"
                    value={id}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setPaletteIds((current) => {
                        const next = [...current];
                        next[index] = nextId;
                        return next;
                      });
                    }}
                  >
                    {YARN_COLORS.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <div className="field">
          <label id={imagesId}>Images</label>
          <div className="color-pills" role="group" aria-labelledby={imagesId}>
            {IMAGE_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                className={
                  count === imageCount ? "color-pill is-active" : "color-pill"
                }
                onClick={() => setImageCount(count)}
                aria-pressed={count === imageCount}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {localError ? <p className="form-error">{localError}</p> : null}

        <div className="form-actions">
          <button className="primary-btn" type="submit">
            Create
          </button>
        </div>
      </form>

      <PromptModal
        open={modalOpen}
        initialPrompt={modalPrompt}
        imageCount={modalImageCount}
        generating={busy}
        onClose={() => {
          if (!busy) setModalOpen(false);
        }}
        onGenerate={handleGenerateFromModal}
        onOpenEndpoint={handleOpenEndpointFromModal}
      />
    </>
  );
}
