import { useEffect, useLayoutEffect, useRef } from "react";

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
  panOffsetSec,
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
  panOffsetSec?: number;
}) => {
  const prevTargetRef = useRef<number | undefined>(undefined);
  // Skip the initial handleMarkerChange call when targetMarkerSec is already
  // defined on mount. Effect 1 will set markerSec to the target, changing
  // resolvedMarkerSec, which will re-trigger this effect with the correct value.
  // Without this guard the re-mounting TimeLine briefly fires handleMarkerChange
  // with timelineStartSec (the null-fallback), which jumps markerSec to the
  // start and can trigger the auto-close effect in Monitor.
  const skipInitialHandleRef = useRef(targetMarkerSec !== undefined);

  const panOffsetSecRef = useRef(panOffsetSec ?? 0);
  const visibleDurationRef = useRef(visibleDuration ?? 0);
  const totalSecRef = useRef(totalSec ?? 0);

  useLayoutEffect(() => {
    panOffsetSecRef.current = panOffsetSec ?? 0;
    visibleDurationRef.current = visibleDuration ?? 0;
    totalSecRef.current = totalSec ?? 0;
  });

  useEffect(() => {
    if (targetMarkerSec !== undefined) {
      const clamped = Math.max(timelineStartSec, Math.min(timelineEndSec, targetMarkerSec));
      setMarkerSec(clamped);

      if (setPanOffsetSec && visibleDurationRef.current > 0) {
        const vd = visibleDurationRef.current;
        const total = totalSecRef.current;
        const offset = panOffsetSecRef.current;
        const isInitial = prevTargetRef.current === undefined;
        const isOutside = clamped < offset || clamped > offset + vd;

        if (isInitial) {
          const leftMargin = vd * 0.1;
          setPanOffsetSec(Math.max(0, Math.min(total - vd, clamped - leftMargin)));
        } else if (isOutside) {
          const margin = vd * 0.2;
          const targetOffset = Math.max(0, Math.min(total - vd, clamped - margin));
          const startOffset = offset;
          const duration = 500;
          const startTime = performance.now();
          const animate = (now: number) => {
            const t = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setPanOffsetSec(startOffset + (targetOffset - startOffset) * eased);
            if (t < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      }
    }
    prevTargetRef.current = targetMarkerSec;
  }, [targetMarkerSec]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (skipInitialHandleRef.current) {
      skipInitialHandleRef.current = false;
      return;
    }
    handleMarkerChange(resolvedMarkerSec);
  }, [resolvedMarkerSec]); // eslint-disable-line react-hooks/exhaustive-deps
};
