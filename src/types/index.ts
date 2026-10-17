export type ToolType =
  | 'move'
  | 'select-rect'
  | 'select-ellipse'
  | 'brush'
  | 'pencil'
  | 'eraser'
  | 'crop'
  | 'text'
  | 'shape-rect'
  | 'shape-ellipse'
  | 'shape-line'
  | 'eyedropper'
  | 'zoom'
  | 'hand';

export type LayerType = 'raster' | 'text' | 'shape';

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 1
  blendMode: BlendMode;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
}

export interface RasterLayer extends BaseLayer {
  type: 'raster';
  // ImageData or internal canvas representation
  dataUrl?: string; // Serialized base64 or object URL for persistence/sync
  canvas?: HTMLCanvasElement; // In-memory editable canvas for rapid pixel manipulation
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: 'rectangle' | 'ellipse' | 'line';
  fill: string;
  stroke: string;
  strokeWidth: number;
  radiusX?: number;
  radiusY?: number;
  points?: number[]; // For line: [x1, y1, x2, y2]
}

export type Layer = RasterLayer | TextLayer | ShapeLayer;

export interface SelectionRegion {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rect' | 'ellipse';
  inverted?: boolean;
}

export interface DocumentDimensions {
  width: number;
  height: number;
}

export interface PixelsDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string; // e.g. '#ffffff' or 'transparent'
  layers: Layer[];
  activeLayerId: string | null;
  selection: SelectionRegion | null;
  createdAt: number;
  updatedAt: number;
  isDirty: boolean;
}

export interface ToolOptions {
  brush: {
    size: number;
    opacity: number;
    hardness: number; // 0 to 1
    color: string;
  };
  pencil: {
    size: number;
    color: string;
    opacity: number;
  };
  eraser: {
    size: number;
    opacity: number;
    hardness: number;
  };
  selection: {
    mode: 'replace' | 'add' | 'subtract';
    feather: number;
  };
  crop: {
    aspectRatio: 'free' | '1:1' | '16:9' | '4:3' | '3:2';
    width: number;
    height: number;
  };
  text: {
    fontSize: number;
    fontFamily: string;
    fill: string;
    align: 'left' | 'center' | 'right';
    bold: boolean;
    italic: boolean;
  };
  shape: {
    shapeType: 'rectangle' | 'ellipse' | 'line';
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
  eyedropper: {
    sampleSize: '1x1' | '3x3' | '5x5';
  };
  zoom: {
    mode: 'in' | 'out';
  };
}

export interface ProjectMetadata {
  id: string;
  name: string;
  width: number;
  height: number;
  layerCount: number;
  thumbnailUrl?: string;
  updatedAt: number;
  fileSize?: number;
}
