/* Custom background from a user-uploaded picture, stored in localStorage as a
 * downscaled JPEG data URL. The app itself renders with the greyscale "void"
 * palette while a custom background is active — only the page background
 * changes (see applyTheme in settings.ts). */

const STORAGE_KEY = "sudotiles:customTheme";

export function loadCustomBackground(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { image?: unknown };
    return typeof parsed?.image === "string" ? parsed.image : null;
  } catch {
    return null;
  }
}

export function clearCustomBackground(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("not an image"));
    };
    img.src = url;
  });
}

function drawScaled(img: HTMLImageElement, maxSide: number, quality: number): string {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const cx = canvas.getContext("2d");
  if (!cx) throw new Error("no canvas");
  cx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/* Encode and persist an uploaded background. Retries with a smaller, more
 * compressed image if localStorage rejects the first attempt. */
export async function createCustomBackground(file: File): Promise<string> {
  const img = await loadImage(file);
  const attempts: [number, number][] = [
    [1600, 0.78],
    [1100, 0.65],
    [800, 0.55],
  ];
  for (const [side, quality] of attempts) {
    const image = drawScaled(img, side, quality);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ image }));
      return image;
    } catch {
      // quota exceeded — try a smaller encode
    }
  }
  throw new Error("image too large to store");
}
