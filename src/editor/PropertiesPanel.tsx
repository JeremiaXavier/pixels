import React from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { TextLayer, ShapeLayer } from '@/types';
import { Input } from '@/components/ui/Input';

export const PropertiesPanel: React.FC = () => {
  const { document, updateLayer } = useDocumentStore();
  if (!document) return null;

  const activeLayer = document.layers.find((l) => l.id === document.activeLayerId);

  if (!activeLayer) {
    return (
      <div className="p-4 text-xs text-editor-dim text-center">
        No active layer selected.
      </div>
    );
  }

  return (
    <div className="p-3 text-xs flex flex-col gap-3 text-editor-text overflow-y-auto">
      {/* Position & Size */}
      <div className="flex flex-col gap-2 bg-[#202026] p-2.5 rounded border border-[#2d2d36]">
        <span className="text-[11px] font-semibold text-editor-muted uppercase tracking-wider">
          Transform
        </span>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="X"
            type="number"
            value={activeLayer.x}
            onChange={(e) => updateLayer(activeLayer.id, { x: Number(e.target.value) })}
          />
          <Input
            label="Y"
            type="number"
            value={activeLayer.y}
            onChange={(e) => updateLayer(activeLayer.id, { y: Number(e.target.value) })}
          />
          <Input
            label="Width (W)"
            type="number"
            value={activeLayer.width}
            onChange={(e) => updateLayer(activeLayer.id, { width: Math.max(1, Number(e.target.value)) })}
          />
          <Input
            label="Height (H)"
            type="number"
            value={activeLayer.height}
            onChange={(e) => updateLayer(activeLayer.id, { height: Math.max(1, Number(e.target.value)) })}
          />
        </div>
      </div>

      {/* Specific Text Layer Properties */}
      {activeLayer.type === 'text' && (
        <div className="flex flex-col gap-2 bg-[#202026] p-2.5 rounded border border-[#2d2d36]">
          <span className="text-[11px] font-semibold text-editor-muted uppercase tracking-wider">
            Text Properties
          </span>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-editor-muted">Content:</label>
            <textarea
              value={(activeLayer as TextLayer).text}
              onChange={(e) => updateLayer(activeLayer.id, { text: e.target.value })}
              rows={2}
              className="w-full bg-[#1e1e24] border border-[#383842] rounded p-1.5 text-xs text-white focus:outline-none focus:border-editor-accent"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-editor-muted">Text Color:</span>
            <input
              type="color"
              value={(activeLayer as TextLayer).fill}
              onChange={(e) => updateLayer(activeLayer.id, { fill: e.target.value })}
              className="w-6 h-6 rounded border border-[#3e3e4a] cursor-pointer bg-transparent"
            />
          </div>
        </div>
      )}

      {/* Specific Shape Layer Properties */}
      {activeLayer.type === 'shape' && (
        <div className="flex flex-col gap-2 bg-[#202026] p-2.5 rounded border border-[#2d2d36]">
          <span className="text-[11px] font-semibold text-editor-muted uppercase tracking-wider">
            Shape Appearance
          </span>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-editor-muted">Fill Color:</span>
            <input
              type="color"
              value={(activeLayer as ShapeLayer).fill}
              onChange={(e) => updateLayer(activeLayer.id, { fill: e.target.value })}
              className="w-6 h-6 rounded border border-[#3e3e4a] cursor-pointer bg-transparent"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-editor-muted">Stroke Color:</span>
            <input
              type="color"
              value={(activeLayer as ShapeLayer).stroke}
              onChange={(e) => updateLayer(activeLayer.id, { stroke: e.target.value })}
              className="w-6 h-6 rounded border border-[#3e3e4a] cursor-pointer bg-transparent"
            />
          </div>

          <Input
            label="Stroke Width"
            type="number"
            min={0}
            max={50}
            value={(activeLayer as ShapeLayer).strokeWidth}
            onChange={(e) =>
              updateLayer(activeLayer.id, { strokeWidth: Math.max(0, Number(e.target.value)) })
            }
          />
        </div>
      )}

      {/* Document Info */}
      <div className="flex flex-col gap-1.5 bg-[#202026] p-2.5 rounded border border-[#2d2d36] text-[11px] text-editor-muted">
        <span className="text-[11px] font-semibold text-editor-muted uppercase tracking-wider">
          Document Details
        </span>
        <div className="flex justify-between">
          <span>Dimensions:</span>
          <span className="font-mono text-editor-text">
            {document.width} × {document.height} px
          </span>
        </div>
        <div className="flex justify-between">
          <span>Layers:</span>
          <span className="font-mono text-editor-text">{document.layers.length}</span>
        </div>
      </div>
    </div>
  );
};
