/* Gerado de src/shared/zoom.ts por bun run gen:compartilhado. Nao editar. */

export const ZOOM_STEP = 1.5;

export type ZoomView = { zoom: number; x: number; y: number };

export const ZOOM_REST: ZoomView = { zoom: 1, x: 0, y: 0 };

export function clampZoom(
  next: ZoomView,
  maxZoom: number,
  width: number,
  height: number,
): ZoomView {
  const zoom = Math.min(maxZoom, Math.max(1, next.zoom));
  if (zoom === 1) return ZOOM_REST;
  if (width <= 0 || height <= 0) return { zoom, x: next.x, y: next.y };
  const maxX = ((zoom - 1) * width) / 2;
  const maxY = ((zoom - 1) * height) / 2;
  return {
    zoom,
    x: Math.min(maxX, Math.max(-maxX, next.x)),
    y: Math.min(maxY, Math.max(-maxY, next.y)),
  };
}

export function zoomAround(
  from: ZoomView,
  target: number,
  dx: number,
  dy: number,
  maxZoom: number,
  width: number,
  height: number,
): ZoomView {
  const zoom = Math.min(maxZoom, Math.max(1, target));
  const ratio = zoom / from.zoom;
  return clampZoom(
    { zoom, x: dx - ratio * (dx - from.x), y: dy - ratio * (dy - from.y) },
    maxZoom,
    width,
    height,
  );
}
