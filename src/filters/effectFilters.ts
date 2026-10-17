/**
 * Pixelate and Noise effect filters
 */

function clamp(val: number, min = 0, max = 255): number {
  return val < min ? min : val > max ? max : val;
}

export function applyPixelate(imageData: ImageData, blockSize = 8): void {
  if (blockSize <= 1) return;
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      // Calculate average color in block
      let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
      let count = 0;

      const maxX = Math.min(x + blockSize, width);
      const maxY = Math.min(y + blockSize, height);

      for (let by = y; by < maxY; by++) {
        for (let bx = x; bx < maxX; bx++) {
          const idx = (by * width + bx) * 4;
          totalR += src[idx];
          totalG += src[idx + 1];
          totalB += src[idx + 2];
          totalA += src[idx + 3];
          count++;
        }
      }

      if (count === 0) continue;
      const avgR = Math.round(totalR / count);
      const avgG = Math.round(totalG / count);
      const avgB = Math.round(totalB / count);
      const avgA = Math.round(totalA / count);

      // Fill block with average color
      for (let by = y; by < maxY; by++) {
        for (let bx = x; bx < maxX; bx++) {
          const idx = (by * width + bx) * 4;
          src[idx] = avgR;
          src[idx + 1] = avgG;
          src[idx + 2] = avgB;
          src[idx + 3] = avgA;
        }
      }
    }
  }
}

export function applyNoise(imageData: ImageData, amount = 25): void {
  if (amount <= 0) return;
  const src = imageData.data;
  const len = src.length;
  const range = amount * 2.55;

  for (let i = 0; i < len; i += 4) {
    if (src[i + 3] === 0) continue;
    const noise = (Math.random() - 0.5) * range;
    src[i] = clamp(src[i] + noise);
    src[i + 1] = clamp(src[i + 1] + noise);
    src[i + 2] = clamp(src[i + 2] + noise);
  }
}
