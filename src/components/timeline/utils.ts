import type { CameraEventPoint } from "./types";

export const hasReviewedTwin = (
  ep: CameraEventPoint,
  points: CameraEventPoint[],
): boolean =>
  points.some(
    (other) =>
      other.id !== ep.id &&
      other.cameraId === ep.cameraId &&
      other.label === ep.label &&
      other.reviewed === true &&
      other.timeSec === ep.timeSec,
  );

// `points` must already be scoped to ep's own row (same label/camera) — matches
// EventRow.tsx's per-row `points` list, which this mirrors exactly. Green/red diamonds
// (any border) are overlapsBlue===true; orange ones (correction or plain reviewed) are
// overlapsBlue===false — only the latter are eligible for bulk deletion.
export const isOverlapsBlue = (
  ep: CameraEventPoint,
  points: CameraEventPoint[],
): boolean =>
  ep.accepted === true ||
  (!!ep.meta && ep.reviewed) ||
  (ep.reviewed &&
    points.some(
      (other) =>
        other.id !== ep.id &&
        !other.reviewed &&
        other.timeSec === ep.timeSec,
    ));

export const secToTimeString = (sec: number): string => {
  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export const timeStringToSec = (time: string): number => {
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + (s ?? 0);
};

export const clientXToSec = (
  clientX: number,
  rect: DOMRect,
  visibleStart: number,
  visibleDuration: number,
): number => {
  const relX = (clientX - rect.left) / rect.width;
  return visibleStart + relX * visibleDuration;
};

export const secToPercent = (
  sec: number,
  visibleStart: number,
  visibleDuration: number,
): number => ((sec - visibleStart) / visibleDuration) * 100;

export const secToPixelX = (
  sec: number,
  visibleStart: number,
  visibleDuration: number,
  width: number,
): number => ((sec - visibleStart) / visibleDuration) * width;
