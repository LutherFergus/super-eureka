import {
  orientationForAspect,
  type AspectRatio,
  type Orientation,
} from "@/lib/types";

const ORIENTATION_LABEL: Record<Orientation, string> = {
  square: "Square",
  landscape: "Landscape",
  portrait: "Portrait",
};

export function blanketTypeLabel(aspectRatio: AspectRatio): string {
  return ORIENTATION_LABEL[orientationForAspect(aspectRatio)];
}

export function buildDownloadBaseName(
  enteredName: string,
  aspectRatio: AspectRatio,
): string {
  const name = enteredName.trim() || "Untitled";
  return `${name} – ${blanketTypeLabel(aspectRatio)}`;
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
}

function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image."));
    image.src = src;
  });
}

function encodePdfString(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Build a one-page letter PDF with the design image centered. */
export async function imageDataUrlToPdfBlob(
  imageDataUrl: string,
  title: string,
): Promise<Blob> {
  const image = await loadImage(imageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare PDF image.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const jpegBase64 = jpegDataUrl.split(",")[1] || "";
  const jpegBytes = Uint8Array.from(atob(jpegBase64), (c) => c.charCodeAt(0));

  const imgW = canvas.width;
  const imgH = canvas.height;
  const landscape = imgW >= imgH;
  const pageW = landscape ? 792 : 612;
  const pageH = landscape ? 612 : 792;
  const margin = 36;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2 - 28;
  const scale = Math.min(maxW / imgW, maxH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = (pageW - drawW) / 2;
  const y = (pageH - drawH) / 2 - 8;

  const objects: string[] = [];
  const offsets: number[] = [0];

  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const pushText = (text: string) => {
    parts.push(encoder.encode(text));
  };

  pushText("%PDF-1.4\n");

  const addObject = (body: string | Uint8Array) => {
    const objNum = objects.length + 1;
    offsets[objNum] = parts.reduce((sum, part) => sum + part.length, 0);
    pushText(`${objNum} 0 obj\n`);
    if (typeof body === "string") {
      pushText(body);
    } else {
      parts.push(body);
    }
    pushText("\nendobj\n");
    objects.push("");
    return objNum;
  };

  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> /Font << /F1 6 0 R >> >> >>`,
  );

  const content = [
    "BT",
    "/F1 14 Tf",
    `1 0 0 1 ${margin} ${pageH - 28} Tm`,
    `(${encodePdfString(title)}) Tj`,
    "ET",
    `q ${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`,
  ].join("\n");
  const contentBytes = encoder.encode(content);
  addObject(
    `<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream`,
  );

  const imageHeader = encoder.encode(
    `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  const imageEnd = encoder.encode("\nendstream");
  const imageObjNum = objects.length + 1;
  offsets[imageObjNum] = parts.reduce((sum, part) => sum + part.length, 0);
  pushText(`${imageObjNum} 0 obj\n`);
  parts.push(imageHeader);
  parts.push(jpegBytes);
  parts.push(imageEnd);
  pushText("\nendobj\n");
  objects.push("");

  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const xrefStart = parts.reduce((sum, part) => sum + part.length, 0);
  const count = objects.length + 1;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let i = 1; i < count; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pushText(xref);
  pushText(
    `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`,
  );

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const pdfBytes = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    pdfBytes.set(part, offset);
    offset += part.length;
  }
  return new Blob([pdfBytes], { type: "application/pdf" });
}

export async function downloadOrSharePdf(
  blob: Blob,
  filename: string,
): Promise<"shared" | "downloaded" | "aborted"> {
  const safeName = sanitizeFilename(filename).replace(/\.pdf$/i, "") + ".pdf";
  const file = new File([blob], safeName, { type: "application/pdf" });

  if (
    isAppleTouchDevice() &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file] });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return "aborted";
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return "downloaded";
}
