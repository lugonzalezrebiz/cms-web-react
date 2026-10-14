import { Box } from "@mui/system";
import { Colors } from "../../theme";
import type React from "react";
import type { CameraEventPoint, FlatRow } from "./types";
import { TimelineRowList } from "./TimelineRowList";
import { TimelineTimeRuler } from "./TimelineTimeRuler";
import { TimelineGridRows } from "./TimelineGridRows";
import { TimelineMarker } from "./TimelineMarker";
import type { SelectedBar } from "./hooks/useTimelineBodyState";
import type { BarEdit, RowNotice } from "./rows/SessionRow";

export interface TimelineBodyViewProps {
  flatRows: FlatRow[];
  headerLabel: string;
  openDialog: boolean;
  dialogOnClose: () => void;
  onOpenDialog: () => void;
  selectedTracks: Set<number>;
  activeSessionStarts: Record<number, number>;
  listBodyRef: React.RefObject<HTMLDivElement | null>;
  rowsScrollRef: React.RefObject<HTMLDivElement | null>;
  iTrackId: number | null;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedTracks: React.Dispatch<React.SetStateAction<Set<number>>>;
  zoom: number;
  isDragging: boolean;
  panOffsetSec: number;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setDragStartX: React.Dispatch<React.SetStateAction<number | null>>;
  setDragStartOffset: React.Dispatch<React.SetStateAction<number>>;
  handleMouseMove: (e: React.MouseEvent) => void;
  timelineStartSec: number;
  timelineEndSec: number;
  visibleStart: number;
  visibleDuration: number;
  startSec: number;
  tickStepSec: number;
  isInActivityRange: (sec: number) => boolean;
  gridRef: React.RefObject<HTMLDivElement | null>;
  totalSec: number;
  completedSessions: Record<number, { start: number; end: number }[]>;
  resolvedMarkerSec: number;
  hasAnyBars: boolean;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPanOffsetSec: React.Dispatch<React.SetStateAction<number>>;
  cameraEventPoints?: CameraEventPoint[];
  onUpdateEventPoint?: (
    id: number,
    update: Partial<Pick<CameraEventPoint, "startSec" | "endSec">>,
  ) => void;
  currentLeft: number;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  selectedEventPointId: number | null;
  setSelectedEventPointId: React.Dispatch<React.SetStateAction<number | null>>;
  editingEventPointId: number | null;
  onExitEditMode: () => void;
  onEditEventPoint?: (id: number) => void;
  onConvertEventPointToLocal?: (id: number) => number;
  onEnterEditMode?: (id: number) => void;
  onUserPan?: () => void;
  rowsLoadState?: boolean;
  loadState?: boolean;
  pendingReviewWallSec?: number;
  hasMultipleRows: boolean;
  showAddButton?: boolean;
  reassignOptions?: { id: number; label: string; disabled?: boolean }[];
  onReassignRow?: (rowId: number, parentId: number) => void;
  emptyGridMessage?: React.ReactNode;
  selectedBar?: SelectedBar | null;
  onSelectBar?: (rowId: number, start: number) => void;
  rowNotice?: RowNotice;
  /** Called when a click in the list selects a row. */
  highlightedSubRowId?: number | null;
  onSelectSubRow?: (rowId: number) => void;
  rowNumberStart?: number;
  getOpenHint?: (rowId: number) => React.ReactNode | undefined;
  canReassignRow?: (rowId: number) => boolean;
  getSelectedHint?: (rowId: number) => React.ReactNode | undefined;
  getParentHint?: (rowId: number) => React.ReactNode | undefined;
  punchedOut?: { rowId: number; sec: number; key: number };
  onSelectLine?: (
    rowId: number,
    block: { start: number; end: number },
  ) => void;
  onEditBar?: (rowId: number, oldStart: number, next: BarEdit) => void;
  getEditBounds?: (
    rowId: number,
    start: number,
  ) => { min: number; max: number } | undefined;
}

