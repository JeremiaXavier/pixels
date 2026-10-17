import React, { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { Modal } from '@/components/ui/Modal';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { FilterParams } from '@/filters/FilterRegistry';
import { Check } from 'lucide-react';

export const FilterDialog: React.FC = () => {
  const { isFilterOpen, activeFilterType, closeFilterDialog } = useEditorStore();
  const { document, applyFilterToActiveLayer } = useDocumentStore();

  // Filter parameters state
  const [blurRadius, setBlurRadius] = useState(6);
  const [sharpenIntensity, setSharpenIntensity] = useState(1.5);
  const [pixelateBlockSize, setPixelateBlockSize] = useState(12);
  const [noiseAmount, setNoiseAmount] = useState(25);

  // Levels state
  const [levels, setLevels] = useState({
    inBlack: 0,
    inWhite: 255,
    gamma: 1.0,
    outBlack: 0,
    outWhite: 255,
  });

  // Color balance state
  const [colorBalance, setColorBalance] = useState({
    cyanRed: 0,
    magentaGreen: 0,
    yellowBlue: 0,
    preserveLuminosity: true,
  });

  const [isApplying, setIsApplying] = useState(false);

  if (!isFilterOpen || !activeFilterType || !document) return null;

  const titles: Record<string, string> = {
    gaussianBlur: 'Gaussian Blur',
    sharpen: 'Sharpen',
    pixelate: 'Pixelate',
    noise: 'Add Noise',
    edgeDetection: 'Edge Detection',
    levels: 'Levels Adjustment',
    colorBalance: 'Color Balance',
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const params: FilterParams = {
        type: activeFilterType,
        blurRadius,
        sharpenIntensity,
        pixelateBlockSize,
        noiseAmount,
        levels,
        colorBalance,
      };

      await applyFilterToActiveLayer(params);
      closeFilterDialog();
    } catch (err) {
      console.error('Filter execution failed:', err);
      alert('Filter execution failed.');
    } finally {
      setIsApplying(false);
    }
  };

  const activeLayer = document.layers.find((l) => l.id === document.activeLayerId);
  const isRaster = activeLayer?.type === 'raster';

  return (
    <Modal
      isOpen={isFilterOpen}
      onClose={closeFilterDialog}
      title={titles[activeFilterType] || 'Filter'}
      maxWidth="sm"
    >
      <div className="flex flex-col gap-4 text-xs">
        {!isRaster && (
          <div className="p-2 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300">
            Please select an editable raster image layer first.
          </div>
        )}

        {/* Gaussian Blur */}
        {activeFilterType === 'gaussianBlur' && (
          <Slider
            label="Blur Radius"
            min={1}
            max={50}
            unit=" px"
            value={blurRadius}
            onChange={setBlurRadius}
          />
        )}

        {/* Sharpen */}
        {activeFilterType === 'sharpen' && (
          <Slider
            label="Sharpen Intensity"
            min={0.2}
            max={5.0}
            step={0.1}
            value={sharpenIntensity}
            onChange={setSharpenIntensity}
          />
        )}

        {/* Pixelate */}
        {activeFilterType === 'pixelate' && (
          <Slider
            label="Cell Size"
            min={2}
            max={64}
            unit=" px"
            value={pixelateBlockSize}
            onChange={setPixelateBlockSize}
          />
        )}

        {/* Noise */}
        {activeFilterType === 'noise' && (
          <Slider
            label="Noise Amount"
            min={1}
            max={100}
            unit="%"
            value={noiseAmount}
            onChange={setNoiseAmount}
          />
        )}

        {/* Edge Detection */}
        {activeFilterType === 'edgeDetection' && (
          <p className="text-editor-muted">
            Applies a Sobel gradient operator to detect and highlight high-contrast outlines across
            the active layer.
          </p>
        )}

        {/* Levels */}
        {activeFilterType === 'levels' && (
          <div className="flex flex-col gap-3">
            <Slider
              label="Input Shadow (Black)"
              min={0}
              max={254}
              value={levels.inBlack}
              onChange={(v) => setLevels((s) => ({ ...s, inBlack: v }))}
            />
            <Slider
              label="Midtone (Gamma)"
              min={0.2}
              max={3.0}
              step={0.05}
              value={levels.gamma}
              onChange={(v) => setLevels((s) => ({ ...s, gamma: v }))}
            />
            <Slider
              label="Input Highlight (White)"
              min={levels.inBlack + 1}
              max={255}
              value={levels.inWhite}
              onChange={(v) => setLevels((s) => ({ ...s, inWhite: v }))}
            />
            <div className="h-px bg-[#32323e]" />
            <Slider
              label="Output Black"
              min={0}
              max={255}
              value={levels.outBlack}
              onChange={(v) => setLevels((s) => ({ ...s, outBlack: v }))}
            />
            <Slider
              label="Output White"
              min={0}
              max={255}
              value={levels.outWhite}
              onChange={(v) => setLevels((s) => ({ ...s, outWhite: v }))}
            />
          </div>
        )}

        {/* Color Balance */}
        {activeFilterType === 'colorBalance' && (
          <div className="flex flex-col gap-3">
            <Slider
              label="Cyan ⟷ Red"
              min={-100}
              max={100}
              value={colorBalance.cyanRed}
              onChange={(v) => setColorBalance((s) => ({ ...s, cyanRed: v }))}
            />
            <Slider
              label="Magenta ⟷ Green"
              min={-100}
              max={100}
              value={colorBalance.magentaGreen}
              onChange={(v) => setColorBalance((s) => ({ ...s, magentaGreen: v }))}
            />
            <Slider
              label="Yellow ⟷ Blue"
              min={-100}
              max={100}
              value={colorBalance.yellowBlue}
              onChange={(v) => setColorBalance((s) => ({ ...s, yellowBlue: v }))}
            />
            <label className="flex items-center gap-2 cursor-pointer pt-1 text-editor-muted">
              <input
                type="checkbox"
                checked={colorBalance.preserveLuminosity}
                onChange={(e) =>
                  setColorBalance((s) => ({ ...s, preserveLuminosity: e.target.checked }))
                }
                className="rounded accent-editor-accent"
              />
              <span>Preserve Luminosity</span>
            </label>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#30303a]">
          <Button variant="secondary" onClick={closeFilterDialog}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={!isRaster || isApplying}
            className="font-semibold"
          >
            <Check size={13} />
            <span>{isApplying ? 'Processing...' : 'Apply Filter'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
