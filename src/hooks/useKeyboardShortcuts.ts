import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { historyManager } from '@/history/HistoryManager';
import { SelectionManager } from '@/document/Selection';
import { ProjectSerializer } from '@/document/ProjectSerializer';
import { indexedDBStorage } from '@/storage/IndexedDBStorage';

export function useKeyboardShortcuts() {
  const {
    document,
    addLayer,
    removeLayer,
    duplicateLayer,
    mergeDown,
    setSelection,
    setSaveStatus,
  } = useDocumentStore();

  const {
    setActiveTool,
    setNewDocOpen,
    setExportOpen,
    setShortcutsOpen,
    swapColors,
    resetDefaultColors,
    setZoom,
    viewport,
  } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      // Single-key tool accelerators (when not holding Ctrl)
      if (!isCtrl && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            e.preventDefault();
            setActiveTool('move');
            return;
          case 'm':
            e.preventDefault();
            setActiveTool(e.shiftKey ? 'select-ellipse' : 'select-rect');
            return;
          case 'b':
            e.preventDefault();
            setActiveTool('brush');
            return;
          case 'p':
            e.preventDefault();
            setActiveTool('pencil');
            return;
          case 'e':
            e.preventDefault();
            setActiveTool('eraser');
            return;
          case 'c':
            e.preventDefault();
            setActiveTool('crop');
            return;
          case 't':
            e.preventDefault();
            setActiveTool('text');
            return;
          case 'u':
            e.preventDefault();
            setActiveTool('shape-rect');
            return;
          case 'i':
            e.preventDefault();
            setActiveTool('eyedropper');
            return;
          case 'z':
            e.preventDefault();
            setActiveTool('zoom');
            return;
          case 'h':
            e.preventDefault();
            setActiveTool('hand');
            return;
          case 'x':
            e.preventDefault();
            swapColors();
            return;
          case 'd':
            e.preventDefault();
            resetDefaultColors();
            return;
          case '?':
            e.preventDefault();
            setShortcutsOpen(true);
            return;
          case 'delete':
          case 'backspace':
            if (document && document.activeLayerId && document.layers.length > 1) {
              e.preventDefault();
              removeLayer(document.activeLayerId);
            }
            return;
        }
      }

      // Ctrl shortcuts
      if (isCtrl) {
        // Undo: Ctrl+Z
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          historyManager.undo();
          return;
        }

        // Redo: Ctrl+Y or Ctrl+Shift+Z
        if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
          e.preventDefault();
          historyManager.redo();
          return;
        }

        // New Document: Ctrl+N
        if (e.key.toLowerCase() === 'n' && !e.shiftKey) {
          e.preventDefault();
          setNewDocOpen(true);
          return;
        }

        // New Layer: Ctrl+Shift+N
        if (e.key.toLowerCase() === 'n' && e.shiftKey && document) {
          e.preventDefault();
          addLayer();
          return;
        }

        // Duplicate Layer: Ctrl+J
        if (e.key.toLowerCase() === 'j' && document?.activeLayerId) {
          e.preventDefault();
          duplicateLayer(document.activeLayerId);
          return;
        }

        // Merge Down: Ctrl+E
        if (e.key.toLowerCase() === 'e' && !e.shiftKey && document?.activeLayerId) {
          e.preventDefault();
          mergeDown(document.activeLayerId);
          return;
        }

        // Export: Ctrl+Shift+E
        if (e.key.toLowerCase() === 'e' && e.shiftKey && document) {
          e.preventDefault();
          setExportOpen(true);
          return;
        }

        // Save: Ctrl+S
        if (e.key.toLowerCase() === 's' && document) {
          e.preventDefault();
          setSaveStatus('saving');
          try {
            const blob = await ProjectSerializer.exportProjectBlob(document);
            const url = URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = `${document.name.replace(/\.[^/.]+$/, '')}.pixels`;
            a.click();
            URL.revokeObjectURL(url);
            await indexedDBStorage.autosaveProject(document);
            setSaveStatus('saved');
          } catch {
            setSaveStatus('unsaved');
          }
          return;
        }

        // Select All: Ctrl+A
        if (e.key.toLowerCase() === 'a' && document) {
          e.preventDefault();
          setSelection(SelectionManager.selectAll(document.width, document.height));
          return;
        }

        // Deselect: Ctrl+D
        if (e.key.toLowerCase() === 'd' && document) {
          e.preventDefault();
          setSelection(null);
          return;
        }

        // Invert Selection: Ctrl+Shift+I
        if (e.key.toLowerCase() === 'i' && e.shiftKey && document) {
          e.preventDefault();
          setSelection(SelectionManager.invert(document.selection, document.width, document.height));
          return;
        }

        // Zoom In: Ctrl++ or Ctrl+=
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoom(viewport.zoom * 1.25);
          return;
        }

        // Zoom Out: Ctrl+-
        if (e.key === '-') {
          e.preventDefault();
          setZoom(viewport.zoom / 1.25);
          return;
        }

        // Actual Size: Ctrl+1
        if (e.key === '1') {
          e.preventDefault();
          setZoom(1);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [document, viewport, setActiveTool, setZoom, addLayer, duplicateLayer, mergeDown, removeLayer, setSelection, setNewDocOpen, setExportOpen, setShortcutsOpen, swapColors, resetDefaultColors, setSaveStatus]);
}
