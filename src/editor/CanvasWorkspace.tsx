import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';
import { toolManager, ToolPointerEvent } from '@/tools/ToolManager';
import { Compositor } from '@/canvas/Compositor';
import { screenToDocument, calculateFitZoom } from '@/canvas/CoordinateSystem';
import { historyManager } from '@/history/HistoryManager';
import { Check, X as CloseIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const CanvasWorkspace: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const document = useDocumentStore((state) => state.document);
  const { updateLayer, cropDocument } = useDocumentStore();
  const {
    activeTool,
    viewport,
    setZoom,
    setPan,
    setCursorCoordinates,
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
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null
  );
  const isCroppingRef = useRef(false);
  const cropStartRef = useRef<{ x: number; y: number } | null>(null);

  // Fit to screen on initial load
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

  // Convert React mouse event to ToolPointerEvent with exact document coordinates
  const getToolEvent = (e: React.MouseEvent): ToolPointerEvent | null => {
    if (!document || !containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const docPt = screenToDocument(
      { x: screenX, y: screenY },
      viewport,
      document.width,
      document.height,
      rect.width,
      rect.height
    );

    return {
      docPoint: docPt,
      screenPoint: { x: screenX, y: screenY },
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey || e.metaKey,
      button: e.button,
    };
  };

  const handlePointerDown = (e: React.MouseEvent) => {
    if (!document || !containerRef.current) return;

    // Middle click or spacebar pan
    if (e.button === 1 || isSpacePressed || activeTool === 'hand') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const toolEvt = getToolEvent(e);
    if (!toolEvt) return;

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
      isCroppingRef.current = true;
      cropStartRef.current = { x: toolEvt.docPoint.x, y: toolEvt.docPoint.y };
      setCropRect({ x: toolEvt.docPoint.x, y: toolEvt.docPoint.y, w: 0, h: 0 });
      return;
    }

    // Standard drawing / selection / eyedropper / zoom
    toolManager.handlePointerDown(toolEvt);

    // Immediate visual composite sync
    if (mainCanvasRef.current && (activeTool === 'brush' || activeTool === 'pencil' || activeTool === 'eraser')) {
      Compositor.compositeToCanvas(document, mainCanvasRef.current);
    }
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (!document || !containerRef.current) return;

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
      return;
    }

    // Handle Crop Tool dragging
    if (isCroppingRef.current && cropStartRef.current) {
      const sx = cropStartRef.current.x;
      const sy = cropStartRef.current.y;
      const cx = toolEvt.docPoint.x;
      const cy = toolEvt.docPoint.y;

      const minX = Math.min(sx, cx);
      const minY = Math.min(sy, cy);
      const w = Math.abs(cx - sx);
      const h = Math.abs(cy - sy);

      setCropRect({ x: minX, y: minY, w, h });
      return;
    }

    toolManager.handlePointerMove(toolEvt);

    if (mainCanvasRef.current && (activeTool === 'brush' || activeTool === 'pencil' || activeTool === 'eraser')) {
      Compositor.compositeToCanvas(document, mainCanvasRef.current);
    }
  };

  const handlePointerUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      return;
    }

    const toolEvt = getToolEvent(e);

    // Handle Move Tool drop
    if (isMovingLayerRef.current && moveStartRef.current && document?.activeLayerId) {
      isMovingLayerRef.current = false;
      const layerId = document.activeLayerId;
      const activeLayer = document.layers.find((l) => l.id === layerId);
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

    // Handle Crop Tool finish
    if (isCroppingRef.current) {
      isCroppingRef.current = false;
      cropStartRef.current = null;
      return;
    }

    if (toolEvt) {
      toolManager.handlePointerUp(toolEvt);
    }

    if (mainCanvasRef.current && document) {
      Compositor.compositeToCanvas(document, mainCanvasRef.current);
    }
  };

  const handleApplyCrop = () => {
    if (!cropRect || cropRect.w < 5 || cropRect.h < 5) return;
    cropDocument(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    setCropRect(null);
  };

  const handleCancelCrop = () => {
    setCropRect(null);
  };

  // Cursor calculation
  const getCursorClass = () => {
    if (isSpacePressed || isPanning || activeTool === 'hand') {
      return isPanning ? 'cursor-grabbing' : 'cursor-grab';
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
      case 'crop':
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

  return (
    <main
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
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

          {/* Interactive Crop Overlay */}
          {cropRect && cropRect.w > 0 && cropRect.h > 0 && (
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
                <rect
                  x={cropRect.x}
                  y={cropRect.y}
                  width={cropRect.w}
                  height={cropRect.h}
                  fill="transparent"
                  stroke="#ffffff"
                  strokeWidth={2 / viewport.zoom}
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Floating Crop Confirmation Toolbar */}
      {cropRect && cropRect.w > 10 && cropRect.h > 10 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1e1e24] border border-[#3e3e4a] rounded-lg shadow-xl px-3 py-2 flex items-center gap-3">
          <span className="text-xs text-editor-muted">
            Crop: {Math.round(cropRect.w)} × {Math.round(cropRect.h)} px
          </span>
          <Button variant="primary" size="sm" onClick={handleApplyCrop}>
            <Check size={14} />
            <span>Apply Crop</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCancelCrop}>
            <CloseIcon size={14} />
            <span>Cancel</span>
          </Button>
        </div>
      )}
    </main>
  );
};
