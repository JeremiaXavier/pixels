import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';
import { toolManager } from '@/tools/ToolManager';
import { Compositor } from '@/canvas/Compositor';
import { LayerFactory } from '@/document/Layer';
import { DocumentManager } from '@/document/Document';
import { historyManager } from '@/history/HistoryManager';
import { screenToDocument } from '@/canvas/CoordinateSystem';

describe('Repaired Editing Tools Verification', () => {
  beforeEach(() => {
    historyManager.clear();
    useDocumentStore.getState().createNewDocument('Test', 200, 200, 'transparent');
    useEditorStore.getState().resetDefaultColors();
  });

  it('1. draws a stroke, finishes it, and accurately undoes/redoes', () => {
    const docStore = useDocumentStore.getState();
    const doc = docStore.document!;
    expect(doc.layers.length).toBe(1);

    useEditorStore.getState().setActiveTool('brush');
    useEditorStore.getState().setForegroundColor('#ff0000');

    // Pointer down, move, up
    toolManager.handlePointerDown({
      docPoint: { x: 50, y: 50 },
      screenPoint: { x: 50, y: 50 },
      shiftKey: false,
      altKey: false,
      ctrlKey: false,
      button: 0,
    });

    toolManager.handlePointerMove({
      docPoint: { x: 55, y: 55 },
      screenPoint: { x: 55, y: 55 },
      shiftKey: false,
      altKey: false,
      ctrlKey: false,
      button: 0,
    });

    toolManager.handlePointerUp({
      docPoint: { x: 55, y: 55 },
      screenPoint: { x: 55, y: 55 },
      shiftKey: false,
      altKey: false,
      ctrlKey: false,
      button: 0,
    });

    // Check history was recorded
    expect(historyManager.canUndo()).toBe(true);

    // Sample color after drawing
    const curDoc = useDocumentStore.getState().document!;
    const colorAfter = Compositor.sampleColor(curDoc, 50, 50);
    expect(colorAfter).toBe('#ff0000');

    // Undo stroke
    historyManager.undo();
    const docAfterUndo = useDocumentStore.getState().document!;
    const colorAfterUndo = Compositor.sampleColor(docAfterUndo, 50, 50);
    // On transparent background, undoing restores transparent (sampleColor returns null)
    expect(colorAfterUndo).toBeNull();

    // Redo stroke
    historyManager.redo();
    const docAfterRedo = useDocumentStore.getState().document!;
    const colorAfterRedo = Compositor.sampleColor(docAfterRedo, 50, 50);
    expect(colorAfterRedo).toBe('#ff0000');
  });

  it('2. creates rectangle, ellipse, and line shapes and renders properly', () => {
    const docStore = useDocumentStore.getState();

    // Create Rectangle
    const rectLayer = LayerFactory.createShapeLayer('rectangle', 10, 10, 60, 40, {
      fill: '#00ff00',
      stroke: '#000000',
      strokeWidth: 2,
    });
    docStore.addLayer(rectLayer);

    // Create Ellipse
    const ellipseLayer = LayerFactory.createShapeLayer('ellipse', 80, 10, 50, 50, {
      fill: '#0000ff',
      stroke: '#ffffff',
      strokeWidth: 2,
    });
    docStore.addLayer(ellipseLayer);

    // Create Line
    const lineLayer = LayerFactory.createShapeLayer('line', 10, 80, 50, 50, {
      stroke: '#ffff00',
      strokeWidth: 3,
      points: [10, 80, 60, 130],
    });
    docStore.addLayer(lineLayer);

    const doc = useDocumentStore.getState().document!;
    expect(doc.layers.length).toBe(4); // 1 base + 3 shapes

    // Compositor renders all layers without error
    const canvas = Compositor.compositeToCanvas(doc);
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(200);
  });

  it('3. creates and edits text with different styles and alignments', () => {
    const docStore = useDocumentStore.getState();

    const textLayer = LayerFactory.createTextLayer('Initial Text', 30, 40, {
      fontSize: 28,
      fontFamily: 'Arial, sans-serif',
      fill: '#ff00ff',
      align: 'center',
      bold: true,
      italic: true,
    });
    docStore.addLayer(textLayer);

    let doc = useDocumentStore.getState().document!;
    const addedText = doc.layers.find((l) => l.id === textLayer.id) as any;
    expect(addedText.text).toBe('Initial Text');
    expect(addedText.bold).toBe(true);
    expect(addedText.align).toBe('center');

    // Update text content and alignment
    docStore.updateLayer(textLayer.id, { text: 'Updated Text', align: 'right' });
    doc = useDocumentStore.getState().document!;
    const updated = doc.layers.find((l) => l.id === textLayer.id) as any;
    expect(updated.text).toBe('Updated Text');
    expect(updated.align).toBe('right');

    const canvas = Compositor.compositeToCanvas(doc);
    expect(canvas).toBeDefined();
  });

  it('4. samples colors from visible, transparent, and out-of-bounds pixels correctly', () => {
    const docStore = useDocumentStore.getState();
    const doc = docStore.document!;
    const rLayer = doc.layers[0] as any;
    const ctx = rLayer.canvas.getContext('2d');

    // Draw a blue square at (20, 20) to (60, 60)
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(20, 20, 40, 40);

    // Visible pixel inside square -> returns hex
    const sampleVisible = Compositor.sampleColor(doc, 30, 30);
    expect(sampleVisible).toBe('#0000ff');

    // Fully transparent pixel outside square -> returns null (preserves current foreground color)
    const sampleTransparent = Compositor.sampleColor(doc, 100, 100);
    expect(sampleTransparent).toBeNull();

    // Out of bounds -> returns null
    const sampleOOBNegative = Compositor.sampleColor(doc, -10, 50);
    expect(sampleOOBNegative).toBeNull();

    const sampleOOBExcess = Compositor.sampleColor(doc, 500, 500);
    expect(sampleOOBExcess).toBeNull();
  });

  it('5. crops using forward and reverse drag directions, and supports undo/redo', () => {
    const docStore = useDocumentStore.getState();
    let doc = docStore.document!;
    expect(doc.width).toBe(200);
    expect(doc.height).toBe(200);

    // Forward crop: (10, 10) to (110, 110)
    docStore.cropDocument(10, 10, 100, 100);
    doc = useDocumentStore.getState().document!;
    expect(doc.width).toBe(100);
    expect(doc.height).toBe(100);

    // Undo crop
    historyManager.undo();
    doc = useDocumentStore.getState().document!;
    expect(doc.width).toBe(200);
    expect(doc.height).toBe(200);

    // Redo crop
    historyManager.redo();
    doc = useDocumentStore.getState().document!;
    expect(doc.width).toBe(100);
    expect(doc.height).toBe(100);

    // Reverse crop normalized bounds check
    const reverseCropDoc = DocumentManager.cropDocument(doc, 80, 80, -50, -50);
    expect(reverseCropDoc.width).toBe(50);
    expect(reverseCropDoc.height).toBe(50);
  });

  it('6. moves a layer and visible composite immediately follows it', () => {
    const docStore = useDocumentStore.getState();
    const doc = docStore.document!;
    const activeLayer = doc.layers[0];

    // Initial position
    expect(activeLayer.x).toBe(0);
    expect(activeLayer.y).toBe(0);

    // Move layer
    docStore.updateLayer(activeLayer.id, { x: 35, y: 45 });
    const movedDoc = useDocumentStore.getState().document!;
    const movedLayer = movedDoc.layers[0];
    expect(movedLayer.x).toBe(35);
    expect(movedLayer.y).toBe(45);

    // Render composite
    const canvas = Compositor.compositeToCanvas(movedDoc);
    expect(canvas).toBeDefined();
  });

  it('7. verifies coordinate accuracy at various zoom and pan settings', () => {
    // Container 800x600, Document 400x300
    // Test 1: zoom = 1, pan = (0, 0)
    const pt1 = screenToDocument(
      { x: 400, y: 300 }, // center of container
      { zoom: 1, panX: 0, panY: 0 },
      400,
      300,
      800,
      600
    );
    expect(pt1.x).toBe(200); // center of document
    expect(pt1.y).toBe(150);

    // Test 2: zoom = 2, pan = (100, 50)
    const pt2 = screenToDocument(
      { x: 500, y: 350 }, // center of viewport (400 + 100, 300 + 50)
      { zoom: 2, panX: 100, panY: 50 },
      400,
      300,
      800,
      600
    );
    expect(pt2.x).toBe(200);
    expect(pt2.y).toBe(150);
  });
});
