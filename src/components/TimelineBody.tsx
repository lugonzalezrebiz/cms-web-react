import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import { useEffect, useRef, useState } from "react";

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
}

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

const TimelineBody = ({ snapshot, activeTab }: TimelineBodyProps) => {
  const [zoom, setZoom] = useState(1.5);
  const [panOffsetSec, setPanOffsetSec] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  const [markerSec, setMarkerSec] = useState<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState<
    Record<number, { start: number; end: number }[]>
  >({});
  const [activeSessionStart, setActiveSessionStart] = useState<number | null>(
    null,
  );
  const [showPunchOut, setShowPunchOut] = useState(false);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const punchOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredTracks =
    snapshot?.timeline.tracks.filter((t) => t.category === activeTab) ||
    MOCK_SNAPSHOT.timeline.tracks.filter((t) => t.category === activeTab);

  const toSeconds = (time: string) => {
    const [h, m, s] = time.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const allTimestamps = filteredTracks.flatMap((track) =>
    track.sessions.map((s) => toSeconds(s.timestamp)),
  );

  const firstActivitySec =
    allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0;

  const hasAnyBars =
    allTimestamps.length > 0 ||
    Object.values(completedSessions).some((arr) => arr.length > 0) ||
    activeSessionStart !== null;

  const data = snapshot || MOCK_SNAPSHOT;

  const timelineStartSec = toSeconds(data.timeline.times.start);
  const timelineEndSec = toSeconds(data.timeline.times.end);

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
    setSelectedTrack(null);
    setActiveSessionStart(null);
    setShowPunchOut(false);
    if (punchOutTimerRef.current) clearTimeout(punchOutTimerRef.current);
  }, [activeTab]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "i") {
        const currentMarker = markerSec ?? timelineStartSec;

        if (selectedTrack !== null && activeSessionStart !== null) {
          setCompletedSessions((prev) => ({
            ...prev,
            [selectedTrack]: [
              ...(prev[selectedTrack] ?? []),
              { start: activeSessionStart, end: currentMarker },
            ],
          }));
        }

        const nextTrack = (() => {
          if (filteredTracks.length === 0) return null;
          if (selectedTrack === null) return filteredTracks[0].id;
          const currentIndex = filteredTracks.findIndex(
            (t) => t.id === selectedTrack,
          );
          const nextIndex = (currentIndex + 1) % filteredTracks.length;
          return filteredTracks[nextIndex].id;
        })();

        setSelectedTrack(nextTrack);
        setActiveSessionStart(nextTrack !== null ? currentMarker : null);
      } else if (e.key === "o") {
        const currentMarker = markerSec ?? timelineStartSec;

        if (selectedTrack !== null && activeSessionStart !== null) {
          setCompletedSessions((prev) => ({
            ...prev,
            [selectedTrack]: [
              ...(prev[selectedTrack] ?? []),
              { start: activeSessionStart, end: currentMarker },
            ],
          }));

          setShowPunchOut(true);
          if (punchOutTimerRef.current) clearTimeout(punchOutTimerRef.current);
          punchOutTimerRef.current = setTimeout(
            () => setShowPunchOut(false),
            1000,
          );
        }

        setSelectedTrack(null);
        setActiveSessionStart(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    filteredTracks,
    selectedTrack,
    activeSessionStart,
    markerSec,
    timelineStartSec,
  ]);

  useEffect(() => {
    const step = 60;

    const handleArrow = (e: KeyboardEvent) => {
      if (selectedTrack !== null) {
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
  }, [selectedTrack, timelineStartSec, timelineEndSec]);

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
            {activeTab}
          </p>
          <Box sx={{ cursor: "pointer" }}>
            <img src="../assets/plus-1.svg" alt="" />
          </Box>
        </Box>

        {/* List */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {filteredTracks.map((track, index) => {
            const isSelected = selectedTrack === track.id;

            return (
              <Box
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: "6px 8px",
                  cursor: "pointer",
                  fontFamily: Fonts.main,
                  fontSize: 12,
                  height: "32px",
                  fontWeight: isSelected ? 700 : 400,
                  backgroundColor: isSelected
                    ? Colors.vividOrange
                    : "transparent",
                  color: isSelected ? Colors.white : Colors.lightBlack,
                  transition: "all 0.15s ease",

                  "&:hover": {
                    backgroundColor: isSelected
                      ? Colors.vividOrange
                      : Colors.white,
                  },
                }}
              >
                {/* Circle index */}
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: isSelected
                      ? Colors.white
                      : Colors.vividOrange,
                    color: isSelected ? Colors.vividOrange : Colors.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 400,
                    textAlign: "center",
                  }}
                >
                  {index + 1}
                </Box>

                {track.name}
              </Box>
            );
          })}
          {filteredTracks.length === 0 && (
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
              const visibleDuration = totalSec / zoom;
              const maxOffset = totalSec - visibleDuration;

              setPanOffsetSec((prev) =>
                Math.max(0, Math.min(maxOffset, prev + e.deltaY * 5)),
              );
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

          {/* Rows */}
          {filteredTracks.map((track, rowIndex) => {
            const rowHeight = 44;
            const topOffset = rowIndex * rowHeight;
            const isSelected = selectedTrack === track.id;

            const snapshotRanges = (() => {
              const ranges: { start: number; end: number }[] = [];
              let currentIn: number | null = null;
              for (const s of track.sessions) {
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
              ...(completedSessions[track.id] ?? []),
            ];
            const liveBar =
              isSelected &&
              activeSessionStart !== null &&
              resolvedMarkerSec > activeSessionStart
                ? { start: activeSessionStart, end: resolvedMarkerSec }
                : null;
            const allRanges = liveBar ? [...frozen, liveBar] : frozen;

            return (
              <Box
                key={track.id}
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
                  const isLive = liveBar !== null && i === allRanges.length - 1;
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
                            ? Colors.vividOrange
                            : Colors.lightGrayishBlue,
                      }}
                    />
                  );
                })}
              </Box>
            );
          })}
          {!hasAnyBars && (
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
            {selectedTrack !== null && !showPunchOut && (
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
