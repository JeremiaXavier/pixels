import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';
import { toolManager, ToolPointerEvent } from '@/tools/ToolManager';
import { Compositor } from '@/canvas/Compositor';
import { calculateFitZoom } from '@/canvas/CoordinateSystem';
import { historyManager } from '@/history/HistoryManager';
import { LayerFactory } from '@/document/Layer';
import { Check, X as CloseIcon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const CanvasWorkspace: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const documentFrameRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);

  const document = useDocumentStore((state) => state.document);
  const { updateLayer, cropDocument, addLayer, setActiveLayer } = useDocumentStore();
  const {
    activeTool,
    toolOptions,
    viewport,
    setZoom,
    setPan,
    setCursorCoordinates,
    setActivePanelTab,
    cropRect,
    setCropRect,
    setActiveTool,
  } = useEditorStore();

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  // Move tool state
  const isMovingLayerRef = useRef(false);
  const moveStartRef = useRef<{ docX: number; docY: number; layerX: number; layerY: number } | null>(
    null
  );

  // Interactive crop state
  const isCroppingRef = useRef(false);
  const cropStartRef = useRef<{ x: number; y: number } | null>(null);
  const cropInitialRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const cropHandleRef = useRef<string>('none');
  const [hoverCropHandle, setHoverCropHandle] = useState<string>('none');

  // Interactive shape drawing state
  const [shapePreview, setShapePreview] = useState<{
    shapeType: 'rectangle' | 'ellipse' | 'line';
    x: number;
    y: number;
    w: number;
    h: number;
    points?: number[];
  } | null>(null);
  const isDrawingShapeRef = useRef(false);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);

  // Fit to screen on initial document load or id change
  useEffect(() => {
    if (document && containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const fit = calculateFitZoom(document.width, document.height, clientWidth, clientHeight);
      setZoom(fit);
      setPan(0, 0);
    }
  }, [document?.id]);

  // Redraw canvas whenever document updates
  useEffect(() => {
    if (!document || !mainCanvasRef.current) return;
    Compositor.compositeToCanvas(document, mainCanvasRef.current);
  }, [document]);

  // Auto-initialize crop region to full document boundaries when entering crop tool
  useEffect(() => {
    if (activeTool === 'crop' && document) {
      if (!cropRect) {
        setCropRect({
          x: 0,
          y: 0,
          w: document.width,
          h: document.height,
        });
      }
    }
  }, [activeTool, document?.id]);

  // Determine which handle or region of the crop box is under the pointer
  const getCropHandle = useCallback(
    (docX: number, docY: number, rect: { x: number; y: number; w: number; h: number } | null): string => {
      if (!rect || rect.w <= 0 || rect.h <= 0) return 'create';
      const tol = 16 / Math.max(0.1, viewport.zoom);
      const { x, y, w, h } = rect;

      // Corners
      if (Math.hypot(docX - x, docY - y) <= tol) return 'nw';
      if (Math.hypot(docX - (x + w), docY - y) <= tol) return 'ne';
      if (Math.hypot(docX - x, docY - (y + h)) <= tol) return 'sw';
      if (Math.hypot(docX - (x + w), docY - (y + h)) <= tol) return 'se';

      // Edges
      if (Math.abs(docY - y) <= tol && docX >= x - tol && docX <= x + w + tol) return 'n';
      if (Math.abs(docY - (y + h)) <= tol && docX >= x - tol && docX <= x + w + tol) return 's';
      if (Math.abs(docX - x) <= tol && docY >= y - tol && docY <= y + h + tol) return 'w';
      if (Math.abs(docX - (x + w)) <= tol && docY >= y - tol && docY <= y + h + tol) return 'e';

      // Inside crop rectangle (reposition entire box)
      if (docX >= x && docX <= x + w && docY >= y && docY <= y + h) return 'inside';

      return 'create';
    },
    [viewport.zoom]
  );

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse wheel zoom / pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!document || !containerRef.current) return;

      if (e.ctrlKey || e.metaKey || e.altKey) {
        // Zoom
        const zoomDelta = e.deltaY < 0 ? 1.15 : 0.85;
        setZoom(viewport.zoom * zoomDelta);
      } else {
        // Pan
        setPan(viewport.panX - e.deltaX, viewport.panY - e.deltaY);
      }
    },
    [document, viewport, setZoom, setPan]
  );

  // Convert mouse / pointer coordinates to document coordinates
  const getToolEvent = useCallback(
    (e: React.MouseEvent | MouseEvent): ToolPointerEvent | null => {
      if (!document || !documentFrameRef.current) return null;
      const frameRect = documentFrameRef.current.getBoundingClientRect();

      const screenX = e.clientX - frameRect.left;
      const screenY = e.clientY - frameRect.top;

      const docX = screenX / viewport.zoom;
      const docY = screenY / viewport.zoom;

      return {
        docPoint: { x: docX, y: docY },
        screenPoint: { x: e.clientX, y: e.clientY },
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey || e.metaKey,
        button: e.button,
      };
    },
    [document, viewport.zoom]
  );

  const handlePointerDown = (e: React.MouseEvent) => {
    if (!document) return;

    // Middle click or spacebar pan or hand tool
    if (e.button === 1 || isSpacePressed || activeTool === 'hand') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const toolEvt = getToolEvent(e);
    if (!toolEvt) return;

    // Handle Text Tool click
    if (activeTool === 'text') {
      const docX = Math.round(toolEvt.docPoint.x);
      const docY = Math.round(toolEvt.docPoint.y);

      // Check if user clicked an existing text layer to activate it
      const existingTextLayer = document.layers
        .slice()
        .reverse()
        .find(
          (l) =>
            l.type === 'text' &&
            l.visible &&
            !l.locked &&
            docX >= l.x &&
            docX <= l.x + l.width &&
            docY >= l.y &&
            docY <= l.y + l.height
        );

      if (existingTextLayer) {
        setActiveLayer(existingTextLayer.id);
        setActivePanelTab('properties');
        return;
      }

      // Create new text layer at click position
      const { toolOptions: tOpts, foregroundColor } = useEditorStore.getState();
      const newTextLayer = LayerFactory.createTextLayer('Double click to edit', docX, docY, {
        fontSize: tOpts.text.fontSize,
        fontFamily: tOpts.text.fontFamily,
        fill: tOpts.text.fill || foregroundColor,
        align: tOpts.text.align,
        bold: tOpts.text.bold,
        italic: tOpts.text.italic,
      });
      addLayer(newTextLayer);
      setActivePanelTab('properties');
      return;
    }

    // Handle Shape Tools (rectangle, ellipse, line)
    if (
      activeTool === 'shape-rect' ||
      activeTool === 'shape-ellipse' ||
      activeTool === 'shape-line'
    ) {
      const shapeType =
        activeTool === 'shape-ellipse'
          ? 'ellipse'
          : activeTool === 'shape-line'
          ? 'line'
          : 'rectangle';

      isDrawingShapeRef.current = true;
      shapeStartRef.current = { x: toolEvt.docPoint.x, y: toolEvt.docPoint.y };
      setShapePreview({
        shapeType,
        x: toolEvt.docPoint.x,
        y: toolEvt.docPoint.y,
        w: 0,
        h: 0,
        points: [toolEvt.docPoint.x, toolEvt.docPoint.y, toolEvt.docPoint.x, toolEvt.docPoint.y],
      });
      return;
    }

    // Handle Move Tool
    if (activeTool === 'move' && document.activeLayerId) {
      const activeLayer = document.layers.find((l) => l.id === document.activeLayerId);
      if (activeLayer && !activeLayer.locked) {
        isMovingLayerRef.current = true;
        moveStartRef.current = {
          docX: toolEvt.docPoint.x,
          docY: toolEvt.docPoint.y,
          layerX: activeLayer.x,
          layerY: activeLayer.y,
        };
        return;
      }
    }

    // Handle Crop Tool
    if (activeTool === 'crop') {
      const handle = getCropHandle(toolEvt.docPoint.x, toolEvt.docPoint.y, cropRect);
      cropHandleRef.current = handle;
      isCroppingRef.current = true;
      cropStartRef.current = { x: toolEvt.docPoint.x, y: toolEvt.docPoint.y };

      const baseRect =
        cropRect && cropRect.w >= 10 && cropRect.h >= 10
          ? cropRect
          : { x: 0, y: 0, w: document.width, h: document.height };
      cropInitialRectRef.current = { ...baseRect };

      if (handle === 'create') {
        const clampedX = Math.max(0, Math.min(document.width, toolEvt.docPoint.x));
        const clampedY = Math.max(0, Math.min(document.height, toolEvt.docPoint.y));
        cropStartRef.current = { x: clampedX, y: clampedY };
        setCropRect({ x: clampedX, y: clampedY, w: 0, h: 0 });
      }
      return;
    }

    // Standard drawing / selection / eyedropper / zoom
    toolManager.handlePointerDown(toolEvt);

    // Immediate visual composite sync for continuous tools
    if (
      mainCanvasRef.current &&
      (activeTool === 'brush' || activeTool === 'pencil' || activeTool === 'eraser')
    ) {
      Compositor.compositeToCanvas(document, mainCanvasRef.current);
    }
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (!document) return;

    // Spacebar / hand pan
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan(viewport.panX + dx, viewport.panY + dy);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const toolEvt = getToolEvent(e);
    if (!toolEvt) return;

    setCursorCoordinates(toolEvt.docPoint.x, toolEvt.docPoint.y);

    // Handle Shape Tool dragging preview
    if (isDrawingShapeRef.current && shapeStartRef.current) {
      const sx = shapeStartRef.current.x;
      const sy = shapeStartRef.current.y;
      const cx = toolEvt.docPoint.x;
      const cy = toolEvt.docPoint.y;

      const shapeType =
        activeTool === 'shape-ellipse'
          ? 'ellipse'
          : activeTool === 'shape-line'
          ? 'line'
          : 'rectangle';

      const minX = Math.round(Math.min(sx, cx));
      const minY = Math.round(Math.min(sy, cy));
      const w = Math.round(Math.abs(cx - sx));
      const h = Math.round(Math.abs(cy - sy));

      setShapePreview({
        shapeType,
        x: minX,
        y: minY,
        w,
        h,
        points: [Math.round(sx), Math.round(sy), Math.round(cx), Math.round(cy)],
      });
      return;
    }

    // Handle Move Tool dragging
    if (isMovingLayerRef.current && moveStartRef.current && document.activeLayerId) {
      const dx = toolEvt.docPoint.x - moveStartRef.current.docX;
      const dy = toolEvt.docPoint.y - moveStartRef.current.docY;
      updateLayer(
        document.activeLayerId,
        {
          x: Math.round(moveStartRef.current.layerX + dx),
          y: Math.round(moveStartRef.current.layerY + dy),
        },
        false
      );

      // Immediate visual update during move
      if (mainCanvasRef.current) {
        const curDoc = useDocumentStore.getState().document;
        if (curDoc) Compositor.compositeToCanvas(curDoc, mainCanvasRef.current);
      }
      return;
    }

    // Track crop hover handle when not dragging
    if (activeTool === 'crop' && !isCroppingRef.current) {
      const hnd = getCropHandle(toolEvt.docPoint.x, toolEvt.docPoint.y, cropRect);
      setHoverCropHandle(hnd);
    }

    // Handle Crop Tool dragging
    if (isCroppingRef.current && cropStartRef.current && cropInitialRectRef.current) {
      const handle = cropHandleRef.current;
      const init = cropInitialRectRef.current;
      const cx = toolEvt.docPoint.x;
      const cy = toolEvt.docPoint.y;
      const dx = cx - cropStartRef.current.x;
      const dy = cy - cropStartRef.current.y;

      if (handle === 'inside') {
        const newX = Math.max(0, Math.min(document.width - init.w, Math.round(init.x + dx)));
        const newY = Math.max(0, Math.min(document.height - init.h, Math.round(init.y + dy)));
        setCropRect({ x: newX, y: newY, w: init.w, h: init.h });
        return;
      }

      if (handle === 'create') {
        const sx = cropStartRef.current.x;
        const sy = cropStartRef.current.y;
        const clampedX = Math.max(0, Math.min(document.width, cx));
        const clampedY = Math.max(0, Math.min(document.height, cy));

        let minX = Math.round(Math.min(sx, clampedX));
        let minY = Math.round(Math.min(sy, clampedY));
        let w = Math.round(Math.abs(clampedX - sx));
        let h = Math.round(Math.abs(clampedY - sy));

        const ratio = toolOptions.crop.aspectRatio;
        if (ratio !== 'free' && w > 0 && h > 0) {
          const aspectMap: Record<string, number> = {
            '1:1': 1,
            '16:9': 16 / 9,
            '4:3': 4 / 3,
            '3:2': 3 / 2,
          };
          const targetRatio = aspectMap[ratio];
          if (targetRatio) {
            h = Math.round(w / targetRatio);
            if (minY + h > document.height) {
              h = document.height - minY;
              w = Math.round(h * targetRatio);
            }
          }
        }

        setCropRect({ x: minX, y: minY, w, h });
        return;
      }

      // Handle edge and corner resizing
      let newX = init.x;
      let newY = init.y;
      let newW = init.w;
      let newH = init.h;

      if (handle.includes('e')) {
        newW = Math.max(10, Math.min(document.width - init.x, Math.round(init.w + dx)));
      }
      if (handle.includes('s')) {
        newH = Math.max(10, Math.min(document.height - init.y, Math.round(init.h + dy)));
      }
      if (handle.includes('w')) {
        const potentialX = Math.max(0, Math.min(init.x + init.w - 10, Math.round(init.x + dx)));
        newW = init.x + init.w - potentialX;
        newX = potentialX;
      }
      if (handle.includes('n')) {
        const potentialY = Math.max(0, Math.min(init.y + init.h - 10, Math.round(init.y + dy)));
        newH = init.y + init.h - potentialY;
        newY = potentialY;
      }

      // Maintain aspect ratio if set
      const ratio = toolOptions.crop.aspectRatio;
      if (ratio !== 'free' && newW > 0 && newH > 0) {
        const aspectMap: Record<string, number> = {
          '1:1': 1,
          '16:9': 16 / 9,
          '4:3': 4 / 3,
          '3:2': 3 / 2,
        };
        const targetRatio = aspectMap[ratio];
        if (targetRatio) {
          if (handle.includes('e') || handle.includes('w')) {
            newH = Math.round(newW / targetRatio);
            if (newY + newH > document.height) {
              newH = document.height - newY;
              newW = Math.round(newH * targetRatio);
            }
          } else {
            newW = Math.round(newH * targetRatio);
            if (newX + newW > document.width) {
              newW = document.width - newX;
              newH = Math.round(newW / targetRatio);
            }
          }
        }
      }

      setCropRect({ x: newX, y: newY, w: newW, h: newH });
      return;
    }

    // Drawing / Selection / Eyedropper move
    toolManager.handlePointerMove(toolEvt);

    if (
      mainCanvasRef.current &&
      (activeTool === 'brush' || activeTool === 'pencil' || activeTool === 'eraser')
    ) {
      Compositor.compositeToCanvas(document, mainCanvasRef.current);
    }
  };

  const handlePointerUp = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
        panStartRef.current = null;
        return;
      }

      const toolEvt = getToolEvent(e);

      // Handle Shape Tool finish
      if (isDrawingShapeRef.current && shapeStartRef.current) {
        isDrawingShapeRef.current = false;
        const sx = shapeStartRef.current.x;
        const sy = shapeStartRef.current.y;
        const cx = toolEvt ? toolEvt.docPoint.x : sx;
        const cy = toolEvt ? toolEvt.docPoint.y : sy;

        const shapeType =
          activeTool === 'shape-ellipse'
            ? 'ellipse'
            : activeTool === 'shape-line'
            ? 'line'
            : 'rectangle';

        const minX = Math.round(Math.min(sx, cx));
        const minY = Math.round(Math.min(sy, cy));
        const w = Math.round(Math.abs(cx - sx));
        const h = Math.round(Math.abs(cy - sy));
        const dist = Math.hypot(cx - sx, cy - sy);

        shapeStartRef.current = null;
        setShapePreview(null);

        if (dist >= 3) {
          const { toolOptions: sOpts, foregroundColor } = useEditorStore.getState();
          const strokeColor = sOpts.shape.stroke || '#ffffff';
          const fillColor = sOpts.shape.fill || foregroundColor;
          const strokeWidth = sOpts.shape.strokeWidth || 2;

          const newLayer = LayerFactory.createShapeLayer(
            shapeType,
            minX,
            minY,
            Math.max(1, w),
            Math.max(1, h),
            {
              fill: shapeType === 'line' ? 'transparent' : fillColor,
              stroke: strokeColor,
              strokeWidth,
              points: [Math.round(sx), Math.round(sy), Math.round(cx), Math.round(cy)],
            }
          );
          addLayer(newLayer);
        }
        return;
      }

      // Handle Move Tool drop
      if (isMovingLayerRef.current && moveStartRef.current && document?.activeLayerId) {
        isMovingLayerRef.current = false;
        const layerId = document.activeLayerId;
        const curDoc = useDocumentStore.getState().document;
        const activeLayer = curDoc?.layers.find((l) => l.id === layerId);
        const startX = moveStartRef.current.layerX;
        const startY = moveStartRef.current.layerY;
        const endX = activeLayer?.x ?? startX;
        const endY = activeLayer?.y ?? startY;

        if (startX !== endX || startY !== endY) {
          historyManager.push({
            id: `move_${Date.now()}`,
            type: 'layer_transform',
            description: 'Move Layer',
            timestamp: Date.now(),
            undo: () => updateLayer(layerId, { x: startX, y: startY }, false),
            redo: () => updateLayer(layerId, { x: endX, y: endY }, false),
          });
        }
        moveStartRef.current = null;
        return;
      }

      // Handle Crop Tool drag finish
      if (isCroppingRef.current) {
        isCroppingRef.current = false;
        cropStartRef.current = null;
        cropInitialRectRef.current = null;
        cropHandleRef.current = 'none';

        const cur = useEditorStore.getState().cropRect;
        if (cur && (cur.w < 10 || cur.h < 10) && document) {
          setCropRect({ x: 0, y: 0, w: document.width, h: document.height });
        }
        return;
      }

      if (toolEvt) {
        toolManager.handlePointerUp(toolEvt);
      }

      if (mainCanvasRef.current && document) {
        Compositor.compositeToCanvas(document, mainCanvasRef.current);
      }
    },
    [document, getToolEvent, isPanning, activeTool, addLayer, updateLayer]
  );

  // Global window listeners so dragging or drawing never gets stuck when mouse leaves window
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      handlePointerUp(e);
    };
    const handleGlobalBlur = () => {
      toolManager.cancelDrawing();
      isMovingLayerRef.current = false;
      isCroppingRef.current = false;
      isDrawingShapeRef.current = false;
      setIsPanning(false);
      setShapePreview(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('blur', handleGlobalBlur);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('blur', handleGlobalBlur);
    };
  }, [handlePointerUp]);

  const handleApplyCrop = () => {
    const curCrop = useEditorStore.getState().cropRect;
    const curDoc = useDocumentStore.getState().document;
    if (!curDoc || !curCrop || curCrop.w < 5 || curCrop.h < 5) return;

    const targetX = Math.round(curCrop.x);
    const targetY = Math.round(curCrop.y);
    const targetW = Math.round(curCrop.w);
    const targetH = Math.round(curCrop.h);

    cropDocument(targetX, targetY, targetW, targetH);

    setCropRect(null);
    setActiveTool('move');

    // Realign viewport to fit new cropped document
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const fit = calculateFitZoom(targetW, targetH, clientWidth, clientHeight);
      setZoom(fit);
      setPan(0, 0);
    }
  };

  const handleResetCrop = () => {
    if (!document) return;
    setCropRect({
      x: 0,
      y: 0,
      w: document.width,
      h: document.height,
    });
  };

  const handleCancelCrop = () => {
    setCropRect(null);
    setActiveTool('move');
  };

  // Enter applies crop, Escape cancels crop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTool !== 'crop') return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApplyCrop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelCrop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, cropRect, document]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!document) return;
    const toolEvt = getToolEvent(e);
    if (!toolEvt) return;
    const docX = Math.round(toolEvt.docPoint.x);
    const docY = Math.round(toolEvt.docPoint.y);

    // Double click inside crop box commits crop
    if (activeTool === 'crop' && cropRect) {
      if (
        docX >= cropRect.x &&
        docX <= cropRect.x + cropRect.w &&
        docY >= cropRect.y &&
        docY <= cropRect.y + cropRect.h
      ) {
        handleApplyCrop();
        return;
      }
    }

    const hitTextLayer = document.layers
      .slice()
      .reverse()
      .find(
        (l) =>
          l.type === 'text' &&
          l.visible &&
          !l.locked &&
          docX >= l.x &&
          docX <= l.x + l.width &&
          docY >= l.y &&
          docY <= l.y + l.height
      );

    if (hitTextLayer) {
      setActiveLayer(hitTextLayer.id);
      setActivePanelTab('properties');
      const currentText = (hitTextLayer as any).text || '';
      const newText = prompt('Edit text content:', currentText);
      if (newText !== null && newText !== undefined && newText !== currentText) {
        updateLayer(hitTextLayer.id, { text: newText }, true, 'Edit Text');
      }
    }
  };

  // Cursor calculation
  const getCursorClass = () => {
    if (isSpacePressed || isPanning || activeTool === 'hand') {
      return isPanning ? 'cursor-grabbing' : 'cursor-grab';
    }
    if (activeTool === 'crop') {
      if (hoverCropHandle === 'nw' || hoverCropHandle === 'se') return 'cursor-nwse-resize';
      if (hoverCropHandle === 'ne' || hoverCropHandle === 'sw') return 'cursor-nesw-resize';
      if (hoverCropHandle === 'n' || hoverCropHandle === 's') return 'cursor-ns-resize';
      if (hoverCropHandle === 'w' || hoverCropHandle === 'e') return 'cursor-ew-resize';
      if (hoverCropHandle === 'inside') return 'cursor-move';
      return 'cursor-crosshair';
    }
    switch (activeTool) {
      case 'move':
        return 'cursor-move';
      case 'brush':
      case 'pencil':
      case 'eraser':
        return 'cursor-crosshair';
      case 'select-rect':
      case 'select-ellipse':
      case 'shape-rect':
      case 'shape-ellipse':
      case 'shape-line':
        return 'cursor-crosshair';
      case 'text':
        return 'cursor-text';
      case 'eyedropper':
        return 'cursor-crosshair';
      case 'zoom':
        return 'cursor-zoom-in';
      default:
        return 'cursor-default';
    }
  };

  if (!document) {
    return null;
  }

  const selection = document.selection;
  const activeLayer = document.layers.find((l) => l.id === document.activeLayerId);

  return (
    <main
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative flex-1 bg-editor-workspace overflow-hidden flex items-center justify-center select-none ${getCursorClass()}`}
    >
      {/* Workspace Transformed Document Viewport */}
      <div
        style={{
          transform: `translate(${viewport.panX}px, ${viewport.panY}px)`,
          transition: isPanning ? 'none' : 'transform 0.05s ease-out',
        }}
        className="relative"
      >
        {/* Document Frame */}
        <div
          ref={documentFrameRef}
          onDoubleClick={handleDoubleClick}
          style={{
            width: document.width * viewport.zoom,
            height: document.height * viewport.zoom,
          }}
          className="relative doc-checkerboard shadow-2xl ring-1 ring-black/40 overflow-hidden"
        >
          {/* Main Composited Canvas */}
          <canvas
            ref={mainCanvasRef}
            width={document.width}
            height={document.height}
            className="w-full h-full object-contain pointer-events-none"
            style={{ imageRendering: viewport.zoom > 2 ? 'pixelated' : 'auto' }}
          />

          {/* Selection Marching Ants Overlay */}
          {selection && selection.active && selection.width > 0 && selection.height > 0 && (
            <svg
              className="absolute inset-0 pointer-events-none w-full h-full"
              viewBox={`0 0 ${document.width} ${document.height}`}
            >
              {selection.type === 'rect' ? (
                <rect
                  x={selection.x}
                  y={selection.y}
                  width={selection.width}
                  height={selection.height}
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke="#ffffff"
                  strokeWidth={1.5 / viewport.zoom}
                  className="marching-ants"
                />
              ) : (
                <ellipse
                  cx={selection.x + selection.width / 2}
                  cy={selection.y + selection.height / 2}
                  rx={selection.width / 2}
                  ry={selection.height / 2}
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke="#ffffff"
                  strokeWidth={1.5 / viewport.zoom}
                  className="marching-ants"
                />
              )}
            </svg>
          )}

          {/* Live Shape Preview Overlay */}
          {shapePreview && (
            <svg
              className="absolute inset-0 pointer-events-none w-full h-full"
              viewBox={`0 0 ${document.width} ${document.height}`}
            >
              {shapePreview.shapeType === 'rectangle' && (
                <rect
                  x={shapePreview.x}
                  y={shapePreview.y}
                  width={shapePreview.w}
                  height={shapePreview.h}
                  fill={toolOptions.shape.fill || '#3b82f6'}
                  stroke={toolOptions.shape.stroke || '#ffffff'}
                  strokeWidth={Math.max(1, toolOptions.shape.strokeWidth) / viewport.zoom}
                />
              )}
              {shapePreview.shapeType === 'ellipse' && (
                <ellipse
                  cx={shapePreview.x + shapePreview.w / 2}
                  cy={shapePreview.y + shapePreview.h / 2}
                  rx={Math.max(1, shapePreview.w / 2)}
                  ry={Math.max(1, shapePreview.h / 2)}
                  fill={toolOptions.shape.fill || '#3b82f6'}
                  stroke={toolOptions.shape.stroke || '#ffffff'}
                  strokeWidth={Math.max(1, toolOptions.shape.strokeWidth) / viewport.zoom}
                />
              )}
              {shapePreview.shapeType === 'line' && shapePreview.points && (
                <line
                  x1={shapePreview.points[0]}
                  y1={shapePreview.points[1]}
                  x2={shapePreview.points[2]}
                  y2={shapePreview.points[3]}
                  stroke={toolOptions.shape.stroke || '#ffffff'}
                  strokeWidth={Math.max(1, toolOptions.shape.strokeWidth) / viewport.zoom}
                  strokeLinecap="round"
                />
              )}
            </svg>
          )}

          {/* Active Layer Transform Box (Move Tool) */}
          {activeTool === 'move' && activeLayer && !activeLayer.locked && (
            <svg
              className="absolute inset-0 pointer-events-none w-full h-full"
              viewBox={`0 0 ${document.width} ${document.height}`}
            >
              <rect
                x={activeLayer.x}
                y={activeLayer.y}
                width={activeLayer.width}
                height={activeLayer.height}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={1.5 / viewport.zoom}
                strokeDasharray="4 2"
              />
              {[
                [activeLayer.x, activeLayer.y],
                [activeLayer.x + activeLayer.width, activeLayer.y],
                [activeLayer.x, activeLayer.y + activeLayer.height],
                [activeLayer.x + activeLayer.width, activeLayer.y + activeLayer.height],
              ].map(([hx, hy], i) => (
                <rect
                  key={i}
                  x={hx - 3 / viewport.zoom}
                  y={hy - 3 / viewport.zoom}
                  width={6 / viewport.zoom}
                  height={6 / viewport.zoom}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={1 / viewport.zoom}
                />
              ))}
            </svg>
          )}

          {/* Interactive Crop Overlay */}
          {activeTool === 'crop' && cropRect && cropRect.w > 0 && cropRect.h > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              <svg
                className="w-full h-full"
                viewBox={`0 0 ${document.width} ${document.height}`}
              >
                {/* Dark dim outside crop */}
                <path
                  d={`M0 0 H${document.width} V${document.height} H0 Z M${cropRect.x} ${cropRect.y} V${cropRect.y + cropRect.h} H${cropRect.x + cropRect.w} V${cropRect.y} Z`}
                  fill="rgba(0,0,0,0.55)"
                  fillRule="evenodd"
                />

                {/* Rule of thirds grid lines */}
                <line
                  x1={cropRect.x + cropRect.w / 3}
                  y1={cropRect.y}
                  x2={cropRect.x + cropRect.w / 3}
                  y2={cropRect.y + cropRect.h}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={1 / viewport.zoom}
                />
                <line
                  x1={cropRect.x + (cropRect.w * 2) / 3}
                  y1={cropRect.y}
                  x2={cropRect.x + (cropRect.w * 2) / 3}
                  y2={cropRect.y + cropRect.h}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={1 / viewport.zoom}
                />
                <line
                  x1={cropRect.x}
                  y1={cropRect.y + cropRect.h / 3}
                  x2={cropRect.x + cropRect.w}
                  y2={cropRect.y + cropRect.h / 3}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={1 / viewport.zoom}
                />
                <line
                  x1={cropRect.x}
                  y1={cropRect.y + (cropRect.h * 2) / 3}
                  x2={cropRect.x + cropRect.w}
                  y2={cropRect.y + (cropRect.h * 2) / 3}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={1 / viewport.zoom}
                />

                {/* Crop boundary */}
                <rect
                  x={cropRect.x}
                  y={cropRect.y}
                  width={cropRect.w}
                  height={cropRect.h}
                  fill="transparent"
                  stroke="#ffffff"
                  strokeWidth={1.5 / viewport.zoom}
                />

                {/* 8 Interactive Resize Handles */}
                {[
                  // NW, NE, SE, SW corners
                  [cropRect.x, cropRect.y],
                  [cropRect.x + cropRect.w, cropRect.y],
                  [cropRect.x + cropRect.w, cropRect.y + cropRect.h],
                  [cropRect.x, cropRect.y + cropRect.h],
                  // N, E, S, W edges
                  [cropRect.x + cropRect.w / 2, cropRect.y],
                  [cropRect.x + cropRect.w, cropRect.y + cropRect.h / 2],
                  [cropRect.x + cropRect.w / 2, cropRect.y + cropRect.h],
                  [cropRect.x, cropRect.y + cropRect.h / 2],
                ].map(([hx, hy], i) => (
                  <rect
                    key={i}
                    x={hx - 4.5 / viewport.zoom}
                    y={hy - 4.5 / viewport.zoom}
                    width={9 / viewport.zoom}
                    height={9 / viewport.zoom}
                    fill="#ffffff"
                    stroke="#1e1e24"
                    strokeWidth={1 / viewport.zoom}
                  />
                ))}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Floating Crop Confirmation Toolbar */}
      {activeTool === 'crop' && cropRect && cropRect.w >= 10 && cropRect.h >= 10 && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1e1e24] border border-[#3e3e4a] rounded-lg shadow-xl px-3 py-2 flex items-center gap-3 select-none"
        >
          <span className="text-xs text-editor-muted">
            Crop: {Math.round(cropRect.w)} × {Math.round(cropRect.h)} px
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyCrop}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1"
          >
            <Check size={14} />
            <span>Apply Crop</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetCrop}
            className="gap-1"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancelCrop}
            className="gap-1"
          >
            <CloseIcon size={14} />
            <span>Cancel</span>
          </Button>
        </div>
      )}
    </main>
  );
};
