import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link2, Unlink } from 'lucide-react';

export const ImageSizeDialog: React.FC = () => {
  const { isImageSizeOpen, setImageSizeOpen } = useEditorStore();
  const { document, resizeImage } = useDocumentStore();

  const [width, setWidth] = useState(document?.width ?? 1920);
  const [height, setHeight] = useState(document?.height ?? 1080);
  const [maintainAspect, setMaintainAspect] = useState(true);

  useEffect(() => {
    if (document) {
      setWidth(document.width);
      setHeight(document.height);
    }
  }, [document?.width, document?.height, isImageSizeOpen]);

  if (!document) return null;

  const originalAspect = document.width / document.height;

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (maintainAspect && val > 0) {
      setHeight(Math.round(val / originalAspect));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (maintainAspect && val > 0) {
      setWidth(Math.round(val * originalAspect));
    }
  };

  const handleApply = () => {
    if (width > 0 && height > 0) {
      resizeImage(width, height);
      setImageSizeOpen(false);
    }
  };

  return (
    <Modal
      isOpen={isImageSizeOpen}
      onClose={() => setImageSizeOpen(false)}
      title="Image Size"
      maxWidth="sm"
    >
      <div className="flex flex-col gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex flex-col gap-3">
            <Input
              label="Width (px)"
              type="number"
              min={1}
              max={8192}
              value={width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
            />
            <Input
              label="Height (px)"
              type="number"
              min={1}
              max={8192}
              value={height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
            />
          </div>

          <button
            type="button"
            onClick={() => setMaintainAspect(!maintainAspect)}
            className={`p-2 rounded border transition-colors self-center ${
              maintainAspect
                ? 'bg-editor-accent/15 border-editor-accent text-editor-accent'
                : 'bg-[#22222a] border-[#383844] text-editor-dim'
            }`}
            title={maintainAspect ? 'Constrain Proportions (On)' : 'Constrain Proportions (Off)'}
          >
            {maintainAspect ? <Link2 size={16} /> : <Unlink size={16} />}
          </button>
        </div>

        <div className="flex justify-between items-center text-[11px] text-editor-dim pt-2 border-t border-[#30303a]">
          <span>Original:</span>
          <span className="font-mono">
            {document.width} × {document.height} px
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#30303a]">
          <Button variant="secondary" onClick={() => setImageSizeOpen(false)}>
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
