import React from 'react';
import {
  Move,
  Square,
  Circle,
  Paintbrush,
  Pencil,
  Eraser,
  Crop,
  Type,
  Shapes,
  Minus,
  Pipette,
  ZoomIn,
  Hand,
  ArrowLeftRight,
} from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { ToolType } from '@/types';

interface ToolItem {
  id: ToolType;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

export const Toolbar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    foregroundColor,
    backgroundColor,
    setForegroundColor,
    setBackgroundColor,
    swapColors,
    resetDefaultColors,
  } = useEditorStore();

  const tools: ToolItem[] = [
    { id: 'move', label: 'Move Tool', icon: <Move size={16} />, shortcut: 'V' },
    { id: 'select-rect', label: 'Rectangular Marquee', icon: <Square size={16} />, shortcut: 'M' },
    { id: 'select-ellipse', label: 'Elliptical Marquee', icon: <Circle size={16} />, shortcut: 'Shift+M' },
    { id: 'crop', label: 'Crop Tool', icon: <Crop size={16} />, shortcut: 'C' },
    { id: 'brush', label: 'Brush Tool', icon: <Paintbrush size={16} />, shortcut: 'B' },
    { id: 'pencil', label: 'Pencil Tool', icon: <Pencil size={16} />, shortcut: 'P' },
    { id: 'eraser', label: 'Eraser Tool', icon: <Eraser size={16} />, shortcut: 'E' },
    { id: 'text', label: 'Text Tool', icon: <Type size={16} />, shortcut: 'T' },
    { id: 'shape-rect', label: 'Rectangle Shape', icon: <Square size={16} />, shortcut: 'U' },
    { id: 'shape-ellipse', label: 'Ellipse Shape', icon: <Circle size={16} />, shortcut: 'Shift+U' },
    { id: 'shape-line', label: 'Line Shape', icon: <Minus size={16} />, shortcut: 'L' },
    { id: 'eyedropper', label: 'Eyedropper', icon: <Pipette size={16} />, shortcut: 'I' },
    { id: 'zoom', label: 'Zoom Tool', icon: <ZoomIn size={16} />, shortcut: 'Z' },
    { id: 'hand', label: 'Hand Tool', icon: <Hand size={16} />, shortcut: 'H' },
  ];

  return (
    <aside className="w-11 bg-editor-toolbar border-r border-editor-border flex flex-col items-center py-2 select-none z-20 shrink-0">
      {/* Tool Buttons */}
      <div className="flex flex-col gap-1 items-center w-full px-1">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors relative group ${
                isActive
                  ? 'bg-editor-accent text-white shadow-xs'
                  : 'text-editor-muted hover:text-white hover:bg-[#2b2b34]'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
              aria-label={tool.label}
            >
              {tool.icon}
            </button>
          );
        })}
      </div>

      <div className="mt-auto w-full flex flex-col items-center gap-2 pt-2 border-t border-[#2e2e38]">
        {/* Color Swatches */}
        <div className="relative w-8 h-8">
          {/* Background color swatch */}
          <div
            className="absolute bottom-0 right-0 w-5 h-5 rounded border border-[#444450] shadow-sm cursor-pointer z-0 overflow-hidden"
            style={{ backgroundColor }}
            title="Background Color (click to change)"
          >
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="opacity-0 w-full h-full cursor-pointer"
            />
          </div>

          {/* Foreground color swatch */}
          <div
            className="absolute top-0 left-0 w-5 h-5 rounded border border-[#444450] shadow-sm cursor-pointer z-10 overflow-hidden"
            style={{ backgroundColor: foregroundColor }}
            title="Foreground Color (click to change)"
          >
            <input
              type="color"
              value={foregroundColor}
              onChange={(e) => setForegroundColor(e.target.value)}
              className="opacity-0 w-full h-full cursor-pointer"
            />
          </div>
        </div>

        {/* Swap / Reset Colors */}
        <div className="flex items-center gap-1 text-[10px] text-editor-dim">
          <button
            onClick={swapColors}
            className="p-1 hover:text-white rounded hover:bg-[#2e2e38] transition-colors"
            title="Swap Colors (X)"
            aria-label="Swap Colors"
          >
            <ArrowLeftRight size={10} />
          </button>
          <button
            onClick={resetDefaultColors}
            className="px-1 py-0.5 font-mono hover:text-white rounded hover:bg-[#2e2e38] transition-colors text-[9px]"
            title="Default Colors (D)"
            aria-label="Default Colors"
          >
            D
          </button>
        </div>
      </div>
    </aside>
  );
};
