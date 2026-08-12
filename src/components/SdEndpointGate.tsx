"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  clearSdEndpoint,
  loadSdEndpoint,
  normalizeSdEndpoint,
  saveSdEndpoint,
} from "@/lib/sdEndpoint";
import { mixedContentBlockReason, testSdEndpoint } from "@/lib/localSd";

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
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const existing = loadSdEndpoint();
    setValue(existing);
    setHasSaved(Boolean(existing));
    setError(null);
    setStatus(null);
    setHint(
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "This page is HTTPS. Test/Generate need an https:// WebUI URL (Cloudflare Tunnel), not plain http://192.168… from the phone."
        : null,
    );
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  async function handleTest() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      if (!value.trim()) {
        throw new Error("Paste your WebUI URL first.");
      }
      const normalized = normalizeSdEndpoint(value);
      const blocked = mixedContentBlockReason(normalized);
      if (blocked) {
        throw new Error(blocked);
      }
      const message = await testSdEndpoint(normalized);
      setStatus(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleOpenWebUi() {
    setError(null);
    try {
      const normalized = normalizeSdEndpoint(value || "http://127.0.0.1:7860");
      window.open(normalized, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid URL.");
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
          In Stability Matrix, launch Automatic1111 or Forge with{" "}
          <code>
            --api --listen --cors-allow-origins=https://lutherfergus.github.io
          </code>
          . Because Mosaic is on HTTPS, use a Cloudflare Tunnel{" "}
          <code>https://…</code> URL here (plain <code>http://192.168…</code>{" "}
          is blocked by the phone browser).
        </p>

        <div className="field">
          <label htmlFor={inputId}>WebUI URL</label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://your-tunnel.trycloudflare.com"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <p className="field-hint">
            On the PC:{" "}
            <code>cloudflared tunnel --url http://127.0.0.1:7860</code> then
            paste the https URL it prints.
          </p>
        </div>

        {hint ? <p className="form-hint-banner">{hint}</p> : null}
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
            disabled={busy || !value.trim()}
            onClick={handleOpenWebUi}
          >
            Open WebUI
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
