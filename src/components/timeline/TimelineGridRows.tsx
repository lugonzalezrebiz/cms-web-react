import { Box } from "@mui/system";
import { Colors } from "../../theme";
import type { FlatRow, CameraEventPoint } from "./types";
import { useEventPointResize } from "./hooks/useEventPointResize";
import { useWheelZoomPan } from "./hooks/useWheelZoomPan";
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
}

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

  return (
    <Box
      ref={gridRef}
      sx={{ flex: 1, position: "relative", overflow: "hidden" }}
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
            row.kind === "event" || row.kind === "activity" ? (
              <EventRow
                key={row.id}
                row={row}
                rowIndex={rowIndex}
                cameraEventPoints={cameraEventPoints}
                visibleStart={visibleStart}
                visibleEnd={visibleEnd}
                visibleDuration={visibleDuration}
                setResizing={setResizing}
              />
            ) : (
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
            ),
          )}
        </Box>
      </Box>
    </Box>
  );
};
