import { Box } from "@mui/system";
import { Colors } from "../../theme";
import type React from "react";
import type { CameraEventPoint, FlatRow } from "./types";
import { TimelineRowList } from "./TimelineRowList";
import { TimelineTimeRuler } from "./TimelineTimeRuler";
import { TimelineGridRows } from "./TimelineGridRows";
import { TimelineMarker } from "./TimelineMarker";
import { GoToTimeDialog } from "./GoToTimeDialog";

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
  goToTimeOpen: boolean;
  setGoToTimeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onUserPan?: () => void;
  rowsLoadState?: boolean;
  loadState?: boolean;
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
  goToTimeOpen,
  setGoToTimeOpen,
  onUserPan,
  rowsLoadState,
  loadState,
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
        />

        <TimelineMarker
          currentLeft={currentLeft}
          setMarkerSec={setMarkerSec}
          visibleStart={visibleStart}
          visibleDuration={visibleDuration}
          timelineStartSec={timelineStartSec}
          timelineEndSec={timelineEndSec}
          gridRef={gridRef}
        />
      </Box>

      <GoToTimeDialog
        open={goToTimeOpen}
        onClose={() => setGoToTimeOpen(false)}
        onConfirm={(sec) => setMarkerSec(sec)}
        timelineStartSec={timelineStartSec}
        timelineEndSec={timelineEndSec}
      />
    </Box>
  );
};

export default TimelineBody;
