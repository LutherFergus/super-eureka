"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

type NamePromptProps = {
  open: boolean;
  title?: string;
  label?: string;
  initialName?: string;
  blanketType: string;
  confirmLabel?: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
};

export function NamePrompt({
  open,
  title = "Name this design",
  label = "Name",
  initialName = "",
  blanketType,
  confirmLabel = "Download PDF",
  onConfirm,
  onClose,
}: NamePromptProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialName);
    setError(null);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [open, initialName]);

  if (!open) return null;

  const previewName = `${(value.trim() || "Untitled").replace(/\s+/g, " ")} – ${blanketType}.pdf`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a name for the file.");
      return;
    }
    onConfirm(trimmed);
  }

  return (
    <div
      className="api-key-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-prompt-title"
    >
      <form className="api-key-panel" onSubmit={handleSubmit}>
        <p className="api-key-eyebrow">Download PDF</p>
        <h2 id="name-prompt-title">{title}</h2>
        <p className="api-key-copy">
          The file will be named with your title and the {blanketType} blanket
          type.
        </p>

        <div className="field">
          <label htmlFor={inputId}>{label}</label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Sleepy fox"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <p className="field-hint">Filename: {previewName}</p>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="api-key-actions">
          <button className="primary-btn" type="submit">
            {confirmLabel}
          </button>
          <button
            className="secondary-btn ghost-on-light"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
