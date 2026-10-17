import { PixelsDocument, Layer, RasterLayer, TextLayer, ShapeLayer } from '@/types';

/**
 * High performance layer compositor using Canvas 2D API
 */
export class Compositor {
  /**
   * Renders the complete document stack to a target canvas or creates a new offscreen canvas.
   */
  public static compositeToCanvas(
    doc: PixelsDocument,
    targetCanvas?: HTMLCanvasElement
  ): HTMLCanvasElement {
    const canvas = targetCanvas || document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(doc.width));
    canvas.height = Math.max(1, Math.round(doc.height));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Document background
    if (doc.backgroundColor && doc.backgroundColor !== 'transparent') {
      ctx.fillStyle = doc.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Render layers from bottom to top
    for (const layer of doc.layers) {
      if (!layer.visible || layer.opacity <= 0) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
      ctx.globalCompositeOperation = layer.blendMode || 'source-over';

      this.renderLayer(ctx, layer);
      ctx.restore();
    }

    return canvas;
  }

  /**
   * Render a single layer onto a 2D canvas context
   */
  public static renderLayer(ctx: CanvasRenderingContext2D, layer: Layer): void {
    ctx.save();

    // Position and rotation
    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;

    ctx.translate(centerX, centerY);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }
    ctx.translate(-centerX, -centerY);

    switch (layer.type) {
      case 'raster':
        this.renderRasterLayer(ctx, layer as RasterLayer);
        break;
      case 'text':
        this.renderTextLayer(ctx, layer as TextLayer);
        break;
      case 'shape':
        this.renderShapeLayer(ctx, layer as ShapeLayer);
        break;
    }

    ctx.restore();
  }

  private static renderRasterLayer(ctx: CanvasRenderingContext2D, layer: RasterLayer): void {
    if (layer.canvas) {
      ctx.drawImage(layer.canvas, layer.x, layer.y, layer.width, layer.height);
    } else if (layer.dataUrl) {
      // If canvas is not yet instantiated, draw from cached image
      const img = new Image();
      img.src = layer.dataUrl;
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
      }
    }
  }

  private static renderTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer): void {
    const fontStyle = `${layer.italic ? 'italic ' : ''}${layer.bold ? 'bold ' : ''}${layer.fontSize}px ${layer.fontFamily || 'Inter, sans-serif'}`;
    ctx.font = fontStyle;
    ctx.fillStyle = layer.fill || '#ffffff';
    ctx.textBaseline = 'top';
    ctx.textAlign = layer.align || 'left';

    let textX = layer.x;
    if (layer.align === 'center') {
      textX = layer.x + layer.width / 2;
    } else if (layer.align === 'right') {
      textX = layer.x + layer.width;
    }

    // Support multiline text
    const lines = layer.text.split('\n');
    const lineHeight = layer.fontSize * 1.25;

    let maxLineWidth = 0;
    lines.forEach((line, index) => {
      const lineY = layer.y + index * lineHeight;
      ctx.fillText(line, textX, lineY);
      const textMetrics = ctx.measureText(line);
      if (textMetrics.width > maxLineWidth) {
        maxLineWidth = textMetrics.width;
      }

      if (layer.underline) {
        let underlineStartX = textX;
        if (layer.align === 'center') underlineStartX -= textMetrics.width / 2;
        if (layer.align === 'right') underlineStartX -= textMetrics.width;

        ctx.strokeStyle = layer.fill;
        ctx.lineWidth = Math.max(1, layer.fontSize / 15);
        ctx.beginPath();
        ctx.moveTo(underlineStartX, lineY + lineHeight - 2);
        ctx.lineTo(underlineStartX + textMetrics.width, lineY + lineHeight - 2);
        ctx.stroke();
      }
    });

    const calculatedWidth = Math.max(50, Math.ceil(maxLineWidth));
    const calculatedHeight = Math.max(20, Math.ceil(lines.length * lineHeight));
    if (Math.abs(layer.width - calculatedWidth) > 5 || Math.abs(layer.height - calculatedHeight) > 5) {
      layer.width = calculatedWidth;
      layer.height = calculatedHeight;
    }
  }

  private static renderShapeLayer(ctx: CanvasRenderingContext2D, layer: ShapeLayer): void {
    ctx.fillStyle = layer.fill || 'transparent';
    ctx.strokeStyle = layer.stroke || 'transparent';
    ctx.lineWidth = layer.strokeWidth || 0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const hasFill = layer.fill && layer.fill !== 'transparent';
    const hasStroke = layer.stroke && layer.stroke !== 'transparent' && layer.strokeWidth > 0;

    switch (layer.shapeType) {
      case 'rectangle': {
        if (hasFill) {
          ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
        }
        if (hasStroke) {
          ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
        }
        break;
      }
      case 'ellipse': {
        const cx = layer.x + layer.width / 2;
        const cy = layer.y + layer.height / 2;
        const rx = Math.max(1, Math.abs(layer.width / 2));
        const ry = Math.max(1, Math.abs(layer.height / 2));

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (hasFill) ctx.fill();
        if (hasStroke) ctx.stroke();
        break;
      }
      case 'line': {
        ctx.beginPath();
        if (layer.points && layer.points.length >= 4) {
          ctx.moveTo(layer.points[0], layer.points[1]);
          ctx.lineTo(layer.points[2], layer.points[3]);
        } else {
          ctx.moveTo(layer.x, layer.y);
          ctx.lineTo(layer.x + layer.width, layer.y + layer.height);
        }
        if (hasStroke) {
          ctx.stroke();
        } else if (hasFill) {
          ctx.strokeStyle = layer.fill;
          ctx.lineWidth = Math.max(1, layer.strokeWidth || 2);
          ctx.stroke();
        }
        break;
      }
    }
  }

  /**
   * Sample the composited color at a specific document coordinate
   */
  public static sampleColor(doc: PixelsDocument, x: number, y: number): string | null {
    if (x < 0 || x >= doc.width || y < 0 || y >= doc.height) {
      return null;
    }
    const canvas = this.compositeToCanvas(doc);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    if (pixel[3] === 0) {
      return null;
    }
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`;
  }
}
