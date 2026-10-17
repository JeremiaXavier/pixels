import React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-1 w-full text-left', className)}>
      <div className="flex justify-between items-center text-[11px] text-editor-muted">
        {label && <span>{label}</span>}
        <span className="font-mono text-editor-text">
          {value}
          {unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-[#33333d] rounded-lg appearance-none cursor-pointer accent-editor-accent"
        />
      </div>
    </div>
  );
};
