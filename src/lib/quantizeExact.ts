type Rgb = readonly [number, number, number];

function dist2(a: Rgb, b: Rgb): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function nearestIndex(pixel: Rgb, palette: Rgb[]): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const d = dist2(pixel, palette[i]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function averageColor(pixels: Rgb[]): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const pixel of pixels) {
    r += pixel[0];
    g += pixel[1];
    b += pixel[2];
  }
  const n = pixels.length || 1;
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/** Farthest-point init so 2-color locks pick true high-contrast ends. */
function initPalette(samples: Rgb[], colorCount: number): Rgb[] {
  const palette: Rgb[] = [samples[0]];

  while (palette.length < colorCount) {
    let bestSample = samples[0];
    let bestScore = -1;
    for (const sample of samples) {
      let nearest = Infinity;
      for (const center of palette) {
        nearest = Math.min(nearest, dist2(sample, center));
      }
      if (nearest > bestScore) {
        bestScore = nearest;
        bestSample = sample;
      }
    }
    palette.push(bestSample);
  }

  return palette;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Could not load image for color lock."));
    img.src = dataUrl;
  });
}

/**
 * Hard-posterize an image to exactly `colorCount` solid RGB colors.
 * Removes anti-alias greys and third-tint accents the model often invents.
 */
export async function lockToExactColorCount(
  dataUrl: string,
  colorCount: number,
): Promise<string> {
  const k = Math.max(2, Math.min(8, Math.round(colorCount)));
  const img = await loadImage(dataUrl);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) return dataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  const samples: Rgb[] = [];
  const totalPixels = data.length / 4;
  const step = Math.max(1, Math.floor(totalPixels / 10_000));
  for (let i = 0; i < data.length; i += 4 * step) {
    samples.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (samples.length < k) return dataUrl;

  let palette = initPalette(samples, k);

  for (let iter = 0; iter < 14; iter++) {
    const buckets: Rgb[][] = Array.from({ length: k }, () => []);
    for (const sample of samples) {
      buckets[nearestIndex(sample, palette)].push(sample);
    }
    palette = buckets.map((bucket, index) =>
      bucket.length ? averageColor(bucket) : palette[index],
    );
  }

  for (let i = 0; i < data.length; i += 4) {
    const idx = nearestIndex([data[i], data[i + 1], data[i + 2]], palette);
    const [r, g, b] = palette[idx];
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
