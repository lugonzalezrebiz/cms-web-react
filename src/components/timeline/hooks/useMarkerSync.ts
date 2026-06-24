import { useEffect, useRef } from "react";

export const useMarkerSync = ({
  targetMarkerSec,
  resolvedMarkerSec,
  timelineStartSec,
  timelineEndSec,
  setMarkerSec,
  handleMarkerChange,
  setPanOffsetSec,
  visibleDuration,
  totalSec,
}: {
  targetMarkerSec?: number;
  resolvedMarkerSec: number;
  timelineStartSec: number;
  timelineEndSec: number;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  handleMarkerChange: (sec: number) => void;
  setPanOffsetSec?: React.Dispatch<React.SetStateAction<number>>;
  visibleDuration?: number;
  totalSec?: number;
}) => {
  const prevTargetRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (targetMarkerSec !== undefined) {
      const clamped = Math.max(timelineStartSec, Math.min(timelineEndSec, targetMarkerSec));
      setMarkerSec(clamped);

      // Pan to show the marker only when transitioning from undefined → defined (initial load).
      // Subsequent tracker switches (number → number) leave the pan untouched.
      if (
        prevTargetRef.current === undefined &&
        setPanOffsetSec &&
        visibleDuration !== undefined &&
        totalSec !== undefined
      ) {
        const leftMargin = visibleDuration * 0.1;
        const offset = Math.max(0, Math.min(totalSec - visibleDuration, clamped - leftMargin));
        setPanOffsetSec(offset);
      }
    }
    prevTargetRef.current = targetMarkerSec;
  }, [targetMarkerSec]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    handleMarkerChange(resolvedMarkerSec);
  }, [resolvedMarkerSec]); // eslint-disable-line react-hooks/exhaustive-deps
};
