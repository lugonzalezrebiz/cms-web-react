import { useEffect, useRef, useState } from "react";
import type { FlatRow, TimelineSnapshot } from "../types";

interface UseTimelineBodyStateParams {
  snapshot?: TimelineSnapshot;
  flatRows: FlatRow[];
  selectableRows: FlatRow[];
  timelineStartSec: number;
  timelineEndSec: number;
  firstActivitySec: number;
}

export const useTimelineBodyState = ({
  flatRows,
  timelineStartSec,
  timelineEndSec,
  firstActivitySec,
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

  const disableAutoFollow = () => {
    autoFollowRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    autoFollowRef.current = false;
    const deltaX = e.clientX - dragStartX;
    const secondsPerPixel = visibleDuration / e.currentTarget.clientWidth;
    const newOffset = dragStartOffset - deltaX * secondsPerPixel;
    const maxOffset = totalSec - visibleDuration;
    setPanOffsetSec(Math.max(0, Math.min(maxOffset, newOffset)));
  };

  const handleOnCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOnOpenDialog = () => {
    setOpenDialog(true);
  };

  const STEP_SEC = 5;

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setMarkerSec((prev) => {
        const next = (prev ?? timelineStartSec) + STEP_SEC;
        if (next >= timelineEndSec) {
          setIsPlaying(false);
          return timelineEndSec;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, timelineStartSec, timelineEndSec]);

  useEffect(() => {
    if (isPlaying) autoFollowRef.current = true;
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || markerSec === null || !autoFollowRef.current) return;
    const maxOffset = totalSec - visibleDuration;
    setPanOffsetSec(Math.max(0, Math.min(maxOffset, markerSec - visibleDuration * 0.2)));
  }, [markerSec, isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setMarkerSec,
    selectedEventPointId,
    setSelectedEventPointId,
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
    disableAutoFollow,
    handleMouseMove,
    handleOnCloseDialog,
    handleOnOpenDialog,
    openDialog,
  };
};
