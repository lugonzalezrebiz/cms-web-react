import { useEffect, useRef } from "react";
import type { CameraEventPoint } from "../types";

interface UseAutoSelectOnEventPointParams {
  cameraEventPoints?: CameraEventPoint[];
  setITrackId: (id: number | null) => void;
  setSelectedTracks: (tracks: Set<number>) => void;
  setSelectedEventPointId: (id: number | null) => void;
}

export const useAutoSelectOnEventPoint = ({
  cameraEventPoints,
  setITrackId,
  setSelectedTracks,
  setSelectedEventPointId,
}: UseAutoSelectOnEventPointParams) => {
  const prevUserCountRef = useRef(
    cameraEventPoints?.filter((ep) => !ep.entryIds).length ?? 0,
  );

  useEffect(() => {
    const userPoints = cameraEventPoints?.filter((ep) => !ep.entryIds) ?? [];
    const count = userPoints.length;
    if (count > prevUserCountRef.current && count > 0) {
      const last = userPoints[userPoints.length - 1];
      setITrackId(last.cameraId);
      setSelectedTracks(new Set());
      setSelectedEventPointId(last.id);
    }
    prevUserCountRef.current = count;
  }, [cameraEventPoints]); // eslint-disable-line react-hooks/exhaustive-deps
};
