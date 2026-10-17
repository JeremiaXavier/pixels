import { create } from 'zustand';
import { PixelsDocument, Layer, RasterLayer, SelectionRegion, BlendMode } from '@/types';
import { DocumentManager } from '@/document/Document';
import { LayerFactory } from '@/document/Layer';
import { historyManager } from '@/history/HistoryManager';
import { executeFilter, FilterParams } from '@/filters/FilterRegistry';
import { workerClient } from '@/workers/workerClient';

interface DocumentState {
  document: PixelsDocument | null;
  saveStatus: 'saved' | 'saving' | 'unsaved';

  // Document lifecycle
  createNewDocument: (name?: string, width?: number, height?: number, backgroundColor?: string) => void;
  openDocument: (doc: PixelsDocument) => void;
  closeDocument: () => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void;

  // Layer operations
  setActiveLayer: (layerId: string) => void;
  addLayer: (layer?: Layer | Partial<RasterLayer>) => void;
  removeLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>, recordHistory?: boolean, description?: string) => void;
  mergeDown: (layerId: string) => void;
  flattenImage: () => void;

  // Selection
  setSelection: (selection: SelectionRegion | null) => void;

  // Image & Canvas Transformations
  resizeCanvas: (width: number, height: number, anchor?: 'center' | 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right') => void;
  resizeImage: (width: number, height: number) => void;
  cropDocument: (x: number, y: number, width: number, height: number) => void;
  rotateDocument: (degrees: 90 | -90 | 180) => void;
  flipDocument: (direction: 'horizontal' | 'vertical') => void;

  // Pixel operations & Filters
  applyFilterToActiveLayer: (params: FilterParams) => Promise<void>;
  commitCanvasChange: (layerId: string, description: string) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: null,
  saveStatus: 'saved',

  createNewDocument: (name = 'Untitled', width = 1280, height = 720, backgroundColor = '#ffffff') => {
    const doc = DocumentManager.createDocument(name, width, height, backgroundColor);
    historyManager.clear();
    set({ document: doc, saveStatus: 'saved' });
  },

  openDocument: (doc: PixelsDocument) => {
    historyManager.clear();
    set({ document: doc, saveStatus: 'saved' });
  },

  closeDocument: () => {
    historyManager.clear();
    set({ document: null, saveStatus: 'saved' });
  },

  setSaveStatus: (status) => set({ saveStatus: status }),

  setActiveLayer: (layerId: string) => {
    const doc = get().document;
    if (!doc) return;
    set({
      document: {
        ...doc,
        activeLayerId: layerId,
      },
    });
  },

  addLayer: (options) => {
    const doc = get().document;
    if (!doc) return;

    let newLayer: Layer;
    if (options && 'id' in options && 'type' in options) {
      newLayer = options as Layer;
    } else {
      const layerName = options?.name || `Layer ${doc.layers.length + 1}`;
      newLayer = LayerFactory.createRasterLayer(layerName, doc.width, doc.height, options);
    }

    const prevLayers = [...doc.layers];
    const prevActiveId = doc.activeLayerId;

    const nextLayers = [...doc.layers, newLayer];

    historyManager.push({
      id: `add_${Date.now()}`,
      type: 'layer_add',
      description: `New Layer "${newLayer.name}"`,
      timestamp: Date.now(),
      undo: () => {
        const currentDoc = get().document;
        if (!currentDoc) return;
        set({
          document: {
            ...currentDoc,
            layers: prevLayers,
            activeLayerId: prevActiveId,
            isDirty: true,
          },
          saveStatus: 'unsaved',
        });
      },
      redo: () => {
        const currentDoc = get().document;
        if (!currentDoc) return;
        set({
          document: {
            ...currentDoc,
            layers: nextLayers,
            activeLayerId: newLayer.id,
            isDirty: true,
          },
          saveStatus: 'unsaved',
        });
      },
    });

    set({
      document: {
        ...doc,
        layers: nextLayers,
        activeLayerId: newLayer.id,
        isDirty: true,
      },
      saveStatus: 'unsaved',
    });
  },

  removeLayer: (layerId: string) => {
    const doc = get().document;
    if (!doc || doc.layers.length <= 1) return;

    const targetLayer = doc.layers.find((l) => l.id === layerId);
    if (!targetLayer) return;

    const prevDoc = { ...doc };
    const newDoc = DocumentManager.removeLayer(doc, layerId);

    historyManager.push({
      id: `del_${Date.now()}`,
      type: 'layer_remove',
      description: `Delete Layer "${targetLayer.name}"`,
      timestamp: Date.now(),
      undo: () => {
        set({ document: prevDoc, saveStatus: 'unsaved' });
      },
      redo: () => {
        set({ document: newDoc, saveStatus: 'unsaved' });
      },
    });

    set({ document: newDoc, saveStatus: 'unsaved' });
  },

  duplicateLayer: (layerId: string) => {
    const doc = get().document;
    if (!doc) return;

    const prevDoc = { ...doc };
    const newDoc = DocumentManager.duplicateLayer(doc, layerId);

    historyManager.push({
      id: `dup_${Date.now()}`,
      type: 'layer_duplicate',
      description: 'Duplicate Layer',
      timestamp: Date.now(),
      undo: () => set({ document: prevDoc, saveStatus: 'unsaved' }),
      redo: () => set({ document: newDoc, saveStatus: 'unsaved' }),
    });

    set({ document: newDoc, saveStatus: 'unsaved' });
  },

  reorderLayers: (fromIndex: number, toIndex: number) => {
    const doc = get().document;
    if (!doc) return;

    const prevDoc = { ...doc };
    const newDoc = DocumentManager.reorderLayers(doc, fromIndex, toIndex);

    historyManager.push({
      id: `reorder_${Date.now()}`,
      type: 'layer_reorder',
      description: 'Reorder Layers',
      timestamp: Date.now(),
      undo: () => set({ document: prevDoc, saveStatus: 'unsaved' }),
      redo: () => set({ document: newDoc, saveStatus: 'unsaved' }),
    });

    set({ document: newDoc, saveStatus: 'unsaved' });
  },

  updateLayer: (layerId: string, updates: Partial<Layer>, recordHistory = false, description = 'Update Layer') => {
    const doc = get().document;
    if (!doc) return;

    const layerIndex = doc.layers.findIndex((l) => l.id === layerId);
    if (layerIndex === -1) return;

    const oldLayer = doc.layers[layerIndex];
    const newLayer = { ...oldLayer, ...updates } as Layer;

    if (recordHistory) {
      const prevDoc = { ...doc };
      historyManager.push({
        id: `upd_${Date.now()}`,
        type: 'layer_property',
        description,
        timestamp: Date.now(),
        undo: () => set({ document: prevDoc, saveStatus: 'unsaved' }),
        redo: () => {
          const currentDoc = get().document;
          if (!currentDoc) return;
          const currentLayers = currentDoc.layers.map((l) => (l.id === layerId ? newLayer : l));
          set({
            document: { ...currentDoc, layers: currentLayers, isDirty: true },
            saveStatus: 'unsaved',
          });
        },
      });
    }

    const newLayers = doc.layers.map((l) => (l.id === layerId ? newLayer : l));
    set({
      document: {
        ...doc,
        layers: newLayers,
        isDirty: true,
      },
      saveStatus: 'unsaved',
    });
  },

  mergeDown: (layerId: string) => {
    const doc = get().document;
    if (!doc) return;

    const prevDoc = { ...doc };
    const newDoc = DocumentManager.mergeDown(doc, layerId);

    historyManager.push({
      id: `merge_${Date.now()}`,
      type: 'layer_property',
      description: 'Merge Down',
      timestamp: Date.now(),
      undo: () => set({ document: prevDoc, saveStatus: 'unsaved' }),
      redo: () => set({ document: newDoc, saveStatus: 'unsaved' }),
    });

    set({ document: newDoc, saveStatus: 'unsaved' });
  },

  flattenImage: () => {
    const doc = get().document;
    if (!doc) return;

    const prevDoc = { ...doc };
    const newDoc = DocumentManager.flattenImage(doc);

    historyManager.push({
      id: `flatten_${Date.now()}`,
      type: 'layer_property',
      description: 'Flatten Image',
      timestamp: Date.now(),
      undo: () => set({ document: prevDoc, saveStatus: 'unsaved' }),
      redo: () => set({ document: newDoc, saveStatus: 'unsaved' }),
    });

    set({ document: newDoc, saveStatus: 'unsaved' });
  },

  setSelection: (selection: SelectionRegion | null) => {
    const doc = get().document;
    if (!doc) return;
    set({
      document: {
        ...doc,
        selection,
      },
    });
  },

  resizeCanvas: (width: number, height: number, anchor = 'center') => {
    const doc = get().document;
    if (!doc) return;

    const prevDoc = { ...doc };
    const newDoc = DocumentManager.resizeCanvas(doc, width, height, anchor);

    historyManager.push({
      id: `canv_sz_${Date.now()}`,
      type: 'canvas_resize',
      description: `Canvas Size ${width}x${height}`,
      timestamp: Date.now(),
      undo: () => set({ document: prevDoc, saveStatus: 'unsaved' }),
      redo: () => set({ document: newDoc, saveStatus: 'unsaved' }),
    });

    set({ document: newDoc, saveStatus: 'unsaved' });
  },

  resizeImage: (width: number, height: number) => {
    const doc = get().document;
    if (!doc) return;

    const prevDoc = { ...doc };
    const newDoc = DocumentManager.resizeImage(doc, width, height);

    historyManager.push({
      id: `img_sz_${Date.now()}`,
      type: 'image_resize',
      description: `Image Size ${width}x${height}`,
      timestamp: Date.now(),
      undo: () => set({ document: prevDoc, saveStatus: 'unsaved' }),
      redo: () => set({ document: newDoc, saveStatus: 'unsaved' }),
    });

    set({ document: newDoc, saveStatus: 'unsaved' });
  },

  cropDocument: (x: number, y: number, width: number, height: number) => {
    const doc = get().document;
    if (!doc) return;

    const prevDoc = { ...doc };
    const newDoc = DocumentManager.cropDocument(doc, x, y, width, height);

    historyManager.push({
      id: `crop_${Date.now()}`,
      type: 'crop',
      description: `Crop ${width}x${height}`,
      timestamp: Date.now(),
      undo: () => set({ document: prevDoc, saveStatus: 'unsaved' }),
      redo: () => set({ document: newDoc, saveStatus: 'unsaved' }),
    });

    set({ document: newDoc, saveStatus: 'unsaved' });
  },

  rotateDocument: (degrees: 90 | -90 | 180) => {
    const doc = get().document;
    if (!doc) return;

    const prevDoc = { ...doc };
    const newDoc = DocumentManager.rotateDocument(doc, degrees);

    historyManager.push({
      id: `rot_${Date.now()}`,
      type: 'rotate',
      description: `Rotate Document ${degrees}°`,
      timestamp: Date.now(),
      undo: () => set({ document: prevDoc, saveStatus: 'unsaved' }),
      redo: () => set({ document: newDoc, saveStatus: 'unsaved' }),
    });

    set({ document: newDoc, saveStatus: 'unsaved' });
  },

  flipDocument: (direction: 'horizontal' | 'vertical') => {
    const doc = get().document;
    if (!doc) return;

    const prevDoc = { ...doc };
    const newDoc = DocumentManager.flipDocument(doc, direction);

    historyManager.push({
      id: `flip_${Date.now()}`,
      type: 'flip',
      description: `Flip Document ${direction}`,
      timestamp: Date.now(),
      undo: () => set({ document: prevDoc, saveStatus: 'unsaved' }),
      redo: () => set({ document: newDoc, saveStatus: 'unsaved' }),
    });

    set({ document: newDoc, saveStatus: 'unsaved' });
  },

  applyFilterToActiveLayer: async (params: FilterParams) => {
    const doc = get().document;
    if (!doc || !doc.activeLayerId) return;

    const activeLayer = doc.layers.find((l) => l.id === doc.activeLayerId);
    if (!activeLayer || activeLayer.type !== 'raster') return;

    const rLayer = activeLayer as RasterLayer;
    if (!rLayer.canvas) return;

    const ctx = rLayer.canvas.getContext('2d');
    if (!ctx) return;

    // Snapshot before filter for undo
    const beforeDataUrl = rLayer.canvas.toDataURL();

    // Get current ImageData
    const imgData = ctx.getImageData(0, 0, rLayer.canvas.width, rLayer.canvas.height);

    // Apply with worker or fallback
    const resultData = await workerClient.processImage(imgData, params, doc.selection);

    ctx.putImageData(resultData, 0, 0);
    const afterDataUrl = rLayer.canvas.toDataURL();

    const layerId = rLayer.id;
    historyManager.push({
      id: `filter_${Date.now()}`,
      type: 'filter_apply',
      description: `Filter: ${params.type}`,
      timestamp: Date.now(),
      undo: () => {
        const cDoc = get().document;
        if (!cDoc) return;
        const target = cDoc.layers.find((l) => l.id === layerId) as RasterLayer;
        if (target && target.canvas) {
          const tCtx = target.canvas.getContext('2d');
          const img = new Image();
          img.src = beforeDataUrl;
          img.onload = () => {
            tCtx?.clearRect(0, 0, target.width, target.height);
            tCtx?.drawImage(img, 0, 0);
            target.dataUrl = beforeDataUrl;
            set({ document: { ...cDoc, isDirty: true }, saveStatus: 'unsaved' });
          };
        }
      },
      redo: () => {
        const cDoc = get().document;
        if (!cDoc) return;
        const target = cDoc.layers.find((l) => l.id === layerId) as RasterLayer;
        if (target && target.canvas) {
          const tCtx = target.canvas.getContext('2d');
          const img = new Image();
          img.src = afterDataUrl;
          img.onload = () => {
            tCtx?.clearRect(0, 0, target.width, target.height);
            tCtx?.drawImage(img, 0, 0);
            target.dataUrl = afterDataUrl;
            set({ document: { ...cDoc, isDirty: true }, saveStatus: 'unsaved' });
          };
        }
      },
    });

    rLayer.dataUrl = afterDataUrl;
    set({
      document: {
        ...doc,
        isDirty: true,
      },
      saveStatus: 'unsaved',
    });
  },

  commitCanvasChange: (layerId: string, description: string) => {
    const doc = get().document;
    if (!doc) return;
    const layer = doc.layers.find((l) => l.id === layerId) as RasterLayer;
    if (!layer || !layer.canvas) return;

    layer.dataUrl = layer.canvas.toDataURL();
    set({
      document: {
        ...doc,
        isDirty: true,
      },
      saveStatus: 'unsaved',
    });
  },
}));
