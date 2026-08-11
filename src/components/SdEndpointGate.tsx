"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  clearSdEndpoint,
  loadSdEndpoint,
  normalizeSdEndpoint,
  saveSdEndpoint,
} from "@/lib/sdEndpoint";
import { testSdEndpoint } from "@/lib/localSd";

type SdEndpointGateProps = {
  open: boolean;
  onSave: (endpoint: string) => void;
  onClose: () => void;
};

export function SdEndpointGate({
  open,
  onSave,
  onClose,
}: SdEndpointGateProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const existing = loadSdEndpoint();
    setValue(existing);
    setHasSaved(Boolean(existing));
    setError(null);
    setStatus(null);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  async function handleTest() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const normalized = normalizeSdEndpoint(value);
      const message = await testSdEndpoint(normalized);
      setStatus(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const normalized = saveSdEndpoint(value);
      onSave(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid endpoint.");
    }
  }

  return (
    <div
      className="prompt-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sd-endpoint-title"
    >
      <form className="prompt-modal-panel sd-endpoint-panel" onSubmit={handleSubmit}>
        <p className="prompt-modal-eyebrow">Local PC</p>
        <h2 id="sd-endpoint-title">Stable Diffusion endpoint</h2>
        <p className="prompt-modal-copy">
          Run Automatic1111 or Forge on your computer with{" "}
          <code>--api --listen</code>, then paste the URL your phone can reach
          (same Wi‑Fi LAN IP, or a Cloudflare / Tailscale tunnel).
        </p>

        <div className="field">
          <label htmlFor={inputId}>WebUI URL</label>
          <input
            ref={inputRef}
            id={inputId}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="http://192.168.1.20:7860"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <p className="field-hint">
            Example: <code>http://192.168.1.20:7860</code> — not localhost from
            your phone (that points at the phone itself).
          </p>
        </div>

        {status ? <p className="form-status">{status}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        <div className="prompt-modal-actions">
          <button className="primary-btn" type="submit" disabled={busy}>
            Save
          </button>
          <button
            className="ghost-on-light"
            type="button"
            disabled={busy || !value.trim()}
            onClick={() => void handleTest()}
          >
            {busy ? "Testing…" : "Test"}
          </button>
          <button
            className="ghost-on-light"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          {hasSaved ? (
            <button
              className="text-btn"
              type="button"
              disabled={busy}
              onClick={() => {
                clearSdEndpoint();
                setValue("");
                setHasSaved(false);
                setStatus("Cleared saved endpoint.");
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
