"use client";

import { useEffect, useId, useRef, useState } from "react";

type PromptModalProps = {
  open: boolean;
  initialPrompt: string;
  imageCount?: number;
  generating?: boolean;
  onClose: () => void;
  onGenerate?: (prompt: string) => void | Promise<void>;
  onOpenEndpoint?: () => void;
};

export function PromptModal({
  open,
  initialPrompt,
  imageCount = 1,
  generating = false,
  onClose,
  onGenerate,
  onOpenEndpoint,
}: PromptModalProps) {
  const titleId = useId();
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(initialPrompt);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initialPrompt);
    setCopied(false);
    setError(null);
    const timer = window.setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [open, initialPrompt]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !generating) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, generating]);

  if (!open) return null;

  async function handleCopy() {
    setError(null);
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy the prompt.");
    }
  }

  async function handleGenerate() {
    if (!onGenerate) return;
    setError(null);
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Prompt is empty.");
      return;
    }
    try {
      await onGenerate(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    }
  }

  return (
    <div
      className="prompt-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !generating) onClose();
      }}
    >
      <div className="prompt-modal-panel">
        <p className="prompt-modal-eyebrow">Prompt</p>
        <h2 id={titleId}>Assembled prompt</h2>
        <p className="prompt-modal-copy">
          Edit freely, then generate on your PC’s Stable Diffusion
          {imageCount > 1 ? ` (${imageCount} images)` : ""}, or copy the prompt.
        </p>

        <div className="field">
          <label htmlFor={textareaId}>Prompt</label>
          <textarea
            ref={textareaRef}
            id={textareaId}
            className="prompt-modal-textarea"
            rows={14}
            value={draft}
            disabled={generating}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="prompt-modal-actions">
          {onGenerate ? (
            <button
              className="primary-btn"
              type="button"
              disabled={generating}
              onClick={() => void handleGenerate()}
            >
              {generating ? "Generating…" : "Generate on PC"}
            </button>
          ) : null}
          <button
            className="ghost-on-light"
            type="button"
            disabled={generating}
            onClick={() => void handleCopy()}
          >
            {copied ? "Copied" : "Copy"}
          </button>
          {onOpenEndpoint ? (
            <button
              className="ghost-on-light"
              type="button"
              disabled={generating}
              onClick={onOpenEndpoint}
            >
              SD settings
            </button>
          ) : null}
          <button
            className="secondary-btn ghost-on-light"
            type="button"
            disabled={generating}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
