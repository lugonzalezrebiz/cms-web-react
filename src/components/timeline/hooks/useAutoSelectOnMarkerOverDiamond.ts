import { useEffect } from "react";
import type { CameraEventPoint, FlatRow } from "../types";
import { TAG_TOLERANCE_SEC } from "../../../hooks/useTagsForCamera";
import { hasReviewedTwin } from "../utils";

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

    // The earliest still-unresolved point (no reviewed twin) is what the wall in
    // Monitor/index.tsx blocks on — nothing chronologically after it is selectable
    // until it's dealt with, so a same-row pin or lucky pixel proximity can't be
    // used to skip ahead of it.
    let earliestPendingSec: number | undefined;
    for (const ep of cameraEventPoints) {
      if (
        ep.reviewed === false &&
        !ep.rejected &&
        !hasReviewedTwin(ep, cameraEventPoints) &&
        (earliestPendingSec === undefined || ep.timeSec < earliestPendingSec)
      ) {
        earliestPendingSec = ep.timeSec;
      }
    }

    // Among diamonds within hit range, the closest one wins; ties (e.g. two
    // events at the exact same time on different lines) go to whichever
    // row is listed first in the tracker panel.
    type Candidate = { ep: CameraEventPoint; dist: number; rowIndex: number };
    const candidates: Candidate[] = [];
    const blockingCandidates: Candidate[] = [];
    const consider = (ep: CameraEventPoint, dist: number) => {
      if (dist > toleranceSec) return;
      const rowIndex = rowIndexFor(ep);
      if (rowIndex === -1) return;
      candidates.push({ ep, dist, rowIndex });
    };

    for (const ep of cameraEventPoints) {
      const isPending =
        ep.reviewed === false &&
        !ep.rejected &&
        !hasReviewedTwin(ep, cameraEventPoints);
      // Points within TAG_TOLERANCE_SEC of the earliest pending one are treated as
      // the same "simultaneous" cluster (e.g. two cameras tagging the same real
      // event) — the digit shortcuts let the reviewer pick between them. Anything
      // further out still has to wait its turn.
      if (
        isPending &&
        earliestPendingSec !== undefined &&
        ep.timeSec > earliestPendingSec + TAG_TOLERANCE_SEC
      ) {
        continue;
      }

      // A pending point's own review context (its full window — the same one the
      // wall/playback use) always wins over merely being pixel-close to some other,
      // unrelated diamond: it's what's actually blocking progress, so it must stay
      // the active selection until resolved — unless the reviewer has explicitly
      // pinned a different member of the same simultaneous cluster (see "pinned"
      // below), in which case that pick is respected.
      const windowEnd =
        ep.mode === "RANGE" && ep.endSec > ep.timeSec
          ? ep.endSec
          : ep.timeSec + TAG_TOLERANCE_SEC;
      const inReviewWindow =
        isPending &&
        earliestPendingSec !== undefined &&
        resolvedMarkerSec >= earliestPendingSec &&
        resolvedMarkerSec <= windowEnd;
      if (inReviewWindow) {
        const rowIndex = rowIndexFor(ep);
        if (rowIndex !== -1) blockingCandidates.push({ ep, dist: -1, rowIndex });
        continue;
      }

      consider(ep, Math.abs(ep.timeSec - resolvedMarkerSec));
      if (ep.mode === "RANGE" && ep.endSec > ep.timeSec) {
        consider(ep, Math.abs(ep.endSec - resolvedMarkerSec));
      }
    }

    if (blockingCandidates.length > 0) {
      blockingCandidates.sort((a, b) => a.ep.timeSec - b.ep.timeSec);
      // If the reviewer explicitly pinned a row (digit shortcut) that's part of
      // this blocking cluster, respect it instead of always snapping back to the
      // chronologically earliest member.
      const pinned =
        iTrackId !== null
          ? blockingCandidates.find((c) => flatRows[c.rowIndex]?.id === iTrackId)
          : undefined;
      const winner = pinned ?? blockingCandidates[0];
      const bestRowId = flatRows[winner.rowIndex].id;
      if (bestRowId !== iTrackId) setITrackId(bestRowId);
      if (winner.ep.id !== selectedEventPointId)
        setSelectedEventPointId(winner.ep.id);
      return;
    }

    if (candidates.length === 0) {
      // Marker isn't within any diamond's perimeter — deselect.
      if (selectedEventPointId !== null) setSelectedEventPointId(null);
      return;
    }

    // An explicitly selected line (digit shortcut, click) wins over any other row's
    // diamond that merely happens to be pixel-closer — only fall back to a global
    // search across every row when no line is currently selected at all. If a line
    // is selected but has nothing within hit range, stay on it with no diamond
    // selected rather than jumping to whatever row happens to be closest.
    const sameRowCandidates =
      iTrackId !== null
        ? candidates.filter((c) => flatRows[c.rowIndex]?.id === iTrackId)
        : [];

    if (iTrackId !== null && sameRowCandidates.length === 0) {
      if (selectedEventPointId !== null) setSelectedEventPointId(null);
      return;
    }

    const pool = sameRowCandidates.length > 0 ? sameRowCandidates : candidates;

    pool.sort((a, b) => {
      const aOnTop = a.ep.reviewed === true && a.dist >= 0;
      const bOnTop = b.ep.reviewed === true && b.dist >= 0;
      if (aOnTop !== bOnTop) return aOnTop ? -1 : 1;
      if (Math.abs(a.dist - b.dist) > TIE_EPSILON_SEC) return a.dist - b.dist;
      const reviewedDiff =
        (b.ep.reviewed === true ? 1 : 0) - (a.ep.reviewed === true ? 1 : 0);
      if (reviewedDiff !== 0) return reviewedDiff;
      return a.rowIndex - b.rowIndex;
    });
    const winningEp = pool[0].ep;
    const bestRowId = flatRows[pool[0].rowIndex].id;

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
