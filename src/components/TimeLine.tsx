import { Box } from "@mui/material";
import TimelineBody from "./timeline/TimelineBody";
import type { CameraEventPoint, TimelineSnapshot } from "./timeline/types";
import TimelineToolbar from "./timeline/TimelineToolbar";
import { MOCK_SNAPSHOT } from "./timeline/constants";
import { useFlatRows } from "./timeline/hooks/useFlatRows";
import { useTimelineBodyState } from "./timeline/hooks/useTimelineBodyState";
import { useAutoSelectOnEventPoint } from "./timeline/hooks/useAutoSelectOnEventPoint";
import { useTimelineKeyboard } from "./timeline/hooks/useTimelineKeyboard";
import { useMarkerSync } from "./timeline/hooks/useMarkerSync";

const TimeLine = ({
  cameraEventPoints,
  onMarkerChange,
  snapshot,
  targetMarkerSec,
  onUpdateEventPoint,
  onDone,
  headerLabel,
  markerTimeSec,
  showFinalizeButton,
}: {
  cameraEventPoints?: CameraEventPoint[];
  onMarkerChange?: (sec: number) => void;
  snapshot: TimelineSnapshot;
  targetMarkerSec?: number;
  onUpdateEventPoint?: (
    id: number,
    update: Partial<Pick<CameraEventPoint, "startSec" | "endSec">>,
  ) => void;
  onDone?: () => void;
  headerLabel: string;
  markerTimeSec: number | null;
  showFinalizeButton: boolean;
}) => {
  const mergedEventPoints = cameraEventPoints ?? [];
  const data = snapshot || MOCK_SNAPSHOT;

  const {
    flatRows,
    selectableRows,
    timelineStartSec,
    timelineEndSec,
    firstActivitySec,
  } = useFlatRows({ data, cameraEventPoints: mergedEventPoints });

  const state = useTimelineBodyState({
    snapshot,
    flatRows,
    selectableRows,
    timelineStartSec,
    timelineEndSec,
    firstActivitySec,
  });

  useMarkerSync({
    targetMarkerSec,
    resolvedMarkerSec: state.resolvedMarkerSec,
    timelineStartSec,
    timelineEndSec,
    setMarkerSec: state.setMarkerSec,
    handleMarkerChange: onMarkerChange ?? (() => {}),
  });

  useAutoSelectOnEventPoint({
    cameraEventPoints: mergedEventPoints,
    setITrackId: state.setITrackId,
    setSelectedTracks: state.setSelectedTracks,
  });

  const handleTogglePlay = () => state.setIsPlaying((prev) => !prev);

  const handleStepMarker = (delta: number) => {
    const next = Math.max(
      timelineStartSec,
      Math.min(timelineEndSec, state.resolvedMarkerSec + delta),
    );
    state.setMarkerSec(next);
  };

  const { goToTimeOpen, setGoToTimeOpen } = useTimelineKeyboard({
    selectableRows,
    iTrackId: state.iTrackId,
    setITrackId: state.setITrackId,
    activeSessionStarts: state.activeSessionStarts,
    setActiveSessionStarts: state.setActiveSessionStarts,
    markerSec: state.markerSec,
    timelineStartSec,
    timelineEndSec,
    selectedTracks: state.selectedTracks,
    setSelectedTracks: state.setSelectedTracks,
    setCompletedSessions: state.setCompletedSessions,
    setMarkerSec: state.setMarkerSec,
    setShowPunchOut: state.setShowPunchOut,
    punchOutTimerRef: state.punchOutTimerRef,
    isPlaying: state.isPlaying,
    setIsPlaying: state.setIsPlaying,
    zoom: state.zoom,
    setZoom: state.setZoom,
    panOffsetSec: state.panOffsetSec,
    setPanOffsetSec: state.setPanOffsetSec,
    totalSec: state.totalSec,
    gridRef: state.gridRef,
  });

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TimelineToolbar
        snapshot={snapshot}
        markerTimeSec={markerTimeSec}
        isPlaying={state.isPlaying}
        showFinalizeButton={showFinalizeButton}
        onStepMarker={handleStepMarker}
        onTogglePlay={handleTogglePlay}
        onDone={onDone ?? (() => {})}
      />

      <TimelineBody
        flatRows={flatRows}
        headerLabel={headerLabel}
        openDialog={state.openDialog}
        dialogOnClose={state.handleOnCloseDialog}
        onOpenDialog={state.handleOnOpenDialog}
        selectedTracks={state.selectedTracks}
        activeSessionStarts={state.activeSessionStarts}
        listBodyRef={state.listBodyRef}
        rowsScrollRef={state.rowsScrollRef}
        iTrackId={state.iTrackId}
        setITrackId={state.setITrackId}
        setSelectedTracks={state.setSelectedTracks}
        zoom={state.zoom}
        isDragging={state.isDragging}
        panOffsetSec={state.panOffsetSec}
        setIsDragging={state.setIsDragging}
        setDragStartX={state.setDragStartX}
        setDragStartOffset={state.setDragStartOffset}
        handleMouseMove={state.handleMouseMove}
        timelineStartSec={timelineStartSec}
        timelineEndSec={timelineEndSec}
        visibleStart={state.visibleStart}
        visibleDuration={state.visibleDuration}
        startSec={state.startSec}
        tickStepSec={state.tickStepSec}
        isInActivityRange={state.isInActivityRange}
        gridRef={state.gridRef}
        totalSec={state.totalSec}
        completedSessions={state.completedSessions}
        resolvedMarkerSec={state.resolvedMarkerSec}
        hasAnyBars={state.hasAnyBars}
        setZoom={state.setZoom}
        setPanOffsetSec={state.setPanOffsetSec}
        cameraEventPoints={mergedEventPoints}
        onUpdateEventPoint={onUpdateEventPoint}
        currentLeft={state.currentLeft}
        setMarkerSec={state.setMarkerSec}
        goToTimeOpen={goToTimeOpen}
        setGoToTimeOpen={setGoToTimeOpen}
      />
    </Box>
  );
};

export default TimeLine;
