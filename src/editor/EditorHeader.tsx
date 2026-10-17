import React from 'react';
import {
  Undo2,
  Redo2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Keyboard,
  HelpCircle,
  FileImage,
} from 'lucide-react';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';
import { historyManager } from '@/history/HistoryManager';
import { Button } from '@/components/ui/Button';

export const EditorHeader: React.FC = () => {
  const document = useDocumentStore((state) => state.document);
  const saveStatus = useDocumentStore((state) => state.saveStatus);
  const { viewport, setZoom, setExportOpen, setShortcutsOpen, setAboutOpen } = useEditorStore();

  const [canUndo, setCanUndo] = React.useState(historyManager.canUndo());
  const [canRedo, setCanRedo] = React.useState(historyManager.canRedo());

  React.useEffect(() => {
    return historyManager.subscribe(() => {
      setCanUndo(historyManager.canUndo());
      setCanRedo(historyManager.canRedo());
    });
  }, []);

  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <header className="h-10 bg-editor-header border-b border-editor-border px-3 flex items-center justify-between select-none shrink-0 z-30">
      {/* Brand & Document Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-editor-accent flex items-center justify-center font-black text-[11px] text-white tracking-tighter">
            Px
          </div>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
            Pixels
          </span>
        </div>

        {document && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#33333d]">
            <FileImage size={14} className="text-editor-muted" />
            <span className="text-xs font-medium text-editor-text truncate max-w-[180px]">
              {document.name}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                saveStatus === 'saved'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : saveStatus === 'saving'
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
            </span>
          </div>
        )}
      </div>

      {/* Undo / Redo & Zoom Controls */}
      {document && (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-[#25252c] rounded border border-[#353540] p-0.5">
            <button
              onClick={() => historyManager.undo()}
              disabled={!canUndo}
              className="p-1 rounded text-editor-muted hover:text-white disabled:opacity-30 disabled:hover:text-editor-muted transition-colors"
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={() => historyManager.redo()}
              disabled={!canRedo}
              className="p-1 rounded text-editor-muted hover:text-white disabled:opacity-30 disabled:hover:text-editor-muted transition-colors"
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <Redo2 size={14} />
            </button>
          </div>

          <div className="h-4 w-px bg-[#353540] mx-1" />

          {/* Zoom */}
          <div className="flex items-center bg-[#25252c] rounded border border-[#353540] px-1.5 py-0.5 gap-1">
            <button
              onClick={() => setZoom(viewport.zoom / 1.25)}
              className="p-0.5 text-editor-muted hover:text-white transition-colors"
              title="Zoom Out (Ctrl+-)"
              aria-label="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="text-[11px] font-mono text-editor-text hover:text-white px-1"
              title="Reset Zoom to 100%"
            >
              {zoomPercent}%
            </button>
            <button
              onClick={() => setZoom(viewport.zoom * 1.25)}
              className="p-0.5 text-editor-muted hover:text-white transition-colors"
              title="Zoom In (Ctrl++)"
              aria-label="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Export & Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShortcutsOpen(true)}
          className="p-1.5 rounded text-editor-muted hover:text-white hover:bg-[#282830] transition-colors"
          title="Keyboard Shortcuts"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard size={15} />
        </button>

        {document && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setExportOpen(true)}
            className="font-semibold shadow-xs"
          >
            <Download size={13} />
            <span>Export</span>
          </Button>
        )}
      </div>
    </header>
  );
};
