import { ToolType, RasterLayer, SelectionRegion } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { historyManager } from '@/history/HistoryManager';
import { Compositor } from '@/canvas/Compositor';
import { SelectionManager } from '@/document/Selection';
import { LayerFactory } from '@/document/Layer';

export interface ToolPointerEvent {
  docPoint: { x: number; y: number };
  screenPoint: { x: number; y: number };
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  button: number;
}

export class ToolManager {
  private isDrawing = false;
  private lastDocPoint: { x: number; y: number } | null = null;
  private strokeStartCanvasSnapshot: HTMLCanvasElement | null = null;
  private activeLayerIdAtStart: string | null = null;

  // Selection tool state
  private selectionStartPoint: { x: number; y: number } | null = null;

  // Hand tool pan state
  private lastPanPoint: { x: number; y: number } | null = null;

  public cancelDrawing(): void {
    this.isDrawing = false;
    this.lastDocPoint = null;
    this.strokeStartCanvasSnapshot = null;
    this.activeLayerIdAtStart = null;
    this.selectionStartPoint = null;
    this.lastPanPoint = null;
  }

  public handlePointerDown(e: ToolPointerEvent): void {
    const editor = useEditorStore.getState();
    const docState = useDocumentStore.getState();
    const doc = docState.document;
    if (!doc) return;

    this.lastDocPoint = { ...e.docPoint };

    switch (editor.activeTool) {
      case 'brush':
      case 'pencil':
      case 'eraser': {
        let activeLayer = doc.layers.find((l) => l.id === doc.activeLayerId);
        // If active layer is not a visible unlocked raster layer, find a suitable raster layer
        if (!activeLayer || activeLayer.type !== 'raster' || !activeLayer.visible || activeLayer.locked) {
          const availableRaster = doc.layers
            .slice()
            .reverse()
            .find((l) => l.type === 'raster' && l.visible && !l.locked);
          if (availableRaster) {
            docState.setActiveLayer(availableRaster.id);
            activeLayer = availableRaster;
          } else {
            // If no raster layer exists, create a new one to draw on
            const newLayer = LayerFactory.createRasterLayer(
              `Layer ${doc.layers.length + 1}`,
              doc.width,
              doc.height
            );
            docState.addLayer(newLayer);
            activeLayer = newLayer;
          }
        }

        const rLayer = activeLayer as RasterLayer;
        if (!rLayer || !rLayer.canvas) return;

        this.isDrawing = true;
        this.activeLayerIdAtStart = rLayer.id;

        // Synchronous snapshot of the canvas buffer for instant undo
        const snapshot = document.createElement('canvas');
        snapshot.width = rLayer.canvas.width;
        snapshot.height = rLayer.canvas.height;
        const sCtx = snapshot.getContext('2d');
        if (sCtx) {
          sCtx.drawImage(rLayer.canvas, 0, 0);
        }
        this.strokeStartCanvasSnapshot = snapshot;

        this.drawStrokeDab(e.docPoint, editor.activeTool);
        break;
      }

      case 'select-rect':
      case 'select-ellipse': {
        this.isDrawing = true;
        this.selectionStartPoint = { ...e.docPoint };
        break;
      }

      case 'eyedropper': {
        const sampledColor = Compositor.sampleColor(doc, e.docPoint.x, e.docPoint.y);
        if (sampledColor) {
          editor.setForegroundColor(sampledColor);
        }
        break;
      }

      case 'hand': {
        this.isDrawing = true;
        this.lastPanPoint = { ...e.screenPoint };
        break;
      }

      case 'zoom': {
        const currentZoom = editor.viewport.zoom;
        const newZoom = e.altKey ? currentZoom / 1.4 : currentZoom * 1.4;
        editor.setZoom(newZoom);
        break;
      }
    }
  }

