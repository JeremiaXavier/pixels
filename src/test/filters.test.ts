import { describe, it, expect } from 'vitest';
import { applyColorAdjustments, applyLevels } from '@/filters/colorAdjustments';
import { applyGaussianBlur, applyBoxBlur, applySharpen } from '@/filters/convolutionFilters';
import { applyPixelate, applyNoise } from '@/filters/effectFilters';
import { executeFilter } from '@/filters/FilterRegistry';

// Helper to create test ImageData
function createTestImageData(w: number, h: number, fillR = 100, fillG = 150, fillB = 200): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fillR;
    data[i + 1] = fillG;
    data[i + 2] = fillB;
    data[i + 3] = 255;
  }
  return {
    data,
    width: w,
    height: h,
    colorSpace: 'srgb',
  } as ImageData;
}

describe('Filters & Adjustments Math', () => {
  it('increases brightness correctly', () => {
    const img = createTestImageData(10, 10, 100, 100, 100);
    applyColorAdjustments(img, { brightness: 20 });
    // Brightness 20 adds ~51 to channels
    expect(img.data[0]).toBeGreaterThan(100);
  });

  it('inverts colors correctly', () => {
    const img = createTestImageData(5, 5, 50, 100, 200);
    applyColorAdjustments(img, { invert: true });
    expect(img.data[0]).toBe(205);
    expect(img.data[1]).toBe(155);
    expect(img.data[2]).toBe(55);
  });

  it('converts to grayscale correctly', () => {
    const img = createTestImageData(5, 5, 200, 50, 50);
    applyColorAdjustments(img, { grayscale: true });
    // R, G, B should be identical
    expect(img.data[0]).toBe(img.data[1]);
    expect(img.data[1]).toBe(img.data[2]);
  });

  it('applies levels adjustment properly', () => {
    const img = createTestImageData(5, 5, 128, 128, 128);
    applyLevels(img, {
      inBlack: 0,
      inWhite: 255,
      gamma: 2.0, // Should brighten midtones
      outBlack: 0,
      outWhite: 255,
    });
    expect(img.data[0]).toBeGreaterThan(128);
  });

  it('applies gaussian blur without NaN or infinite values', () => {
    const img = createTestImageData(10, 10, 120, 140, 160);
    applyGaussianBlur(img, 3);
    expect(Number.isFinite(img.data[0])).toBe(true);
    expect(img.data[0]).toBeGreaterThanOrEqual(0);
    expect(img.data[0]).toBeLessThanOrEqual(255);
  });

  it('applies box blur without NaN or infinite values', () => {
    const img = createTestImageData(10, 10, 120, 140, 160);
    applyBoxBlur(img, 2);
    expect(Number.isFinite(img.data[0])).toBe(true);
    expect(img.data[0]).toBeGreaterThanOrEqual(0);
    expect(img.data[0]).toBeLessThanOrEqual(255);
  });

  it('applies pixelate correctly grouping pixels', () => {
    const img = createTestImageData(8, 8, 80, 120, 160);
    // Change top left pixel
    img.data[0] = 200;
    applyPixelate(img, 4);
    // Top-left block pixels should now share the block average
    expect(img.data[0]).toBe(img.data[4]);
  });

  it('executes filter restricted to selection region', () => {
    const img = createTestImageData(20, 20, 100, 100, 100);
    executeFilter(
      img,
      { type: 'colorAdjustments', colorAdjustments: { invert: true } },
      { active: true, x: 0, y: 0, width: 10, height: 10, type: 'rect', inverted: false }
    );

    // Pixel at (0,0) is inside selection -> inverted (255 - 100 = 155)
    expect(img.data[0]).toBe(155);

    // Pixel at (15, 15) is outside selection -> unchanged (100)
    const outsideIdx = (15 * 20 + 15) * 4;
    expect(img.data[outsideIdx]).toBe(100);
  });
});
