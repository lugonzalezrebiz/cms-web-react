import { useEffect } from "react";

export const useMarkerSync = ({
  targetMarkerSec,
  resolvedMarkerSec,
  timelineStartSec,
  timelineEndSec,
  setMarkerSec,
  handleMarkerChange,
}: {
  targetMarkerSec?: number;
  resolvedMarkerSec: number;
  timelineStartSec: number;
  timelineEndSec: number;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  handleMarkerChange: (sec: number) => void;
}) => {
  useEffect(() => {
    if (targetMarkerSec !== undefined) {
      setMarkerSec(
        Math.max(timelineStartSec, Math.min(timelineEndSec, targetMarkerSec)),
      );
    }
  }, [targetMarkerSec]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    handleMarkerChange(resolvedMarkerSec);
  }, [resolvedMarkerSec]); // eslint-disable-line react-hooks/exhaustive-deps
};
