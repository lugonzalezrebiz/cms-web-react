import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clientXToSec } from "../utils";

const EDGE_ZONE_PX = 60;
const MAX_SCROLL_SPEED = 5000; // seconds per second at full intensity

export function useMarkerDrag(
  gridRef: React.RefObject<HTMLDivElement | null>,
  visibleStart: number,
  visibleDuration: number,
  timelineStartSec: number,
  timelineEndSec: number,
  setMarkerSec: (sec: number) => void,
  setPanOffsetSec?: React.Dispatch<React.SetStateAction<number>>,
  totalSec?: number,
  currentMarkerSec?: number,
) {
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);

  // Keep mutable refs so RAF and event listeners always see latest values
  const visibleStartRef = useRef(visibleStart);
  const visibleDurationRef = useRef(visibleDuration);
  const totalSecRef = useRef(totalSec ?? 0);
  const timelineStartRef = useRef(timelineStartSec);
  const timelineEndRef = useRef(timelineEndSec);
  const setMarkerSecRef = useRef(setMarkerSec);
  const setPanOffsetSecRef = useRef(setPanOffsetSec);

  useLayoutEffect(() => {
    visibleStartRef.current = visibleStart;
    visibleDurationRef.current = visibleDuration;
    totalSecRef.current = totalSec ?? 0;
    timelineStartRef.current = timelineStartSec;
    timelineEndRef.current = timelineEndSec;
    setMarkerSecRef.current = setMarkerSec;
    setPanOffsetSecRef.current = setPanOffsetSec;
  });

  const scrollRef = useRef<{
    direction: -1 | 0 | 1;
    speed: number;
    rafId: number | null;
    lastTs: number;
    markerSec: number;
  }>({ direction: 0, speed: 0, rafId: null, lastTs: 0, markerSec: 0 });

  useEffect(() => {
    if (!isDraggingMarker) return;

    const s = scrollRef.current;
    s.direction = 0;
    s.speed = 0;
    s.lastTs = 0;

    const tick = (ts: number) => {
      if (s.direction !== 0 && s.lastTs > 0) {
        const elapsed = (ts - s.lastTs) / 1000;
        const delta = s.direction * s.speed * elapsed;
        const maxOffset = totalSecRef.current - visibleDurationRef.current;

        setPanOffsetSecRef.current?.((prev) =>
          Math.max(0, Math.min(maxOffset, prev + delta)),
        );

        const next = Math.max(
          timelineStartRef.current,
          Math.min(timelineEndRef.current, s.markerSec + delta),
        );
        s.markerSec = next;
        setMarkerSecRef.current(next);
      }
      s.lastTs = ts;
      s.rafId = requestAnimationFrame(tick);
    };

    s.rafId = requestAnimationFrame(tick);

    const onMouseMove = (e: MouseEvent) => {
      const el = gridRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const distLeft = e.clientX - rect.left;
      const distRight = rect.right - e.clientX;

      if (distLeft < EDGE_ZONE_PX) {
        const intensity = Math.max(0, 1 - distLeft / EDGE_ZONE_PX);
        s.direction = -1;
        s.speed = MAX_SCROLL_SPEED * intensity;
      } else if (distRight < EDGE_ZONE_PX) {
        const intensity = Math.max(0, 1 - distRight / EDGE_ZONE_PX);
        s.direction = 1;
        s.speed = MAX_SCROLL_SPEED * intensity;
      } else {
        s.direction = 0;
        s.speed = 0;
        const sec = clientXToSec(e.clientX, rect, visibleStartRef.current, visibleDurationRef.current);
        const clamped = Math.max(timelineStartRef.current, Math.min(timelineEndRef.current, sec));
        s.markerSec = clamped;
        setMarkerSecRef.current(clamped);
      }
    };

    const onMouseUp = () => {
      s.direction = 0;
      setIsDraggingMarker(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (s.rafId !== null) {
        cancelAnimationFrame(s.rafId);
        s.rafId = null;
      }
    };
  }, [isDraggingMarker, gridRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    scrollRef.current.markerSec = currentMarkerSec ?? 0;
    setIsDraggingMarker(true);
  };

  return { isDraggingMarker, handleMouseDown };
}
