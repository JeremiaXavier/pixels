import { PixelsDocument } from '@/types';
import { Compositor } from '@/canvas/Compositor';

export interface ExportOptions {
  filename: string;
  format: 'image/png' | 'image/jpeg' | 'image/webp';
  quality: number; // 0.1 to 1.0 (for jpeg/webp)
  width: number;
  height: number;
  backgroundColorForOpaque?: string; // e.g. '#ffffff' for JPEG
}

export class ExportManager {
  /**
   * Render and generate Blob for export
   */
  public static async generateExportBlob(
    doc: PixelsDocument,
    options: ExportOptions
  ): Promise<Blob> {
    // 1. Composite original document
    const compositeCanvas = Compositor.compositeToCanvas(doc);

    // 2. Scale if output dimensions differ
    let finalCanvas = compositeCanvas;
    if (options.width !== doc.width || options.height !== doc.height) {
      finalCanvas = document.createElement('canvas');
      finalCanvas.width = Math.max(1, Math.round(options.width));
      finalCanvas.height = Math.max(1, Math.round(options.height));
      const ctx = finalCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(compositeCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
      }
    }

    // 3. For JPEG, fill background if document has transparency
    if (options.format === 'image/jpeg') {
      const opaqueCanvas = document.createElement('canvas');
      opaqueCanvas.width = finalCanvas.width;
      opaqueCanvas.height = finalCanvas.height;
      const oCtx = opaqueCanvas.getContext('2d');
      if (oCtx) {
        oCtx.fillStyle = options.backgroundColorForOpaque || '#ffffff';
        oCtx.fillRect(0, 0, opaqueCanvas.width, opaqueCanvas.height);
        oCtx.drawImage(finalCanvas, 0, 0);
        finalCanvas = opaqueCanvas;
      }
    }

    // 4. Convert to Blob
    return new Promise<Blob>((resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Export failed: Canvas toBlob returned null.'));
          }
        },
        options.format,
        options.quality
      );
    });
  }

  /**
   * Trigger browser-native file download
   */
  public static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Cleanup URL after short delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
}
