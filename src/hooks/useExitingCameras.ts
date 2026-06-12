import { useState, useEffect, useRef, useMemo } from "react";

export type CameraInfo = { id: number; name: string };

export const useExitingCameras = (
  cameras: CameraInfo[] | undefined,
  count: number,
  transitionMs: number,
) => {
  const [prevCount, setPrevCount] = useState(count);
  if (prevCount !== count) setPrevCount(count);
  const skipAnimation = prevCount <= 1 && count <= 1;

  const sortedCameras = useMemo(
    () => [...(cameras ?? [])].sort((a, b) => a.id - b.id),
    [cameras],
  );

  const [exitingCameras, setExitingCameras] = useState<CameraInfo[]>([]);
  const prevCamerasRef = useRef<CameraInfo[]>([]);

  const cameraIdsKey = sortedCameras.map((c) => c.id).join(",");

  useEffect(() => {
    const incoming = [...(cameras ?? [])].sort((a, b) => a.id - b.id);
    const incomingIds = new Set(incoming.map((c) => c.id));
    const leaving = prevCamerasRef.current.filter((c) => !incomingIds.has(c.id));
    prevCamerasRef.current = incoming;

    if (leaving.length === 0) {
      const t = setTimeout(() => setExitingCameras([]), 0);
      return () => clearTimeout(t);
    }

    const tStart = setTimeout(() => setExitingCameras(leaving), 0);
    const tEnd = setTimeout(() => setExitingCameras([]), transitionMs + 50);

    return () => {
      clearTimeout(tStart);
      clearTimeout(tEnd);
    };
  }, [cameraIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderedCameras = useMemo(() => {
    const incomingIds = new Set(sortedCameras.map((c) => c.id));
    const exitingOnly = exitingCameras.filter((c) => !incomingIds.has(c.id));
    return [...sortedCameras, ...exitingOnly].sort((a, b) => a.id - b.id);
  }, [sortedCameras, exitingCameras]);

  const exitingIds = useMemo(
    () => new Set(exitingCameras.map((c) => c.id)),
    [exitingCameras],
  );

  return { renderedCameras, exitingIds, skipAnimation };
};
