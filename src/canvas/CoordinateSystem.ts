export interface Point {
  x: number;
  y: number;
}

export interface ViewportTransform {
  zoom: number; // e.g. 1 = 100%, 2 = 200%, 0.5 = 50%
  panX: number; // offset in screen pixels
  panY: number; // offset in screen pixels
}

/**
 * Maps screen coordinates (relative to container element) to document canvas coordinates
 */
export function screenToDocument(
  screenPoint: Point,
  viewport: ViewportTransform,
  docWidth: number,
  docHeight: number,
  containerWidth: number,
  containerHeight: number
): Point {
  // Center of document in container
  const centerX = containerWidth / 2 + viewport.panX;
  const centerY = containerHeight / 2 + viewport.panY;

  // Top-left of document on screen
  const docScreenX = centerX - (docWidth * viewport.zoom) / 2;
  const docScreenY = centerY - (docHeight * viewport.zoom) / 2;

  const docX = (screenPoint.x - docScreenX) / viewport.zoom;
  const docY = (screenPoint.y - docScreenY) / viewport.zoom;

  return { x: docX, y: docY };
}

/**
 * Maps document canvas coordinates to screen coordinates
 */
export function documentToScreen(
  docPoint: Point,
  viewport: ViewportTransform,
  docWidth: number,
  docHeight: number,
  containerWidth: number,
  containerHeight: number
): Point {
  const centerX = containerWidth / 2 + viewport.panX;
  const centerY = containerHeight / 2 + viewport.panY;

  const docScreenX = centerX - (docWidth * viewport.zoom) / 2;
  const docScreenY = centerY - (docHeight * viewport.zoom) / 2;

  return {
    x: docScreenX + docPoint.x * viewport.zoom,
    y: docScreenY + docPoint.y * viewport.zoom,
  };
}

/**
 * Calculate zoom to fit document inside container with padding
 */
export function calculateFitZoom(
  docWidth: number,
  docHeight: number,
  containerWidth: number,
  containerHeight: number,
  padding = 40
): number {
  if (docWidth <= 0 || docHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return 1;
  }
  const availW = Math.max(containerWidth - padding * 2, 50);
  const availH = Math.max(containerHeight - padding * 2, 50);

  const scaleX = availW / docWidth;
  const scaleY = availH / docHeight;
  const fit = Math.min(scaleX, scaleY);

  // Clamp between 0.05 and 5.0
  return Math.min(Math.max(Number(fit.toFixed(2)), 0.05), 5.0);
}
