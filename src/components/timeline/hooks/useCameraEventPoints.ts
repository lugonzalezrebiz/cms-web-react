import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraEventPoint } from "../types";

const storageKey = (id: string) => `cameraEventPoints_${id}`;

const readFromStorage = (id: string): CameraEventPoint[] => {
  try {
    const raw = sessionStorage.getItem(storageKey(id));
    return raw ? (JSON.parse(raw) as CameraEventPoint[]) : [];
  } catch {
    return [];
  }
};

export const useCameraEventPoints = (monitoringID: string) => {
  const activityCounterRef = useRef(0);
  const [cameraActivities, setCameraActivities] = useState<
    { id: number; cameraIndex: number; activityLabel: string }[]
  >([]);
  const [cameraEventPoints, setCameraEventPoints] = useState<CameraEventPoint[]>(
    () => readFromStorage(monitoringID),
  );
  const [markerSec, setMarkerSec] = useState<number>(0);
  const markerSecRef = useRef<number>(0);

  const historyRef = useRef<CameraEventPoint[][]>([]);
  const futureRef = useRef<CameraEventPoint[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const lastUpdateTimeRef = useRef<number>(0);
  const currentPointsRef = useRef<CameraEventPoint[]>(readFromStorage(monitoringID));

  // Persist every change to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey(monitoringID), JSON.stringify(cameraEventPoints));
    } catch { /* ignore */ }
  }, [cameraEventPoints, monitoringID]);

  // Clear sessionStorage on real navigation (not on browser reload)
  useEffect(() => {
    const isReloading = { current: false };
    const onBeforeUnload = () => { isReloading.current = true; };
    window.addEventListener("beforeunload", onBeforeUnload);
    let active = false;
    const id = setTimeout(() => { active = true; }, 0);
    return () => {
      clearTimeout(id);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (active && !isReloading.current) {
        sessionStorage.removeItem(storageKey(monitoringID));
      }
    };
  }, [monitoringID]);

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

  const handleUpdateEventPoint = (id: number, update: Partial<Pick<CameraEventPoint, "startSec" | "endSec">>) => {
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
    handleActivitySelect,
    handleMarkerChange,
    handleUpdateEventPoint,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  };
};
