"use client";

import { CreatorForm } from "@/components/CreatorForm";

export function MosaicApp() {
  return (
    <div className="app-shell app-shell--prompt-only">
      <main className="studio studio--prompt-only">
        <CreatorForm />
      </main>
    </div>
  );
}
