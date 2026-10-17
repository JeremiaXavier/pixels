import React, { useState, useRef, useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';
import { historyManager } from '@/history/HistoryManager';
import { ProjectSerializer } from '@/document/ProjectSerializer';
import { SelectionManager } from '@/document/Selection';
import { indexedDBStorage } from '@/storage/IndexedDBStorage';
import { DocumentManager } from '@/document/Document';

export const MenuBar: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const {
    document,
    createNewDocument,
    openDocument,
    closeDocument,
    addLayer,
    removeLayer,
    duplicateLayer,
    mergeDown,
    flattenImage,
    setSelection,
    rotateDocument,
    flipDocument,
    setSaveStatus,
  } = useDocumentStore();

  const {
    setNewDocOpen,
    setExportOpen,
    setImageSizeOpen,
    setCanvasSizeOpen,
    openFilterDialog,
    setShortcutsOpen,
    setAboutOpen,
    setZoom,
    resetViewport,
    viewport,
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save project (.pixels)
  const handleSaveProject = async () => {
    if (!document) return;
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
    } catch (err) {
      console.error('Failed to save project:', err);
      setSaveStatus('unsaved');
    }
  };

  // Open Image
  const handleOpenImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const newDoc = DocumentManager.createFromImage(img, file.name);
      openDocument(newDoc);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    e.target.value = '';
  };

  // Open .pixels project
  const handleOpenProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const doc = await ProjectSerializer.importProjectBlob(file);
      openDocument(doc);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to open project file');
    }
    e.target.value = '';
  };

  const handleSelectAll = () => {
    if (!document) return;
    setSelection(SelectionManager.selectAll(document.width, document.height));
  };

  const handleDeselect = () => {
    setSelection(null);
  };

  const handleInvertSelection = () => {
    if (!document) return;
    setSelection(SelectionManager.invert(document.selection, document.width, document.height));
  };

  const menuItems = [
    {
      id: 'file',
      label: 'File',
      children: [
        { label: 'New Document...', shortcut: 'Ctrl+N', action: () => setNewDocOpen(true) },
        {
          label: 'Open Image...',
          shortcut: 'Ctrl+O',
          action: () => fileInputRef.current?.click(),
        },
        {
          label: 'Open Pixels Project...',
          action: () => projectInputRef.current?.click(),
        },
        { type: 'separator' },
        {
          label: 'Save Project (.pixels)',
          shortcut: 'Ctrl+S',
          disabled: !document,
          action: handleSaveProject,
        },
        {
          label: 'Export Image...',
          shortcut: 'Ctrl+Shift+E',
          disabled: !document,
          action: () => setExportOpen(true),
        },
        { type: 'separator' },
        {
          label: 'Close Document',
          disabled: !document,
          action: closeDocument,
        },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      children: [
        {
          label: 'Undo',
          shortcut: 'Ctrl+Z',
          disabled: !historyManager.canUndo(),
          action: () => historyManager.undo(),
        },
        {
          label: 'Redo',
          shortcut: 'Ctrl+Y',
          disabled: !historyManager.canRedo(),
          action: () => historyManager.redo(),
        },
        { type: 'separator' },
        {
          label: 'Select All',
          shortcut: 'Ctrl+A',
          disabled: !document,
          action: handleSelectAll,
        },
        {
          label: 'Deselect',
          shortcut: 'Ctrl+D',
          disabled: !document || !document.selection?.active,
          action: handleDeselect,
        },
        { type: 'separator' },
        {
          label: 'Keyboard Shortcuts',
          shortcut: '?',
          action: () => setShortcutsOpen(true),
        },
      ],
    },
    {
      id: 'image',
      label: 'Image',
      children: [
        {
          label: 'Image Size...',
          disabled: !document,
          action: () => setImageSizeOpen(true),
        },
        {
          label: 'Canvas Size...',
          disabled: !document,
          action: () => setCanvasSizeOpen(true),
        },
        { type: 'separator' },
        {
          label: 'Rotate 90° Clockwise',
          disabled: !document,
          action: () => rotateDocument(90),
        },
        {
          label: 'Rotate 90° Counter-Clockwise',
          disabled: !document,
          action: () => rotateDocument(-90),
        },
        {
          label: 'Rotate 180°',
          disabled: !document,
          action: () => rotateDocument(180),
        },
        { type: 'separator' },
        {
          label: 'Flip Horizontal',
          disabled: !document,
          action: () => flipDocument('horizontal'),
        },
        {
          label: 'Flip Vertical',
          disabled: !document,
          action: () => flipDocument('vertical'),
        },
      ],
    },
    {
      id: 'layer',
      label: 'Layer',
      children: [
        {
          label: 'New Layer',
          shortcut: 'Ctrl+Shift+N',
          disabled: !document,
          action: () => addLayer(),
        },
        {
          label: 'Duplicate Layer',
          shortcut: 'Ctrl+J',
          disabled: !document || !document.activeLayerId,
          action: () => document?.activeLayerId && duplicateLayer(document.activeLayerId),
        },
        {
          label: 'Delete Layer',
          disabled: !document || !document.activeLayerId || document.layers.length <= 1,
          action: () => document?.activeLayerId && removeLayer(document.activeLayerId),
        },
        { type: 'separator' },
        {
          label: 'Merge Down',
          shortcut: 'Ctrl+E',
          disabled:
            !document ||
            !document.activeLayerId ||
            document.layers.findIndex((l) => l.id === document.activeLayerId) <= 0,
          action: () => document?.activeLayerId && mergeDown(document.activeLayerId),
        },
        {
          label: 'Flatten Image',
          disabled: !document || document.layers.length <= 1,
          action: flattenImage,
        },
      ],
    },
    {
      id: 'select',
      label: 'Select',
      children: [
        {
          label: 'Select All',
          shortcut: 'Ctrl+A',
          disabled: !document,
          action: handleSelectAll,
        },
        {
          label: 'Deselect',
          shortcut: 'Ctrl+D',
          disabled: !document || !document.selection?.active,
          action: handleDeselect,
        },
        {
          label: 'Invert Selection',
          shortcut: 'Ctrl+Shift+I',
          disabled: !document,
          action: handleInvertSelection,
        },
      ],
    },
    {
      id: 'filter',
      label: 'Filter',
      children: [
        {
          label: 'Color Adjustments...',
          disabled: !document,
          action: () => openFilterDialog('colorAdjustments'),
        },
        {
          label: 'Levels...',
          disabled: !document,
          action: () => openFilterDialog('levels'),
        },
        {
          label: 'Color Balance...',
          disabled: !document,
          action: () => openFilterDialog('colorBalance'),
        },
        { type: 'separator' },
        {
          label: 'Gaussian Blur...',
          disabled: !document,
          action: () => openFilterDialog('gaussianBlur'),
        },
        {
          label: 'Sharpen...',
          disabled: !document,
          action: () => openFilterDialog('sharpen'),
        },
        {
          label: 'Pixelate...',
          disabled: !document,
          action: () => openFilterDialog('pixelate'),
        },
        {
          label: 'Noise...',
          disabled: !document,
          action: () => openFilterDialog('noise'),
        },
        {
          label: 'Edge Detection',
          disabled: !document,
          action: () => openFilterDialog('edgeDetection'),
        },
      ],
    },
    {
      id: 'view',
      label: 'View',
      children: [
        {
          label: 'Zoom In',
          shortcut: 'Ctrl++',
          disabled: !document,
          action: () => setZoom(viewport.zoom * 1.25),
        },
        {
          label: 'Zoom Out',
          shortcut: 'Ctrl+-',
          disabled: !document,
          action: () => setZoom(viewport.zoom / 1.25),
        },
        {
          label: '100% (Actual Size)',
          shortcut: 'Ctrl+1',
          disabled: !document,
          action: () => setZoom(1),
        },
        {
          label: 'Reset Viewport',
          disabled: !document,
          action: resetViewport,
        },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      children: [
        {
          label: 'Keyboard Shortcuts',
          action: () => setShortcutsOpen(true),
        },
        {
          label: 'About Pixels',
          action: () => setAboutOpen(true),
        },
      ],
    },
  ];

  return (
    <div
      ref={menuBarRef}
      className="h-7 bg-[#1c1c20] border-b border-[#2d2d34] px-2 flex items-center text-xs select-none z-30"
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleOpenImage}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={projectInputRef}
        onChange={handleOpenProject}
        accept=".pixels,application/zip"
        className="hidden"
      />

      <nav className="flex items-center gap-0.5">
        {menuItems.map((menu) => (
          <div key={menu.id} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
              onMouseEnter={() => {
                if (openMenu) setOpenMenu(menu.id);
              }}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                openMenu === menu.id
                  ? 'bg-editor-accent text-white'
                  : 'text-editor-muted hover:text-white hover:bg-[#2c2c34]'
              }`}
            >
              {menu.label}
            </button>

            {openMenu === menu.id && (
              <div className="absolute top-full left-0 mt-0.5 min-w-[210px] bg-[#222228] border border-[#3e3e4a] rounded shadow-2xl py-1 z-50 text-[11px]">
                {menu.children.map((item, index) => {
                  if (item.type === 'separator') {
                    return <div key={index} className="h-px bg-[#32323c] my-1" />;
                  }

                  return (
                    <button
                      key={index}
                      disabled={item.disabled}
                      onClick={() => {
                        setOpenMenu(null);
                        item.action?.();
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-left text-editor-text hover:bg-editor-accent hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="text-[10px] text-editor-dim font-mono ml-4">
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};