const TimelineBody = ({
  flatRows,
  headerLabel,
  openDialog,
  dialogOnClose,
  onOpenDialog,
  selectedTracks,
  activeSessionStarts,
  listBodyRef,
  rowsScrollRef,
  iTrackId,
  setITrackId,
  setSelectedTracks,
  zoom,
  isDragging,
  panOffsetSec,
  setIsDragging,
  setDragStartX,
  setDragStartOffset,
  handleMouseMove,
  timelineStartSec,
  timelineEndSec,
  visibleStart,
  visibleDuration,
  startSec,
  tickStepSec,
  isInActivityRange,
  gridRef,
  totalSec,
  completedSessions,
  resolvedMarkerSec,
  hasAnyBars,
  setZoom,
  setPanOffsetSec,
  cameraEventPoints,
  onUpdateEventPoint,
  currentLeft,
  setMarkerSec,
  selectedEventPointId,
  setSelectedEventPointId,
  editingEventPointId,
  onExitEditMode,
  onEditEventPoint,
  onConvertEventPointToLocal,
  onEnterEditMode,
  onUserPan,
  rowsLoadState,
  loadState,
  pendingReviewWallSec,
  hasMultipleRows,
  showAddButton,
  reassignOptions,
  onReassignRow,
  emptyGridMessage,
  selectedBar,
  onSelectBar,
  rowNotice,
  highlightedSubRowId,
  onSelectSubRow,
  rowNumberStart,
  getOpenHint,
  canReassignRow,
  getSelectedHint,
  getParentHint,
  punchedOut,
  onSelectLine,
  onEditBar,
  getEditBounds,
}: TimelineBodyViewProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        //borderTop: `1px solid ${Colors.lightGrayishBlue}`,
        overflow: "hidden",
      }}
    >
      <TimelineRowList
        dialogOnClose={dialogOnClose}
        onOpenDialog={onOpenDialog}
        openDialog={openDialog}
        flatRows={flatRows}
        selectedTracks={selectedTracks}
        activeSessionStarts={activeSessionStarts}
        headerLabel={headerLabel}
        listBodyRef={listBodyRef}
        rowsScrollRef={rowsScrollRef}
        iTrackId={iTrackId}
        setITrackId={setITrackId}
        setSelectedTracks={setSelectedTracks}
        loadState={rowsLoadState}
        showAddButton={showAddButton}
        highlightedSubRowId={highlightedSubRowId}
        onSelectSubRow={onSelectSubRow}
        rowNumberStart={rowNumberStart}
      />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: Colors.white,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <TimelineTimeRuler
          zoom={zoom}
          isDragging={isDragging}
          panOffsetSec={panOffsetSec}
          setIsDragging={setIsDragging}
          setDragStartX={setDragStartX}
          setDragStartOffset={setDragStartOffset}
          handleMouseMove={handleMouseMove}
          timelineStartSec={timelineStartSec}
          timelineEndSec={timelineEndSec}
          visibleStart={visibleStart}
          visibleDuration={visibleDuration}
          startSec={startSec}
          tickStepSec={tickStepSec}
          isInActivityRange={isInActivityRange}
        />

        <TimelineGridRows
          flatRows={flatRows}
          gridRef={gridRef}
          rowsScrollRef={rowsScrollRef}
          listBodyRef={listBodyRef}
          zoom={zoom}
          panOffsetSec={panOffsetSec}
          totalSec={totalSec}
          timelineStartSec={timelineStartSec}
          timelineEndSec={timelineEndSec}
          startSec={startSec}
          tickStepSec={tickStepSec}
          selectedTracks={selectedTracks}
          completedSessions={completedSessions}
          activeSessionStarts={activeSessionStarts}
          resolvedMarkerSec={resolvedMarkerSec}
          visibleStart={visibleStart}
          visibleDuration={visibleDuration}
          hasAnyBars={hasAnyBars}
          setZoom={setZoom}
          setPanOffsetSec={setPanOffsetSec}
          onUserPan={onUserPan}
          cameraEventPoints={cameraEventPoints}
          onUpdateEventPoint={onUpdateEventPoint}
          iTrackId={iTrackId}
          setITrackId={setITrackId}
          setMarkerSec={setMarkerSec}
          selectedEventPointId={selectedEventPointId}
          setSelectedEventPointId={setSelectedEventPointId}
          editingEventPointId={editingEventPointId}
          onExitEditMode={onExitEditMode}
          onEditEventPoint={onEditEventPoint}
          onConvertEventPointToLocal={onConvertEventPointToLocal}
          onEnterEditMode={onEnterEditMode}
          loadState={loadState}
          pendingReviewWallSec={pendingReviewWallSec}
          hasMultipleRows={hasMultipleRows}
          reassignOptions={reassignOptions}
          onReassignRow={onReassignRow}
          emptyGridMessage={emptyGridMessage}
          selectedBar={selectedBar}
          onSelectBar={onSelectBar}
          rowNotice={rowNotice}
          highlightedSubRowId={highlightedSubRowId}
          getOpenHint={getOpenHint}
          canReassignRow={canReassignRow}
          getSelectedHint={getSelectedHint}
          getParentHint={getParentHint}
          punchedOut={punchedOut}
          onSelectLine={onSelectLine}
          onEditBar={onEditBar}
          getEditBounds={getEditBounds}
        />

        {!loadState && (
          <TimelineMarker
            currentLeft={currentLeft}
            setMarkerSec={setMarkerSec}
            visibleStart={visibleStart}
            visibleDuration={visibleDuration}
            timelineStartSec={timelineStartSec}
            timelineEndSec={timelineEndSec}
            gridRef={gridRef}
            setPanOffsetSec={setPanOffsetSec}
            totalSec={totalSec}
            currentMarkerSec={resolvedMarkerSec}
          />
        )}
      </Box>
    </Box>
  );
};

export default TimelineBody;
