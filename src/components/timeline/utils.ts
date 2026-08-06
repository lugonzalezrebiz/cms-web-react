import { Colors } from "../../theme";
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

// Mirrors EventRow.tsx's diamond fill/border selection exactly, so any UI element
// showing an event point's status (canvas diamond or DOM chip) reads as one system.
export const getEventPointColors = (
  ep: Pick<CameraEventPoint, "mode" | "reviewed" | "value" | "reviewDisagree">,
  overlapsBlue: boolean,
  hasMultipleRows: boolean,
  isEditing = false,
): { fill: string; border: string } => {
  const isEligibleForNewScheme = ep.mode === "POINT" && hasMultipleRows;
  const isResolvedPoint = overlapsBlue && isEligibleForNewScheme;
  const isCorrectionAccept =
    !overlapsBlue &&
    isEligibleForNewScheme &&
    ep.reviewed &&
    ep.value === true &&
    ep.reviewDisagree === false;
  const isCorrectionReject =
    !overlapsBlue &&
    isEligibleForNewScheme &&
    ep.reviewed &&
    ep.value === false &&
    ep.reviewDisagree === false;

  const fill = isResolvedPoint
    ? ep.value === true
      ? Colors.leafGreen
      : Colors.blushRed
    : isCorrectionAccept
      ? Colors.leafGreen
      : isCorrectionReject
        ? Colors.blushRed
        : overlapsBlue
          ? Colors.leafGreen
          : isEditing
            ? Colors.vividOrange
            : ep.reviewed
              ? Colors.vividOrange
              : Colors.blue;

  const border = isResolvedPoint
    ? ep.reviewDisagree === false
      ? Colors.green
      : ep.reviewDisagree === true
        ? Colors.red
        : "#ffffff"
    : isCorrectionAccept || isCorrectionReject
      ? Colors.vividOrange
      : "#ffffff";

  return { fill, border };
};

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
