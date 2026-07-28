import { useEffect, useRef } from "react";
import useNavigateWithQuery from "../../../hooks/useNavigate";
import useCompanyConfig from "../../../hooks/useCompanyConfig";
import type { CameraEventPoint, FlatRow } from "../types";

interface UseTimelineKeyboardParams {
  selectableRows: FlatRow[];
  iTrackId: number | null;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  activeSessionStarts: Record<number, number>;
  setActiveSessionStarts: React.Dispatch<
    React.SetStateAction<Record<number, number>>
  >;
  markerSec: number | null;
  timelineStartSec: number;
  timelineEndSec: number;
  selectedTracks: Set<number>;
  setSelectedTracks: React.Dispatch<React.SetStateAction<Set<number>>>;
  setCompletedSessions: React.Dispatch<
    React.SetStateAction<Record<number, { start: number; end: number }[]>>
  >;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  setShowPunchOut: React.Dispatch<React.SetStateAction<boolean>>;
  punchOutTimerRef: React.RefObject<
    ReturnType<typeof setTimeout> | null
  >;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  panOffsetSec: number;
  setPanOffsetSec: React.Dispatch<React.SetStateAction<number>>;
  totalSec: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  cameraEventPoints?: CameraEventPoint[];
  menuItems?: { id: number; name: string; onClick?: (index: number) => void }[];
  onDeleteEventPoint?: () => void;
  onAcceptEventPoint?: (id: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const useTimelineKeyboard = ({
  selectableRows,
  iTrackId,
  setITrackId,
  activeSessionStarts,
  setActiveSessionStarts,
  markerSec,
  timelineStartSec,
  timelineEndSec,
  selectedTracks,
  setSelectedTracks,
  setCompletedSessions,
  setMarkerSec,
  setShowPunchOut,
  punchOutTimerRef,
  zoom,
  setZoom,
  panOffsetSec,
  setPanOffsetSec,
  totalSec,
  gridRef,
  isPlaying: _isPlaying,
  setIsPlaying,
  cameraEventPoints,
  menuItems,
  onDeleteEventPoint,
  onAcceptEventPoint,
  onUndo,
  onRedo,
}: UseTimelineKeyboardParams) => {
  const onDeleteRef = useRef(onDeleteEventPoint);
  const onAcceptRef = useRef(onAcceptEventPoint);
  const onUndoRef = useRef(onUndo);
  const onRedoRef = useRef(onRedo);
  useEffect(() => {
    onDeleteRef.current = onDeleteEventPoint;
    onAcceptRef.current = onAcceptEventPoint;
    onUndoRef.current = onUndo;
    onRedoRef.current = onRedo;
  });
  const navigate = useNavigateWithQuery();
  const { imagesInterval } = useCompanyConfig();

  // Track mouse X relative to the grid element
  const mouseXRef = useRef<number>(0);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseXRef.current = e.clientX - rect.left;
    };
    el.addEventListener("mousemove", onMouseMove);
    return () => el.removeEventListener("mousemove", onMouseMove);
  }, [gridRef]);

  // ── "i" (new event point on selected line) and "o" (punch-out all) ──────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      if (
        e.key === "i" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        iTrackId !== null
      ) {
        const row = selectableRows.find((r) => r.id === iTrackId);
        const currentMarker = markerSec ?? timelineStartSec;
        const pending = cameraEventPoints?.find(
          (ep) =>
            ep.reviewed === false &&
            !ep.rejected &&
            ep.timeSec === currentMarker &&
            ep.label === row?.name &&
            (row?.parentCameraId === undefined ||
              ep.cameraId === row.parentCameraId),
        );
        if (pending) onAcceptRef.current?.(pending.id);

        const item = menuItems?.find((m) => m.id === iTrackId);
        item?.onClick?.(iTrackId);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        onUndoRef.current?.();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        onRedoRef.current?.();
      } else if (e.key === "Delete") {
        onDeleteRef.current?.();
      } else if (e.key === "h") {
        setMarkerSec(timelineStartSec);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && /^[0-9]$/.test(e.key)) {
        const position = e.key === "0" ? 10 : Number(e.key);
        const row = selectableRows[position - 1];
        if (row) {
          setITrackId(row.id);
          setSelectedTracks(
            activeSessionStarts[row.id] !== undefined
              ? new Set([row.id])
              : new Set(),
          );
        }
      }
      // else if (e.key === "o") {
      //   const currentMarker = markerSec ?? timelineStartSec;
      //   // Compute which selected tracks can be completed
      //   const completedIds = Object.entries(activeSessionStarts)
      //     .filter(([idStr, sessionStart]) =>
      //       selectedTracks.has(Number(idStr)) && currentMarker > sessionStart,
      //     )
      //     .map(([idStr]) => Number(idStr));
      //
      //   if (completedIds.length > 0) {
      //     setCompletedSessions((prev) => {
      //       const updates = { ...prev };
      //       for (const id of completedIds) {
      //         updates[id] = [
      //           ...(prev[id] ?? []),
      //           { start: activeSessionStarts[id], end: currentMarker },
      //         ];
      //       }
      //       return updates;
      //     });
      //     setShowPunchOut(true);
      //     if (punchOutTimerRef.current) clearTimeout(punchOutTimerRef.current);
      //     punchOutTimerRef.current = setTimeout(
      //       () => setShowPunchOut(false),
      //       1000,
      //     );
      //     setSelectedTracks(new Set());
      //     setActiveSessionStarts((prev) => {
      //       const next = { ...prev };
      //       for (const id of completedIds) delete next[id];
      //       return next;
      //     });
      //   }
      // }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectableRows,
    iTrackId,
    activeSessionStarts,
    markerSec,
    timelineStartSec,
    setITrackId,
    setActiveSessionStarts,
    setSelectedTracks,
    setCompletedSessions,
    setShowPunchOut,
    punchOutTimerRef,
    setMarkerSec,
    menuItems,
    cameraEventPoints,
  ]);

  // ── Alt+ArrowLeft: go back ───────────────────────────────────────────────
  useEffect(() => {
    const handleBack = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener("keydown", handleBack);
    return () => window.removeEventListener("keydown", handleBack);
  }, [navigate]);

  // ── Arrow keys: move marker ──────────────────────────────────────────────
  useEffect(() => {
    const handleArrow = (e: KeyboardEvent) => {
      if (e.altKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      e.preventDefault();

      const visibleDuration = totalSec / zoom;

      const panTo = (targetSec: number) => {
        const visibleEnd = panOffsetSec + visibleDuration;
        if (targetSec < panOffsetSec || targetSec > visibleEnd) {
          const margin = visibleDuration * 0.2;
          const targetOffset = Math.max(0, Math.min(totalSec - visibleDuration, targetSec - margin));
          const startOffset = panOffsetSec;
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
      };

      if (e.ctrlKey || e.metaKey) {
        const currentSec = markerSec ?? timelineStartSec;
        const sorted = [...(cameraEventPoints ?? [])].sort((a, b) => a.timeSec - b.timeSec);
        let targetSec: number | undefined;
        if (e.key === "ArrowLeft") {
          targetSec = [...sorted].reverse().find((ep) => ep.timeSec < currentSec)?.timeSec;
        } else {
          targetSec = sorted.find((ep) => ep.timeSec > currentSec)?.timeSec;
        }
        if (targetSec !== undefined) {
          setMarkerSec(targetSec);
          panTo(targetSec);
        }
        return;
      }

      if (selectedTracks.size > 0 && e.key !== "ArrowRight") return;
      const delta = e.key === "ArrowRight" ? imagesInterval : -imagesInterval;
      const base = markerSec ?? timelineStartSec;
      const next = Math.max(timelineStartSec, Math.min(timelineEndSec, base + delta));
      setMarkerSec(next);
      panTo(next);
    };

    window.addEventListener("keydown", handleArrow);
    return () => window.removeEventListener("keydown", handleArrow);
  }, [selectedTracks, timelineStartSec, timelineEndSec, setMarkerSec, markerSec, cameraEventPoints, panOffsetSec, zoom, totalSec, setPanOffsetSec, imagesInterval]);

  // ── Space: play / pause ──────────────────────────────────────────────────
  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      e.preventDefault();
      setIsPlaying((prev) => !prev);
    };
    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  }, [setIsPlaying]);

  // ── + / - keys: zoom centered on mouse position ───────────────────────────
  useEffect(() => {
    const handleZoom = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      if (e.key !== "+" && e.key !== "-") return;
      e.preventDefault();

      const el = gridRef.current;
      const width = el?.clientWidth ?? 1;
      const mouseX = Math.max(0, Math.min(mouseXRef.current, width));

      const oldZoom = zoom;
      const newZoom = Math.min(72, Math.max(1, oldZoom + (e.key === "+" ? 2 : -2)));
      if (newZoom === oldZoom) return;

      const oldVisibleDuration = totalSec / oldZoom;
      const newVisibleDuration = totalSec / newZoom;
      const cursorTime = panOffsetSec + (mouseX / width) * oldVisibleDuration;
      const newOffset = Math.max(
        0,
        Math.min(totalSec - newVisibleDuration, cursorTime - (mouseX / width) * newVisibleDuration),
      );

      setZoom(newZoom);
      setPanOffsetSec(newOffset);
    };

    window.addEventListener("keydown", handleZoom);
    return () => window.removeEventListener("keydown", handleZoom);
  }, [zoom, panOffsetSec, totalSec, gridRef, setZoom, setPanOffsetSec]);
};
