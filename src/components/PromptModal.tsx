"use client";

import { useEffect, useId, useRef, useState } from "react";

type PromptModalProps = {
  open: boolean;
  initialPrompt: string;
  onClose: () => void;
};

export function PromptModal({
  open,
  initialPrompt,
  onClose,
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
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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

  return (
    <div
      className="prompt-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="prompt-modal-panel">
        <p className="prompt-modal-eyebrow">Prompt</p>
        <h2 id={titleId}>Assembled prompt</h2>
        <p className="prompt-modal-copy">
          Edit freely, then copy into Imagine or any image model.
        </p>

        <div className="field">
          <label htmlFor={textareaId}>Prompt</label>
          <textarea
            ref={textareaRef}
            id={textareaId}
            className="prompt-modal-textarea"
            rows={14}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="prompt-modal-actions">
          <button className="primary-btn" type="button" onClick={() => void handleCopy()}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            className="secondary-btn ghost-on-light"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
