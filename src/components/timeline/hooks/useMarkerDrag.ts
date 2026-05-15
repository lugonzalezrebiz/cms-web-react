import { useEffect, useState } from "react";

export const useMarkerDrag=(
  gridRef: React.RefObject<HTMLDivElement | null>,
  visibleStart: number,
  visibleDuration: number,
  timelineStartSec: number,
  timelineEndSec: number,
  setMarkerSec: (sec: number) => void,
)=> {
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);

  useEffect(() => {
    if (!isDraggingMarker) return;
    const handleMouseMove = (e: MouseEvent) => {
      const el = gridRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const newSec = visibleStart + relX * visibleDuration;
      setMarkerSec(Math.max(timelineStartSec, Math.min(timelineEndSec, newSec)));
    };
    const handleMouseUp = () => setIsDraggingMarker(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingMarker, visibleStart, visibleDuration, timelineStartSec, timelineEndSec, gridRef, setMarkerSec]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMarker(true);
  };

  return { isDraggingMarker, handleMouseDown };
}
