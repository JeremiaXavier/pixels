import { Layer, RasterLayer, TextLayer, ShapeLayer, BlendMode } from '@/types';

export class LayerFactory {
  private static idCounter = 0;

  public static generateId(): string {
    return `layer_${Date.now()}_${++this.idCounter}`;
  }

  /**
   * Create an editable raster layer with an in-memory HTMLCanvasElement
   */
  public static createRasterLayer(
    name: string,
    width: number,
    height: number,
    options: Partial<RasterLayer> = {}
  ): RasterLayer {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));

    return {
      id: this.generateId(),
      name,
      type: 'raster',
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'source-over',
      x: 0,
      y: 0,
      width,
      height,
      rotation: 0,
      canvas,
      dataUrl: canvas.toDataURL(),
      ...options,
    };
  }

  /**
   * Create a raster layer initialized from an HTMLImageElement
   */
  public static createRasterLayerFromImage(
    img: HTMLImageElement,
    name: string,
    docWidth: number,
    docHeight: number
  ): RasterLayer {
    const layer = this.createRasterLayer(name, img.naturalWidth, img.naturalHeight);
    const ctx = layer.canvas!.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      layer.dataUrl = layer.canvas!.toDataURL();
    }
    // Center if image is smaller than document
    if (img.naturalWidth < docWidth || img.naturalHeight < docHeight) {
      layer.x = Math.max(0, Math.round((docWidth - img.naturalWidth) / 2));
      layer.y = Math.max(0, Math.round((docHeight - img.naturalHeight) / 2));
    }
    return layer;
  }

  /**
   * Create an editable text layer
   */
  public static createTextLayer(
    text: string,
    x: number,
    y: number,
    options: Partial<TextLayer> = {}
  ): TextLayer {
    return {
      id: this.generateId(),
      name: text.slice(0, 15) || 'Text Layer',
      type: 'text',
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'source-over',
      x,
      y,
      width: 200,
      height: 50,
      rotation: 0,
      text,
      fontSize: 32,
      fontFamily: 'Inter, sans-serif',
      fill: '#ffffff',
      align: 'left',
      bold: false,
      italic: false,
      underline: false,
      ...options,
    };
  }

  /**
   * Create an editable shape layer
   */
  public static createShapeLayer(
    shapeType: 'rectangle' | 'ellipse' | 'line',
    x: number,
    y: number,
    width: number,
    height: number,
    options: Partial<ShapeLayer> = {}
  ): ShapeLayer {
    const names = {
      rectangle: 'Rectangle',
      ellipse: 'Ellipse',
      line: 'Line',
    };
    return {
      id: this.generateId(),
      name: names[shapeType] || 'Shape',
      type: 'shape',
      shapeType,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'source-over',
      x,
      y,
      width,
      height,
      rotation: 0,
      fill: '#3b82f6',
      stroke: '#ffffff',
      strokeWidth: 2,
      ...options,
    };
  }

  /**
   * Deep clone a layer (including its raster canvas buffer)
   */
  public static duplicateLayer(layer: Layer): Layer {
    const cloned: Layer = {
      ...JSON.parse(JSON.stringify(layer)),
      id: this.generateId(),
      name: `${layer.name} copy`,
    };

    if (layer.type === 'raster') {
      const origRaster = layer as RasterLayer;
      const newCanvas = document.createElement('canvas');
      newCanvas.width = origRaster.width;
      newCanvas.height = origRaster.height;
      const ctx = newCanvas.getContext('2d');
      if (ctx && origRaster.canvas) {
        ctx.drawImage(origRaster.canvas, 0, 0);
      }
      (cloned as RasterLayer).canvas = newCanvas;
      (cloned as RasterLayer).dataUrl = newCanvas.toDataURL();
    }

    return cloned;
  }

  /**
   * Rotate a raster layer by 90 deg steps or flip horizontally/vertically
   */
  public static transformRasterCanvas(
    layer: RasterLayer,
    operation: 'rotate90cw' | 'rotate90ccw' | 'rotate180' | 'flipH' | 'flipV'
  ): void {
    if (!layer.canvas) return;
    const oldCanvas = layer.canvas;
    const w = oldCanvas.width;
    const h = oldCanvas.height;

    const newCanvas = document.createElement('canvas');
    if (operation === 'rotate90cw' || operation === 'rotate90ccw') {
      newCanvas.width = h;
      newCanvas.height = w;
    } else {
      newCanvas.width = w;
      newCanvas.height = h;
    }

    const ctx = newCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    switch (operation) {
      case 'rotate90cw':
        ctx.translate(h, 0);
        ctx.rotate(Math.PI / 2);
        break;
      case 'rotate90ccw':
        ctx.translate(0, w);
        ctx.rotate(-Math.PI / 2);
        break;
      case 'rotate180':
        ctx.translate(w, h);
        ctx.rotate(Math.PI);
        break;
      case 'flipH':
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        break;
      case 'flipV':
        ctx.translate(0, h);
        ctx.scale(1, -1);
        break;
    }

    ctx.drawImage(oldCanvas, 0, 0);
    ctx.restore();

    layer.canvas = newCanvas;
    layer.width = newCanvas.width;
    layer.height = newCanvas.height;
    layer.dataUrl = newCanvas.toDataURL();
  }
}
