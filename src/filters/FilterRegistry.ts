import { applyColorAdjustments, applyLevels, applyColorBalance, ColorAdjustmentOptions, LevelsOptions, ColorBalanceOptions } from './colorAdjustments';
import { applyGaussianBlur, applySharpen, applyEdgeDetection } from './convolutionFilters';
import { applyPixelate, applyNoise } from './effectFilters';
import { SelectionRegion } from '@/types';

export type FilterType =
  | 'colorAdjustments'
  | 'levels'
  | 'colorBalance'
  | 'gaussianBlur'
  | 'sharpen'
  | 'edgeDetection'
  | 'pixelate'
  | 'noise';

export interface FilterParams {
  type: FilterType;
  colorAdjustments?: ColorAdjustmentOptions;
  levels?: LevelsOptions;
  colorBalance?: ColorBalanceOptions;
  blurRadius?: number;
  sharpenIntensity?: number;
  pixelateBlockSize?: number;
  noiseAmount?: number;
}

/**
 * Apply a filter to an ImageData object, optionally restricted to an active selection region.
 */
export function executeFilter(
  imageData: ImageData,
  params: FilterParams,
  selection?: SelectionRegion | null
): ImageData {
  // If no selection is active, apply directly
  if (!selection || !selection.active || selection.width <= 0 || selection.height <= 0) {
    applyDirect(imageData, params);
    return imageData;
  }

  // With active selection:
  // Create an isolated sub-ImageData for the selection bounding box, process it, then blend back
  const { width, height } = imageData;
  const sx = Math.max(0, Math.floor(selection.x));
  const sy = Math.max(0, Math.floor(selection.y));
  const sw = Math.min(width - sx, Math.ceil(selection.width));
  const sh = Math.min(height - sy, Math.ceil(selection.height));

  if (sw <= 0 || sh <= 0) return imageData;

  // Clone original to compare / mask
  const original = new Uint8ClampedArray(imageData.data);

  // Apply filter to entire or sub image
  applyDirect(imageData, params);

  const dest = imageData.data;
  const isEllipse = selection.type === 'ellipse';
  const rx = sw / 2;
  const ry = sh / 2;
  const cx = sx + rx;
  const cy = sy + ry;

  // Restore pixels outside the selection region
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let isInside = false;
      if (x >= sx && x < sx + sw && y >= sy && y < sy + sh) {
        if (isEllipse) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          isInside = dx * dx + dy * dy <= 1;
        } else {
          isInside = true;
        }
      }

      if (selection.inverted) {
        isInside = !isInside;
      }

      if (!isInside) {
        const idx = (y * width + x) * 4;
        dest[idx] = original[idx];
        dest[idx + 1] = original[idx + 1];
        dest[idx + 2] = original[idx + 2];
        dest[idx + 3] = original[idx + 3];
      }
    }
  }

  return imageData;
}

function applyDirect(imageData: ImageData, params: FilterParams): void {
  switch (params.type) {
    case 'colorAdjustments':
      if (params.colorAdjustments) {
        applyColorAdjustments(imageData, params.colorAdjustments);
      }
      break;
    case 'levels':
      if (params.levels) {
        applyLevels(imageData, params.levels);
      }
      break;
    case 'colorBalance':
      if (params.colorBalance) {
        applyColorBalance(imageData, params.colorBalance);
      }
      break;
    case 'gaussianBlur':
      applyGaussianBlur(imageData, params.blurRadius ?? 4);
      break;
    case 'sharpen':
      applySharpen(imageData, params.sharpenIntensity ?? 1);
      break;
    case 'edgeDetection':
      applyEdgeDetection(imageData);
      break;
    case 'pixelate':
      applyPixelate(imageData, params.pixelateBlockSize ?? 8);
      break;
    case 'noise':
      applyNoise(imageData, params.noiseAmount ?? 25);
      break;
  }
}
