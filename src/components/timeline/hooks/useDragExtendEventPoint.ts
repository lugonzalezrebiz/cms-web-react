import { useState, useCallback, useEffect, useRef } from "react";
import type React from "react";
import type { EventPointUpdate } from "../types";

export const useDragExtendEventPoint = ({
  gridRef,
  visibleStart,
  visibleDuration,
  totalSec,
  onUpdateEventPoint,
}: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  visibleStart: number;
  visibleDuration: number;
  totalSec: number;
  onUpdateEventPoint?: (id: number, update: EventPointUpdate) => void;
}) => {
  // End-diamond drag (updates endSec)
  const [extendingId, setExtendingId] = useState<number | null>(null);
  const minSecRef = useRef(0);

  // Start-diamond drag (updates timeSec + startSec)
  const [movingStartId, setMovingStartId] = useState<number | null>(null);
  const maxSecRef = useRef(Infinity);

  const visibleStartRef = useRef(visibleStart);
  const visibleDurationRef = useRef(visibleDuration);
  const onUpdateRef = useRef(onUpdateEventPoint);

  useEffect(() => { visibleStartRef.current = visibleStart; }, [visibleStart]);
  useEffect(() => { visibleDurationRef.current = visibleDuration; }, [visibleDuration]);
  useEffect(() => { onUpdateRef.current = onUpdateEventPoint; }, [onUpdateEventPoint]);

  // End diamond drag
  useEffect(() => {
    if (extendingId === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) return;
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const rawSec = visibleStartRef.current + fraction * visibleDurationRef.current;
      const newSec = Math.max(minSecRef.current, Math.min(totalSec, rawSec));
      onUpdateRef.current?.(extendingId, { endSec: newSec });
    };

    const handleMouseUp = () => setExtendingId(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [extendingId, gridRef, totalSec]);

  // Start diamond drag
  useEffect(() => {
    if (movingStartId === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) return;
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const rawSec = visibleStartRef.current + fraction * visibleDurationRef.current;
      const newSec = Math.max(0, Math.min(maxSecRef.current, rawSec));
      onUpdateRef.current?.(movingStartId, { timeSec: newSec, startSec: newSec });
    };

    const handleMouseUp = () => setMovingStartId(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [movingStartId, gridRef]);

  const startExtend = useCallback((epId: number, e: React.MouseEvent, minSec: number) => {
    e.preventDefault();
    e.stopPropagation();
    minSecRef.current = minSec;
    setExtendingId(epId);
  }, []);

  const startMove = useCallback((epId: number, e: React.MouseEvent, maxSec: number) => {
    e.preventDefault();
    e.stopPropagation();
    maxSecRef.current = maxSec;
    setMovingStartId(epId);
  }, []);

  return { extendingId, startExtend, movingStartId, startMove };
};
