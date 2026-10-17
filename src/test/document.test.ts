import { describe, it, expect } from 'vitest';
import { DocumentManager } from '@/document/Document';
import { LayerFactory } from '@/document/Layer';
import { SelectionManager } from '@/document/Selection';
import { useDocumentStore } from '@/store/documentStore';

describe('DocumentManager', () => {
  it('initializes a document with default background layer and dimensions', () => {
    const doc = DocumentManager.createDocument('Test Doc', 800, 600, '#ffffff');
    expect(doc.name).toBe('Test Doc');
    expect(doc.width).toBe(800);
    expect(doc.height).toBe(600);
    expect(doc.layers.length).toBe(1);
    expect(doc.layers[0].name).toBe('Background');
    expect(doc.activeLayerId).toBe(doc.layers[0].id);
  });

  it('duplicates an existing layer', () => {
    const doc = DocumentManager.createDocument('Test', 500, 500);
    const bgId = doc.layers[0].id;
    const updated = DocumentManager.duplicateLayer(doc, bgId);

    expect(updated.layers.length).toBe(2);
    expect(updated.layers[1].name).toBe('Background copy');
    expect(updated.activeLayerId).toBe(updated.layers[1].id);
  });

  it('prevents removing the last remaining layer', () => {
    const doc = DocumentManager.createDocument('Test', 500, 500);
    const bgId = doc.layers[0].id;
    const updated = DocumentManager.removeLayer(doc, bgId);

    expect(updated.layers.length).toBe(1);
  });

  it('reorders layers correctly', () => {
    let doc = DocumentManager.createDocument('Test', 500, 500);
    const layer2 = LayerFactory.createRasterLayer('Layer 2', 500, 500);
    doc = { ...doc, layers: [...doc.layers, layer2] };

    expect(doc.layers[0].name).toBe('Background');
    expect(doc.layers[1].name).toBe('Layer 2');

    const reordered = DocumentManager.reorderLayers(doc, 0, 1);
    expect(reordered.layers[0].name).toBe('Layer 2');
    expect(reordered.layers[1].name).toBe('Background');
  });

  it('resizes canvas with correct new dimensions and layer offset', () => {
    const doc = DocumentManager.createDocument('Test', 400, 400);
    const resized = DocumentManager.resizeCanvas(doc, 600, 600, 'center');

    expect(resized.width).toBe(600);
    expect(resized.height).toBe(600);
    expect(resized.layers[0].x).toBe(100);
    expect(resized.layers[0].y).toBe(100);
  });

  it('resizes image scaling all layers proportionally', () => {
    const doc = DocumentManager.createDocument('Test', 200, 200);
    const resized = DocumentManager.resizeImage(doc, 400, 400);

    expect(resized.width).toBe(400);
    expect(resized.height).toBe(400);
    expect(resized.layers[0].width).toBe(400);
    expect(resized.layers[0].height).toBe(400);
  });

  it('rotates document dimensions on 90 degree rotation', () => {
    const doc = DocumentManager.createDocument('Test', 800, 600);
    const rotated = DocumentManager.rotateDocument(doc, 90);

    expect(rotated.width).toBe(600);
    expect(rotated.height).toBe(800);
  });

  it('crops document and updates layer coordinates', () => {
    const doc = DocumentManager.createDocument('Test', 800, 600);
    const cropped = DocumentManager.cropDocument(doc, 50, 50, 400, 300);

    expect(cropped.width).toBe(400);
    expect(cropped.height).toBe(300);
  });
});

describe('SelectionManager', () => {
  it('creates full document selection on selectAll', () => {
    const sel = SelectionManager.selectAll(1920, 1080);
    expect(sel.active).toBe(true);
    expect(sel.width).toBe(1920);
    expect(sel.height).toBe(1080);
  });

  it('inverts selection flag', () => {
    const sel = SelectionManager.selectAll(500, 500);
    const inverted = SelectionManager.invert(sel, 500, 500);
    expect(inverted.inverted).toBe(true);
  });

  it('correctly determines whether points are inside selection', () => {
    const sel = SelectionManager.combine(
      null,
      { x: 100, y: 100, width: 200, height: 200, type: 'rect' },
      'replace'
    );

    expect(SelectionManager.isPointInside({ x: 150, y: 150 }, sel)).toBe(true);
    expect(SelectionManager.isPointInside({ x: 50, y: 50 }, sel)).toBe(false);
  });

  it('clears selection contents on raster layer using store action', () => {
    useDocumentStore.getState().createNewDocument('Test Clear', 200, 200);
    useDocumentStore.getState().setSelection({
      active: true,
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      type: 'rect',
    });

    // Invoke clear
    useDocumentStore.getState().clearSelectionContents();
    const doc = useDocumentStore.getState().document;
    expect(doc?.isDirty).toBe(true);
  });
});
