import { useEffect, useState } from "react";
import type { CameraEventPoint, ResizingState, SetResizing } from "../types";
import { clientXToSec } from "../utils";

interface UseEventPointResizeArgs {
  gridRef: React.RefObject<HTMLDivElement | null>;
  visibleStart: number;
  visibleDuration: number;
  timelineStartSec: number;
  timelineEndSec: number;
  onUpdateEventPoint?: (
    id: number,
    update: Partial<Pick<CameraEventPoint, "startSec" | "endSec">>,
  ) => void;
}

export const useEventPointResize = ({
  gridRef,
  visibleStart,
  visibleDuration,
  timelineStartSec,
  timelineEndSec,
  onUpdateEventPoint,
}: UseEventPointResizeArgs): SetResizing => {
  const [resizing, setResizing] = useState<ResizingState>(null);

  useEffect(() => {
    if (!resizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const el = gridRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const newSec = Math.max(timelineStartSec, Math.min(timelineEndSec, clientXToSec(e.clientX, rect, visibleStart, visibleDuration)));
      onUpdateEventPoint?.(
        resizing.id,
        resizing.side === "left" ? { startSec: newSec } : { endSec: newSec },
      );
    };
    const handleMouseUp = () => setResizing(null);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, visibleStart, visibleDuration, timelineStartSec, timelineEndSec, gridRef, onUpdateEventPoint]);

  return setResizing;
};
