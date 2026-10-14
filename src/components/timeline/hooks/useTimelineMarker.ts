import { useState, useCallback } from "react";
import type { TimelineSnapshot } from "../types";
import { secToTimeString, timeStringToSec } from "../utils";

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

  // The time of day goes out with the marker, in the same update — not from
  // an effect afterwards, which chained one more render per marker move and,
  // with the marker moving fast (a held arrow), hit React's nested update
  // limit.
  const handleMarkerChange = useCallback(
    (sec: number) => {
      setMarkerTimeSec(sec);
      onMarkerChange?.(sec);
      onTimeChange?.(secToTimeString(sec));
    },
    [onMarkerChange, onTimeChange],
  );

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
