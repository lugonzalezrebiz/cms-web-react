import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import { useEffect, useMemo, useRef, useState } from "react";

export type NavTab = "employees" | "compliances" | "activities";

export interface TimelineSnapshot {
  timeline: {
    times: {
      start: string;
      end: string;
      current: string;
      buffer: number;
      interval: number;
      businessStart: string;
      businessEnd: string;
      actualStart: string;
      actualEnd: string;
    };
    tracks: {
      id: number;
      name: string;
      category: NavTab;
      sessions: {
        type: "in" | "out";
        timestamp: string;
      }[];
    }[];
  };
  ui: {
    panOffsetSec: number;
    zoom: number;
    category: NavTab;
    playback: boolean;
  };
}

interface TimelineBodyProps {
  snapshot?: TimelineSnapshot;
  activeTab: NavTab;
  selectedTab?: string;
  cameraActivities?: {
    id: number;
    cameraIndex: number;
    activityLabel: string;
  }[];
}

type FlatRow = {
  id: number;
  name: string;
  kind: "camera" | "activity";
  parentCameraId?: number;
  cameraNumber: number;
  sessions: { type: "in" | "out"; timestamp: string }[];
};

const TUNNEL_CAMERAS: TimelineSnapshot["timeline"]["tracks"] = [
  { id: 101, name: "Camera 1", category: "activities", sessions: [] },
  { id: 102, name: "Camera 2", category: "activities", sessions: [] },
  { id: 103, name: "Camera 3", category: "activities", sessions: [] },
  { id: 104, name: "Camera 4", category: "activities", sessions: [] },
  { id: 105, name: "Camera 5", category: "activities", sessions: [] },
  { id: 106, name: "Camera 6", category: "activities", sessions: [] },
];

const MOCK_SNAPSHOT: TimelineSnapshot = {
  timeline: {
    times: {
      start: "09:00:00",
      end: "19:00:00",
      current: "12:30:00",
      buffer: 0,
      interval: 3600,
      businessStart: "09:00:00",
      businessEnd: "19:00:00",
      actualStart: "08:55:00",
      actualEnd: "18:05:00",
    },
    tracks: [
      //   {
      //     id: 1,
      //     name: "John Smith",
      //     category: "employees",
      //     sessions: [
      //       { type: "in", timestamp: "09:05:00" },
      //       { type: "out", timestamp: "12:00:00" },
      //       { type: "in", timestamp: "13:00:00" },
      //       { type: "out", timestamp: "17:30:00" },
      //     ],
      //   },
      //   {
      //     id: 2,
      //     name: "Maria Garcia",
      //     category: "employees",
      //     sessions: [
      //       { type: "in", timestamp: "08:55:00" },
      //       { type: "out", timestamp: "18:05:00" },
      //     ],
      //   },
      //   {
      //     id: 3,
      //     name: "Speed violation",
      //     category: "compliances",
      //     sessions: [
      //       { type: "in", timestamp: "10:15:00" },
      //       { type: "out", timestamp: "10:20:00" },
      //     ],
      //   },
      //   {
      //     id: 4,
      //     name: "Loading bay",
      //     category: "activities",
      //     sessions: [
      //       { type: "in", timestamp: "11:00:00" },
      //       { type: "out", timestamp: "14:30:00" },
      //     ],
      //   },
    ],
  },
  ui: {
    panOffsetSec: 0,
    zoom: 1,
    category: "employees",
    playback: false,
  },
};

