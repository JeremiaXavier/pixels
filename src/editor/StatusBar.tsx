import React from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';

export const StatusBar: React.FC = () => {
  const document = useDocumentStore((state) => state.document);
  const { activeTool, cursorCoordinates, viewport } = useEditorStore();

  const toolLabels: Record<string, string> = {
    move: 'Move Tool (V)',
    'select-rect': 'Rectangular Marquee (M)',
    'select-ellipse': 'Elliptical Marquee (Shift+M)',
    crop: 'Crop Tool (C)',
    brush: 'Brush Tool (B)',
    pencil: 'Pencil Tool (P)',
    eraser: 'Eraser Tool (E)',
    text: 'Text Tool (T)',
    'shape-rect': 'Rectangle Shape (U)',
    'shape-ellipse': 'Ellipse Shape (Shift+U)',
    'shape-line': 'Line Shape (L)',
    eyedropper: 'Eyedropper (I)',
    zoom: 'Zoom Tool (Z)',
    hand: 'Hand Tool (H)',
  };

  return (
    <footer className="h-6 bg-[#16161a] border-t border-editor-border px-3 flex items-center justify-between text-[11px] text-editor-dim font-mono select-none z-30 shrink-0">
      {/* Left: Active Tool */}
      <div className="flex items-center gap-2">
        <span className="text-editor-muted">{toolLabels[activeTool] || activeTool}</span>
      </div>

      {/* Right: Document dimensions, Zoom %, Cursor */}
      {document ? (
        <div className="flex items-center gap-4">
          {document.selection?.active && (
            <span className="text-editor-accent">
              Sel: {Math.round(document.selection.width)} × {Math.round(document.selection.height)} px
            </span>
          )}

          <span>
            Doc: {document.width} × {document.height} px
          </span>

          <span>
            X: {cursorCoordinates.x} Y: {cursorCoordinates.y}
          </span>

          <span className="text-editor-text">
            {Math.round(viewport.zoom * 100)}%
          </span>
        </div>
      ) : (
        <span>No document open</span>
      )}
    </footer>
  );
};
