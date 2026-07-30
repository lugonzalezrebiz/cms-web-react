import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraEventPoint } from "../types";

interface HistorySnapshot {
  points: CameraEventPoint[];
  rejectedIds: Set<number>;
  acceptedIds: Set<number>;
  actionSec: number;
}

export const useCameraEventPoints = (monitoringID: string) => {
  const activityCounterRef = useRef(0);
  const [cameraActivities, setCameraActivities] = useState<
    { id: number; cameraId: number; activityLabel: string }[]
  >([]);
  const [cameraEventPoints, setCameraEventPoints] = useState<CameraEventPoint[]>([]);
  const [rejectedEventIds, setRejectedEventIds] = useState<Set<number>>(new Set());
  const [acceptedEventIds, setAcceptedEventIds] = useState<Set<number>>(new Set());
  const [markerSec, setMarkerSec] = useState<number>(0);
  const markerSecRef = useRef<number>(0);

  const historyRef = useRef<HistorySnapshot[]>([]);
  const futureRef = useRef<HistorySnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const lastUpdateTimeRef = useRef<number>(0);
  const currentPointsRef = useRef<CameraEventPoint[]>([]);
  const currentRejectedRef = useRef<Set<number>>(new Set());
  const currentAcceptedRef = useRef<Set<number>>(new Set());

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

  const pushHistory = (
    points: CameraEventPoint[],
    rejectedIds: Set<number> = currentRejectedRef.current,
    acceptedIds: Set<number> = currentAcceptedRef.current,
  ) => {
    historyRef.current = [
      ...historyRef.current,
      { points, rejectedIds, acceptedIds, actionSec: markerSecRef.current },
    ];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  };

  const handleRejectEventPoint = (id: number) => {
    pushHistory(currentPointsRef.current, currentRejectedRef.current, currentAcceptedRef.current);
    setRejectedEventIds((prev) => {
      const next = new Set(prev).add(id);
      currentRejectedRef.current = next;
      return next;
    });
  };

  const handleAcceptEventPoint = (id: number) => {
    pushHistory(currentPointsRef.current, currentRejectedRef.current, currentAcceptedRef.current);
    setAcceptedEventIds((prev) => {
      const next = new Set(prev).add(id);
      currentAcceptedRef.current = next;
      return next;
    });
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

  const handleConvertToEditableLocal = (point: CameraEventPoint): number => {
    const newId = Date.now();
    const localCopy: CameraEventPoint = { ...point, entryIds: undefined, id: newId };
    pushHistory(currentPointsRef.current);
    setCameraEventPoints((prev) => {
      const next = [...prev, localCopy];
      currentPointsRef.current = next;
      return next;
    });
    return newId;
  };

  const handleUpdateEventPoint = (id: number, update: Partial<Pick<CameraEventPoint, "timeSec" | "startSec" | "endSec">>) => {
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
    cameraId: number,
    activityLabel: string,
    mode: "POINT" | "RANGE" = "POINT",
  ): void => {
    setCameraActivities((prev) => {
      const alreadyExists = prev.some(
        (a) =>
          a.cameraId === cameraId && a.activityLabel === activityLabel,
      );
      if (alreadyExists) return prev;
      const newId = activityCounterRef.current++;
      return [...prev, { id: newId, cameraId, activityLabel }];
    });
    const timeSec = markerSecRef.current;
    const startSec = timeSec;
    const endSec = timeSec;
    setCameraEventPoints((prev) => {
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
    futureRef.current = [
      {
        points: currentPointsRef.current,
        rejectedIds: currentRejectedRef.current,
        acceptedIds: currentAcceptedRef.current,
        actionSec: prev.actionSec,
      },
      ...futureRef.current,
    ];
    historyRef.current = historyRef.current.slice(0, -1);
    currentPointsRef.current = prev.points;
    currentRejectedRef.current = prev.rejectedIds;
    currentAcceptedRef.current = prev.acceptedIds;
    setCameraEventPoints(prev.points);
    setRejectedEventIds(prev.rejectedIds);
    setAcceptedEventIds(prev.acceptedIds);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
    return prev.actionSec;
  }, []);

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    historyRef.current = [
      ...historyRef.current,
      {
        points: currentPointsRef.current,
        rejectedIds: currentRejectedRef.current,
        acceptedIds: currentAcceptedRef.current,
        actionSec: next.actionSec,
      },
    ];
    futureRef.current = futureRef.current.slice(1);
    currentPointsRef.current = next.points;
    currentRejectedRef.current = next.rejectedIds;
    currentAcceptedRef.current = next.acceptedIds;
    setCameraEventPoints(next.points);
    setRejectedEventIds(next.rejectedIds);
    setAcceptedEventIds(next.acceptedIds);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
    return next.actionSec;
  }, []);

  return {
    cameraActivities,
    cameraEventPoints,
    rejectedEventIds,
    handleRejectEventPoint,
    acceptedEventIds,
    handleAcceptEventPoint,
    markerSec,
    handleRemoveEventPoint,
    handleRegisterPreloadedDelete,
    handleConvertToEditableLocal,
    handleActivitySelect,
    handleMarkerChange,
    handleUpdateEventPoint,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    cleanUp,
  };
};
