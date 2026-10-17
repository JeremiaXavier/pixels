import React, { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { ExportManager } from '@/export/ExportManager';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { Download, AlertCircle } from 'lucide-react';

export const ExportDialog: React.FC = () => {
  const { isExportOpen, setExportOpen } = useEditorStore();
  const document = useDocumentStore((state) => state.document);

  const [filename, setFilename] = useState(
    document ? document.name.replace(/\.[^/.]+$/, '') : 'export'
  );
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  if (!document) return null;

  const targetWidth = Math.round(document.width * scale);
  const targetHeight = Math.round(document.height * scale);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';
      const fullFilename = `${filename.trim() || 'export'}.${ext}`;

      const blob = await ExportManager.generateExportBlob(document, {
        filename: fullFilename,
        format,
        quality,
        width: targetWidth,
        height: targetHeight,
        backgroundColorForOpaque: '#ffffff',
      });

      ExportManager.downloadBlob(blob, fullFilename);
      setExportOpen(false);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export image: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isExportOpen}
      onClose={() => setExportOpen(false)}
      title="Export Image"
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 text-xs">
        <Input
          label="Filename"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
        />

        {/* Format Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-editor-muted">Format</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'PNG (Lossless)', value: 'image/png', desc: 'Preserves transparency' },
              { label: 'JPEG (Photo)', value: 'image/jpeg', desc: 'Smaller file, white BG' },
              { label: 'WebP (Modern)', value: 'image/webp', desc: 'High compression & alpha' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value as any)}
                className={`p-2.5 rounded text-left border transition-colors ${
                  format === f.value
                    ? 'bg-editor-accent/15 border-editor-accent text-white'
                    : 'bg-[#1e1e24] border-[#30303a] hover:bg-[#282832] text-editor-muted'
                }`}
              >
                <div className="font-semibold text-xs text-white">{f.label}</div>
                <div className="text-[10px] text-editor-dim mt-0.5">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality Slider (for JPEG / WebP) */}
        {format !== 'image/png' && (
          <Slider
            label="Quality"
            min={10}
            max={100}
            unit="%"
            value={Math.round(quality * 100)}
            onChange={(val) => setQuality(val / 100)}
          />
        )}

        {/* Scale & Dimensions */}
        <div className="flex flex-col gap-1.5 bg-[#1e1e24] p-3 rounded border border-[#30303a]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-editor-muted">Scale:</span>
            <span className="font-mono text-editor-text">{Math.round(scale * 100)}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[0.25, 0.5, 0.75, 1, 1.5, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                className={`flex-1 py-1 rounded text-[10px] font-mono border ${
                  scale === s
                    ? 'bg-editor-accent border-editor-accent text-white'
                    : 'bg-[#282832] border-[#383844] text-editor-muted hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 text-[11px] text-editor-dim border-t border-[#2a2a34] mt-1">
            <span>Export Dimensions:</span>
            <span className="font-mono text-editor-text">
              {targetWidth} × {targetHeight} px
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#30303a]">
          <Button variant="secondary" onClick={() => setExportOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-1.5 font-semibold"
          >
            <Download size={13} />
            <span>{isExporting ? 'Exporting...' : 'Download Image'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
