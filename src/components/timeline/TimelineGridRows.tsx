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
import { SessionRow, type BarEdit, type RowNotice } from "./rows/SessionRow";
import type { SelectedBar } from "./hooks/useTimelineBodyState";
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
  pendingReviewWallSec?: number;
  hasMultipleRows: boolean;
  reassignOptions?: { id: number; label: string; disabled?: boolean }[];
  onReassignRow?: (rowId: number, parentId: number) => void;
  /** Hint centered over the grid while there's nothing recorded yet. */
  emptyGridMessage?: React.ReactNode;
  /** Punches tabs: the selected session bar. */
  selectedBar?: SelectedBar | null;
  /** Punches tabs: clicking a bar selects it. */
  onSelectBar?: (rowId: number, start: number) => void;
  /** Punches tabs: a message shown at the marker on one row. */
  rowNotice?: RowNotice;
  /** Punches tabs: the sub-selected open sub-row. */
  activeSubRowId?: number | null;
  /** Punches tabs: the picked sub-row (↑/↓, click), highlighted. */
  highlightedSubRowId?: number | null;
  /** Punches tabs: per-row text next to the marker while its bar is open. */
  getOpenHint?: (rowId: number) => React.ReactNode | undefined;
  /** Punches tabs: whether a sub-row gets the change-attendance button. */
  canReassignRow?: (rowId: number) => boolean;
  /** Punches tabs: saves a bar dragged by its ends. */
  onEditBar?: (rowId: number, oldStart: number, next: BarEdit) => void;
  /** Punches tabs: outer limits for a bar's ends. */
  getEditBounds?: (
    rowId: number,
    start: number,
  ) => { min: number; max: number } | undefined;
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
  pendingReviewWallSec,
  hasMultipleRows,
  reassignOptions,
  onReassignRow,
  emptyGridMessage,
  selectedBar,
  onSelectBar,
  rowNotice,
  activeSubRowId,
  highlightedSubRowId,
  getOpenHint,
  canReassignRow,
  onEditBar,
  getEditBounds,
}: TimelineGridRowsProps) => {
  const selectedBarStartOf = (rowId: number) =>
    selectedBar?.rowId === rowId ? selectedBar.start : undefined;
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

  // Sub-rows under each parent row (e.g. Customer punches groups), so the
  // parent can mirror their bars.
  const childRowIdsByParent = new Map<number, number[]>();
  for (const r of flatRows) {
    if (r.kind !== "event" || r.parentCameraId === undefined) continue;
    const ids = childRowIdsByParent.get(r.parentCameraId) ?? [];
    ids.push(r.id);
    childRowIdsByParent.set(r.parentCameraId, ids);
  }

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

      {emptyGridMessage && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              maxWidth: "270px",
              fontFamily: Fonts.main,
              fontWeight: 400,
              fontSize: 12,
              lineHeight: "18px",
              letterSpacing: 0,
              color: Colors.dimGray,
              textAlign: "center",
              // A see-through card so it reads over the bars and grid lines.
              bgcolor: Colors.softWhite,
              boxShadow: "0 2px 10px 0 rgba(0, 0, 0, 0.16)",
              borderRadius: "8px",
              p: "8px 12px",
            }}
          >
            {emptyGridMessage}
          </Box>
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
          <Box
            sx={{
              position: "absolute",
              top: Math.max(0, flatRows.findIndex((r) => r.id === iTrackId)) * ROW_HEIGHT,
              left: 0,
              right: 0,
              height: ROW_HEIGHT,
              bgcolor: `${Colors.transparentVividOrange}`,
              pointerEvents: "none",
              zIndex: 0,
              opacity: iTrackId !== null && flatRows.some((r) => r.id === iTrackId) ? 1 : 0,
              transition: "top 150ms ease, opacity 150ms ease",
            }}
          />
          {flatRows.map((row, rowIndex) =>
            row.kind === "camera" ? (
              <SessionRow
                key={row.id}
                row={row}
                rowIndex={rowIndex}
                childRowIds={childRowIdsByParent.get(row.id)}
                isSelected={selectedTracks.has(row.id)}
                completedSessions={completedSessions}
                activeSessionStarts={activeSessionStarts}
                resolvedMarkerSec={resolvedMarkerSec}
                visibleStart={visibleStart}
                visibleDuration={visibleDuration}
                selectedBarStart={selectedBarStartOf(row.id)}
                onSelectBar={onSelectBar}
                onEditBar={onEditBar}
                getEditBounds={getEditBounds}
                notice={rowNotice?.rowId === row.id ? rowNotice : undefined}
                openHint={getOpenHint?.(row.id)}
                // Punches tabs: the selected line, with no sub-row bar picked.
                highlightChildBars={
                  onSelectBar !== undefined &&
                  row.id === iTrackId &&
                  !(
                    selectedBar &&
                    childRowIdsByParent.get(row.id)?.includes(selectedBar.rowId)
                  )
                }
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
                  reassignOptions={reassignOptions}
                  // Only rows the tab allows (e.g. not Back Room breaks).
                  onReassign={
                    canReassignRow?.(row.id) === false
                      ? undefined
                      : onReassignRow
                  }
                  // Only the sub-selected sub-row is highlighted and shows
                  // the punch-out hint ("o" acts on it alone).
                  isSubSelected={row.id === highlightedSubRowId}
                  showPunchOutHint={row.id === activeSubRowId}
                  selectedBarStart={selectedBarStartOf(row.id)}
                  onSelectBar={onSelectBar}
                  onEditBar={onEditBar}
                  getEditBounds={getEditBounds}
                  notice={rowNotice?.rowId === row.id ? rowNotice : undefined}
                  openHint={getOpenHint?.(row.id)}
                />
                {/* Punches tabs (selectable bars) have no diamonds, and the
                    diamond canvas would swallow the clicks on sub-row bars. */}
                {!onSelectBar && (
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
                    pendingReviewWallSec={pendingReviewWallSec}
                    hasMultipleRows={hasMultipleRows}
                  />
                )}
              </Box>
            ),
          )}
        </Box>
      </Box>
    </Box>
  );
};
