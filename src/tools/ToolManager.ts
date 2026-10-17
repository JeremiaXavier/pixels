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
  private strokeStartCanvasSnapshot: string | null = null;
  private activeLayerIdAtStart: string | null = null;

  // Selection tool state
  private selectionStartPoint: { x: number; y: number } | null = null;

  // Hand tool pan state
  private lastPanPoint: { x: number; y: number } | null = null;

  public handlePointerDown(e: ToolPointerEvent): void {
    const editor = useEditorStore.getState();
    const docState = useDocumentStore.getState();
    const doc = docState.document;
    if (!doc) return;

    this.isDrawing = true;
    this.lastDocPoint = { ...e.docPoint };

    switch (editor.activeTool) {
      case 'brush':
      case 'pencil':
      case 'eraser': {
        const activeLayer = doc.layers.find((l) => l.id === doc.activeLayerId);
        if (!activeLayer || activeLayer.type !== 'raster' || !activeLayer.visible || activeLayer.locked) {
          // If no active editable raster layer, or locked, ignore
          return;
        }
        const rLayer = activeLayer as RasterLayer;
        if (!rLayer.canvas) return;

        this.strokeStartCanvasSnapshot = rLayer.canvas.toDataURL();
        this.activeLayerIdAtStart = rLayer.id;

        this.drawStrokeDab(e.docPoint, editor.activeTool);
        break;
      }

      case 'select-rect':
      case 'select-ellipse': {
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
        const width = e.docPoint.x - this.selectionStartPoint.x;
        const height = e.docPoint.y - this.selectionStartPoint.y;
        const type = editor.activeTool === 'select-ellipse' ? 'ellipse' : 'rect';

        const updatedRegion = SelectionManager.combine(
          null,
          {
            x: this.selectionStartPoint.x,
            y: this.selectionStartPoint.y,
            width,
            height,
            type,
          },
          'replace'
        );
        docState.setSelection(updatedRegion);
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
            const beforeSnapshot = this.strokeStartCanvasSnapshot;
            const afterSnapshot = targetLayer.canvas.toDataURL();
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
                  const img = new Image();
                  img.src = beforeSnapshot;
                  img.onload = () => {
                    ctx?.clearRect(0, 0, lyr.width, lyr.height);
                    ctx?.drawImage(img, 0, 0);
                    docState.commitCanvasChange(layerId, 'Undo ' + actionName);
                  };
                }
              },
              redo: () => {
                const curDoc = useDocumentStore.getState().document;
                if (!curDoc) return;
                const lyr = curDoc.layers.find((l) => l.id === layerId) as RasterLayer;
                if (lyr && lyr.canvas) {
                  const ctx = lyr.canvas.getContext('2d');
                  const img = new Image();
                  img.src = afterSnapshot;
                  img.onload = () => {
                    ctx?.clearRect(0, 0, lyr.width, lyr.height);
                    ctx?.drawImage(img, 0, 0);
                    docState.commitCanvasChange(layerId, 'Redo ' + actionName);
                  };
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
