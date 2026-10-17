import JSZip from 'jszip';
import { PixelsDocument, Layer, RasterLayer, TextLayer, ShapeLayer } from '@/types';
import { LayerFactory } from './Layer';

export interface SerializedProject {
  format: 'pixels';
  version: 1;
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  createdAt: number;
  updatedAt: number;
  layers: SerializedLayer[];
}

export type SerializedLayer =
  | (Omit<RasterLayer, 'canvas' | 'dataUrl'> & { assetFilename?: string; dataUrl?: string })
  | TextLayer
  | ShapeLayer;

export class ProjectSerializer {
  /**
   * Serialize a PixelsDocument into a .pixels ZIP archive blob
   */
  public static async exportProjectBlob(doc: PixelsDocument): Promise<Blob> {
    const zip = new JSZip();
    const assetsFolder = zip.folder('assets');

    const serializedLayers: SerializedLayer[] = [];

    for (const layer of doc.layers) {
      if (layer.type === 'raster') {
        const rLayer = layer as RasterLayer;
        const filename = `${layer.id}.png`;

        if (rLayer.canvas) {
          // Convert canvas to blob and store in assets folder
          const blob = await new Promise<Blob | null>((resolve) =>
            rLayer.canvas!.toBlob(resolve, 'image/png')
          );
          if (blob && assetsFolder) {
            assetsFolder.file(filename, blob);
          }
        }

        const { canvas, dataUrl, ...rest } = rLayer;
        serializedLayers.push({
          ...rest,
          assetFilename: filename,
        });
      } else {
        serializedLayers.push({ ...layer });
      }
    }

    const projectJson: SerializedProject = {
      format: 'pixels',
      version: 1,
      id: doc.id,
      name: doc.name,
      width: doc.width,
      height: doc.height,
      backgroundColor: doc.backgroundColor,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      layers: serializedLayers,
    };

    zip.file('project.json', JSON.stringify(projectJson, null, 2));

    return await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/x-pixels',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }

  /**
   * Deserialize a .pixels ZIP blob back into a fully operational PixelsDocument
   */
  public static async importProjectBlob(file: Blob | File): Promise<PixelsDocument> {
    const zip = new JSZip();
    let contents: JSZip;
    try {
      contents = await zip.loadAsync(file);
    } catch {
      throw new Error('Invalid project file: Not a valid Pixels archive.');
    }

    const projectJsonFile = contents.file('project.json');
    if (!projectJsonFile) {
      throw new Error('Corrupted project: Missing project.json manifest.');
    }

    const projectText = await projectJsonFile.async('text');
    let project: SerializedProject;
    try {
      project = JSON.parse(projectText);
    } catch {
      throw new Error('Corrupted project: Invalid project metadata JSON.');
    }

    if (project.format !== 'pixels' || project.version !== 1) {
      throw new Error(
        `Unsupported project format or version (${project.format} v${project.version}).`
      );
    }

    const reconstructedLayers: Layer[] = [];

    for (const sLayer of project.layers) {
      if (sLayer.type === 'raster') {
        const assetFilename = (sLayer as { assetFilename?: string }).assetFilename;
        let canvas: HTMLCanvasElement;

        if (assetFilename) {
          const assetFile = contents.file(`assets/${assetFilename}`);
          if (assetFile) {
            const blob = await assetFile.async('blob');
            const img = await this.loadImageFromBlob(blob);
            canvas = document.createElement('canvas');
            canvas.width = sLayer.width;
            canvas.height = sLayer.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
            }
          } else {
            canvas = document.createElement('canvas');
            canvas.width = sLayer.width;
            canvas.height = sLayer.height;
          }
        } else {
          canvas = document.createElement('canvas');
          canvas.width = sLayer.width;
          canvas.height = sLayer.height;
        }

        const rLayer: RasterLayer = {
          ...(sLayer as RasterLayer),
          canvas,
          dataUrl: canvas.toDataURL(),
        };
        reconstructedLayers.push(rLayer);
      } else {
        reconstructedLayers.push(sLayer as Layer);
      }
    }

    return {
      id: project.id || LayerFactory.generateId(),
      name: project.name || 'Restored Project',
      width: project.width,
      height: project.height,
      backgroundColor: project.backgroundColor || '#ffffff',
      layers: reconstructedLayers,
      activeLayerId: reconstructedLayers.length > 0 ? reconstructedLayers[reconstructedLayers.length - 1].id : null,
      selection: null,
      createdAt: project.createdAt || Date.now(),
      updatedAt: project.updatedAt || Date.now(),
      isDirty: false,
    };
  }

  private static loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load raster layer asset.'));
      };
      img.src = url;
    });
  }
}
