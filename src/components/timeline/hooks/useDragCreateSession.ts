import { useState, useCallback, useRef, useEffect } from "react";
import type React from "react";
import type { FlatRow } from "../types";

const ROW_HEIGHT = 32.8;
const MIN_DRAG_SEC = 5;
const MIN_DRAG_PX = 5;

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
  const pendingRef = useRef<{ rowId: number; startSec: number; startX: number } | null>(null);
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

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const sec = secFromX(e.clientX);
      const row = rowFromY(e.clientY);
      if (sec === null || row === null) return;

      pendingRef.current = { rowId: row.id, startSec: sec, startX: e.clientX };
      e.preventDefault();

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const pending = pendingRef.current;
        if (pending !== null) {
          if (Math.abs(moveEvent.clientX - pending.startX) < MIN_DRAG_PX) return;
          const endSec = secFromX(moveEvent.clientX) ?? pending.startSec;
          const session = { rowId: pending.rowId, startSec: pending.startSec, endSec };
          pendingRef.current = null;
          draggingRef.current = session;
          setDragging(session);
          return;
        }
        if (draggingRef.current !== null) {
          const endSec = secFromX(moveEvent.clientX);
          if (endSec === null) return;
          const updated = { ...draggingRef.current, endSec };
          draggingRef.current = updated;
          setDragging(updated);
        }
      };

      const handleMouseUp = () => {
        pendingRef.current = null;
        const prev = draggingRef.current;
        draggingRef.current = null;
        setDragging(null);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        if (!prev) return;
        const start = Math.min(prev.startSec, prev.endSec);
        const end = Math.max(prev.startSec, prev.endSec);
        if (end - start >= MIN_DRAG_SEC) {
          onCommitRef.current(prev.rowId, start, end);
        }
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [secFromX, rowFromY],
  );

  return { dragging, onMouseDown };
};
