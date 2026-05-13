import { useState, useCallback, useEffect, useRef } from "react";
import type React from "react";
import type { CameraEventPoint } from "../types";

export type DragConfig = { target: "start" | "end"; minSec: number; maxSec: number };

export const useDragExtendEventPoint = ({
  gridRef,
  visibleStart,
  visibleDuration,
  onUpdateEventPoint,
}: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  visibleStart: number;
  visibleDuration: number;
  totalSec: number;
  onUpdateEventPoint?: (
    id: number,
    update: Partial<Pick<CameraEventPoint, "startSec" | "endSec" | "timeSec">>,
  ) => void;
}) => {
  const [extendingId, setExtendingId] = useState<number | null>(null);
  const minSecRef = useRef(0);
  const maxSecRef = useRef(Infinity);
  const dragTargetRef = useRef<"start" | "end">("end");
  const visibleStartRef = useRef(visibleStart);
  const visibleDurationRef = useRef(visibleDuration);
  const onUpdateRef = useRef(onUpdateEventPoint);

  useEffect(() => { visibleStartRef.current = visibleStart; }, [visibleStart]);
  useEffect(() => { visibleDurationRef.current = visibleDuration; }, [visibleDuration]);
  useEffect(() => { onUpdateRef.current = onUpdateEventPoint; }, [onUpdateEventPoint]);

  useEffect(() => {
    if (extendingId === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) return;
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const rawSec = visibleStartRef.current + fraction * visibleDurationRef.current;
      const newSec = Math.max(minSecRef.current, Math.min(maxSecRef.current, rawSec));

      if (dragTargetRef.current === "start") {
        onUpdateRef.current?.(extendingId, { timeSec: newSec, startSec: newSec });
      } else {
        onUpdateRef.current?.(extendingId, { endSec: newSec });
      }
    };

    const handleMouseUp = () => setExtendingId(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [extendingId, gridRef]);

  const startExtend = useCallback((epId: number, config: DragConfig) => {
    minSecRef.current = config.minSec;
    maxSecRef.current = config.maxSec;
    dragTargetRef.current = config.target;
    setExtendingId(epId);
  }, []);

  return { extendingId, startExtend };
};
