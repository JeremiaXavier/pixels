/**
 * High performance convolution & spatial filters
 */

function clamp(val: number, min = 0, max = 255): number {
  return val < min ? min : val > max ? max : val;
}

/**
 * Separable Gaussian Blur for O(radius * W * H) performance instead of O(radius^2 * W * H)
 */
export function applyGaussianBlur(imageData: ImageData, radius: number): void {
  if (radius <= 0) return;
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;

  // Generate 1D Gaussian kernel
  const sigma = Math.max(radius / 2, 0.5);
  const kSize = Math.ceil(radius * 2) + 1;
  const kernel = new Float32Array(kSize);
  const half = Math.floor(kSize / 2);
  let kSum = 0;

  for (let i = 0; i < kSize; i++) {
    const x = i - half;
    const g = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel[i] = g;
    kSum += g;
  }
  for (let i = 0; i < kSize; i++) {
    kernel[i] /= kSum;
  }

  // Temporary buffer for horizontal pass
  const temp = new Float32Array(width * height * 4);

  // Horizontal Pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let k = 0; k < kSize; k++) {
        const px = clamp(x + k - half, 0, width - 1);
        const idx = rowOffset + px * 4;
        const weight = kernel[k];
        r += src[idx] * weight;
        g += src[idx + 1] * weight;
        b += src[idx + 2] * weight;
        a += src[idx + 3] * weight;
      }
      const outIdx = rowOffset + x * 4;
      temp[outIdx] = r;
      temp[outIdx + 1] = g;
      temp[outIdx + 2] = b;
      temp[outIdx + 3] = a;
    }
  }

  // Vertical Pass back to src
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let k = 0; k < kSize; k++) {
        const py = clamp(y + k - half, 0, height - 1);
        const idx = (py * width + x) * 4;
        const weight = kernel[k];
        r += temp[idx] * weight;
        g += temp[idx + 1] * weight;
        b += temp[idx + 2] * weight;
        a += temp[idx + 3] * weight;
      }
      const outIdx = (y * width + x) * 4;
      src[outIdx] = Math.round(r);
      src[outIdx + 1] = Math.round(g);
      src[outIdx + 2] = Math.round(b);
      src[outIdx + 3] = Math.round(a);
    }
  }
}

/**
 * 3x3 Sharpen Kernel
 */
export function applySharpen(imageData: ImageData, intensity = 1.0): void {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const copy = new Uint8ClampedArray(src);

  // Kernel:
  // [ 0,  -1,  0 ]
  // [ -1,  5, -1 ]
  // [ 0,  -1,  0 ]
  // Scaled by intensity
  const factor = intensity;
  const centerWeight = 1 + 4 * factor;
  const edgeWeight = -factor;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      if (copy[idx + 3] === 0) continue;

      const top = ((y - 1) * width + x) * 4;
      const bottom = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          copy[idx + c] * centerWeight +
          (copy[top + c] + copy[bottom + c] + copy[left + c] + copy[right + c]) * edgeWeight;
        src[idx + c] = clamp(Math.round(val));
      }
    }
  }
}

/**
 * Sobel Edge Detection
 */
export function applyEdgeDetection(imageData: ImageData): void {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const copy = new Uint8ClampedArray(src);

  // Convert copy to grayscale first for Sobel operator
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = Math.round(0.299 * copy[idx] + 0.587 * copy[idx + 1] + 0.114 * copy[idx + 2]);
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      if (copy[idx + 3] === 0) continue;

      // Sobel Kernels
      // Gx: [-1 0 1, -2 0 2, -1 0 1]
      // Gy: [-1 -2 -1, 0 0 0, 1 2 1]
      const tl = gray[(y - 1) * width + (x - 1)];
      const tc = gray[(y - 1) * width + x];
      const tr = gray[(y - 1) * width + (x + 1)];
      const ml = gray[y * width + (x - 1)];
      const mr = gray[y * width + (x + 1)];
      const bl = gray[(y + 1) * width + (x - 1)];
      const bc = gray[(y + 1) * width + x];
      const br = gray[(y + 1) * width + (x + 1)];

      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;

      const magnitude = clamp(Math.round(Math.sqrt(gx * gx + gy * gy)));

      src[idx] = magnitude;
      src[idx + 1] = magnitude;
      src[idx + 2] = magnitude;
    }
  }
}
