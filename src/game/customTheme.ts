/* Custom theme from a user-uploaded background picture. The image is
 * downscaled and stored in localStorage as a data URL, and a palette (accent
 * plus tinted dark surfaces) is derived from its dominant hue and applied as
 * inline overrides of the CSS theme variables. */

export interface CustomTheme {
  image: string; // JPEG data URL for the page background
  vars: Record<string, string>;
}

const STORAGE_KEY = "sudotiles:customTheme";

/* Every variable a custom theme overrides (must mirror index.css tokens). */
const VAR_KEYS = [
  "--accent",
  "--accent-strong",
  "--accent-rgb",
  "--bg0",
  "--bg1",
  "--bg2",
  "--board0",
  "--board1",
  "--cell",
  "--cell-hover",
  "--panel0",
  "--panel1",
  "--row0",
  "--row1",
  "--pad0",
  "--pad1",
  "--ctl0",
  "--ctl1",
  "--menu0",
  "--menu1",
] as const;

export function loadCustomTheme(): CustomTheme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomTheme;
    if (typeof parsed?.image !== "string" || typeof parsed?.vars !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCustomTheme(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function applyCustomVars(vars: Record<string, string>): void {
  for (const k of VAR_KEYS) {
    if (vars[k]) document.documentElement.style.setProperty(k, vars[k]);
  }
}

export function clearCustomVars(): void {
  for (const k of VAR_KEYS) document.documentElement.style.removeProperty(k);
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

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

/* The image's dominant hue: pixels are bucketed by hue, weighted by
 * saturation, so a colorful subject wins over grey expanses. Falls back to a
 * warm neutral when the picture has almost no color. */
function dominantHue(img: HTMLImageElement): { h: number; s: number } {
  const N = 48;
  const canvas = document.createElement("canvas");
  canvas.width = N;
  canvas.height = N;
  const cx = canvas.getContext("2d");
  if (!cx) return { h: 38, s: 0.5 };
  cx.drawImage(img, 0, 0, N, N);
  const data = cx.getImageData(0, 0, N, N).data;

  const BUCKETS = 24;
  const weight = new Array<number>(BUCKETS).fill(0);
  const hueSum = new Array<number>(BUCKETS).fill(0);
  const satSum = new Array<number>(BUCKETS).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d < 0.06 || l < 0.12 || l > 0.9) continue; // near-grey or extreme
    const s = d / (1 - Math.abs(2 * l - 1));
    let h: number;
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
    const bi = Math.min(BUCKETS - 1, Math.floor((h / 360) * BUCKETS));
    weight[bi] += s;
    hueSum[bi] += h * s;
    satSum[bi] += s * s;
  }

  let best = 0;
  for (let i = 1; i < BUCKETS; i++) if (weight[i] > weight[best]) best = i;
  if (weight[best] < 1) return { h: 38, s: 0.5 }; // effectively colorless image
  return { h: hueSum[best] / weight[best], s: Math.min(1, satSum[best] / weight[best]) };
}

/* Dark surfaces tinted toward the image hue, with lightness steps matching
 * the built-in themes, plus a readable accent in the same hue. */
function paletteFrom(h: number, imgSat: number): Record<string, string> {
  const surfSat = Math.min(0.14, Math.max(0.06, imgSat * 0.35));
  const hsl = (sat: number, l: number) =>
    `hsl(${Math.round(h)} ${Math.round(sat * 100)}% ${Math.round(l * 100)}%)`;
  const surf = (l: number) => hsl(surfSat, l);
  const accentSat = Math.min(0.6, Math.max(0.35, imgSat));
  const [ar, ag, ab] = hslToRgb(h, accentSat, 0.62);
  return {
    "--accent": hsl(accentSat, 0.7),
    "--accent-strong": hsl(accentSat, 0.62),
    "--accent-rgb": `${ar}, ${ag}, ${ab}`,
    "--bg0": surf(0.085),
    "--bg1": surf(0.06),
    "--bg2": surf(0.045),
    "--board0": surf(0.095),
    "--board1": surf(0.065),
    "--cell": surf(0.12),
    "--cell-hover": surf(0.155),
    "--panel0": surf(0.115),
    "--panel1": surf(0.08),
    "--row0": surf(0.145),
    "--row1": surf(0.105),
    "--pad0": surf(0.14),
    "--pad1": surf(0.1),
    "--ctl0": surf(0.13),
    "--ctl1": surf(0.095),
    "--menu0": surf(0.16),
    "--menu1": surf(0.105),
  };
}

/* Build a custom theme from an uploaded file and persist it. Retries with a
 * smaller/more compressed image if localStorage rejects the first attempt. */
export async function createCustomTheme(file: File): Promise<CustomTheme> {
  const img = await loadImage(file);
  const { h, s } = dominantHue(img);
  const vars = paletteFrom(h, s);

  const attempts: [number, number][] = [
    [1600, 0.78],
    [1100, 0.65],
    [800, 0.55],
  ];
  for (const [side, quality] of attempts) {
    const theme: CustomTheme = { image: drawScaled(img, side, quality), vars };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
      return theme;
    } catch {
      // quota exceeded — try a smaller encode
    }
  }
  throw new Error("image too large to store");
}
