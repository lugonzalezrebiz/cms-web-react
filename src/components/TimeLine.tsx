import { Box } from "@mui/material";
import { memo, useMemo, useState } from "react";
import TimelineBody from "./timeline/TimelineBody";
import type { CameraEventPoint, TimelineSnapshot } from "./timeline/types";
import TimelineToolbar from "./timeline/TimelineToolbar";
import { MOCK_SNAPSHOT } from "./timeline/constants";
import { useFlatRows } from "./timeline/hooks/useFlatRows";
import { useActivityRows } from "./timeline/hooks/useActivityRows";
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
  onPopOut,
  headerLabel,
  markerTimeSec,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onRemoveEventPoint,
  onStartEditEventPoint,
  viewMode = "camera",
  menuItems = [],
  rangeSessions,
}: {
  cameraEventPoints?: CameraEventPoint[];
  onMarkerChange?: (sec: number) => void;
  snapshot: TimelineSnapshot;
  targetMarkerSec?: number;
  onUpdateEventPoint?: (
    id: number,
    update: Partial<Pick<CameraEventPoint, "startSec" | "endSec">>,
  ) => void;
  onPopOut?: () => void;
  headerLabel: string;
  markerTimeSec: number | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onRemoveEventPoint?: (id: number) => void;
  onStartEditEventPoint?: (id: number) => Promise<number>;
  viewMode?: "camera" | "activity";
  menuItems?: { id: number; name: string }[];
  rangeSessions?: Record<number, { type: "in" | "out"; timestamp: string }[]>;
}) => {
  const mergedEventPoints = cameraEventPoints ?? [];
  const data = snapshot || MOCK_SNAPSHOT;

  const cameraRowsData = useFlatRows({
    data,
    cameraEventPoints: mergedEventPoints,
  });
  const activityRowsData = useActivityRows({
    menuItems,
    cameraEventPoints: mergedEventPoints,
    rangeSessions,
  });

  const isActivityMode = viewMode === "activity";
  const flatRows = isActivityMode
    ? activityRowsData.flatRows
    : cameraRowsData.flatRows;
  const selectableRows = isActivityMode
    ? activityRowsData.selectableRows
    : cameraRowsData.selectableRows;
  const { timelineStartSec, timelineEndSec, firstActivitySec } = cameraRowsData;

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

  const sortedEventPoints = useMemo(
    () => [...mergedEventPoints].sort((a, b) => a.timeSec - b.timeSec),
    [mergedEventPoints],
  );
  const prevEventPoint = useMemo(
    () => [...sortedEventPoints].reverse().find((ep) => ep.timeSec < state.resolvedMarkerSec),
    [sortedEventPoints, state.resolvedMarkerSec],
  );
  const nextEventPoint = useMemo(
    () => sortedEventPoints.find((ep) => ep.timeSec > state.resolvedMarkerSec),
    [sortedEventPoints, state.resolvedMarkerSec],
  );

  const handleGoToPrevEventPoint = () => {
    if (prevEventPoint) state.setMarkerSec(prevEventPoint.timeSec);
  };
  const handleGoToNextEventPoint = () => {
    if (nextEventPoint) state.setMarkerSec(nextEventPoint.timeSec);
  };

  const selectedActivityLabel = isActivityMode
    ? menuItems.find((m) => m.id === state.iTrackId)?.name
    : undefined;

  const eventPointUnderMarker = useMemo(
    () =>
      mergedEventPoints.find((ep) =>
        isActivityMode
          ? ep.label === selectedActivityLabel &&
            state.resolvedMarkerSec >= ep.startSec &&
            state.resolvedMarkerSec <= ep.endSec
          : ep.cameraId === state.iTrackId &&
            state.resolvedMarkerSec >= ep.startSec &&
            state.resolvedMarkerSec <= ep.endSec,
      ),
    [mergedEventPoints, isActivityMode, selectedActivityLabel, state.resolvedMarkerSec, state.iTrackId],
  );

  const targetEventPoint = useMemo(
    () =>
      state.selectedEventPointId !== null
        ? mergedEventPoints.find((ep) => ep.id === state.selectedEventPointId)
        : eventPointUnderMarker,
    [state.selectedEventPointId, mergedEventPoints, eventPointUnderMarker],
  );

  const handleDeleteEventPoint = () => {
    if (!targetEventPoint?.reviewed) return;
    onRemoveEventPoint?.(targetEventPoint.id);
    state.setSelectedEventPointId(null);
  };

  const [editingEventPointId, setEditingEventPointId] = useState<number | null>(null);

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
    cameraEventPoints: mergedEventPoints,
    onDeleteEventPoint: handleDeleteEventPoint,
  });

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TimelineToolbar
        snapshot={snapshot}
        markerTimeSec={markerTimeSec}
        isPlaying={state.isPlaying}
        onStepMarker={handleStepMarker}
        onTogglePlay={handleTogglePlay}
        onPopOut={onPopOut}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onDeleteEventPoint={handleDeleteEventPoint}
        canDelete={targetEventPoint?.reviewed === true}
        onGoPrevEventPoint={handleGoToPrevEventPoint}
        onGoNextEventPoint={handleGoToNextEventPoint}
        hasPrevEventPoint={prevEventPoint !== undefined}
        hasNextEventPoint={nextEventPoint !== undefined}
      />

      <TimelineBody
        flatRows={flatRows}
        headerLabel={headerLabel}
        openDialog={
          //  state.openDialog
          false
        }
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
        selectedEventPointId={state.selectedEventPointId}
        setSelectedEventPointId={state.setSelectedEventPointId}
        editingEventPointId={editingEventPointId}
        setEditingEventPointId={setEditingEventPointId}
        onClearEditing={() => setEditingEventPointId(null)}
        onStartEditEventPoint={onStartEditEventPoint}
        goToTimeOpen={goToTimeOpen}
        setGoToTimeOpen={setGoToTimeOpen}
      />
      {/* <TimelineDialog
        dialogOnClose={state.handleOnCloseDialog}
        openDialog={state.openDialog}
      /> */}
    </Box>
  );
};

export default memo(TimeLine);
