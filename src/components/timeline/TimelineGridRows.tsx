import { Box } from "@mui/system";
import { Colors, Fonts } from "../../theme";
import type {} from "react";
import type React from "react";
import Spinner from "../Spinner";
import type { FlatRow, CameraEventPoint } from "./types";
import { useEventPointResize } from "./hooks/useEventPointResize";
import { useWheelZoomPan } from "./hooks/useWheelZoomPan";
import { useDragExtendEventPoint } from "./hooks/useDragExtendEventPoint";
import { EventRow } from "./rows/EventRow";
import { SessionRow } from "./rows/SessionRow";
import { GridLines } from "./rows/GridLines";
import Card from "../Card";

const ROW_HEIGHT = 32.8;

interface TimelineGridRowsProps {
  flatRows: FlatRow[];
  gridRef: React.RefObject<HTMLDivElement | null>;
  rowsScrollRef: React.RefObject<HTMLDivElement | null>;
  listBodyRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  panOffsetSec: number;
  totalSec: number;
  timelineStartSec: number;
  timelineEndSec: number;
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
  editingEventPointId: number | null;
  onExitEditMode: () => void;
  onEditEventPoint?: (id: number) => void;
  onConvertEventPointToLocal?: (id: number) => number;
  onEnterEditMode?: (id: number) => void;
  onUserPan?: () => void;
  loadState?: boolean;
}

export const TimelineGridRows = ({
  flatRows,
  gridRef,
  rowsScrollRef,
  listBodyRef,
  zoom,
  panOffsetSec,
  totalSec,
  timelineStartSec,
  timelineEndSec,
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
  editingEventPointId,
  onExitEditMode,
  onEditEventPoint,
  onConvertEventPointToLocal,
  onEnterEditMode,
  onUserPan,
  loadState = false,
}: TimelineGridRowsProps) => {
  const visibleEnd = visibleStart + visibleDuration;

  const setResizing = useEventPointResize({
    gridRef,
    visibleStart,
    visibleDuration,
    timelineStartSec,
    timelineEndSec,
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
    onUserPan,
  });

  const { startExtend, startMove } = useDragExtendEventPoint({
    gridRef,
    visibleStart,
    visibleDuration,
    timelineStartSec,
    timelineEndSec,
    onUpdateEventPoint,
  });

  return (
    <Box
      ref={gridRef}
      sx={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        cursor: "default",
      }}
    >
      <GridLines
        totalSec={totalSec}
        tickStepSec={tickStepSec}
        startSec={startSec}
        visibleStart={visibleStart}
        visibleEnd={visibleEnd}
        visibleDuration={visibleDuration}
      />

      {flatRows.filter((r) => r.kind !== "event").length === 0 && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            fontFamily: Fonts.main,
            fontSize: 12,
            color: Colors.dimGray,
            lineHeight: 1.5,
          }}
        >
          {loadState ? (
            <Card
              sx={{
                bgcolor: Colors.white,
                display: "flex",
                alignItems: "center",
                width: "120px",
              }}
            >
              <Spinner m="8px" />
              loading...
            </Card>
          ) : (
            <Card
              sx={{
                bgcolor: Colors.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100px",
                height: "25px",
              }}
            >
              Empty
            </Card>
          )}
        </Box>
      )}

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
                  bgcolor: `${Colors.transparentVividOrange}`,
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
              <Box
                key={row.id}
                sx={{ position: "absolute", top: 0, left: 0, right: 0 }}
              >
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
                  editingEventPointId={editingEventPointId}
                  onExitEditMode={onExitEditMode}
                  onStartMove={startMove}
                  onExtendStart={startExtend}
                  onConvertEventPointToLocal={onConvertEventPointToLocal}
                  onEnterEditMode={onEnterEditMode}
                  onEditEventPoint={onEditEventPoint}
                />
              </Box>
            ),
          )}
        </Box>
      </Box>
    </Box>
  );
};
