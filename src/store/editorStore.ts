import { create } from 'zustand';
import { ToolType, ToolOptions } from '@/types';
import { FilterType } from '@/filters/FilterRegistry';

interface EditorState {
  activeTool: ToolType;
  toolOptions: ToolOptions;
  foregroundColor: string;
  backgroundColor: string;
  viewport: {
    zoom: number;
    panX: number;
    panY: number;
  };
  cursorCoordinates: {
    x: number;
    y: number;
  };
  activePanelTab: 'layers' | 'properties' | 'adjustments' | 'history';

  // Modals
  isNewDocOpen: boolean;
  isExportOpen: boolean;
  isImageSizeOpen: boolean;
  isCanvasSizeOpen: boolean;
  isFilterOpen: boolean;
  activeFilterType: FilterType | null;
  isShortcutsOpen: boolean;
  isAboutOpen: boolean;

  // Actions
  setActiveTool: (tool: ToolType) => void;
  updateToolOptions: <K extends keyof ToolOptions>(tool: K, options: Partial<ToolOptions[K]>) => void;
  setForegroundColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  swapColors: () => void;
  resetDefaultColors: () => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  resetViewport: () => void;
  setCursorCoordinates: (x: number, y: number) => void;
  setActivePanelTab: (tab: 'layers' | 'properties' | 'adjustments' | 'history') => void;

  // Modal actions
  setNewDocOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  setImageSizeOpen: (open: boolean) => void;
  setCanvasSizeOpen: (open: boolean) => void;
  openFilterDialog: (filterType: FilterType) => void;
  closeFilterDialog: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: 'brush',
  foregroundColor: '#3b82f6',
  backgroundColor: '#ffffff',
  viewport: {
    zoom: 1,
    panX: 0,
    panY: 0,
  },
  cursorCoordinates: {
    x: 0,
    y: 0,
  },
  activePanelTab: 'layers',

  toolOptions: {
    brush: {
      size: 24,
      opacity: 1,
      hardness: 0.8,
      color: '#3b82f6',
    },
    pencil: {
      size: 2,
      opacity: 1,
      color: '#3b82f6',
    },
    eraser: {
      size: 32,
      opacity: 1,
      hardness: 0.8,
    },
    selection: {
      mode: 'replace',
      feather: 0,
    },
    crop: {
      aspectRatio: 'free',
      width: 0,
      height: 0,
    },
    text: {
      fontSize: 32,
      fontFamily: 'Inter, sans-serif',
      fill: '#ffffff',
      align: 'left',
      bold: false,
      italic: false,
    },
    shape: {
      shapeType: 'rectangle',
      fill: '#3b82f6',
      stroke: '#ffffff',
      strokeWidth: 2,
    },
    eyedropper: {
      sampleSize: '1x1',
    },
    zoom: {
      mode: 'in',
    },
  },

  isNewDocOpen: false,
  isExportOpen: false,
  isImageSizeOpen: false,
  isCanvasSizeOpen: false,
  isFilterOpen: false,
  activeFilterType: null,
  isShortcutsOpen: false,
  isAboutOpen: false,

  setActiveTool: (tool) => set({ activeTool: tool }),

  updateToolOptions: (tool, options) => {
    set((state) => ({
      toolOptions: {
        ...state.toolOptions,
        [tool]: {
          ...state.toolOptions[tool],
          ...options,
        },
      },
    }));
  },

  setForegroundColor: (color) => {
    set((state) => ({
      foregroundColor: color,
      toolOptions: {
        ...state.toolOptions,
        brush: { ...state.toolOptions.brush, color },
        pencil: { ...state.toolOptions.pencil, color },
        shape: { ...state.toolOptions.shape, fill: color },
        text: { ...state.toolOptions.text, fill: color },
      },
    }));
  },

  setBackgroundColor: (color) => set({ backgroundColor: color }),

  swapColors: () => {
    const { foregroundColor, backgroundColor } = get();
    get().setForegroundColor(backgroundColor);
    set({ backgroundColor: foregroundColor });
  },

  resetDefaultColors: () => {
    set({ foregroundColor: '#000000', backgroundColor: '#ffffff' });
  },

  setZoom: (zoom) => {
    const clamped = Math.max(0.05, Math.min(10, Number(zoom.toFixed(2))));
    set((state) => ({
      viewport: { ...state.viewport, zoom: clamped },
    }));
  },

  setPan: (panX, panY) => {
    set((state) => ({
      viewport: { ...state.viewport, panX, panY },
    }));
  },

  resetViewport: () => {
    set({
      viewport: { zoom: 1, panX: 0, panY: 0 },
    });
  },

  setCursorCoordinates: (x, y) => {
    set({ cursorCoordinates: { x: Math.round(x), y: Math.round(y) } });
  },

  setActivePanelTab: (tab) => set({ activePanelTab: tab }),

  setNewDocOpen: (open) => set({ isNewDocOpen: open }),
  setExportOpen: (open) => set({ isExportOpen: open }),
  setImageSizeOpen: (open) => set({ isImageSizeOpen: open }),
  setCanvasSizeOpen: (open) => set({ isCanvasSizeOpen: open }),
  openFilterDialog: (filterType) => set({ isFilterOpen: true, activeFilterType: filterType }),
  closeFilterDialog: () => set({ isFilterOpen: false, activeFilterType: null }),
  setShortcutsOpen: (open) => set({ isShortcutsOpen: open }),
  setAboutOpen: (open) => set({ isAboutOpen: open }),
}));
