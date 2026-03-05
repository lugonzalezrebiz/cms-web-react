import { useEffect, useRef, useState } from "react";
import type { FlatRow, TimelineSnapshot } from "../types";
import type { NavTab } from "../types";

interface UseTimelineBodyStateParams {
  snapshot?: TimelineSnapshot;
  activeTab: NavTab;
  selectedTab?: string;
  cameraActivities?: { id: number; cameraIndex: number; activityLabel: string }[];
  isTunnel: boolean;
  flatRows: FlatRow[];
  selectableRows: FlatRow[];
  timelineStartSec: number;
  timelineEndSec: number;
  firstActivitySec: number;
}

export const useTimelineBodyState = ({
  activeTab,
  selectedTab,
  cameraActivities,
  isTunnel,
  flatRows,
  timelineStartSec,
  timelineEndSec,
  firstActivitySec,
}: UseTimelineBodyStateParams) => {
  const totalSec = 24 * 3600;
  const startSec = 0;

  const [zoom, setZoom] = useState(1.5);
  const [panOffsetSec, setPanOffsetSec] = useState(0);
  const [selectedTracks, setSelectedTracks] = useState<Set<number>>(new Set());
  const [iTrackId, setITrackId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  const [markerSec, setMarkerSec] = useState<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState<
    Record<number, { start: number; end: number }[]>
  >({});
  const [activeSessionStarts, setActiveSessionStarts] = useState<
    Record<number, number>
  >({});
  const [showPunchOut, setShowPunchOut] = useState(false);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const listBodyRef = useRef<HTMLDivElement | null>(null);
  const rowsScrollRef = useRef<HTMLDivElement | null>(null);
  const punchOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markerSecRef = useRef<number | null>(null);
  const timelineStartSecRef = useRef(0);
  const prevCameraActivitiesRef = useRef<
    { id: number; cameraIndex: number; activityLabel: string }[]
  >([]);

  // Keep refs current
  markerSecRef.current = markerSec;
  timelineStartSecRef.current = timelineStartSec;

  // Derived layout values
  const visibleDuration = totalSec / zoom;
  const visibleStart = panOffsetSec;
  const visibleEnd = visibleStart + visibleDuration;

  const gridWidth = gridRef.current?.clientWidth || 1;
  const pixelsPerSecond = gridWidth / visibleDuration;
  const pixelsPerHour = pixelsPerSecond * 3600;

  let hourStep = 1;
  if (pixelsPerHour < 40) hourStep = 2;
  if (pixelsPerHour < 25) hourStep = 3;
  if (pixelsPerHour < 18) hourStep = 4;
  if (pixelsPerHour < 12) hourStep = 6;

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
    const deltaX = e.clientX - dragStartX;
    const secondsPerPixel = visibleDuration / e.currentTarget.clientWidth;
    const newOffset = dragStartOffset - deltaX * secondsPerPixel;
    const maxOffset = totalSec - visibleDuration;
    setPanOffsetSec(Math.max(0, Math.min(maxOffset, newOffset)));
  };

  // Effect 1: reset pan/marker on tab change
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
  }, [activeTab, selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: prevent passive wheel on grid
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Effect 3: auto-select new tunnel activity rows
  useEffect(() => {
    if (!isTunnel) {
      prevCameraActivitiesRef.current = cameraActivities ?? [];
      return;
    }
    const prev = prevCameraActivitiesRef.current;
    const current = cameraActivities ?? [];
    const prevIds = new Set(prev.map((p) => p.id));
    const newActivities = current.filter((a) => !prevIds.has(a.id));

    if (newActivities.length > 0) {
      const currentMarker =
        markerSecRef.current ?? timelineStartSecRef.current;
      setSelectedTracks((p) => {
        const next = new Set(p);
        newActivities.forEach((act) => next.add(10000 + act.id));
        return next;
      });
      setActiveSessionStarts((p) => {
        const next = { ...p };
        newActivities.forEach((act) => {
          next[10000 + act.id] = currentMarker;
        });
        return next;
      });
    }
    prevCameraActivitiesRef.current = current;
  }, [cameraActivities, isTunnel]);

  return {
    // state
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
    completedSessions,
    setCompletedSessions,
    activeSessionStarts,
    setActiveSessionStarts,
    showPunchOut,
    setShowPunchOut,
    // refs
    gridRef,
    listBodyRef,
    rowsScrollRef,
    punchOutTimerRef,
    // derived
    totalSec,
    startSec,
    visibleStart,
    visibleDuration,
    visibleEnd,
    hourStep,
    resolvedMarkerSec,
    isCurrentVisible,
    currentLeft,
    hasAnyBars,
    isInActivityRange,
    handleMouseMove,
  };
};
