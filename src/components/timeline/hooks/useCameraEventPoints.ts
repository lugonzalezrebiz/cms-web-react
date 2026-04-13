import { useRef, useState } from "react";
import type { CameraEventPoint } from "../types";

export const useCameraEventPoints = () => {
  const activityCounterRef = useRef(0);
  const [cameraActivities, setCameraActivities] = useState<
    { id: number; cameraIndex: number; activityLabel: string }[]
  >([]);
  const [cameraEventPoints, setCameraEventPoints] = useState<CameraEventPoint[]>([]);
  const [markerSec, setMarkerSec] = useState<number>(0);
  const markerSecRef = useRef<number>(0);

  const handleRemoveEventPoint = (id: number) => {
    setCameraEventPoints((prev) => prev.filter((ep) => ep.id !== id));
  };

  const handleUpdateEventPoint = (id: number, update: Partial<Pick<CameraEventPoint, "startSec" | "endSec">>) => {
    setCameraEventPoints((prev) =>
      prev.map((ep) => (ep.id === id ? { ...ep, ...update } : ep)),
    );
  };

  const handleActivitySelect = (
    cameraIndex: number,
    activityLabel: string,
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
    const endSec = timeSec + 120;
    setCameraEventPoints((prev) => {
      const duplicate = prev.some(
        (ep) =>
          ep.cameraId === cameraId &&
          ep.label === activityLabel &&
          Math.abs(timeSec - ep.timeSec) <= 300,
      );
      if (duplicate) return prev;
      return [
        ...prev,
        { id: Date.now(), cameraId, timeSec, startSec, endSec, label: activityLabel },
      ];
    });
  };

  const handleMarkerChange = (sec: number) => {
    markerSecRef.current = sec;
    setMarkerSec(sec);
  };

  return {
    cameraActivities,
    cameraEventPoints,
    markerSec,
    handleRemoveEventPoint,
    handleActivitySelect,
    handleMarkerChange,
    handleUpdateEventPoint,
  };
};