  public handlePointerMove(e: ToolPointerEvent): void {
    const editor = useEditorStore.getState();
    const docState = useDocumentStore.getState();
    const doc = docState.document;
    if (!doc) return;

    editor.setCursorCoordinates(e.docPoint.x, e.docPoint.y);

    if (editor.activeTool === 'eyedropper' && e.button === 0) {
      const sampledColor = Compositor.sampleColor(doc, e.docPoint.x, e.docPoint.y);
      if (sampledColor) {
        editor.setForegroundColor(sampledColor);
      }
    }

    if (!this.isDrawing) return;

    switch (editor.activeTool) {
      case 'brush':
      case 'pencil':
      case 'eraser': {
        if (!this.lastDocPoint) break;
        this.interpolateStroke(this.lastDocPoint, e.docPoint, editor.activeTool);
        this.lastDocPoint = { ...e.docPoint };
        break;
      }

      case 'select-rect':
      case 'select-ellipse': {
        if (!this.selectionStartPoint) break;
        const sx = this.selectionStartPoint.x;
        const sy = this.selectionStartPoint.y;
        const cx = e.docPoint.x;
        const cy = e.docPoint.y;

        const clampedX = Math.max(0, Math.min(doc.width, cx));
        const clampedY = Math.max(0, Math.min(doc.height, cy));

        const normX = Math.round(Math.min(sx, clampedX));
        const normY = Math.round(Math.min(sy, clampedY));
        const normW = Math.round(Math.abs(clampedX - sx));
        const normH = Math.round(Math.abs(clampedY - sy));
        const type = editor.activeTool === 'select-ellipse' ? 'ellipse' : 'rect';

        docState.setSelection({
          active: true,
          x: normX,
          y: normY,
          width: normW,
          height: normH,
          type,
        });
        break;
      }

      case 'hand': {
        if (!this.lastPanPoint) break;
        const dx = e.screenPoint.x - this.lastPanPoint.x;
        const dy = e.screenPoint.y - this.lastPanPoint.y;
        editor.setPan(editor.viewport.panX + dx, editor.viewport.panY + dy);
        this.lastPanPoint = { ...e.screenPoint };
        break;
      }
    }
  }

  public handlePointerUp(e: ToolPointerEvent): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const editor = useEditorStore.getState();
    const docState = useDocumentStore.getState();
    const doc = docState.document;

    switch (editor.activeTool) {
      case 'brush':
      case 'pencil':
      case 'eraser': {
        if (this.strokeStartCanvasSnapshot && this.activeLayerIdAtStart && doc) {
          const layerId = this.activeLayerIdAtStart;
          const targetLayer = doc.layers.find((l) => l.id === layerId) as RasterLayer;
          if (targetLayer && targetLayer.canvas) {
            const beforeCanvas = this.strokeStartCanvasSnapshot;
            const afterCanvas = document.createElement('canvas');
            afterCanvas.width = targetLayer.canvas.width;
            afterCanvas.height = targetLayer.canvas.height;
            const aCtx = afterCanvas.getContext('2d');
            if (aCtx) {
              aCtx.drawImage(targetLayer.canvas, 0, 0);
            }

            const actionName =
              editor.activeTool === 'eraser'
                ? 'Eraser'
                : editor.activeTool === 'pencil'
                ? 'Pencil Stroke'
                : 'Brush Stroke';

            historyManager.push({
              id: `stroke_${Date.now()}`,
              type: editor.activeTool === 'eraser' ? 'erase' : 'draw',
              description: actionName,
              timestamp: Date.now(),
              undo: () => {
                const curDoc = useDocumentStore.getState().document;
                if (!curDoc) return;
                const lyr = curDoc.layers.find((l) => l.id === layerId) as RasterLayer;
                if (lyr && lyr.canvas) {
                  const ctx = lyr.canvas.getContext('2d');
                  ctx?.clearRect(0, 0, lyr.width, lyr.height);
                  ctx?.drawImage(beforeCanvas, 0, 0);
                  useDocumentStore.getState().commitCanvasChange(layerId, 'Undo ' + actionName);
                }
              },
              redo: () => {
                const curDoc = useDocumentStore.getState().document;
                if (!curDoc) return;
                const lyr = curDoc.layers.find((l) => l.id === layerId) as RasterLayer;
                if (lyr && lyr.canvas) {
                  const ctx = lyr.canvas.getContext('2d');
                  ctx?.clearRect(0, 0, lyr.width, lyr.height);
                  ctx?.drawImage(afterCanvas, 0, 0);
                  useDocumentStore.getState().commitCanvasChange(layerId, 'Redo ' + actionName);
                }
              },
            });

            docState.commitCanvasChange(layerId, actionName);
          }
        }
        break;
      }

      case 'select-rect':
      case 'select-ellipse': {
        if (this.selectionStartPoint && doc) {
          const sx = this.selectionStartPoint.x;
          const sy = this.selectionStartPoint.y;
          const cx = e.docPoint.x;
          const cy = e.docPoint.y;
          const normW = Math.abs(cx - sx);
          const normH = Math.abs(cy - sy);

          if (normW < 3 && normH < 3) {
            // Click without drag deselects
            docState.setSelection(null);
          }
        }
        this.selectionStartPoint = null;
        break;
      }

      case 'hand': {
        this.lastPanPoint = null;
        break;
      }
    }

