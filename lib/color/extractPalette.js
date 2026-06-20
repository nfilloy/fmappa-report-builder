// Extracts up to three dominant, visually distinct colours from a logo image
// (data URL) using a canvas. Runs in the browser only. Returns lowercase
// #rrggbb strings, the most frequent colour first. If the logo is effectively
// monochrome it synthesises lighter/darker shades so callers always get three.

function toHex(r, g, b) {
  const channel = (value) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function hexToRgb(hex) {
  const value = String(hex).replace(/^#/, "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function distance(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function shade(hex, factor) {
  // factor > 0 lightens toward white, < 0 darkens toward black.
  const { r, g, b } = hexToRgb(hex);
  const mix = (c) => (factor >= 0 ? c + (255 - c) * factor : c * (1 + factor));
  return toHex(mix(r), mix(g), mix(b));
}

function synthesiseShades(colors) {
  if (colors.length === 0) {
    return [];
  }

  const result = [...colors];
  const base = colors[0];

  if (result.length < 3) {
    result.push(shade(base, 0.32));
  }
  if (result.length < 3) {
    result.push(shade(base, -0.32));
  }

  return result.slice(0, 3);
}

export function extractPalette(dataUrl, { maxColors = 3, minDistance = 60 } = {}) {
  return new Promise((resolve) => {
    if (typeof document === "undefined" || !dataUrl) {
      resolve([]);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const size = 64;
        const scale = Math.min(size / image.width, size / image.height, 1);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, width, height);

        const { data } = ctx.getImageData(0, 0, width, height);
        const buckets = new Map();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent and near-white background pixels.
          if (a < 128) continue;
          if (r > 245 && g > 245 && b > 245) continue;

          const key = `${r >> 4},${g >> 4},${b >> 4}`;
          const bucket = buckets.get(key);
          if (bucket) {
            bucket.r += r;
            bucket.g += g;
            bucket.b += b;
            bucket.count += 1;
          } else {
            buckets.set(key, { r, g, b, count: 1 });
          }
        }

        const ranked = [...buckets.values()]
          .map((bucket) => ({
            r: bucket.r / bucket.count,
            g: bucket.g / bucket.count,
            b: bucket.b / bucket.count,
            count: bucket.count,
          }))
          .sort((a, b) => b.count - a.count);

        const chosen = [];
        for (const candidate of ranked) {
          if (chosen.length >= maxColors) break;
          const isDistinct = chosen.every(
            (picked) => distance(picked, candidate) >= minDistance,
          );
          if (isDistinct) {
            chosen.push(candidate);
          }
        }

        const colors = chosen.map((c) => toHex(c.r, c.g, c.b));
        resolve(synthesiseShades(colors));
      } catch {
        resolve([]);
      }
    };

    image.onerror = () => resolve([]);
    image.src = dataUrl;
  });
}
