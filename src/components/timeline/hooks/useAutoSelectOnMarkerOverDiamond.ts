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
  selectedEventPointId: number | null;
  setSelectedEventPointId: React.Dispatch<React.SetStateAction<number | null>>;
  isPlaying: boolean;
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
  selectedEventPointId,
  setSelectedEventPointId,
  isPlaying,
}: UseAutoSelectOnMarkerOverDiamondParams) => {
  useEffect(() => {
    // While reviewing a selected clip, playback deliberately moves the marker away from
    // the diamond's own hit radius (to the start of its review window) — don't let that
    // read as "left the diamond" and deselect mid-playback (see TimeLine's playWindow).
    if (isPlaying) return;

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
    type Candidate = { ep: CameraEventPoint; dist: number; rowIndex: number };
    const candidates: Candidate[] = [];
    const consider = (ep: CameraEventPoint, dist: number) => {
      if (dist > toleranceSec) return;
      const rowIndex = rowIndexFor(ep);
      if (rowIndex === -1) return;
      candidates.push({ ep, dist, rowIndex });
    };

    for (const ep of cameraEventPoints) {
      consider(ep, Math.abs(ep.timeSec - resolvedMarkerSec));
      if (ep.mode === "RANGE" && ep.endSec > ep.timeSec) {
        consider(ep, Math.abs(ep.endSec - resolvedMarkerSec));
      }
    }

    if (candidates.length === 0) {
      // Marker isn't within any diamond's perimeter — deselect.
      if (selectedEventPointId !== null) setSelectedEventPointId(null);
      return;
    }

    candidates.sort((a, b) =>
      Math.abs(a.dist - b.dist) > TIE_EPSILON_SEC
        ? a.dist - b.dist
        : a.rowIndex - b.rowIndex,
    );
    const winningEp = candidates[0].ep;
    const bestRowId = flatRows[candidates[0].rowIndex].id;

    if (bestRowId !== iTrackId) setITrackId(bestRowId);
    if (winningEp.id !== selectedEventPointId) setSelectedEventPointId(winningEp.id);
  }, [
    flatRows,
    cameraEventPoints,
    resolvedMarkerSec,
    visibleDuration,
    gridRef,
    isActivityMode,
    iTrackId,
    setITrackId,
    selectedEventPointId,
    setSelectedEventPointId,
    isPlaying,
  ]);
};
