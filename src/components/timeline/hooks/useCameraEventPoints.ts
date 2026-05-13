import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraEventPoint } from "../types";

export const useCameraEventPoints = (monitoringID: string) => {
  const activityCounterRef = useRef(0);
  const [cameraActivities, setCameraActivities] = useState<
    { id: number; cameraIndex: number; activityLabel: string }[]
  >([]);
  const [cameraEventPoints, setCameraEventPoints] = useState<CameraEventPoint[]>([]);
  const [markerSec, setMarkerSec] = useState<number>(0);
  const markerSecRef = useRef<number>(0);

  const historyRef = useRef<CameraEventPoint[][]>([]);
  const futureRef = useRef<CameraEventPoint[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const lastUpdateTimeRef = useRef<number>(0);
  const currentPointsRef = useRef<CameraEventPoint[]>([]);

  const syncChannelRef = useRef<BroadcastChannel | null>(null);
  const suppressSyncRef = useRef(false);

  // Cross-window event point sync
  useEffect(() => {
    const channel = new BroadcastChannel("camera-event-points-sync");
    syncChannelRef.current = channel;
    channel.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "sync" && e.data?.monitoringID === monitoringID) {
        const incoming = e.data.points as CameraEventPoint[];
        suppressSyncRef.current = true;
        currentPointsRef.current = incoming;
        setCameraEventPoints(incoming);
      }
    });
    return () => {
      channel.close();
      syncChannelRef.current = null;
    };
  }, [monitoringID]);

  // Broadcast local changes to other windows
  useEffect(() => {
    if (suppressSyncRef.current) {
      suppressSyncRef.current = false;
      return;
    }
    syncChannelRef.current?.postMessage({ type: "sync", monitoringID, points: cameraEventPoints });
  }, [cameraEventPoints, monitoringID]);

  const cleanUp = () => {
    setCameraEventPoints([]);
    currentPointsRef.current = [];
  };

  const pushHistory = (snapshot: CameraEventPoint[]) => {
    historyRef.current = [...historyRef.current, snapshot];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  };

  const handleRemoveEventPoint = (id: number) => {
    pushHistory(currentPointsRef.current);
    setCameraEventPoints((prev) => {
      const next = prev.filter((ep) => ep.id !== id);
      currentPointsRef.current = next;
      return next;
    });
  };

  // Called when deleting a preloaded point (one with entryIds).
  // The point is already being deleted from the server via the DELETE API.
  // We push a history snapshot that includes a local copy of the point (without entryIds)
  // so that undo can restore it and handleDone can re-save it via save2.
  const handleRegisterPreloadedDelete = (point: CameraEventPoint) => {
    const localCopy: CameraEventPoint = { ...point, entryIds: undefined, id: Date.now() };
    pushHistory([...currentPointsRef.current, localCopy]);
    // Current state stays unchanged; the point disappears from preloadedEventPoints
    // naturally after the query is invalidated.
  };

  const handleConvertToLocal = useCallback((point: CameraEventPoint): number => {
    const newId = Date.now();
    const localCopy: CameraEventPoint = { ...point, entryIds: undefined, id: newId };
    pushHistory(currentPointsRef.current);
    setCameraEventPoints((prev) => {
      const next = [...prev, localCopy];
      currentPointsRef.current = next;
      return next;
    });
    return newId;
  }, []);

  const handleUpdateEventPoint = (id: number, update: Partial<Pick<CameraEventPoint, "startSec" | "endSec" | "timeSec">>) => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current > 500) {
      pushHistory(currentPointsRef.current);
    }
    lastUpdateTimeRef.current = now;
    setCameraEventPoints((prev) => {
      const next = prev.map((ep) => (ep.id === id ? { ...ep, ...update } : ep));
      currentPointsRef.current = next;
      return next;
    });
  };

  const handleActivitySelect = (
    cameraIndex: number,
    activityLabel: string,
    mode: "POINT" | "RANGE" = "POINT",
  ): void => {
    setCameraActivities((prev) => {
      const alreadyExists = prev.some(
        (a) =>
          a.cameraIndex === cameraIndex && a.activityLabel === activityLabel,
      );
      if (alreadyExists) return prev;
      const newId = activityCounterRef.current++;
      return [...prev, { id: newId, cameraIndex, activityLabel }];
    });
    const cameraId = 1 + cameraIndex;
    const timeSec = markerSecRef.current;
    const startSec = Math.max(0, timeSec - 120);
    const endSec = timeSec;
    setCameraEventPoints((prev) => {
      const duplicate = prev.some(
        (ep) =>
          ep.cameraId === cameraId &&
          ep.label === activityLabel &&
          Math.abs(timeSec - ep.timeSec) <= 300,
      );
      if (duplicate) return prev;
      pushHistory(prev);
      const next = [
        ...prev,
        { id: Date.now(), cameraId, timeSec, startSec, endSec, label: activityLabel, reviewed: true, value: true, mode },
      ];
      currentPointsRef.current = next;
      return next;
    });
  };

  const handleMarkerChange = (sec: number) => {
    markerSecRef.current = sec;
    setMarkerSec(sec);
  };

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    futureRef.current = [currentPointsRef.current, ...futureRef.current];
    historyRef.current = historyRef.current.slice(0, -1);
    currentPointsRef.current = prev;
    setCameraEventPoints(prev);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
  }, []);

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    historyRef.current = [...historyRef.current, currentPointsRef.current];
    futureRef.current = futureRef.current.slice(1);
    currentPointsRef.current = next;
    setCameraEventPoints(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  return {
    cameraActivities,
    cameraEventPoints,
    markerSec,
    handleRemoveEventPoint,
    handleRegisterPreloadedDelete,
    handleActivitySelect,
    handleMarkerChange,
    handleUpdateEventPoint,
    handleConvertToLocal,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    cleanUp,
  };
};
