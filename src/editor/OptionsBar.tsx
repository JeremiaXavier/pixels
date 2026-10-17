import React from 'react';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Check,
  X,
  Square,
  Circle,
  Minus,
} from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { LayerFactory } from '@/document/Layer';
import { Button } from '@/components/ui/Button';

export const OptionsBar: React.FC = () => {
  const { activeTool, toolOptions, updateToolOptions, setZoom, viewport, resetViewport } =
    useEditorStore();
  const { document, addLayer, cropDocument, setSelection } = useDocumentStore();

  const handleAddText = () => {
    if (!document) return;
    const textLayer = LayerFactory.createTextLayer(
      'Double click to edit',
      Math.round(document.width / 4),
      Math.round(document.height / 3),
      {
        fontSize: toolOptions.text.fontSize,
        fontFamily: toolOptions.text.fontFamily,
        fill: toolOptions.text.fill,
        bold: toolOptions.text.bold,
        italic: toolOptions.text.italic,
        align: toolOptions.text.align,
      }
    );
    addLayer(textLayer);
  };

  const handleAddShape = () => {
    if (!document) return;
    const shapeLayer = LayerFactory.createShapeLayer(
      toolOptions.shape.shapeType,
      Math.round(document.width / 4),
      Math.round(document.height / 4),
      Math.round(document.width / 3),
      Math.round(document.height / 3),
      {
        fill: toolOptions.shape.fill,
        stroke: toolOptions.shape.stroke,
        strokeWidth: toolOptions.shape.strokeWidth,
      }
    );
    addLayer(shapeLayer);
  };

  return (
    <div className="h-9 bg-[#202026] border-b border-[#2f2f38] px-3 flex items-center gap-4 text-xs select-none z-10 overflow-x-auto shrink-0">
      {/* Move Tool Options */}
      {activeTool === 'move' && (
        <div className="flex items-center gap-2 text-editor-muted text-[11px]">
          <span>Move Tool:</span>
          <span className="text-editor-dim">Drag on canvas to position selected layer</span>
        </div>
      )}

      {/* Brush Options */}
      {activeTool === 'brush' && (
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-editor-muted">Size:</span>
            <input
              type="range"
              min={1}
              max={200}
              value={toolOptions.brush.size}
              onChange={(e) => updateToolOptions('brush', { size: Number(e.target.value) })}
              className="w-24 h-1.5 bg-[#363640] rounded accent-editor-accent cursor-pointer"
            />
            <span className="font-mono text-editor-text w-8">{toolOptions.brush.size}px</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-editor-muted">Opacity:</span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={toolOptions.brush.opacity}
              onChange={(e) => updateToolOptions('brush', { opacity: Number(e.target.value) })}
              className="w-20 h-1.5 bg-[#363640] rounded accent-editor-accent cursor-pointer"
            />
            <span className="font-mono text-editor-text w-8">
              {Math.round(toolOptions.brush.opacity * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-editor-muted">Hardness:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={toolOptions.brush.hardness}
              onChange={(e) => updateToolOptions('brush', { hardness: Number(e.target.value) })}
              className="w-20 h-1.5 bg-[#363640] rounded accent-editor-accent cursor-pointer"
            />
            <span className="font-mono text-editor-text w-8">
              {Math.round(toolOptions.brush.hardness * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Pencil Options */}
      {activeTool === 'pencil' && (
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-editor-muted">Size:</span>
            <input
              type="range"
              min={1}
              max={50}
              value={toolOptions.pencil.size}
              onChange={(e) => updateToolOptions('pencil', { size: Number(e.target.value) })}
              className="w-24 h-1.5 bg-[#363640] rounded accent-editor-accent cursor-pointer"
            />
            <span className="font-mono text-editor-text w-8">{toolOptions.pencil.size}px</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-editor-muted">Opacity:</span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={toolOptions.pencil.opacity}
              onChange={(e) => updateToolOptions('pencil', { opacity: Number(e.target.value) })}
              className="w-20 h-1.5 bg-[#363640] rounded accent-editor-accent cursor-pointer"
            />
            <span className="font-mono text-editor-text w-8">
              {Math.round(toolOptions.pencil.opacity * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Eraser Options */}
      {activeTool === 'eraser' && (
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-editor-muted">Size:</span>
            <input
              type="range"
              min={1}
              max={250}
              value={toolOptions.eraser.size}
              onChange={(e) => updateToolOptions('eraser', { size: Number(e.target.value) })}
              className="w-24 h-1.5 bg-[#363640] rounded accent-editor-accent cursor-pointer"
            />
            <span className="font-mono text-editor-text w-8">{toolOptions.eraser.size}px</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-editor-muted">Opacity:</span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={toolOptions.eraser.opacity}
              onChange={(e) => updateToolOptions('eraser', { opacity: Number(e.target.value) })}
              className="w-20 h-1.5 bg-[#363640] rounded accent-editor-accent cursor-pointer"
            />
            <span className="font-mono text-editor-text w-8">
              {Math.round(toolOptions.eraser.opacity * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-editor-muted">Hardness:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={toolOptions.eraser.hardness}
              onChange={(e) => updateToolOptions('eraser', { hardness: Number(e.target.value) })}
              className="w-20 h-1.5 bg-[#363640] rounded accent-editor-accent cursor-pointer"
            />
            <span className="font-mono text-editor-text w-8">
              {Math.round(toolOptions.eraser.hardness * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Selection Options */}
      {(activeTool === 'select-rect' || activeTool === 'select-ellipse') && (
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-editor-muted">Mode:</span>
          <div className="flex items-center bg-[#282830] rounded p-0.5 border border-[#383842]">
            {(['replace', 'add', 'subtract'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => updateToolOptions('selection', { mode })}
                className={`px-2 py-0.5 rounded capitalize text-[10px] ${
                  toolOptions.selection.mode === mode
                    ? 'bg-editor-accent text-white font-medium'
                    : 'text-editor-muted hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {document?.selection?.active && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelection(null)}
              className="h-6 text-[11px]"
            >
              Deselect (Ctrl+D)
            </Button>
          )}
        </div>
      )}

      {/* Crop Options */}
      {activeTool === 'crop' && (
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-editor-muted">Aspect Ratio:</span>
          <select
            value={toolOptions.crop.aspectRatio}
            onChange={(e) =>
              updateToolOptions('crop', {
                aspectRatio: e.target.value as 'free' | '1:1' | '16:9' | '4:3' | '3:2',
              })
            }
            className="bg-[#282830] text-editor-text border border-[#383842] rounded px-2 py-0.5 text-xs"
          >
            <option value="free">Freeform</option>
            <option value="1:1">1:1 Square</option>
            <option value="16:9">16:9 Landscape</option>
            <option value="4:3">4:3 Standard</option>
            <option value="3:2">3:2 Photo</option>
          </select>
          <span className="text-editor-dim">Drag on canvas to define crop region</span>
        </div>
      )}

      {/* Text Options */}
      {activeTool === 'text' && (
        <div className="flex items-center gap-3 text-[11px]">
          <Button variant="primary" size="sm" onClick={handleAddText} className="h-6">
            <Plus size={12} />
            <span>Add Text</span>
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-editor-muted">Font:</span>
            <select
              value={toolOptions.text.fontFamily}
              onChange={(e) => updateToolOptions('text', { fontFamily: e.target.value })}
              className="bg-[#282830] text-editor-text border border-[#383842] rounded px-2 py-0.5 text-xs"
            >
              <option value="Inter, sans-serif">Inter</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Courier New', monospace">Courier</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="Impact, sans-serif">Impact</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-editor-muted">Size:</span>
            <input
              type="number"
              min={8}
              max={300}
              value={toolOptions.text.fontSize}
              onChange={(e) => updateToolOptions('text', { fontSize: Number(e.target.value) })}
              className="w-14 bg-[#282830] text-editor-text border border-[#383842] rounded px-1.5 py-0.5 text-xs font-mono"
            />
          </div>

          <div className="flex items-center bg-[#282830] rounded border border-[#383842] p-0.5">
            <button
              onClick={() => updateToolOptions('text', { bold: !toolOptions.text.bold })}
              className={`p-1 rounded ${
                toolOptions.text.bold ? 'bg-editor-accent text-white' : 'text-editor-muted'
              }`}
              title="Bold"
            >
              <Bold size={12} />
            </button>
            <button
              onClick={() => updateToolOptions('text', { italic: !toolOptions.text.italic })}
              className={`p-1 rounded ${
                toolOptions.text.italic ? 'bg-editor-accent text-white' : 'text-editor-muted'
              }`}
              title="Italic"
            >
              <Italic size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Shape Options */}
      {activeTool === 'shape-rect' && (
        <div className="flex items-center gap-3 text-[11px]">
          <Button variant="primary" size="sm" onClick={handleAddShape} className="h-6">
            <Plus size={12} />
            <span>Add Shape</span>
          </Button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => updateToolOptions('shape', { shapeType: 'rectangle' })}
              className={`p-1 rounded ${
                toolOptions.shape.shapeType === 'rectangle'
                  ? 'bg-editor-accent text-white'
                  : 'text-editor-muted'
              }`}
              title="Rectangle"
            >
              <Square size={13} />
            </button>
            <button
              onClick={() => updateToolOptions('shape', { shapeType: 'ellipse' })}
              className={`p-1 rounded ${
                toolOptions.shape.shapeType === 'ellipse'
                  ? 'bg-editor-accent text-white'
                  : 'text-editor-muted'
              }`}
              title="Ellipse"
            >
              <Circle size={13} />
            </button>
            <button
              onClick={() => updateToolOptions('shape', { shapeType: 'line' })}
              className={`p-1 rounded ${
                toolOptions.shape.shapeType === 'line'
                  ? 'bg-editor-accent text-white'
                  : 'text-editor-muted'
              }`}
              title="Line"
            >
              <Minus size={13} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-editor-muted">Stroke:</span>
            <input
              type="number"
              min={0}
              max={50}
              value={toolOptions.shape.strokeWidth}
              onChange={(e) => updateToolOptions('shape', { strokeWidth: Number(e.target.value) })}
              className="w-12 bg-[#282830] text-editor-text border border-[#383842] rounded px-1.5 py-0.5 text-xs font-mono"
            />
          </div>
        </div>
      )}

      {/* Eyedropper Options */}
      {activeTool === 'eyedropper' && (
        <div className="flex items-center gap-2 text-editor-muted text-[11px]">
          <span>Eyedropper Tool:</span>
          <span className="text-editor-dim">Click anywhere on the image to sample color</span>
        </div>
      )}

      {/* Zoom Options */}
      {activeTool === 'zoom' && (
        <div className="flex items-center gap-3 text-[11px]">
          <Button variant="secondary" size="sm" onClick={() => setZoom(1)} className="h-6">
            100% Actual Size
          </Button>
          <Button variant="secondary" size="sm" onClick={resetViewport} className="h-6">
            Reset View
          </Button>
          <span className="text-editor-dim">Hold Alt key while clicking to zoom out</span>
        </div>
      )}

      {/* Hand Options */}
      {activeTool === 'hand' && (
        <div className="flex items-center gap-2 text-editor-muted text-[11px]">
          <span>Hand Tool:</span>
          <span className="text-editor-dim">Click and drag to pan across the workspace</span>
        </div>
      )}
    </div>
  );
};
