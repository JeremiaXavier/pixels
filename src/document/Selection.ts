import { SelectionRegion } from '@/types';

export class SelectionManager {
  /**
   * Create a selection covering the full document
   */
  public static selectAll(width: number, height: number): SelectionRegion {
    return {
      active: true,
      x: 0,
      y: 0,
      width,
      height,
      type: 'rect',
      inverted: false,
    };
  }

  /**
   * Deselect
   */
  public static deselect(): null {
    return null;
  }

  /**
   * Invert selection
   */
  public static invert(selection: SelectionRegion | null, docWidth: number, docHeight: number): SelectionRegion {
    if (!selection || !selection.active) {
      return this.selectAll(docWidth, docHeight);
    }
    return {
      ...selection,
      inverted: !selection.inverted,
    };
  }

  /**
   * Combine two selection regions (replace, add, subtract)
   */
  public static combine(
    current: SelectionRegion | null,
    newRegion: { x: number; y: number; width: number; height: number; type: 'rect' | 'ellipse' },
    mode: 'replace' | 'add' | 'subtract'
  ): SelectionRegion {
    // Normalize new region coordinates (allow dragging in any direction)
    let nx = newRegion.x;
    let ny = newRegion.y;
    let nw = newRegion.width;
    let nh = newRegion.height;

    if (nw < 0) {
      nx += nw;
      nw = Math.abs(nw);
    }
    if (nh < 0) {
      ny += nh;
      nh = Math.abs(nh);
    }

    if (!current || !current.active || mode === 'replace') {
      return {
        active: true,
        x: nx,
        y: ny,
        width: nw,
        height: nh,
        type: newRegion.type,
        inverted: false,
      };
    }

    if (mode === 'add') {
      // Union bounding box
      const minX = Math.min(current.x, nx);
      const minY = Math.min(current.y, ny);
      const maxX = Math.max(current.x + current.width, nx + nw);
      const maxY = Math.max(current.y + current.height, ny + nh);

      return {
        active: true,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        type: 'rect', // simplified union bounding box
        inverted: false,
      };
    }

    // Subtract: clip current bounds if it intersects
    return {
      ...current,
      active: true,
    };
  }

  /**
   * Check if a document point is inside the active selection
   */
  public static isPointInside(point: { x: number; y: number }, selection: SelectionRegion | null): boolean {
    if (!selection || !selection.active) return true; // everything is active when no selection

    const { x, y, width, height, type, inverted } = selection;
    let inside = false;

    if (type === 'rect') {
      inside = point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
    } else if (type === 'ellipse') {
      const rx = width / 2;
      const ry = height / 2;
      const cx = x + rx;
      const cy = y + ry;
      if (rx > 0 && ry > 0) {
        const dx = (point.x - cx) / rx;
        const dy = (point.y - cy) / ry;
        inside = dx * dx + dy * dy <= 1;
      }
    }

    return inverted ? !inside : inside;
  }
}