    this.lastDocPoint = null;
    this.strokeStartCanvasSnapshot = null;
    this.activeLayerIdAtStart = null;
  }

  /**
   * Continuous interpolation between points for smooth brush strokes
   */
  private interpolateStroke(
    from: { x: number; y: number },
    to: { x: number; y: number },
    tool: 'brush' | 'pencil' | 'eraser'
  ): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const editor = useEditorStore.getState();
    const size =
      tool === 'brush'
        ? editor.toolOptions.brush.size
        : tool === 'pencil'
        ? editor.toolOptions.pencil.size
        : editor.toolOptions.eraser.size;

    const step = Math.max(1, size * 0.2);
    const steps = Math.ceil(dist / step);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const y = from.y + dy * t;
      this.drawStrokeDab({ x, y }, tool);
    }
  }

  /**
   * Draw single brush/pencil/eraser dab onto active raster layer
   */
  private drawStrokeDab(pt: { x: number; y: number }, tool: 'brush' | 'pencil' | 'eraser'): void {
    const docState = useDocumentStore.getState();
    const doc = docState.document;
    if (!doc || !doc.activeLayerId) return;

    // Check selection containment
    if (doc.selection && doc.selection.active && !SelectionManager.isPointInside(pt, doc.selection)) {
      return;
    }

    const activeLayer = doc.layers.find((l) => l.id === doc.activeLayerId) as RasterLayer;
    if (!activeLayer || !activeLayer.canvas) return;

    const ctx = activeLayer.canvas.getContext('2d');
    if (!ctx) return;

    const editor = useEditorStore.getState();
    const localX = pt.x - activeLayer.x;
    const localY = pt.y - activeLayer.y;

    ctx.save();

    if (tool === 'eraser') {
      const { size, opacity, hardness } = editor.toolOptions.eraser;
      const radius = size / 2;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = opacity;

      if (hardness >= 0.95) {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(localX, localY, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const grad = ctx.createRadialGradient(localX, localY, radius * hardness, localX, localY, radius);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(localX, localY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (tool === 'pencil') {
      const { size, color, opacity } = editor.toolOptions.pencil;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(localX - size / 2), Math.floor(localY - size / 2), size, size);
    } else {
      // Brush
      const { size, opacity, hardness, color } = editor.toolOptions.brush;
      const radius = size / 2;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = opacity;

      if (hardness >= 0.95) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(localX, localY, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const grad = ctx.createRadialGradient(localX, localY, radius * hardness, localX, localY, radius);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(localX, localY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

export const toolManager = new ToolManager();
