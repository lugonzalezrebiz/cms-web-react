import { useEffect, useRef } from "react";
import type { CameraEventPoint } from "../types";

interface UseAutoSelectOnEventPointParams {
  cameraEventPoints?: CameraEventPoint[];
  setITrackId: (id: number | null) => void;
  setSelectedTracks: (tracks: Set<number>) => void;
}

export const useAutoSelectOnEventPoint = ({
  cameraEventPoints,
  setITrackId,
  setSelectedTracks,
}: UseAutoSelectOnEventPointParams) => {
  const prevEventCountRef = useRef(cameraEventPoints?.length ?? 0);

  useEffect(() => {
    const count = cameraEventPoints?.length ?? 0;
    if (count > prevEventCountRef.current && cameraEventPoints?.length) {
      const last = cameraEventPoints[cameraEventPoints.length - 1];
      setITrackId(last.cameraId);
      setSelectedTracks(new Set());
    }
    prevEventCountRef.current = count;
  }, [cameraEventPoints]); // eslint-disable-line react-hooks/exhaustive-deps
};
