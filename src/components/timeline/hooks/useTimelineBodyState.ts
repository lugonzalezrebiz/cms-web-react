import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type React from "react";
import type { FlatRow, PlayWindow, TimelineSnapshot } from "../types";

interface UseTimelineBodyStateParams {
  snapshot?: TimelineSnapshot;
  flatRows: FlatRow[];
  selectableRows: FlatRow[];
  timelineStartSec: number;
  timelineEndSec: number;
  firstActivitySec: number;
  // Earliest timeSec of an unresolved (unreviewed, undecided) event point in the current
  // view — the marker can never be moved past it until it's accepted or rejected.
  // undefined means nothing is pending — no restriction.
  pendingReviewWallSec?: number;
  // When a diamond is selected, playback is scoped to reviewing just that clip (start,
  // end, and the position the marker snaps back to once playback finishes) instead of
  // the whole timeline. A ref (not a reactive value) because the window is derived from
  // this hook's own selectedEventPointId/resolvedMarkerSec — a plain prop would be
  // circular. undefined/.current undefined means play across the whole timeline.
  playWindowRef?: React.RefObject<PlayWindow | undefined>;
}

export const useTimelineBodyState = ({
  flatRows,
  timelineStartSec,
  timelineEndSec,
  firstActivitySec,
  pendingReviewWallSec,
  playWindowRef,
}: UseTimelineBodyStateParams) => {
  const totalSec = 24 * 3600;
  const startSec = 0;

  const [zoom, setZoom] = useState(4);
  const [panOffsetSec, setPanOffsetSec] = useState(0);
  const [selectedTracks, setSelectedTracks] = useState<Set<number>>(new Set());
  const [iTrackId, setITrackId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  const [markerSec, setMarkerSec] = useState<number | null>(null);
  const [selectedEventPointId, setSelectedEventPointId] = useState<number | null>(null);
  const [editingEventPointId, setEditingEventPointId] = useState<number | null>(null);
  // Smooth pan to marker when a different event point is selected and marker is off-screen
  const panOffsetSecRef = useRef(0);
  const visibleDurationRef = useRef(0);
  const totalSecRef = useRef(totalSec);
  const markerSecForPanRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    panOffsetSecRef.current = panOffsetSec;
    visibleDurationRef.current = visibleDuration;
    totalSecRef.current = totalSec;
    markerSecForPanRef.current = markerSec;
  });

  useEffect(() => {
    if (selectedEventPointId === null) return;
    const marker = markerSecForPanRef.current;
    if (marker === null) return;
    const offset = panOffsetSecRef.current;
    const vd = visibleDurationRef.current;
    const total = totalSecRef.current;
    if (marker >= offset && marker <= offset + vd) return;
    const margin = vd * 0.2;
    const targetOffset = Math.max(0, Math.min(total - vd, marker - margin));
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
  }, [selectedEventPointId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [completedSessions, setCompletedSessions] = useState<
    Record<number, { start: number; end: number }[]>
  >({});
  const [activeSessionStarts, setActiveSessionStarts] = useState<
    Record<number, number>
  >({});
  const [showPunchOut, setShowPunchOut] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const listBodyRef = useRef<HTMLDivElement | null>(null);
  const rowsScrollRef = useRef<HTMLDivElement | null>(null);
  const punchOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFollowRef = useRef(false);

  // Derived layout values
  const visibleDuration = totalSec / zoom;
  const visibleStart = panOffsetSec;
  const visibleEnd = visibleStart + visibleDuration;

  const gridWidth = gridRef.current?.clientWidth || 1;
  const pixelsPerSecond = gridWidth / visibleDuration;

  const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600];
  const MIN_PIXELS_PER_TICK = 60;
  const tickStepSec = TICK_STEPS.find((s) => s * pixelsPerSecond >= MIN_PIXELS_PER_TICK) ?? 21600;

  const resolvedMarkerSec = markerSec ?? timelineStartSec;
  const isCurrentVisible =
    resolvedMarkerSec >= visibleStart && resolvedMarkerSec <= visibleEnd;
  const currentLeft =
    ((resolvedMarkerSec - visibleStart) / visibleDuration) * 100;

  const hasAnyBars =
    flatRows.some((row) => row.sessions.length > 0) ||
    Object.values(completedSessions).some((arr) => arr.length > 0) ||
    Object.keys(activeSessionStarts).length > 0;

  const isInActivityRange = (sec: number) =>
    sec >= timelineStartSec && sec <= timelineEndSec;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    autoFollowRef.current = false;
    const deltaX = e.clientX - dragStartX;
    const secondsPerPixel = visibleDuration / e.currentTarget.clientWidth;
    const newOffset = dragStartOffset - deltaX * secondsPerPixel;
    const maxOffset = totalSec - visibleDuration;
    setPanOffsetSec(Math.max(0, Math.min(maxOffset, newOffset)));
  };

  const disableAutoFollow = useCallback(() => {
    autoFollowRef.current = false;
  }, []);

  const handleOnCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOnOpenDialog = () => {
    setOpenDialog(true);
  };

  const STEP_SEC = 1;

  const guardedSetMarkerSec = useCallback<
    React.Dispatch<React.SetStateAction<number | null>>
  >(
    (update) => {
      setMarkerSec((prev) => {
        const candidate =
          typeof update === "function"
            ? (update as (p: number | null) => number | null)(prev)
            : update;
        if (candidate === null) return candidate;
        if (
          pendingReviewWallSec !== undefined &&
          candidate > pendingReviewWallSec
        ) {
          return pendingReviewWallSec;
        }
        return candidate;
      });
    },
    [pendingReviewWallSec],
  );

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setMarkerSec((prev) => {
        const base = prev ?? timelineStartSec;
        const next = base + STEP_SEC;

        // Reviewing a selected clip: play only within its window, then snap back to
        // its center once done — not gated by pendingReviewWallSec, since watching the
        // flagged clip itself (including just past it) is exactly what review requires.
        const playWindow = playWindowRef?.current;
        if (playWindow) {
          if (next >= playWindow.end) {
            setIsPlaying(false);
            return playWindow.center;
          }
          return next;
        }

        if (pendingReviewWallSec !== undefined && next > pendingReviewWallSec) {
          setIsPlaying(false);
          return pendingReviewWallSec > base ? pendingReviewWallSec : base;
        }
        if (next >= timelineEndSec) {
          setIsPlaying(false);
          return timelineEndSec;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, timelineStartSec, timelineEndSec, pendingReviewWallSec]);

  // Enable auto-follow whenever playback starts
  useEffect(() => {
    if (isPlaying) autoFollowRef.current = true;
  }, [isPlaying]);

  // Keep marker at 20% from left while playing and auto-follow is active
  useEffect(() => {
    if (!isPlaying || markerSec === null || !autoFollowRef.current) return;
    const maxOffset = totalSec - visibleDuration;
    setPanOffsetSec(Math.max(0, Math.min(maxOffset, markerSec - visibleDuration * 0.2)));
  }, [markerSec, isPlaying, totalSec, visibleDuration]);

  useEffect(() => {
    const vd = totalSec / zoom;
    const maxOffset = totalSec - vd;

    if (firstActivitySec > 0) {
      const leftMargin = vd * 0.1;
      let initialOffset = firstActivitySec - leftMargin;
      initialOffset = Math.max(0, Math.min(maxOffset, initialOffset));
      setPanOffsetSec(initialOffset);
    } else {
      const leftMargin = vd * 0.1;
      let initialOffset = timelineStartSec - leftMargin;
      initialOffset = Math.max(0, Math.min(maxOffset, initialOffset));
      setPanOffsetSec(initialOffset);
    }

    setMarkerSec(null);
    setSelectedTracks(new Set());
    setITrackId(null);
    setActiveSessionStarts({});
    setShowPunchOut(false);
    if (punchOutTimerRef.current) clearTimeout(punchOutTimerRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return {
    zoom,
    setZoom,
    panOffsetSec,
    setPanOffsetSec,
    selectedTracks,
    setSelectedTracks,
    iTrackId,
    setITrackId,
    isDragging,
    setIsDragging,
    dragStartX,
    setDragStartX,
    dragStartOffset,
    setDragStartOffset,
    markerSec,
    setMarkerSec: guardedSetMarkerSec,
    selectedEventPointId,
    setSelectedEventPointId,
    editingEventPointId,
    setEditingEventPointId,
    completedSessions,
    setCompletedSessions,
    activeSessionStarts,
    setActiveSessionStarts,
    showPunchOut,
    setShowPunchOut,
    isPlaying,
    setIsPlaying,
    gridRef,
    listBodyRef,
    rowsScrollRef,
    punchOutTimerRef,
    totalSec,
    startSec,
    visibleStart,
    visibleDuration,
    visibleEnd,
    tickStepSec,
    resolvedMarkerSec,
    isCurrentVisible,
    currentLeft,
    hasAnyBars,
    isInActivityRange,
    handleMouseMove,
    handleOnCloseDialog,
    handleOnOpenDialog,
    openDialog,
    disableAutoFollow,
  };
};
