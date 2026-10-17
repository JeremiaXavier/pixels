/**
 * High performance color adjustments for ImageData
 */

export interface ColorAdjustmentOptions {
  brightness?: number; // -100 to 100
  contrast?: number;   // -100 to 100
  saturation?: number; // -100 to 100
  hue?: number;        // -180 to 180
  exposure?: number;   // -100 to 100
  gamma?: number;      // 0.1 to 3.0 (default 1.0)
  temperature?: number;// -100 (cool) to 100 (warm)
  tint?: number;       // -100 (green) to 100 (magenta)
  grayscale?: boolean;
  sepia?: boolean;
  invert?: boolean;
}

export interface LevelsOptions {
  inBlack: number;  // 0 to 255
  inWhite: number;  // 0 to 255
  gamma: number;    // 0.1 to 5.0 (default 1.0)
  outBlack: number; // 0 to 255
  outWhite: number; // 0 to 255
}

export interface ColorBalanceOptions {
  cyanRed: number;      // -100 to 100
  magentaGreen: number; // -100 to 100
  yellowBlue: number;   // -100 to 100
  preserveLuminosity?: boolean;
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function clamp(val: number, min = 0, max = 255): number {
  return val < min ? min : val > max ? max : val;
}

export function applyColorAdjustments(imageData: ImageData, options: ColorAdjustmentOptions): void {
  const data = imageData.data;
  const len = data.length;

  const bAdj = (options.brightness ?? 0) * 2.55; // -255 to 255
  const cVal = options.contrast ?? 0;
  // Standard contrast formula: factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  const cFactor = (259 * (cVal + 255)) / (255 * (259 - cVal));

  const satAdj = options.saturation ?? 0; // -100 to 100
  const hueAdj = options.hue ?? 0;        // -180 to 180
  const expAdj = options.exposure ?? 0;   // -100 to 100
  const expFactor = Math.pow(2, expAdj / 50); // exposure multiplier
  const gammaVal = options.gamma ?? 1.0;
  const invGamma = gammaVal !== 1.0 ? 1 / gammaVal : 1.0;

  const temp = options.temperature ?? 0; // warm/cool
  const tint = options.tint ?? 0;        // magenta/green

  const hasBrightness = bAdj !== 0;
  const hasContrast = cVal !== 0;
  const hasExposure = expAdj !== 0;
  const hasGamma = gammaVal !== 1.0;
  const hasHsl = satAdj !== 0 || hueAdj !== 0;
  const hasTempTint = temp !== 0 || tint !== 0;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue; // skip transparent pixels

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Exposure
    if (hasExposure) {
      r = clamp(r * expFactor);
      g = clamp(g * expFactor);
      b = clamp(b * expFactor);
    }

    // Brightness
    if (hasBrightness) {
      r = clamp(r + bAdj);
      g = clamp(g + bAdj);
      b = clamp(b + bAdj);
    }

    // Contrast
    if (hasContrast) {
      r = clamp(cFactor * (r - 128) + 128);
      g = clamp(cFactor * (g - 128) + 128);
      b = clamp(cFactor * (b - 128) + 128);
    }

    // Gamma
    if (hasGamma) {
      r = clamp(Math.pow(r / 255, invGamma) * 255);
      g = clamp(Math.pow(g / 255, invGamma) * 255);
      b = clamp(Math.pow(b / 255, invGamma) * 255);
    }

    // Temperature & Tint
    if (hasTempTint) {
      r = clamp(r + temp * 0.8);
      b = clamp(b - temp * 0.8);
      g = clamp(g - tint * 0.8);
    }

    // Hue / Saturation
    if (hasHsl) {
      let [h, s, l] = rgbToHsl(r, g, b);
      if (hueAdj !== 0) {
        h = (h + hueAdj / 360) % 1;
        if (h < 0) h += 1;
      }
      if (satAdj !== 0) {
        s = clamp(s * (1 + satAdj / 100), 0, 1);
      }
      const [nr, ng, nb] = hslToRgb(h, s, l);
      r = nr;
      g = ng;
      b = nb;
    }

    // Grayscale
    if (options.grayscale) {
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      r = gray;
      g = gray;
      b = gray;
    }

    // Sepia
    if (options.sepia) {
      const sr = clamp(0.393 * r + 0.769 * g + 0.189 * b);
      const sg = clamp(0.349 * r + 0.686 * g + 0.168 * b);
      const sb = clamp(0.272 * r + 0.534 * g + 0.131 * b);
      r = sr;
      g = sg;
      b = sb;
    }

    // Invert
    if (options.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

export function applyLevels(imageData: ImageData, options: LevelsOptions): void {
  const { inBlack, inWhite, gamma, outBlack, outWhite } = options;
  const lut = new Uint8Array(256);
  const inRange = Math.max(1, inWhite - inBlack);
  const outRange = outWhite - outBlack;
  const invGamma = 1 / Math.max(0.01, gamma);

  for (let i = 0; i < 256; i++) {
    // Normalization to 0..1 based on input black/white
    let v = (i - inBlack) / inRange;
    v = Math.max(0, Math.min(1, v));
    // Apply gamma curve
    v = Math.pow(v, invGamma);
    // Map to output black/white range
    const res = Math.round(outBlack + v * outRange);
    lut[i] = clamp(res);
  }

  const data = imageData.data;
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue;
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
}

export function applyColorBalance(imageData: ImageData, options: ColorBalanceOptions): void {
  const { cyanRed, magentaGreen, yellowBlue } = options;
  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Shift channels
    const nr = clamp(r + cyanRed * 0.5);
    const ng = clamp(g + magentaGreen * 0.5);
    const nb = clamp(b + yellowBlue * 0.5);

    if (options.preserveLuminosity) {
      const lumOriginal = 0.299 * r + 0.587 * g + 0.114 * b;
      const lumNew = 0.299 * nr + 0.587 * ng + 0.114 * nb;
      const diff = lumOriginal - lumNew;
      data[i] = clamp(nr + diff);
      data[i + 1] = clamp(ng + diff);
      data[i + 2] = clamp(nb + diff);
    } else {
      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;
    }
  }
}
