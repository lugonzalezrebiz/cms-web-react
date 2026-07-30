import { Box } from "@mui/material";
import { memo, useEffect, useMemo, useRef } from "react";
import TimelineBody from "./timeline/TimelineBody";
import type {
  CameraEventPoint,
  PlayWindow,
  TimelineSnapshot,
} from "./timeline/types";
import TimelineToolbar from "./timeline/TimelineToolbar";
import { MOCK_SNAPSHOT } from "./timeline/constants";
import { useFlatRows } from "./timeline/hooks/useFlatRows";
import { useActivityRows } from "./timeline/hooks/useActivityRows";
import { useTimelineBodyState } from "./timeline/hooks/useTimelineBodyState";
import { useAutoSelectOnEventPoint } from "./timeline/hooks/useAutoSelectOnEventPoint";
import { useAutoSelectOnMarkerOverDiamond } from "./timeline/hooks/useAutoSelectOnMarkerOverDiamond";
import { useTimelineKeyboard } from "./timeline/hooks/useTimelineKeyboard";
import { useMarkerSync } from "./timeline/hooks/useMarkerSync";
import { TAG_TOLERANCE_SEC } from "../hooks/useTagsForCamera";

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
  onAcceptEventPoint,
  onRejectEventPoint,
  onConvertEventPointToLocal,
  viewMode = "camera",
  menuItems = [],
  rangeSessions,
  expandedIcon = false,
  rowsLoadState,
  loadState,
  pendingReviewWallSec,
}: {
  cameraEventPoints?: CameraEventPoint[];
  onMarkerChange?: (sec: number) => void;
  snapshot: TimelineSnapshot;
  targetMarkerSec?: number;
  onUpdateEventPoint?: (
    id: number,
    update: Partial<Pick<CameraEventPoint, "timeSec" | "startSec" | "endSec">>,
  ) => void;
  onPopOut?: () => void;
  headerLabel: string;
  markerTimeSec: number | null;
  onUndo?: () => number | void;
  onRedo?: () => number | void;
  canUndo?: boolean;
  canRedo?: boolean;
  onRemoveEventPoint?: (id: number) => void;
  onAcceptEventPoint?: (id: number) => void;
  onRejectEventPoint?: (id: number) => void;
  onConvertEventPointToLocal?: (id: number) => number;
  viewMode?: "camera" | "activity";
  menuItems?: { id: number; name: string; onClick?: (index: number) => void }[];
  rangeSessions?: Record<number, { type: "in" | "out"; timestamp: string }[]>;
  expandedIcon: boolean;
  rowsLoadState?: boolean;
  loadState?: boolean;
  pendingReviewWallSec?: number;
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

  const playWindowRef = useRef<PlayWindow | undefined>(undefined);

  const state = useTimelineBodyState({
    snapshot,
    flatRows,
    selectableRows,
    timelineStartSec,
    timelineEndSec,
    firstActivitySec,
    pendingReviewWallSec,
    playWindowRef,
  });

  useMarkerSync({
    targetMarkerSec,
    resolvedMarkerSec: state.resolvedMarkerSec,
    timelineStartSec,
    timelineEndSec,
    setMarkerSec: state.setMarkerSec,
    handleMarkerChange: onMarkerChange ?? (() => {}),
    setPanOffsetSec: state.setPanOffsetSec,
    visibleDuration: state.visibleDuration,
    totalSec: state.totalSec,
    panOffsetSec: state.panOffsetSec,
  });

  useAutoSelectOnEventPoint({
    cameraEventPoints: mergedEventPoints,
    flatRows,
    isActivityMode,
    setITrackId: state.setITrackId,
    setSelectedTracks: state.setSelectedTracks,
    setSelectedEventPointId: state.setSelectedEventPointId,
  });

  useAutoSelectOnMarkerOverDiamond({
    flatRows,
    cameraEventPoints: mergedEventPoints,
    resolvedMarkerSec: state.resolvedMarkerSec,
    visibleDuration: state.visibleDuration,
    gridRef: state.gridRef,
    isActivityMode,
    iTrackId: state.iTrackId,
    setITrackId: state.setITrackId,
    selectedEventPointId: state.selectedEventPointId,
    setSelectedEventPointId: state.setSelectedEventPointId,
    isPlaying: state.isPlaying,
  });

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
    () =>
      [...sortedEventPoints]
        .reverse()
        .find((ep) => ep.timeSec < state.resolvedMarkerSec),
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
    [
      mergedEventPoints,
      isActivityMode,
      selectedActivityLabel,
      state.resolvedMarkerSec,
      state.iTrackId,
    ],
  );

  const targetEventPoint = useMemo(
    () =>
      state.selectedEventPointId !== null
        ? mergedEventPoints.find((ep) => ep.id === state.selectedEventPointId)
        : eventPointUnderMarker,
    [state.selectedEventPointId, mergedEventPoints, eventPointUnderMarker],
  );

  // Reviewing a selected diamond: play its clip (RANGE bounds, or ±TAG_TOLERANCE_SEC
  // around a POINT) instead of the whole timeline, then snap back to its center.
  const playWindow = useMemo<PlayWindow | undefined>(() => {
    if (!targetEventPoint) return undefined;
    if (
      targetEventPoint.mode === "RANGE" &&
      targetEventPoint.endSec > targetEventPoint.timeSec
    ) {
      return {
        start: targetEventPoint.timeSec,
        end: targetEventPoint.endSec,
        center: (targetEventPoint.timeSec + targetEventPoint.endSec) / 2,
      };
    }
    return {
      start: Math.max(
        timelineStartSec,
        targetEventPoint.timeSec - TAG_TOLERANCE_SEC,
      ),
      end: Math.min(
        timelineEndSec,
        targetEventPoint.timeSec + TAG_TOLERANCE_SEC,
      ),
      center: targetEventPoint.timeSec,
    };
  }, [targetEventPoint, timelineStartSec, timelineEndSec]);

  useEffect(() => {
    playWindowRef.current = playWindow;
  }, [playWindow]);

  const handleTogglePlay = () => {
    const next = !state.isPlaying;
    if (next && playWindow) state.setMarkerSec(playWindow.start);
    state.setIsPlaying(next);
  };

  const handleDeleteEventPoint = () => {
    if (!targetEventPoint?.reviewed) return;
    onRemoveEventPoint?.(targetEventPoint.id);
    state.setSelectedEventPointId(null);
  };

  const handleEditEventPointById = (id: number) => {
    const ep = mergedEventPoints.find((p) => p.id === id);
    if (!ep?.reviewed) return;
    const newId = onConvertEventPointToLocal?.(id) ?? id;
    state.setEditingEventPointId(newId);
    state.setSelectedEventPointId(newId);
  };

  const handleEnterEditMode = (id: number) => {
    state.setEditingEventPointId(id);
    state.setSelectedEventPointId(id);
  };

  useTimelineKeyboard({
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
    zoom: state.zoom,
    setZoom: state.setZoom,
    panOffsetSec: state.panOffsetSec,
    setPanOffsetSec: state.setPanOffsetSec,
    totalSec: state.totalSec,
    gridRef: state.gridRef,
    cameraEventPoints: mergedEventPoints,
    menuItems,
    onDeleteEventPoint: handleDeleteEventPoint,
    onAcceptEventPoint,
    onRejectEventPoint,
    onUndo,
    onRedo,
    onTogglePlay: handleTogglePlay,
    setMarkerSecRaw: state.setMarkerSecRaw,
    selectedEventPointId: state.selectedEventPointId,
    setSelectedEventPointId: state.setSelectedEventPointId,
    flatRows,
    isActivityMode,
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
        expanded={expandedIcon}
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
        onUserPan={state.disableAutoFollow}
        cameraEventPoints={mergedEventPoints}
        onUpdateEventPoint={onUpdateEventPoint}
        currentLeft={state.currentLeft}
        setMarkerSec={state.setMarkerSec}
        selectedEventPointId={state.selectedEventPointId}
        setSelectedEventPointId={state.setSelectedEventPointId}
        editingEventPointId={state.editingEventPointId}
        onExitEditMode={() => state.setEditingEventPointId(null)}
        onEditEventPoint={handleEditEventPointById}
        onConvertEventPointToLocal={onConvertEventPointToLocal}
        onEnterEditMode={handleEnterEditMode}
        rowsLoadState={rowsLoadState}
        loadState={loadState}
        pendingReviewWallSec={state.pendingReviewWallSec}
      />
    </Box>
  );
};

export default memo(TimeLine);
