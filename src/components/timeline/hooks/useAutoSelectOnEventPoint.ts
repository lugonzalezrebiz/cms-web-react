import { useEffect, useRef } from "react";
import type { CameraEventPoint, FlatRow } from "../types";

interface UseAutoSelectOnEventPointParams {
  cameraEventPoints?: CameraEventPoint[];
  flatRows: FlatRow[];
  isActivityMode: boolean;
  setITrackId: (id: number | null) => void;
  setSelectedTracks: (tracks: Set<number>) => void;
  setSelectedEventPointId: (id: number | null) => void;
  suppressUntilRef?: React.RefObject<number>;
}

export const useAutoSelectOnEventPoint = ({
  cameraEventPoints,
  flatRows,
  isActivityMode,
  setITrackId,
  setSelectedTracks,
  setSelectedEventPointId,
  suppressUntilRef,
}: UseAutoSelectOnEventPointParams) => {
  const prevUserCountRef = useRef(
    cameraEventPoints?.filter((ep) => !ep.entryIds).length ?? 0,
  );

  useEffect(() => {
    const userPoints = cameraEventPoints?.filter((ep) => !ep.entryIds) ?? [];
    const count = userPoints.length;
    if (suppressUntilRef?.current && Date.now() < suppressUntilRef.current) {
      prevUserCountRef.current = count;
      return;
    }
    if (count > prevUserCountRef.current && count > 0) {
      const last = userPoints[userPoints.length - 1];
      // last.cameraId is the real camera/tracker id, not necessarily the row id
      // (join-camera activity rows use a composite id) — resolve the actual row
      // the same way EventRow/useAutoSelectOnMarkerOverDiamond match diamonds to rows.
      const row = flatRows.find((r) =>
        isActivityMode
          ? r.kind === "activity" && r.name === last.label
          : r.kind === "event" &&
            r.parentCameraId === last.cameraId &&
            r.name === last.label,
      );
      if (row) setITrackId(row.id);
      setSelectedTracks(new Set());
      setSelectedEventPointId(last.id);
    }
    prevUserCountRef.current = count;
  }, [cameraEventPoints, flatRows, isActivityMode]); // eslint-disable-line react-hooks/exhaustive-deps
};