const TimelineBody = ({
  snapshot,
  activeTab,
  selectedTab,
  cameraActivities,
}: TimelineBodyProps) => {
  const isTunnel = selectedTab === "2";
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

  // Stable refs so the auto-select effect doesn't stale-close over marker values
  const markerSecRef = useRef<number | null>(null);
  const timelineStartSecRef = useRef(0);
  const prevCameraActivitiesRef = useRef<
    { id: number; cameraIndex: number; activityLabel: string }[]
  >([]);

  const filteredTracks =
    snapshot?.timeline.tracks.filter((t) => t.category === activeTab) ||
    MOCK_SNAPSHOT.timeline.tracks.filter((t) => t.category === activeTab);

  const headerLabel = isTunnel ? "Tunnel Activities" : activeTab;

  const flatRows = useMemo((): FlatRow[] => {
    if (!isTunnel) {
      return filteredTracks.map((t, i) => ({
        id: t.id,
        name: t.name,
        kind: "camera" as const,
        cameraNumber: i + 1,
        sessions: t.sessions,
      }));
    }
    const rows: FlatRow[] = [];
    let camNum = 0;
    for (const cam of TUNNEL_CAMERAS) {
      camNum++;
      rows.push({
        id: cam.id,
        name: cam.name,
        kind: "camera",
        cameraNumber: camNum,
        sessions: cam.sessions,
      });
      const acts = (cameraActivities ?? []).filter(
        (a) => a.cameraIndex === cam.id - 101,
      );
      for (const act of acts) {
        rows.push({
          id: 10000 + act.id,
          name: act.activityLabel,
          kind: "activity",
          parentCameraId: cam.id,
          cameraNumber: 0,
          sessions: [],
        });
      }
    }
    return rows;
  }, [isTunnel, filteredTracks, cameraActivities]);

  // Only activity sub-rows are cycled by the i-key in tunnel mode
  const selectableRows = useMemo(
    () => (isTunnel ? flatRows.filter((r) => r.kind === "activity") : flatRows),
    [isTunnel, flatRows],
  );

  const toSeconds = (time: string) => {
    const [h, m, s] = time.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const allTimestamps = flatRows.flatMap((row) =>
    row.sessions.map((s) => toSeconds(s.timestamp)),
  );

  const firstActivitySec =
    allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0;

  const hasAnyBars =
    allTimestamps.length > 0 ||
    Object.values(completedSessions).some((arr) => arr.length > 0) ||
    Object.keys(activeSessionStarts).length > 0;

  const data = snapshot || MOCK_SNAPSHOT;

  const timelineStartSec = toSeconds(data.timeline.times.start);
  const timelineEndSec = toSeconds(data.timeline.times.end);

  // Keep refs current so the auto-select effect always reads fresh values
  markerSecRef.current = markerSec;
  timelineStartSecRef.current = timelineStartSec;

  const startSec = 0;
  const totalSec = 24 * 3600;

  const visibleStart = panOffsetSec;
  const visibleDuration = totalSec / zoom;
  const visibleEnd = visibleStart + visibleDuration;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;

    const deltaX = e.clientX - dragStartX;

    const secondsPerPixel = visibleDuration / e.currentTarget.clientWidth;

    const newOffset = dragStartOffset - deltaX * secondsPerPixel;

    const maxOffset = totalSec - visibleDuration;
    const minOffset = 0;

    setPanOffsetSec(Math.max(minOffset, Math.min(maxOffset, newOffset)));
  };

  useEffect(() => {
    const visibleDuration = totalSec / zoom;
    const maxOffset = totalSec - visibleDuration;

    if (firstActivitySec > 0) {
      const leftMargin = visibleDuration * 0.1;

      let initialOffset = firstActivitySec - leftMargin;

      initialOffset = Math.max(0, Math.min(maxOffset, initialOffset));

      setPanOffsetSec(initialOffset);
    } else {
      const leftMargin = visibleDuration * 0.1;
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
  }, [activeTab, selectedTab]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Auto-select an activity sub-row the moment it is added or replaced
  useEffect(() => {
    if (!isTunnel) {
      prevCameraActivitiesRef.current = cameraActivities ?? [];
      return;
    }

    const prev = prevCameraActivitiesRef.current;
    const current = cameraActivities ?? [];

    // Detect only brand-new activities (by id)
    const prevIds = new Set(prev.map((p) => p.id));
    const newActivities = current.filter((a) => !prevIds.has(a.id));

    if (newActivities.length > 0) {
      const currentMarker = markerSecRef.current ?? timelineStartSecRef.current;

      // Auto-select each new activity sub-row
      setSelectedTracks((prev) => {
        const next = new Set(prev);
        newActivities.forEach((act) => next.add(10000 + act.id));
        return next;
      });

      // Start a live session from the current marker
      setActiveSessionStarts((prev) => {
        const next = { ...prev };
        newActivities.forEach((act) => {
          next[10000 + act.id] = currentMarker;
        });
        return next;
      });
    }

    prevCameraActivitiesRef.current = current;
  }, [cameraActivities, isTunnel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTunnel && e.key === "i") return;
      if (e.key === "i") {
        const currentMarker = markerSec ?? timelineStartSec;

        // Complete the current i-cycled track's session
        if (iTrackId !== null) {
          const sessionStart = activeSessionStarts[iTrackId];
          if (sessionStart !== undefined) {
            setCompletedSessions((prev) => ({
              ...prev,
              [iTrackId]: [
                ...(prev[iTrackId] ?? []),
                { start: sessionStart, end: currentMarker },
              ],
            }));
          }
          setActiveSessionStarts((prev) => {
            const next = { ...prev };
            delete next[iTrackId];
            return next;
          });
          setSelectedTracks((prev) => {
            const next = new Set(prev);
            next.delete(iTrackId);
            return next;
          });
        }

        // Advance to next track in cycle
        const nextTrack = (() => {
          if (selectableRows.length === 0) return null;
          if (iTrackId === null) return selectableRows[0].id;
          const currentIndex = selectableRows.findIndex(
            (r) => r.id === iTrackId,
          );
          const nextIndex = (currentIndex + 1) % selectableRows.length;
          return selectableRows[nextIndex].id;
        })();

        setITrackId(nextTrack);
        if (nextTrack !== null) {
          setSelectedTracks((prev) => {
            const next = new Set(prev);
            next.add(nextTrack);
            return next;
          });
          setActiveSessionStarts((prev) => ({
            ...prev,
            [nextTrack]: currentMarker,
          }));
        }
      } else if (e.key === "o") {
        const currentMarker = markerSec ?? timelineStartSec;
        // Complete ALL active sessions simultaneously
        setCompletedSessions((prev) => {
          const updates = { ...prev };
          for (const [idStr, sessionStart] of Object.entries(
            activeSessionStarts,
          )) {
            const id = Number(idStr);
            if (currentMarker > sessionStart) {
              updates[id] = [
                ...(prev[id] ?? []),
                { start: sessionStart, end: currentMarker },
              ];
            }
          }
          return updates;
        });
        if (Object.keys(activeSessionStarts).length > 0) {
          setShowPunchOut(true);
          if (punchOutTimerRef.current) clearTimeout(punchOutTimerRef.current);
          punchOutTimerRef.current = setTimeout(
            () => setShowPunchOut(false),
            1000,
          );
        }
        setITrackId(null);
        setSelectedTracks(new Set());
        setActiveSessionStarts({});
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectableRows,
    iTrackId,
    activeSessionStarts,
    markerSec,
    timelineStartSec,
  ]);

  useEffect(() => {
    const step = 60;

    const handleArrow = (e: KeyboardEvent) => {
      if (selectedTracks.size > 0) {
        if (e.key !== "ArrowRight") return;
      } else {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      }
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? step : -step;
      setMarkerSec((prev) => {
        const base = prev ?? timelineStartSec;
        return Math.max(
          timelineStartSec,
          Math.min(timelineEndSec, base + delta),
        );
      });
    };

    window.addEventListener("keydown", handleArrow);
    return () => window.removeEventListener("keydown", handleArrow);
  }, [selectedTracks, timelineStartSec, timelineEndSec]);

  const gridWidth = gridRef.current?.clientWidth || 1;
  const pixelsPerSecond = gridWidth / visibleDuration;
  const pixelsPerHour = pixelsPerSecond * 3600;

  let hourStep = 1;

  if (pixelsPerHour < 40) hourStep = 2;
  if (pixelsPerHour < 25) hourStep = 3;
  if (pixelsPerHour < 18) hourStep = 4;
  if (pixelsPerHour < 12) hourStep = 6;

  const isInActivityRange = (sec: number) => {
    return sec >= timelineStartSec && sec <= timelineEndSec;
  };

  const resolvedMarkerSec = markerSec ?? timelineStartSec;

  const isCurrentVisible =
    resolvedMarkerSec >= visibleStart && resolvedMarkerSec <= visibleEnd;

  const currentLeft =
    ((resolvedMarkerSec - visibleStart) / visibleDuration) * 100;

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        borderTop: `1px solid ${Colors.lightGrayishBlue}`,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          minWidth: 130,
          maxWidth: 220,
          background: Colors.white,
          borderRight: `1px solid ${Colors.lightGrayishBlue}`,
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${Colors.lightGrayishBlue}`,
            height: "28px",
            padding: "0 4px 0 8px",
          }}
        >
          <p
            style={{
              textTransform: "capitalize",
              fontFamily: Fonts.main,
              fontSize: 12,
              color: Colors.lightBlack,
              lineHeight: 1.5,
              margin: 0,
              fontWeight: 700,
            }}
          >
            {headerLabel}
          </p>
          <Box sx={{ cursor: "pointer" }}>
            <img src="../assets/plus-1.svg" alt="" />
          </Box>
        </Box>

        {/* List */}
        <Box
          ref={listBodyRef}
          onScroll={() => {
            if (rowsScrollRef.current && listBodyRef.current) {
              rowsScrollRef.current.scrollTop = listBodyRef.current.scrollTop;
            }
          }}
          sx={{
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {flatRows.map((row) => {
            const isSelected = selectedTracks.has(row.id);
            const isActivitySubRow = isTunnel && row.kind === "activity";
            const isCameraInTunnel = isTunnel && row.kind === "camera";

            // Parent camera lights up when any of its activity children is selected
            const childSelected =
              isCameraInTunnel &&
              flatRows.some(
                (r) => r.parentCameraId === row.id && selectedTracks.has(r.id),
              );

            const handleClick = isCameraInTunnel
              ? undefined
              : () => {
                  const currentMarker = markerSec ?? timelineStartSec;
                  if (selectedTracks.has(row.id)) {
                    const sessionStart = activeSessionStarts[row.id];
                    if (
                      sessionStart !== undefined &&
                      currentMarker > sessionStart
                    ) {
                      setCompletedSessions((prev) => ({
                        ...prev,
                        [row.id]: [
                          ...(prev[row.id] ?? []),
                          { start: sessionStart, end: currentMarker },
                        ],
                      }));
                    }
                    setSelectedTracks((prev) => {
                      const next = new Set(prev);
                      next.delete(row.id);
                      return next;
                    });
                    setActiveSessionStarts((prev) => {
                      const next = { ...prev };
                      delete next[row.id];
                      return next;
                    });
                  } else {
                    setSelectedTracks((prev) => {
                      const next = new Set(prev);
                      next.add(row.id);
                      return next;
                    });
                    setActiveSessionStarts((prev) => ({
                      ...prev,
                      [row.id]: currentMarker,
                    }));
                  }
                };

            return (
              <Box
                key={row.id}
                onClick={handleClick}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: isActivitySubRow ? 0 : 1.5,
                  pl: isActivitySubRow ? "50px" : "8px",
                  pr: "8px",
                  py: "6px",
                  cursor: isCameraInTunnel ? "default" : "pointer",
                  fontFamily: Fonts.main,
                  fontSize: 14,
                  height: "32px",
                  lineHeight: 1.43,
                  fontWeight: isCameraInTunnel
                    ? childSelected
                      ? 700
                      : 400
                    : isSelected
                      ? 400
                      : 400,
                  backgroundColor: isCameraInTunnel
                    ? childSelected
                      ? Colors.vividOrange
                      : "transparent"
                    : isActivitySubRow
                      ? isSelected
                        ? Colors.blushWhite
                        : "transparent"
                      : isSelected
                        ? Colors.vividOrange
                        : "transparent",
                  color:
                    isCameraInTunnel && childSelected
                      ? Colors.white
                      : Colors.lightBlack,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    backgroundColor: isCameraInTunnel
                      ? childSelected
                        ? Colors.vividOrange
                        : "transparent"
                      : isActivitySubRow
                        ? isSelected
                          ? Colors.blushWhite
                          : Colors.white
                        : isSelected
                          ? Colors.vividOrange
                          : Colors.white,
                  },
                }}
              >
                {/* Circle index — hidden for activity sub-rows */}
                {!isActivitySubRow && (
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor:
                        (isCameraInTunnel && childSelected) || isSelected
                          ? Colors.white
                          : Colors.vividOrange,
                      color:
                        (isCameraInTunnel && childSelected) || isSelected
                          ? Colors.vividOrange
                          : Colors.white,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight:
                        (isCameraInTunnel && childSelected) || isSelected
                          ? 700
                          : 400,
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {row.cameraNumber}
                  </Box>
                )}
                {row.name}
              </Box>
            );
          })}
          {flatRows.filter((r) => r.kind === "camera").length === 0 && (
            <Box
              sx={{
                width: "129px",
                height: "54px",
                m: "25px auto",
                fontFamily: Fonts.main,
                fontSize: 12,
                color: Colors.dimGray,
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              Press <span style={{ color: Colors.vividOrange }}>+</span> on your
              keyboard to add a new employee
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Time grid area ───────────────────────────── */}

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: Colors.white,
          position: "relative",
        }}
      >
        {/* ── Time header ───────────────────────── */}
        <Box
          sx={{
            height: 28,
            position: "relative",
            borderBottom: `1px solid ${Colors.lightGrayishBlue}`,
            background: Colors.white,
            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
            userSelect: "none",
          }}
          onMouseDown={(e) => {
            if (zoom === 1) return;
            setIsDragging(true);
            setDragStartX(e.clientX);
            setDragStartOffset(panOffsetSec);
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {(() => {
            const start = Math.max(timelineStartSec, visibleStart);
            const end = Math.min(timelineEndSec, visibleEnd);

            if (end <= start) return null;

            const left = ((start - visibleStart) / visibleDuration) * 100;
            const width = ((end - start) / visibleDuration) * 100;

            return (
              <Box
                sx={{
                  position: "absolute",
                  left: `${left}%`,
                  width: `${width}%`,
                  top: 0,
                  height: "2px",
                  background: Colors.green,
                  zIndex: 10,
                }}
              />
            );
          })()}
          {Array.from({ length: 24 }).map((_, i) => {
            if (i % hourStep !== 0) return null;
            const hourTime = startSec + i * 3600;

            if (hourTime < visibleStart || hourTime > visibleEnd) return null;

            const left = ((hourTime - visibleStart) / visibleDuration) * 100;

            const hour = Math.floor((hourTime / 3600) % 24);

            return (
              <Box
                key={i}
                sx={{
                  position: "absolute",
                  left: `${left}%`,
                  top: 5,
                  transform: "translateX(-50%)",
                  fontSize: 14,
                  fontFamily: Fonts.main,
                  color: isInActivityRange(hourTime)
                    ? Colors.vividOrange
                    : Colors.mediumGray,
                  fontWeight: 400,
                }}
              >
                {`${hour.toString().padStart(2, "0")}:00`}
              </Box>
            );
          })}
        </Box>

        {/* ── Grid body ───────────────────────── */}
        <Box
          ref={gridRef}
          sx={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}
          onWheel={(e) => {
            if (!gridRef.current) return;

            if (e.ctrlKey) {
              e.preventDefault();

              const rect = gridRef.current.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const width = rect.width;

              const oldZoom = zoom;
              const newZoom = Math.min(
                4,
                Math.max(1, oldZoom + (e.deltaY > 0 ? -0.2 : 0.2)),
              );

              if (newZoom === oldZoom) return;

              const oldVisibleDuration = totalSec / oldZoom;
              const newVisibleDuration = totalSec / newZoom;

              const cursorTime =
                panOffsetSec + (mouseX / width) * oldVisibleDuration;

              let newOffset =
                cursorTime - (mouseX / width) * newVisibleDuration;

              const maxOffset = totalSec - newVisibleDuration;

              newOffset = Math.max(0, Math.min(maxOffset, newOffset));

              setZoom(newZoom);
              setPanOffsetSec(newOffset);
            } else {
              // Vertical wheel → scroll rows
              if (listBodyRef.current) {
                listBodyRef.current.scrollTop += e.deltaY;
                if (rowsScrollRef.current) {
                  rowsScrollRef.current.scrollTop =
                    listBodyRef.current.scrollTop;
                }
              }
              // Horizontal (trackpad swipe) → pan timeline
              if (e.deltaX !== 0) {
                const visibleDuration = totalSec / zoom;
                const maxOffset = totalSec - visibleDuration;
                setPanOffsetSec((prev) =>
                  Math.max(0, Math.min(maxOffset, prev + e.deltaX * 5)),
                );
              }
            }
          }}
        >
          {/* Vertical grid lines */}
          {Array.from({ length: 48 }).map((_, i) => {
            if (i % (hourStep * 2) !== 0) return null;
            const halfHourTime = startSec + i * 1800;

            if (halfHourTime < visibleStart || halfHourTime > visibleEnd)
              return null;

            const left =
              ((halfHourTime - visibleStart) / visibleDuration) * 100;

            return (
              <Box
                key={i}
                sx={{
                  position: "absolute",
                  left: `${left}%`,
                  top: 0,
                  bottom: 0,
                  width: "1px",
                  background: Colors.paleGray,
                }}
              />
            );
          })}

          {/* Rows — scroll-synced with left list */}
          <Box
            ref={rowsScrollRef}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: "hidden",
              pointerEvents: "none",
            }}
          >
            <Box sx={{ position: "relative", height: flatRows.length * 44 }}>
              {flatRows.map((row, rowIndex) => {
                const rowHeight = 44;
                const topOffset = rowIndex * rowHeight;
                const isSelected = selectedTracks.has(row.id);

                // ── Camera parent row in tunnel mode: aggregate from all activity sub-rows ──
                if (isTunnel && row.kind === "camera") {
                  const childIds = flatRows
                    .filter((r) => r.parentCameraId === row.id)
                    .map((r) => r.id);
                  const allFrozen = childIds.flatMap(
                    (id) => completedSessions[id] ?? [],
                  );
                  const allLive = childIds.flatMap((id) => {
                    const actStart = activeSessionStarts[id];
                    return selectedTracks.has(id) &&
                      actStart !== undefined &&
                      resolvedMarkerSec > actStart
                      ? [{ start: actStart, end: resolvedMarkerSec }]
                      : [];
                  });
                  const camRanges = [...allFrozen, ...allLive];

                  return (
                    <Box
                      key={row.id}
                      sx={{
                        position: "absolute",
                        top: topOffset,
                        left: 0,
                        right: 0,
                        height: rowHeight,
                        bgcolor: "transparent",
                      }}
                    >
                      {camRanges.map((range, i) => {
                        const isLive = i >= allFrozen.length;
                        const left =
                          ((range.start - visibleStart) / visibleDuration) *
                          100;
                        const width =
                          ((range.end - range.start) / visibleDuration) * 100;
                        return (
                          <Box
                            key={i}
                            sx={{
                              position: "absolute",
                              left: `${left}%`,
                              width: `${width}%`,
                              top: "50%",
                              transform: "translateY(-50%)",
                              height: 19,
                              borderRadius: "8px",
                              background:
                                isSelected || isLive
                                  ? Colors.softPink
                                  : Colors.lightGrayishBlue,
                            }}
                          />
                        );
                      })}
                    </Box>
                  );
                }

                // ── Normal selectable row (activity in tunnel, or camera in non-tunnel) ──
                const snapshotRanges = (() => {
                  const ranges: { start: number; end: number }[] = [];
                  let currentIn: number | null = null;
                  for (const s of row.sessions) {
                    if (s.type === "in") currentIn = toSeconds(s.timestamp);
                    if (s.type === "out" && currentIn !== null) {
                      ranges.push({
                        start: currentIn,
                        end: toSeconds(s.timestamp),
                      });
                      currentIn = null;
                    }
                  }
                  return ranges;
                })();
                const frozen = [
                  ...snapshotRanges,
                  ...(completedSessions[row.id] ?? []),
                ];
                const sessionStart = activeSessionStarts[row.id];
                const liveBar =
                  isSelected &&
                  sessionStart !== undefined &&
                  resolvedMarkerSec > sessionStart
                    ? { start: sessionStart, end: resolvedMarkerSec }
                    : null;
                const allRanges = liveBar ? [...frozen, liveBar] : frozen;

                return (
                  <Box
                    key={row.id}
                    sx={{
                      position: "absolute",
                      top: topOffset,
                      left: 0,
                      right: 0,
                      height: rowHeight,
                      bgcolor: isSelected
                        ? "rgba(255, 166, 0, 0.04)"
                        : "transparent",
                    }}
                  >
                    {/* Session bars */}
                    {allRanges.map((range, i) => {
                      const isLive =
                        liveBar !== null && i === allRanges.length - 1;
                      const left =
                        ((range.start - visibleStart) / visibleDuration) * 100;
                      const width =
                        ((range.end - range.start) / visibleDuration) * 100;
                      return (
                        <Box
                          key={i}
                          sx={{
                            position: "absolute",
                            left: `${left}%`,
                            width: `${width}%`,
                            top: "50%",
                            transform: "translateY(-50%)",
                            height: 19,
                            borderRadius: "8px",
                            background:
                              isSelected || isLive
                                ? isTunnel
                                  ? Colors.palePeach
                                  : Colors.vividOrange
                                : Colors.lightGrayishBlue,
                          }}
                        />
                      );
                    })}
                  </Box>
                );
              })}
            </Box>
          </Box>
          {!hasAnyBars && !isTunnel && (
            <Box
              sx={{
                width: "217px",
                height: "52px",
                fontFamily: Fonts.main,
                fontSize: 12,
                color: Colors.dimGray,
                lineHeight: 1.5,
                textAlign: "center",
                position: "absolute",
                top: "30%",
                left: "35%",
                padding: "8px 16px",
                bgcolor: " rgba(255, 255, 255, 0.6)",
                borderRadius: "8px",
              }}
            >
              Press <span style={{ color: Colors.vividOrange }}>i</span> on your
              keyboard to punch-in the selected employee
            </Box>
          )}
        </Box>
        {/* Current time marker */}
        {isCurrentVisible && (
          <>
            {/* Vertical line */}
            <Box
              sx={{
                position: "absolute",
                left: `${currentLeft}%`,
                top: 0,
                bottom: 0,
                width: "3px",
                background: Colors.vividOrange,
                transform: "translateX(-50%)",
                zIndex: 20,
              }}
            />

            {/* Top pill indicator */}
            <Box
              sx={{
                width: "18px",
                height: "7px",
                position: "absolute",
                left: `${currentLeft}%`,
                top: 22,
                transform: "translateX(-50%)",
                background: Colors.vividOrange,
                color: "white",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                zIndex: 21,
                pointerEvents: "none",
                justifyContent: "space-between",
              }}
            >
              <img
                style={{
                  height: "7px",
                  filter: "brightness(0) invert(1)",
                }}
                src="../assets/chevron-left.svg"
                alt=""
              />
              <img
                style={{
                  height: "7px",
                  filter: "brightness(0) invert(1)",
                }}
                src="../assets/chevron-right.svg"
                alt=""
              />
            </Box>
            {selectedTracks.size > 0 && !showPunchOut && (
              <Box
                sx={{
                  position: "absolute",
                  left: `${currentLeft + 1}%`,
                  top: 40,
                  color: Colors.dimGray,
                  fontSize: 12,
                  fontWeight: 400,
                  alignItems: "center",
                  gap: "2px",
                  zIndex: 1,
                  pointerEvents: "none",
                  lineHeight: 1.5,
                  fontFamily: Fonts.main,
                }}
              >
                <>
                  Press <span style={{ color: Colors.vividOrange }}>o</span> to
                  punch-out
                </>
              </Box>
            )}
            {showPunchOut && (
              <Box
                sx={{
                  position: "absolute",
                  left: `${currentLeft + 1}%`,
                  top: 40,
                  color: Colors.dimGray,
                  fontSize: 12,
                  fontWeight: 400,
                  zIndex: 1,
                  pointerEvents: "none",
                  lineHeight: 1.5,
                  fontFamily: Fonts.main,
                }}
              >
                Punch Out
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default TimelineBody;
