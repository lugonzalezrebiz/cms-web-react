import { Box } from "@mui/system";
import { Colors } from "../../theme";
import { useCallback } from "react";
import type React from "react";
import type { FlatRow, CameraEventPoint } from "./types";
import { useEventPointResize } from "./hooks/useEventPointResize";
import { useWheelZoomPan } from "./hooks/useWheelZoomPan";
import { useDragExtendEventPoint } from "./hooks/useDragExtendEventPoint";
import type { DragConfig } from "./hooks/useDragExtendEventPoint";
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
    update: Partial<Pick<CameraEventPoint, "startSec" | "endSec" | "timeSec">>,
  ) => void;
  iTrackId?: number | null;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  selectedEventPointId: number | null;
  setSelectedEventPointId: React.Dispatch<React.SetStateAction<number | null>>;
  editingEventPointId: number | null;
  setEditingEventPointId: React.Dispatch<React.SetStateAction<number | null>>;
  onClearEditing: () => void;
  onStartEditEventPoint?: (id: number) => Promise<number>;
  onUserPan?: () => void;
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
  setITrackId,
  setMarkerSec,
  selectedEventPointId,
  setSelectedEventPointId,
  editingEventPointId,
  setEditingEventPointId,
  onClearEditing,
  onStartEditEventPoint,
  onUserPan,
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
    onUserPan,
  });

  const { startExtend } = useDragExtendEventPoint({
    gridRef,
    visibleStart,
    visibleDuration,
    totalSec,
    onUpdateEventPoint,
  });

  const handleDragStart = useCallback(
    async (ep: CameraEventPoint, e: React.MouseEvent, config: DragConfig) => {
      e.preventDefault();
      e.stopPropagation();
      if (selectedEventPointId !== ep.id) {
        setSelectedEventPointId(ep.id);
        return;
      }
      if (editingEventPointId === ep.id) {
        startExtend(ep.id, config);
        return;
      }
      // Point has no range yet (first extension)
      if (ep.endSec <= ep.timeSec) {
        if (!ep.entryIds?.length) {
          startExtend(ep.id, config);
          return;
        }
        // Preloaded RANGE point — must convert to local before the drag updates take effect
        if (!onStartEditEventPoint) return;
        const userDragged = await new Promise<boolean>((resolve) => {
          const onMove = () => { window.removeEventListener("mouseup", onUp); resolve(true); };
          const onUp = () => { window.removeEventListener("mousemove", onMove); resolve(false); };
          window.addEventListener("mousemove", onMove, { once: true });
          window.addEventListener("mouseup", onUp, { once: true });
        });
        if (!userDragged) return;

        let releasedBeforeReady = false;
        const onEarlyMouseUp = () => { releasedBeforeReady = true; };
        window.addEventListener("mouseup", onEarlyMouseUp, { once: true });

        const newId = await onStartEditEventPoint(ep.id);
        window.removeEventListener("mouseup", onEarlyMouseUp);

        setEditingEventPointId(newId);
        setSelectedEventPointId(newId);
        if (!releasedBeforeReady) {
          startExtend(newId, config);
        }
        return;
      }
      if (ep.entryIds?.length && onStartEditEventPoint) {
        // Wait for first mousemove before calling the API — prevents creating an
        // orphaned shadow copy when the user clicks without dragging.
        const userDragged = await new Promise<boolean>((resolve) => {
          const onMove = () => { window.removeEventListener("mouseup", onUp); resolve(true); };
          const onUp = () => { window.removeEventListener("mousemove", onMove); resolve(false); };
          window.addEventListener("mousemove", onMove, { once: true });
          window.addEventListener("mouseup", onUp, { once: true });
        });
        if (!userDragged) return;

        // User is dragging — start extending the original optimistically while API resolves.
        startExtend(ep.id, config);

        let releasedBeforeReady = false;
        const onEarlyMouseUp = () => { releasedBeforeReady = true; };
        window.addEventListener("mouseup", onEarlyMouseUp, { once: true });

        const newId = await onStartEditEventPoint(ep.id);
        window.removeEventListener("mouseup", onEarlyMouseUp);

        setEditingEventPointId(newId);
        setSelectedEventPointId(newId);
        if (!releasedBeforeReady) {
          // Seamlessly switch the drag from original to shadow copy.
          startExtend(newId, config);
        }
      } else {
        setEditingEventPointId(ep.id);
        startExtend(ep.id, config);
      }
    },
    [editingEventPointId, selectedEventPointId, onStartEditEventPoint, setEditingEventPointId, setSelectedEventPointId, startExtend],
  );

  const handleGridClick = () => {
    if (editingEventPointId !== null) onClearEditing();
  };

  return (
    <Box
      ref={gridRef}
      onClick={handleGridClick}
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
                  totalSec={totalSec}
                  setMarkerSec={setMarkerSec}
                  setITrackId={setITrackId}
                  selectedEventPointId={selectedEventPointId}
                  editingEventPointId={editingEventPointId}
                  setSelectedEventPointId={setSelectedEventPointId}
                  onDragStart={handleDragStart}
                />
              </Box>
            ),
          )}


        </Box>
      </Box>
    </Box>
  );
};
