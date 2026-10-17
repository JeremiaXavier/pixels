import { PixelsDocument, Layer, RasterLayer, TextLayer } from '@/types';
import { LayerFactory } from './Layer';
import { Compositor } from '@/canvas/Compositor';

export class DocumentManager {
  private static idCounter = 0;

  public static createDocument(
    name = 'Untitled',
    width = 1920,
    height = 1080,
    backgroundColor = '#ffffff'
  ): PixelsDocument {
    const docId = `doc_${Date.now()}_${++this.idCounter}`;
    const initialLayer = LayerFactory.createRasterLayer('Background', width, height);

    // If background color is solid, fill the initial layer canvas
    if (backgroundColor && backgroundColor !== 'transparent') {
      const ctx = initialLayer.canvas?.getContext('2d');
      if (ctx) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        initialLayer.dataUrl = initialLayer.canvas?.toDataURL();
      }
    }

    return {
      id: docId,
      name,
      width,
      height,
      backgroundColor,
      layers: [initialLayer],
      activeLayerId: initialLayer.id,
      selection: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDirty: false,
    };
  }

  /**
   * Create document from an imported image
   */
  public static createFromImage(img: HTMLImageElement, name: string): PixelsDocument {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const docId = `doc_${Date.now()}_${++this.idCounter}`;

    const layer = LayerFactory.createRasterLayerFromImage(img, 'Background', width, height);

    return {
      id: docId,
      name,
      width,
      height,
      backgroundColor: 'transparent',
      layers: [layer],
      activeLayerId: layer.id,
      selection: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDirty: false,
    };
  }

  /**
   * Duplicate a layer
   */
  public static duplicateLayer(doc: PixelsDocument, layerId: string): PixelsDocument {
    const index = doc.layers.findIndex((l) => l.id === layerId);
    if (index === -1) return doc;

    const source = doc.layers[index];
    const clone = LayerFactory.duplicateLayer(source);
    const newLayers = [...doc.layers];
    newLayers.splice(index + 1, 0, clone);

    return {
      ...doc,
      layers: newLayers,
      activeLayerId: clone.id,
      updatedAt: Date.now(),
      isDirty: true,
    };
  }

  /**
   * Delete a layer (prevent removing last layer)
   */
  public static removeLayer(doc: PixelsDocument, layerId: string): PixelsDocument {
    if (doc.layers.length <= 1) {
      // Cannot delete the only remaining layer
      return doc;
    }

    const index = doc.layers.findIndex((l) => l.id === layerId);
    if (index === -1) return doc;

    const newLayers = doc.layers.filter((l) => l.id !== layerId);
    const newActiveIndex = Math.max(0, Math.min(index, newLayers.length - 1));

    return {
      ...doc,
      layers: newLayers,
      activeLayerId: newLayers[newActiveIndex].id,
      updatedAt: Date.now(),
      isDirty: true,
    };
  }

  /**
   * Reorder layers
   */
  public static reorderLayers(doc: PixelsDocument, fromIndex: number, toIndex: number): PixelsDocument {
    if (
      fromIndex < 0 ||
      fromIndex >= doc.layers.length ||
      toIndex < 0 ||
      toIndex >= doc.layers.length ||
      fromIndex === toIndex
    ) {
      return doc;
    }

    const newLayers = [...doc.layers];
    const [moved] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, moved);

    return {
      ...doc,
      layers: newLayers,
      updatedAt: Date.now(),
      isDirty: true,
    };
  }

  /**
   * Merge active layer down onto the layer below it
   */
  public static mergeDown(doc: PixelsDocument, layerId: string): PixelsDocument {
    const index = doc.layers.findIndex((l) => l.id === layerId);
    if (index <= 0) return doc; // Cannot merge bottom-most layer down

    const topLayer = doc.layers[index];
    const bottomLayer = doc.layers[index - 1];

    // Create a merged raster canvas
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = doc.width;
    mergedCanvas.height = doc.height;
    const ctx = mergedCanvas.getContext('2d');
    if (!ctx) return doc;

    // Render bottom layer
    Compositor.renderLayer(ctx, bottomLayer);
    // Render top layer
    ctx.save();
    ctx.globalAlpha = topLayer.opacity;
    ctx.globalCompositeOperation = topLayer.blendMode;
    Compositor.renderLayer(ctx, topLayer);
    ctx.restore();

    const mergedLayer: RasterLayer = {
      id: bottomLayer.id,
      name: `${bottomLayer.name} (Merged)`,
      type: 'raster',
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'source-over',
      x: 0,
      y: 0,
      width: doc.width,
      height: doc.height,
      rotation: 0,
      canvas: mergedCanvas,
      dataUrl: mergedCanvas.toDataURL(),
    };

    const newLayers = [...doc.layers];
    newLayers.splice(index - 1, 2, mergedLayer);

    return {
      ...doc,
      layers: newLayers,
      activeLayerId: mergedLayer.id,
      updatedAt: Date.now(),
      isDirty: true,
    };
  }

  /**
   * Flatten entire image into one background layer
   */
  public static flattenImage(doc: PixelsDocument): PixelsDocument {
    const flatCanvas = Compositor.compositeToCanvas(doc);
    const flatLayer: RasterLayer = {
      id: LayerFactory.generateId(),
      name: 'Background',
      type: 'raster',
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'source-over',
      x: 0,
      y: 0,
      width: doc.width,
      height: doc.height,
      rotation: 0,
      canvas: flatCanvas,
      dataUrl: flatCanvas.toDataURL(),
    };

    return {
      ...doc,
      backgroundColor: 'transparent',
      layers: [flatLayer],
      activeLayerId: flatLayer.id,
      updatedAt: Date.now(),
      isDirty: true,
    };
  }

  /**
   * Crop the document
   */
  public static cropDocument(
    doc: PixelsDocument,
    cropX: number,
    cropY: number,
    cropWidth: number,
    cropHeight: number
  ): PixelsDocument {
    const x1 = Math.round(cropX);
    const y1 = Math.round(cropY);
    const safeX = Math.max(0, Math.min(doc.width - 1, Math.min(x1, x1 + Math.round(cropWidth))));
    const safeY = Math.max(0, Math.min(doc.height - 1, Math.min(y1, y1 + Math.round(cropHeight))));
    const w = Math.max(1, Math.min(doc.width - safeX, Math.round(Math.abs(cropWidth))));
    const h = Math.max(1, Math.min(doc.height - safeY, Math.round(Math.abs(cropHeight))));

    const updatedLayers = doc.layers.map((layer) => {
      if (layer.type === 'raster') {
        const rLayer = layer as RasterLayer;
        const newCanvas = document.createElement('canvas');
        newCanvas.width = w;
        newCanvas.height = h;
        const ctx = newCanvas.getContext('2d');
        if (ctx) {
          if (rLayer.canvas) {
            ctx.drawImage(rLayer.canvas, rLayer.x - safeX, rLayer.y - safeY);
          } else if (rLayer.dataUrl) {
            const img = new Image();
            img.src = rLayer.dataUrl;
            ctx.drawImage(img, rLayer.x - safeX, rLayer.y - safeY);
          }
        }
        return {
          ...rLayer,
          x: 0,
          y: 0,
          width: w,
          height: h,
          canvas: newCanvas,
          dataUrl: newCanvas.toDataURL(),
        };
      } else {
        return {
          ...layer,
          x: layer.x - safeX,
          y: layer.y - safeY,
        };
      }
    });

    return {
      ...doc,
      width: w,
      height: h,
      layers: updatedLayers,
      selection: null,
      updatedAt: Date.now(),
      isDirty: true,
    };
  }

  /**
   * Resize Canvas boundaries (with anchor position)
   */
  public static resizeCanvas(
    doc: PixelsDocument,
    newWidth: number,
    newHeight: number,
    anchor: 'center' | 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right' = 'center'
  ): PixelsDocument {
    const nw = Math.max(1, Math.round(newWidth));
    const nh = Math.max(1, Math.round(newHeight));

    let dx = 0;
    let dy = 0;

    switch (anchor) {
      case 'center':
        dx = (nw - doc.width) / 2;
        dy = (nh - doc.height) / 2;
        break;
      case 'top-left':
        dx = 0;
        dy = 0;
        break;
      case 'top':
        dx = (nw - doc.width) / 2;
        dy = 0;
        break;
      case 'top-right':
        dx = nw - doc.width;
        dy = 0;
        break;
      case 'left':
        dx = 0;
        dy = (nh - doc.height) / 2;
        break;
      case 'right':
        dx = nw - doc.width;
        dy = (nh - doc.height) / 2;
        break;
      case 'bottom-left':
        dx = 0;
        dy = nh - doc.height;
        break;
      case 'bottom':
        dx = (nw - doc.width) / 2;
        dy = nh - doc.height;
        break;
      case 'bottom-right':
        dx = nw - doc.width;
        dy = nh - doc.height;
        break;
    }

    const updatedLayers = doc.layers.map((layer) => ({
      ...layer,
      x: layer.x + dx,
      y: layer.y + dy,
    }));

    return {
      ...doc,
      width: nw,
      height: nh,
      layers: updatedLayers,
      updatedAt: Date.now(),
      isDirty: true,
    };
  }

  /**
   * Resize Image (rescaling all layers and document pixels)
   */
  public static resizeImage(doc: PixelsDocument, newWidth: number, newHeight: number): PixelsDocument {
    const nw = Math.max(1, Math.round(newWidth));
    const nh = Math.max(1, Math.round(newHeight));
    const scaleX = nw / doc.width;
    const scaleY = nh / doc.height;

    const updatedLayers = doc.layers.map((layer) => {
      if (layer.type === 'raster') {
        const rLayer = layer as RasterLayer;
        const newLayerW = Math.max(1, Math.round(rLayer.width * scaleX));
        const newLayerH = Math.max(1, Math.round(rLayer.height * scaleY));

        const newCanvas = document.createElement('canvas');
        newCanvas.width = newLayerW;
        newCanvas.height = newLayerH;
        const ctx = newCanvas.getContext('2d');
        if (ctx && rLayer.canvas) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(rLayer.canvas, 0, 0, newLayerW, newLayerH);
        }

        return {
          ...rLayer,
          x: Math.round(rLayer.x * scaleX),
          y: Math.round(rLayer.y * scaleY),
          width: newLayerW,
          height: newLayerH,
          canvas: newCanvas,
          dataUrl: newCanvas.toDataURL(),
        };
      } else if (layer.type === 'text') {
        const tLayer = layer as TextLayer;
        return {
          ...tLayer,
          x: Math.round(tLayer.x * scaleX),
          y: Math.round(tLayer.y * scaleY),
          width: Math.round(tLayer.width * scaleX),
          height: Math.round(tLayer.height * scaleY),
          fontSize: Math.round(tLayer.fontSize * Math.min(scaleX, scaleY)),
        };
      } else {
        return {
          ...layer,
          x: Math.round(layer.x * scaleX),
          y: Math.round(layer.y * scaleY),
          width: Math.round(layer.width * scaleX),
          height: Math.round(layer.height * scaleY),
        };
      }
    });

    return {
      ...doc,
      width: nw,
      height: nh,
      layers: updatedLayers,
      updatedAt: Date.now(),
      isDirty: true,
    };
  }

  /**
   * Rotate document 90 CW, 90 CCW, or 180 degrees
   */
  public static rotateDocument(doc: PixelsDocument, degrees: 90 | -90 | 180): PixelsDocument {
    const is90 = degrees === 90 || degrees === -90;
    const newDocW = is90 ? doc.height : doc.width;
    const newDocH = is90 ? doc.width : doc.height;

    const op = degrees === 90 ? 'rotate90cw' : degrees === -90 ? 'rotate90ccw' : 'rotate180';

    const updatedLayers = doc.layers.map((layer) => {
      if (layer.type === 'raster') {
        const rLayer = LayerFactory.duplicateLayer(layer) as RasterLayer;
        LayerFactory.transformRasterCanvas(rLayer, op);
        return rLayer;
      }
      return layer;
    });

    return {
      ...doc,
      width: newDocW,
      height: newDocH,
      layers: updatedLayers,
      updatedAt: Date.now(),
      isDirty: true,
    };
  }

  /**
   * Flip document horizontally or vertically
   */
  public static flipDocument(doc: PixelsDocument, direction: 'horizontal' | 'vertical'): PixelsDocument {
    const op = direction === 'horizontal' ? 'flipH' : 'flipV';

    const updatedLayers = doc.layers.map((layer) => {
      if (layer.type === 'raster') {
        const rLayer = LayerFactory.duplicateLayer(layer) as RasterLayer;
        LayerFactory.transformRasterCanvas(rLayer, op);
        return rLayer;
      }
      return layer;
    });

    return {
      ...doc,
      layers: updatedLayers,
      updatedAt: Date.now(),
      isDirty: true,
    };
  }
}
