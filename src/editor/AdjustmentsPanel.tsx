import React, { useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { ColorAdjustmentOptions } from '@/filters/colorAdjustments';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { RotateCcw, Check, Sparkles } from 'lucide-react';

export const AdjustmentsPanel: React.FC = () => {
  const { document, applyFilterToActiveLayer } = useDocumentStore();
  const [isApplying, setIsApplying] = useState(false);

  const initialValues: ColorAdjustmentOptions = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    exposure: 0,
    temperature: 0,
    tint: 0,
    grayscale: false,
    sepia: false,
    invert: false,
  };

  const [values, setValues] = useState<ColorAdjustmentOptions>(initialValues);

  const handleReset = () => {
    setValues(initialValues);
  };

  const handleApply = async () => {
    if (!document || !document.activeLayerId) return;
    setIsApplying(true);
    try {
      await applyFilterToActiveLayer({
        type: 'colorAdjustments',
        colorAdjustments: values,
      });
      handleReset();
    } catch (err) {
      console.error('Failed to apply adjustments:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleQuickPreset = async (preset: 'grayscale' | 'sepia' | 'invert') => {
    if (!document || !document.activeLayerId) return;
    setIsApplying(true);
    try {
      await applyFilterToActiveLayer({
        type: 'colorAdjustments',
        colorAdjustments: { [preset]: true },
      });
    } catch (err) {
      console.error(`Failed to apply ${preset}:`, err);
    } finally {
      setIsApplying(false);
    }
  };

  const activeLayer = document?.layers.find((l) => l.id === document.activeLayerId);
  const isRaster = activeLayer?.type === 'raster';

  return (
    <div className="p-3 text-xs flex flex-col gap-3 text-editor-text overflow-y-auto">
      {!isRaster && (
        <div className="p-2 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[11px]">
          Select a raster image layer to apply pixel adjustments.
        </div>
      )}

      {/* Quick Color Toggles */}
      <div className="flex flex-col gap-1.5 bg-[#202026] p-2.5 rounded border border-[#2d2d36]">
        <span className="text-[11px] font-semibold text-editor-muted uppercase tracking-wider">
          Quick Filters
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={!isRaster || isApplying}
            onClick={() => handleQuickPreset('grayscale')}
          >
            Grayscale
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!isRaster || isApplying}
            onClick={() => handleQuickPreset('sepia')}
          >
            Sepia
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!isRaster || isApplying}
            onClick={() => handleQuickPreset('invert')}
          >
            Invert
          </Button>
        </div>
      </div>

      {/* Fine Adjustment Sliders */}
      <div className="flex flex-col gap-3 bg-[#202026] p-2.5 rounded border border-[#2d2d36]">
        <span className="text-[11px] font-semibold text-editor-muted uppercase tracking-wider">
          Color & Tone
        </span>

        <Slider
          label="Brightness"
          min={-100}
          max={100}
          value={values.brightness ?? 0}
          onChange={(v) => setValues((s) => ({ ...s, brightness: v }))}
        />

        <Slider
          label="Contrast"
          min={-100}
          max={100}
          value={values.contrast ?? 0}
          onChange={(v) => setValues((s) => ({ ...s, contrast: v }))}
        />

        <Slider
          label="Saturation"
          min={-100}
          max={100}
          value={values.saturation ?? 0}
          onChange={(v) => setValues((s) => ({ ...s, saturation: v }))}
        />

        <Slider
          label="Hue Shift"
          min={-180}
          max={180}
          unit="°"
          value={values.hue ?? 0}
          onChange={(v) => setValues((s) => ({ ...s, hue: v }))}
        />

        <Slider
          label="Exposure"
          min={-100}
          max={100}
          value={values.exposure ?? 0}
          onChange={(v) => setValues((s) => ({ ...s, exposure: v }))}
        />

        <Slider
          label="Temperature"
          min={-100}
          max={100}
          value={values.temperature ?? 0}
          onChange={(v) => setValues((s) => ({ ...s, temperature: v }))}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          disabled={!isRaster}
          className="flex-1"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleApply}
          disabled={!isRaster || isApplying}
          className="flex-1"
        >
          <Check size={13} />
          <span>{isApplying ? 'Applying...' : 'Apply'}</span>
        </Button>
      </div>
    </div>
  );
};
