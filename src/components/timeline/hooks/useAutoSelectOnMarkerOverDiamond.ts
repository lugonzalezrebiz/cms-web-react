import { useEffect } from "react";
import type { CameraEventPoint, FlatRow } from "../types";

// Mirrors EventRow's hitDiamond radius (DIAMOND_SIZE / Math.SQRT2 + 3) so the
// marker "hits" a diamond at the same pixel distance a mouse click would.
const DIAMOND_HIT_RADIUS_PX = 17 / Math.SQRT2 + 3;

interface UseAutoSelectOnMarkerOverDiamondParams {
  flatRows: FlatRow[];
  cameraEventPoints?: CameraEventPoint[];
  resolvedMarkerSec: number;
  visibleDuration: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  isActivityMode: boolean;
  iTrackId: number | null;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
}

export const useAutoSelectOnMarkerOverDiamond = ({
  flatRows,
  cameraEventPoints,
  resolvedMarkerSec,
  visibleDuration,
  gridRef,
  isActivityMode,
  iTrackId,
  setITrackId,
}: UseAutoSelectOnMarkerOverDiamondParams) => {
  useEffect(() => {
    const width = gridRef.current?.clientWidth;
    if (!width || !cameraEventPoints?.length) return;

    const toleranceSec = DIAMOND_HIT_RADIUS_PX / (width / visibleDuration);
    const TIE_EPSILON_SEC = 1e-9;

    const rowIndexFor = (ep: CameraEventPoint) =>
      flatRows.findIndex((r) =>
        isActivityMode
          ? r.kind === "activity" && r.name === ep.label
          : r.kind === "event" &&
            r.parentCameraId === ep.cameraId &&
            r.name === ep.label,
      );

    // Among diamonds within hit range, the closest one wins; ties (e.g. two
    // events at the exact same time on different lines) go to whichever
    // row is listed first in the tracker panel.
    let bestDist = Infinity;
    let bestRowIndex = -1;
    const consider = (ep: CameraEventPoint, dist: number) => {
      if (dist > toleranceSec) return;
      const rowIndex = rowIndexFor(ep);
      if (rowIndex === -1) return;
      if (
        dist < bestDist - TIE_EPSILON_SEC ||
        (Math.abs(dist - bestDist) <= TIE_EPSILON_SEC && rowIndex < bestRowIndex)
      ) {
        bestDist = dist;
        bestRowIndex = rowIndex;
      }
    };

    for (const ep of cameraEventPoints) {
      consider(ep, Math.abs(ep.timeSec - resolvedMarkerSec));
      if (ep.mode === "RANGE" && ep.endSec > ep.timeSec) {
        consider(ep, Math.abs(ep.endSec - resolvedMarkerSec));
      }
    }
    if (bestRowIndex === -1) return;

    const bestRowId = flatRows[bestRowIndex].id;
    if (bestRowId !== iTrackId) setITrackId(bestRowId);
  }, [
    flatRows,
    cameraEventPoints,
    resolvedMarkerSec,
    visibleDuration,
    gridRef,
    isActivityMode,
    iTrackId,
    setITrackId,
  ]);
};
