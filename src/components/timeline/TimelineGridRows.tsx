import { Box } from "@mui/system";
import { Colors } from "../../theme";
import type React from "react";
import type { FlatRow, CameraEventPoint } from "./types";
import { useEventPointResize } from "./hooks/useEventPointResize";
import { useWheelZoomPan } from "./hooks/useWheelZoomPan";
import { useDragCreateSession } from "./hooks/useDragCreateSession";
import { useDragExtendEventPoint } from "./hooks/useDragExtendEventPoint";
import type { DragSession } from "./hooks/useDragCreateSession";
import { EventRow } from "./rows/EventRow";
import { SessionRow } from "./rows/SessionRow";
import { GridLines } from "./rows/GridLines";

const ROW_HEIGHT = 44;

interface TimelineGridRowsProps {
  flatRows: FlatRow[];
  gridRef: React.RefObject<HTMLDivElement | null>;
  rowsScrollRef: React.RefObject<HTMLDivElement | null>;
  listBodyRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  panOffsetSec: number;
  totalSec: number;
  startSec: number;
  tickStepSec: number;
  selectedTracks: Set<number>;
  completedSessions: Record<number, { start: number; end: number }[]>;
  activeSessionStarts: Record<number, number>;
  resolvedMarkerSec: number;
  visibleStart: number;
  visibleDuration: number;
  hasAnyBars: boolean;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPanOffsetSec: React.Dispatch<React.SetStateAction<number>>;
  cameraEventPoints?: CameraEventPoint[];
  onUpdateEventPoint?: (
    id: number,
    update: Partial<Pick<CameraEventPoint, "startSec" | "endSec">>,
  ) => void;
  iTrackId?: number | null;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  selectedEventPointId: number | null;
  setSelectedEventPointId: React.Dispatch<React.SetStateAction<number | null>>;
  onCreateSession: (rowId: number, start: number, end: number) => void;
}

const DragPreview = ({
  dragging,
  flatRows,
  visibleStart,
  visibleDuration,
}: {
  dragging: DragSession;
  flatRows: FlatRow[];
  visibleStart: number;
  visibleDuration: number;
}) => {
  const rowIndex = flatRows.findIndex((r) => r.id === dragging.rowId);
  if (rowIndex === -1) return null;
  const start = Math.min(dragging.startSec, dragging.endSec);
  const end = Math.max(dragging.startSec, dragging.endSec);
  const leftPct = ((start - visibleStart) / visibleDuration) * 100;
  const widthPct = ((end - start) / visibleDuration) * 100;
  const topCenter = rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
  const diamond = (pct: number, key: string) => (
    <Box
      key={key}
      sx={{
        position: "absolute",
        left: `${pct}%`,
        top: topCenter,
        transform: "translate(-50%, -50%) rotate(45deg)",
        width: 14,
        height: 14,
        bgcolor: Colors.vividOrange,
        outline: `1px solid ${Colors.white}`,
        opacity: 0.85,
        pointerEvents: "none",
        zIndex: 11,
      }}
    />
  );
  return (
    <>
      <Box
        sx={{
          position: "absolute",
          left: `${leftPct}%`,
          width: `${Math.max(widthPct, 0)}%`,
          top: topCenter - 9,
          height: 19,
          borderRadius: "8px",
          bgcolor: Colors.vividOrange,
          opacity: 0.45,
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
      {diamond(leftPct, "start")}
      {diamond(leftPct + widthPct, "end")}
    </>
  );
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
  tickStepSec,
  selectedTracks,
  completedSessions,
  activeSessionStarts,
  resolvedMarkerSec,
  visibleStart,
  visibleDuration,
  //hasAnyBars,
  setZoom,
  setPanOffsetSec,
  cameraEventPoints = [],
  onUpdateEventPoint,
  iTrackId,
  setITrackId,
  setMarkerSec,
  selectedEventPointId,
  setSelectedEventPointId,
  onCreateSession,
}: TimelineGridRowsProps) => {
  const visibleEnd = visibleStart + visibleDuration;

  const setResizing = useEventPointResize({
    gridRef,
    visibleStart,
    visibleDuration,
    totalSec,
    onUpdateEventPoint,
  });

  useWheelZoomPan({
    gridRef,
    rowsScrollRef,
    listBodyRef,
    zoom,
    panOffsetSec,
    totalSec,
    setZoom,
    setPanOffsetSec,
  });

  const { startExtend } = useDragExtendEventPoint({
    gridRef,
    visibleStart,
    visibleDuration,
    totalSec,
    onUpdateEventPoint,
  });

  const { dragging, onMouseDown } = useDragCreateSession({
    gridRef,
    rowsScrollRef,
    visibleStart,
    visibleDuration,
    flatRows,
    onCommit: onCreateSession,
  });

  return (
    <Box
      ref={gridRef}
      sx={{ flex: 1, position: "relative", overflow: "hidden", cursor: dragging ? "ew-resize" : "default" }}
      onMouseDown={onMouseDown}
    >
      <GridLines
        totalSec={totalSec}
        tickStepSec={tickStepSec}
        startSec={startSec}
        visibleStart={visibleStart}
        visibleEnd={visibleEnd}
        visibleDuration={visibleDuration}
      />

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
        <Box
          sx={{ position: "relative", height: flatRows.length * ROW_HEIGHT }}
        >
          {flatRows.map((row, rowIndex) =>
            iTrackId === row.id ? (
              <Box
                key={`highlight-${row.id}`}
                sx={{
                  position: "absolute",
                  top: rowIndex * ROW_HEIGHT,
                  left: 0,
                  right: 0,
                  height: ROW_HEIGHT,
                  bgcolor: `${Colors.semiTransparentGray}`,
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
            ) : null,
          )}
          {flatRows.map((row, rowIndex) =>
            row.kind === "camera" ? (
              <SessionRow
                key={row.id}
                row={row}
                rowIndex={rowIndex}
                isSelected={selectedTracks.has(row.id)}
                completedSessions={completedSessions}
                activeSessionStarts={activeSessionStarts}
                resolvedMarkerSec={resolvedMarkerSec}
                visibleStart={visibleStart}
                visibleDuration={visibleDuration}
              />
            ) : (
              <Box key={row.id} sx={{ position: "absolute", top: 0, left: 0, right: 0 }}>
                <SessionRow
                  row={row}
                  rowIndex={rowIndex}
                  isSelected={selectedTracks.has(row.id)}
                  completedSessions={completedSessions}
                  activeSessionStarts={activeSessionStarts}
                  resolvedMarkerSec={resolvedMarkerSec}
                  visibleStart={visibleStart}
                  visibleDuration={visibleDuration}
                />
                <EventRow
                  row={row}
                  rowIndex={rowIndex}
                  cameraEventPoints={cameraEventPoints}
                  visibleStart={visibleStart}
                  visibleEnd={visibleEnd}
                  visibleDuration={visibleDuration}
                  setResizing={setResizing}
                  setMarkerSec={setMarkerSec}
                  setITrackId={setITrackId}
                  selectedEventPointId={selectedEventPointId}
                  setSelectedEventPointId={setSelectedEventPointId}
                  onExtendStart={startExtend}
                />
              </Box>
            ),
          )}

          {dragging && (
            <DragPreview
              dragging={dragging}
              flatRows={flatRows}
              visibleStart={visibleStart}
              visibleDuration={visibleDuration}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};
