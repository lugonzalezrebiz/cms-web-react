import { useState, useCallback, useEffect } from "react";
import type { TimelineSnapshot } from "../types";

export const secToTimeString = (sec: number): string => {
  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const toSeconds = (time: string): number => {
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

export const useTimelineMarker = ({
  snapshot,
  onTimeChange,
  onMarkerChange,
}: {
  snapshot: TimelineSnapshot;
  onTimeChange?: (timestamp: string) => void;
  onMarkerChange?: (sec: number) => void;
}) => {
  const [markerTimeSec, setMarkerTimeSec] = useState<number | null>(null);

  const handleMarkerChange = useCallback(
    (sec: number) => {
      setMarkerTimeSec(sec);
      onMarkerChange?.(sec);
    },
    [onMarkerChange],
  );

  useEffect(() => {
    if (markerTimeSec === null) return;
    onTimeChange?.(secToTimeString(markerTimeSec));
  }, [markerTimeSec, onTimeChange]);

  const timelineEndSec = snapshot?.timeline.times.end
    ? toSeconds(snapshot.timeline.times.end)
    : null;

  const showFinalizeButton =
    markerTimeSec !== null &&
    timelineEndSec !== null &&
    markerTimeSec >= timelineEndSec;

  return {
    markerTimeSec,
    handleMarkerChange,
    showFinalizeButton,
  };
};
