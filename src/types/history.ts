export type HistoryActionType =
  | 'draw'
  | 'erase'
  | 'layer_add'
  | 'layer_remove'
  | 'layer_reorder'
  | 'layer_duplicate'
  | 'layer_visibility'
  | 'layer_opacity'
  | 'layer_blend_mode'
  | 'layer_transform'
  | 'layer_property'
  | 'text_edit'
  | 'shape_edit'
  | 'filter_apply'
  | 'adjustment_apply'
  | 'crop'
  | 'canvas_resize'
  | 'image_resize'
  | 'rotate'
  | 'flip';

export interface HistoryCommand {
  id: string;
  type: HistoryActionType;
  description: string;
  timestamp: number;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}
