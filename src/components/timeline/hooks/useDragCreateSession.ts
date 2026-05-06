import { useState, useCallback, useRef, useEffect } from "react";
import type React from "react";
import type { FlatRow } from "../types";

const ROW_HEIGHT = 44;
const MIN_DRAG_SEC = 5;

export interface DragSession {
  rowId: number;
  startSec: number;
  endSec: number;
}

export const useDragCreateSession = ({
  gridRef,
  rowsScrollRef,
  visibleStart,
  visibleDuration,
  flatRows,
  onCommit,
}: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  rowsScrollRef: React.RefObject<HTMLDivElement | null>;
  visibleStart: number;
  visibleDuration: number;
  flatRows: FlatRow[];
  onCommit: (rowId: number, start: number, end: number) => void;
}) => {
  const [dragging, setDragging] = useState<DragSession | null>(null);
  const draggingRef = useRef<DragSession | null>(null);
  const visibleStartRef = useRef(visibleStart);
  const visibleDurationRef = useRef(visibleDuration);
  const onCommitRef = useRef(onCommit);

  useEffect(() => { visibleStartRef.current = visibleStart; }, [visibleStart]);
  useEffect(() => { visibleDurationRef.current = visibleDuration; }, [visibleDuration]);
  useEffect(() => { onCommitRef.current = onCommit; }, [onCommit]);

  const secFromX = useCallback((clientX: number): number | null => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return visibleStartRef.current + fraction * visibleDurationRef.current;
  }, [gridRef]);

  const rowFromY = useCallback((clientY: number): FlatRow | null => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const scrollTop = rowsScrollRef.current?.scrollTop ?? 0;
    const rowIndex = Math.floor((clientY - rect.top + scrollTop) / ROW_HEIGHT);
    return flatRows[rowIndex] ?? null;
  }, [gridRef, rowsScrollRef, flatRows]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const sec = secFromX(e.clientX);
      if (sec === null) return;
      const updated = { ...draggingRef.current!, endSec: sec };
      draggingRef.current = updated;
      setDragging(updated);
    };

    const handleMouseUp = () => {
      const prev = draggingRef.current;
      draggingRef.current = null;
      setDragging(null);
      if (!prev) return;
      const start = Math.min(prev.startSec, prev.endSec);
      const end = Math.max(prev.startSec, prev.endSec);
      if (end - start >= MIN_DRAG_SEC) {
        onCommitRef.current(prev.rowId, start, end);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, secFromX]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const sec = secFromX(e.clientX);
      const row = rowFromY(e.clientY);
      if (sec === null || row === null) return;
      const session = { rowId: row.id, startSec: sec, endSec: sec };
      draggingRef.current = session;
      setDragging(session);
      e.preventDefault();
    },
    [secFromX, rowFromY],
  );

  return { dragging, onMouseDown };
};
