import { useState, useEffect, useMemo } from "react";

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

  // Track previous cameras as state so we can update it synchronously during render
  const [prevSortedCameras, setPrevSortedCameras] = useState<CameraInfo[]>([]);
  // Cameras kept in the DOM while fading out
  const [exitingCameras, setExitingCameras] = useState<CameraInfo[]>([]);
  // Subset of exitingCameras that have started their fade-out (set one RAF after mount)
  const [activelyExitingIds, setActivelyExitingIds] = useState<ReadonlySet<number>>(new Set<number>());

  const currentKey = sortedCameras.map((c) => c.id).join(",");
  const prevKey = prevSortedCameras.map((c) => c.id).join(",");

  // Synchronous detection during render — prevents the "flash then reappear" artifact
  // that happens when an effect schedules exitingCameras update after a paint.
  if (currentKey !== prevKey) {
    setPrevSortedCameras(sortedCameras);

    const incomingIds = new Set(sortedCameras.map((c) => c.id));
    const leaving = prevSortedCameras.filter((c) => !incomingIds.has(c.id));
    const remaining = prevSortedCameras.filter((c) => incomingIds.has(c.id));
    const isFullReset = prevSortedCameras.length > 0 && remaining.length === 0;

    if (isFullReset) {
      if (exitingCameras.length > 0) setExitingCameras([]);
      if (activelyExitingIds.size > 0) setActivelyExitingIds(new Set());
    } else if (leaving.length > 0) {
      const existingExitingIds = new Set(exitingCameras.map((c) => c.id));
      const newlyLeaving = leaving.filter((c) => !existingExitingIds.has(c.id));
      if (newlyLeaving.length > 0) {
        setExitingCameras((prev) => [
          ...prev.filter((c) => !incomingIds.has(c.id)), // drop any that came back
          ...newlyLeaving,
        ]);
      }
    }
    // When cameras are only added (leaving.length === 0) leave exitingCameras alone
    // so any ongoing exit animation runs to completion via its tEnd timer.
  }

  const exitingKey = exitingCameras.map((c) => c.id).join(",");

  useEffect(() => {
    if (exitingCameras.length === 0) {
      setActivelyExitingIds(new Set());
      return;
    }

    const ids = exitingCameras.map((c) => c.id);
    const idSet = new Set(ids);

    // One RAF after the cameras are in the DOM at opacity 1, start the fade-out animation.
    const rafId = requestAnimationFrame(() => {
      setActivelyExitingIds(new Set(ids));
    });

    // Remove from DOM after the animation completes.
    const tEnd = setTimeout(() => {
      setExitingCameras((prev) => prev.filter((c) => !idSet.has(c.id)));
      setActivelyExitingIds((prev) => {
        if (prev.size === 0) return prev;
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    }, transitionMs + 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(tEnd);
    };
  }, [exitingKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderedCameras = useMemo(() => {
    const incomingIds = new Set(sortedCameras.map((c) => c.id));
    const exitingOnly = exitingCameras.filter((c) => !incomingIds.has(c.id));
    return [...sortedCameras, ...exitingOnly].sort((a, b) => a.id - b.id);
  }, [sortedCameras, exitingCameras]);

  return { renderedCameras, exitingIds: activelyExitingIds, skipAnimation };
};
