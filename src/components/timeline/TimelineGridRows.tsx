import { Box } from "@mui/system";
import { Colors, Fonts } from "../../theme";
import type { FlatRow } from "./types";

interface TimelineGridRowsProps {
  flatRows: FlatRow[];
  gridRef: React.RefObject<HTMLDivElement | null>;
  rowsScrollRef: React.RefObject<HTMLDivElement | null>;
  listBodyRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  panOffsetSec: number;
  totalSec: number;
  startSec: number;
  hourStep: number;
  selectedTracks: Set<number>;
  completedSessions: Record<number, { start: number; end: number }[]>;
  activeSessionStarts: Record<number, number>;
  resolvedMarkerSec: number;
  isTunnel: boolean;
  visibleStart: number;
  visibleDuration: number;
  hasAnyBars: boolean;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPanOffsetSec: React.Dispatch<React.SetStateAction<number>>;
}

const toSeconds = (time: string) => {
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

export const TimelineGridRows = ({
  flatRows,
  gridRef,
  rowsScrollRef,
  listBodyRef,
  zoom,
  panOffsetSec,
  totalSec,
  startSec,
  hourStep,
  selectedTracks,
  completedSessions,
  activeSessionStarts,
  resolvedMarkerSec,
  isTunnel,
  visibleStart,
  visibleDuration,
  hasAnyBars,
  setZoom,
  setPanOffsetSec,
}: TimelineGridRowsProps) => {
  const visibleEnd = visibleStart + visibleDuration;

  return (
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
          if (listBodyRef.current) {
            listBodyRef.current.scrollTop += e.deltaY;
            if (rowsScrollRef.current) {
              rowsScrollRef.current.scrollTop = listBodyRef.current.scrollTop;
            }
          }
          if (e.deltaX !== 0) {
            const vd = totalSec / zoom;
            const maxOffset = totalSec - vd;
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

            // Camera parent row in tunnel mode: aggregate from activity children
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
                              ? Colors.softPink
                              : Colors.lightGrayishBlue,
                        }}
                      />
                    );
                  })}
                </Box>
              );
            }

            // Normal selectable row
            const snapshotRanges = (() => {
              const ranges: { start: number; end: number }[] = [];
              let currentIn: number | null = null;
              for (const s of row.sessions) {
                if (s.type === "in") currentIn = toSeconds(s.timestamp);
                if (s.type === "out" && currentIn !== null) {
                  ranges.push({ start: currentIn, end: toSeconds(s.timestamp) });
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

      {/* Empty state hint */}
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
  );
};
