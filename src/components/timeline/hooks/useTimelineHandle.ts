import { useImperativeHandle, type ForwardedRef } from "react";
import type { TimelineBodyHandle } from "../types";

interface UseTimelineHandleParams {
  ref: ForwardedRef<TimelineBodyHandle>;
  timelineStartSec: number;
  timelineEndSec: number;
  resolvedMarkerSec: number;
  setMarkerSec: (sec: number) => void;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useTimelineHandle = ({
  ref,
  timelineStartSec,
  timelineEndSec,
  resolvedMarkerSec,
  setMarkerSec,
  setIsPlaying,
}: UseTimelineHandleParams) => {
  useImperativeHandle(ref, () => ({
    stepMarker: (deltaSec: number) => {
      const next = Math.max(
        timelineStartSec,
        Math.min(timelineEndSec, resolvedMarkerSec + deltaSec),
      );
      setMarkerSec(next);
    },
    setMarker: (sec: number) => {
      setMarkerSec(Math.max(timelineStartSec, Math.min(timelineEndSec, sec)));
    },
    togglePlay: () => {
      setIsPlaying((prev) => !prev);
    },
  }));
};
