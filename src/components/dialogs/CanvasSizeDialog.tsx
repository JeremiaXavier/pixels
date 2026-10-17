import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type AnchorPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export const CanvasSizeDialog: React.FC = () => {
  const { isCanvasSizeOpen, setCanvasSizeOpen } = useEditorStore();
  const { document, resizeCanvas } = useDocumentStore();

  const [width, setWidth] = useState(document?.width ?? 1920);
  const [height, setHeight] = useState(document?.height ?? 1080);
  const [anchor, setAnchor] = useState<AnchorPosition>('center');

  useEffect(() => {
    if (document) {
      setWidth(document.width);
      setHeight(document.height);
    }
  }, [document?.width, document?.height, isCanvasSizeOpen]);

  if (!document) return null;

  const handleApply = () => {
    if (width > 0 && height > 0) {
      resizeCanvas(width, height, anchor);
      setCanvasSizeOpen(false);
    }
  };

  const anchorGrid: { id: AnchorPosition; label: string }[][] = [
    [
      { id: 'top-left', label: '↖' },
      { id: 'top', label: '↑' },
      { id: 'top-right', label: '↗' },
    ],
    [
      { id: 'left', label: '←' },
      { id: 'center', label: '•' },
      { id: 'right', label: '→' },
    ],
    [
      { id: 'bottom-left', label: '↙' },
      { id: 'bottom', label: '↓' },
      { id: 'bottom-right', label: '↘' },
    ],
  ];

  return (
    <Modal
      isOpen={isCanvasSizeOpen}
      onClose={() => setCanvasSizeOpen(false)}
      title="Canvas Size"
      maxWidth="sm"
    >
      <div className="flex flex-col gap-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="New Width (px)"
            type="number"
            min={1}
            max={8192}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
          <Input
            label="New Height (px)"
            type="number"
            min={1}
            max={8192}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </div>

        {/* 3x3 Anchor Grid */}
        <div className="flex flex-col gap-1.5 items-center">
          <label className="text-[11px] font-medium text-editor-muted">Anchor Placement</label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#18181e] border border-[#30303c] rounded w-28 h-28">
            {anchorGrid.flat().map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setAnchor(item.id)}
                className={`rounded flex items-center justify-center font-bold text-sm transition-colors ${
                  anchor === item.id
                    ? 'bg-editor-accent text-white shadow-xs'
                    : 'bg-[#22222a] text-editor-muted hover:bg-[#2c2c36] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center text-[11px] text-editor-dim pt-2 border-t border-[#30303a]">
          <span>Current:</span>
          <span className="font-mono">
            {document.width} × {document.height} px
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#30303a]">
          <Button variant="secondary" onClick={() => setCanvasSizeOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
};
