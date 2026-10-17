import React, { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Preset {
  name: string;
  width: number;
  height: number;
}

const PRESETS: Preset[] = [
  { name: 'Full HD 1080p', width: 1920, height: 1080 },
  { name: 'HD 720p', width: 1280, height: 720 },
  { name: 'Instagram Square', width: 1080, height: 1080 },
  { name: 'Social Banner', width: 1200, height: 630 },
  { name: 'Standard 4:3', width: 1024, height: 768 },
  { name: '4K UHD', width: 3840, height: 2160 },
];

export const NewDocumentDialog: React.FC = () => {
  const { isNewDocOpen, setNewDocOpen } = useEditorStore();
  const { createNewDocument } = useDocumentStore();

  const [name, setName] = useState('Untitled');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [bgColorType, setBgColorType] = useState<'white' | 'transparent' | 'black' | 'custom'>(
    'white'
  );
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
  const [error, setError] = useState<string | null>(null);

  const handleApplyPreset = (preset: Preset) => {
    setWidth(preset.width);
    setHeight(preset.height);
  };

  const handleCreate = () => {
    if (width <= 0 || height <= 0) {
      setError('Dimensions must be greater than zero.');
      return;
    }
    if (width > 8192 || height > 8192) {
      setError('Dimensions exceed the safe maximum limit of 8,192 px.');
      return;
    }

    let resolvedBg = '#ffffff';
    if (bgColorType === 'transparent') resolvedBg = 'transparent';
    else if (bgColorType === 'black') resolvedBg = '#000000';
    else if (bgColorType === 'custom') resolvedBg = customBgColor;

    createNewDocument(name.trim() || 'Untitled', width, height, resolvedBg);
    setNewDocOpen(false);
    setError(null);
  };

  return (
    <Modal
      isOpen={isNewDocOpen}
      onClose={() => setNewDocOpen(false)}
      title="Create New Document"
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 text-xs">
        {error && (
          <div className="p-2 rounded bg-red-950/60 border border-red-800/40 text-red-300">
            {error}
          </div>
        )}

        <Input
          label="Document Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Untitled"
        />

        {/* Presets */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-editor-muted">Presets</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`p-2 rounded text-left border transition-colors ${
                  width === p.width && height === p.height
                    ? 'bg-editor-accent/15 border-editor-accent text-white'
                    : 'bg-[#1e1e24] border-[#30303a] hover:bg-[#282832] text-editor-muted'
                }`}
              >
                <div className="font-medium text-[11px] truncate">{p.name}</div>
                <div className="text-[10px] text-editor-dim font-mono">
                  {p.width} × {p.height}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Dimensions */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Width (px)"
            type="number"
            min={1}
            max={8192}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
          <Input
            label="Height (px)"
            type="number"
            min={1}
            max={8192}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </div>

        {/* Background Color */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-editor-muted">Background</label>
          <div className="flex items-center gap-2">
            {(['white', 'transparent', 'black', 'custom'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBgColorType(type)}
                className={`px-3 py-1.5 rounded capitalize text-[11px] border transition-colors ${
                  bgColorType === type
                    ? 'bg-editor-accent border-editor-accent text-white font-medium'
                    : 'bg-[#1e1e24] border-[#30303a] text-editor-muted hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}

            {bgColorType === 'custom' && (
              <input
                type="color"
                value={customBgColor}
                onChange={(e) => setCustomBgColor(e.target.value)}
                className="w-7 h-7 rounded border border-[#3e3e4a] cursor-pointer bg-transparent"
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#30303a]">
          <Button variant="secondary" onClick={() => setNewDocOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            Create Document
          </Button>
        </div>
      </div>
    </Modal>
  );
};
