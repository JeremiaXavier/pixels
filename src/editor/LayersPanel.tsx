import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  Layers as LayersIcon,
  Type,
  Square,
  ArrowUp,
  ArrowDown,
  Merge,
} from 'lucide-react';
import { useDocumentStore } from '@/store/documentStore';
import { BlendMode, Layer } from '@/types';
import { Slider } from '@/components/ui/Slider';

export const LayersPanel: React.FC = () => {
  const {
    document,
    setActiveLayer,
    addLayer,
    removeLayer,
    duplicateLayer,
    reorderLayers,
    updateLayer,
    mergeDown,
  } = useDocumentStore();

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!document) return null;

  const activeLayer = document.layers.find((l) => l.id === document.activeLayerId);
  const activeIndex = document.layers.findIndex((l) => l.id === document.activeLayerId);

  // Layers displayed in reverse order so top-most layer is at top of UI list
  const displayLayers = [...document.layers].reverse();

  const handleStartRename = (layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const handleSaveRename = (layerId: string) => {
    if (editingName.trim()) {
      updateLayer(layerId, { name: editingName.trim() }, true, 'Rename Layer');
    }
    setEditingLayerId(null);
  };

  const blendModes: { label: string; value: BlendMode }[] = [
    { label: 'Normal', value: 'source-over' },
    { label: 'Multiply', value: 'multiply' },
    { label: 'Screen', value: 'screen' },
    { label: 'Overlay', value: 'overlay' },
    { label: 'Darken', value: 'darken' },
    { label: 'Lighten', value: 'lighten' },
    { label: 'Color Dodge', value: 'color-dodge' },
    { label: 'Color Burn', value: 'color-burn' },
    { label: 'Hard Light', value: 'hard-light' },
    { label: 'Soft Light', value: 'soft-light' },
    { label: 'Difference', value: 'difference' },
    { label: 'Exclusion', value: 'exclusion' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1c1c20] text-editor-text select-none text-xs">
      {/* Blend Mode & Opacity Controls */}
      <div className="p-2.5 bg-[#202026] border-b border-[#2d2d34] flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-editor-muted">Blend:</span>
          <select
            value={activeLayer?.blendMode || 'source-over'}
            disabled={!activeLayer}
            onChange={(e) =>
              activeLayer &&
              updateLayer(activeLayer.id, { blendMode: e.target.value as BlendMode }, true, 'Change Blend Mode')
            }
            className="flex-1 bg-[#282832] text-editor-text border border-[#3a3a46] rounded px-2 py-1 text-xs focus:outline-none focus:border-editor-accent"
          >
            {blendModes.map((bm) => (
              <option key={bm.value} value={bm.value}>
                {bm.label}
              </option>
            ))}
          </select>
        </div>

        {/* Opacity Slider */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-editor-muted">Opacity:</span>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((activeLayer?.opacity ?? 1) * 100)}
              disabled={!activeLayer}
              onChange={(e) =>
                activeLayer &&
                updateLayer(activeLayer.id, { opacity: Number(e.target.value) / 100 })
              }
              className="flex-1 h-1.5 bg-[#363642] rounded accent-editor-accent cursor-pointer"
            />
            <span className="font-mono text-[11px] w-9 text-right">
              {Math.round((activeLayer?.opacity ?? 1) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1">
        {displayLayers.map((layer) => {
          const isActive = layer.id === document.activeLayerId;
          const actualIndex = document.layers.findIndex((l) => l.id === layer.id);

          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors group cursor-pointer border ${
                isActive
                  ? 'bg-[#2b2b36] border-editor-accent text-white shadow-xs'
                  : 'bg-[#22222a] border-[#2e2e38] text-editor-muted hover:bg-[#282832] hover:text-editor-text'
              }`}
            >
              {/* Visibility Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateLayer(layer.id, { visible: !layer.visible }, true, 'Toggle Visibility');
                }}
                className={`p-1 rounded transition-colors ${
                  layer.visible
                    ? 'text-editor-text hover:text-white'
                    : 'text-editor-dim opacity-50 hover:opacity-100'
                }`}
                title={layer.visible ? 'Hide Layer' : 'Show Layer'}
              >
                {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>

              {/* Lock Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateLayer(layer.id, { locked: !layer.locked }, true, 'Toggle Lock');
                }}
                className={`p-1 rounded transition-colors ${
                  layer.locked
                    ? 'text-amber-400'
                    : 'text-editor-dim opacity-0 group-hover:opacity-100'
                }`}
                title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
              >
                {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>

              {/* Layer Icon */}
              <div className="text-editor-dim">
                {layer.type === 'raster' && <LayersIcon size={13} />}
                {layer.type === 'text' && <Type size={13} />}
                {layer.type === 'shape' && <Square size={13} />}
              </div>

              {/* Layer Name / Inline Rename */}
              <div className="flex-1 min-w-0" onDoubleClick={() => handleStartRename(layer)}>
                {editingLayerId === layer.id ? (
                  <input
                    type="text"
                    value={editingName}
                    autoFocus
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleSaveRename(layer.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(layer.id);
                      if (e.key === 'Escape') setEditingLayerId(null);
                    }}
                    className="w-full bg-[#18181e] px-1.5 py-0.5 text-xs text-white rounded border border-editor-accent focus:outline-none"
                  />
                ) : (
                  <span className="truncate block text-xs font-medium">{layer.name}</span>
                )}
              </div>

              {/* Layer Reorder Arrows */}
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  disabled={actualIndex >= document.layers.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    reorderLayers(actualIndex, actualIndex + 1);
                  }}
                  className="p-0.5 hover:text-white disabled:opacity-20"
                  title="Move Up"
                >
                  <ArrowUp size={11} />
                </button>
                <button
                  disabled={actualIndex <= 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    reorderLayers(actualIndex, actualIndex - 1);
                  }}
                  className="p-0.5 hover:text-white disabled:opacity-20"
                  title="Move Down"
                >
                  <ArrowDown size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Layer Actions Footer */}
      <div className="p-2 bg-[#202026] border-t border-[#2d2d34] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => addLayer()}
            className="p-1.5 rounded hover:bg-[#2e2e38] text-editor-muted hover:text-white transition-colors"
            title="New Layer (Ctrl+Shift+N)"
          >
            <Plus size={14} />
          </button>
          <button
            disabled={!activeLayer}
            onClick={() => activeLayer && duplicateLayer(activeLayer.id)}
            className="p-1.5 rounded hover:bg-[#2e2e38] text-editor-muted hover:text-white disabled:opacity-30 transition-colors"
            title="Duplicate Layer (Ctrl+J)"
          >
            <Copy size={13} />
          </button>
          <button
            disabled={!activeLayer || activeIndex <= 0}
            onClick={() => activeLayer && mergeDown(activeLayer.id)}
            className="p-1.5 rounded hover:bg-[#2e2e38] text-editor-muted hover:text-white disabled:opacity-30 transition-colors"
            title="Merge Down (Ctrl+E)"
          >
            <Merge size={13} />
          </button>
        </div>

        <button
          disabled={!activeLayer || document.layers.length <= 1}
          onClick={() => activeLayer && removeLayer(activeLayer.id)}
          className="p-1.5 rounded hover:bg-red-950/60 text-editor-muted hover:text-red-400 disabled:opacity-30 transition-colors"
          title="Delete Layer"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
