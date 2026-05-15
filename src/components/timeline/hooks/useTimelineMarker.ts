import { useState, useCallback, useEffect } from "react";
import type { TimelineSnapshot } from "../types";
import { secToTimeString, timeStringToSec } from "../utils";

export { secToTimeString };

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
    ? timeStringToSec(snapshot.timeline.times.end)
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
