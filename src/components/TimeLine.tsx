import { Box } from "@mui/material";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import TimelineBody from "./timeline/TimelineBody";
import type {
  CameraEventPoint,
  NavTab,
  PlayWindow,
  TimelineSnapshot,
} from "./timeline/types";
import TimelineToolbar from "./timeline/TimelineToolbar";
import { EMPLOYEE_TRACKS, MOCK_SNAPSHOT } from "./timeline/constants";
import { useFlatRows } from "./timeline/hooks/useFlatRows";
import { useActivityRows } from "./timeline/hooks/useActivityRows";
import { useTimelineBodyState } from "./timeline/hooks/useTimelineBodyState";
import { useAutoSelectOnEventPoint } from "./timeline/hooks/useAutoSelectOnEventPoint";
import { useAutoSelectOnMarkerOverDiamond } from "./timeline/hooks/useAutoSelectOnMarkerOverDiamond";
import { useTimelineKeyboard } from "./timeline/hooks/useTimelineKeyboard";
import { useMarkerSync } from "./timeline/hooks/useMarkerSync";
import { TAG_TOLERANCE_SEC } from "../hooks/useTagsForCamera";
import { isOverlapsBlue } from "./timeline/utils";
import type { RowNotice } from "./timeline/rows/SessionRow";

const NO_EVENT_POINTS: CameraEventPoint[] = [];

const TimeLine = ({
  cameraEventPoints,
  onMarkerChange,
  snapshot,
  targetMarkerSec,
  targetMarkerKey,
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
  onMarkAiIncorrect,
  onConvertEventPointToLocal,
  viewMode = "camera",
  menuItems = [],
  rangeSessions,
  expandedIcon = false,
  rowsLoadState,
  loadState,
  pendingReviewWallSec,
  activeTab,
  onTabChange,
  disabledTabs,
  emptyRowsMessage,
  showAddButton,
  onAddRow,
  rowTracks,
  activeSessionStarts: activeSessionStartsProp,
  focusRowId,
  completedSessions: completedSessionsProp,
  onPunchIn,
  onPunchOut,
  onDeleteSession,
  rowSelectMarkerSec,
  rowNotice,
  reassignOptions,
  onReassignRow,
  sessionWallSec,
  emptyGridMessage,
}: {
  cameraEventPoints?: CameraEventPoint[];
  onMarkerChange?: (sec: number) => void;
  snapshot: TimelineSnapshot;
  targetMarkerSec?: number;
  /** Changing it re-applies targetMarkerSec even if the number is unchanged. */
  targetMarkerKey?: string | number;
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
  onRejectEventPoint?: (id: number, skipHistory?: boolean) => void;
  onMarkAiIncorrect?: (id: number) => void;
  onConvertEventPointToLocal?: (id: number) => number;
  viewMode?: "camera" | "activity";
  menuItems?: {
    id: number;
    name: string;
    onClick?: (index: number) => void;
    onReject?: (index: number) => void;
  }[];
  rangeSessions?: Record<number, { type: "in" | "out"; timestamp: string }[]>;
  expandedIcon: boolean;
  rowsLoadState?: boolean;
  loadState?: boolean;
  pendingReviewWallSec?: number;
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  /** Nav tabs shown but not selectable. */
  disabledTabs?: NavTab[];
  emptyRowsMessage?: React.ReactNode;
  showAddButton?: boolean;
  onAddRow?: () => void;
  /** Replaces the snapshot's tracks as the timeline rows (camera view mode). */
  rowTracks?: TimelineSnapshot["timeline"]["tracks"];
  /** Open sessions by row id → start second; overrides the internal state. */
  activeSessionStarts?: Record<number, number>;
  /** Row to select whenever this value changes. */
  focusRowId?: number | null;
  /** Closed sessions by row id; overrides the internal state. */
  completedSessions?: Record<number, { start: number; end: number }[]>;
  /** Employee punches: "i" opens a session on the selected row; returns whether it did. */
  onPunchIn?: (rowId: number, startSec: number) => boolean;
  /** Employee punches: "o" closes the selected row's open session at `endSec`. */
  onPunchOut?: (rowId: number, endSec: number) => void;
  /** Punches tabs: Delete removes the bar starting at `startSec` on `rowId`. */
  onDeleteSession?: (rowId: number, startSec: number) => void;
  /** Punches tabs: where the marker goes when a row is picked (list click or
   * digit), or undefined to leave it. */
  rowSelectMarkerSec?: (rowId: number) => number | undefined;
  /** Punches tabs: a message shown at the marker on one row. */
  rowNotice?: RowNotice;
  /** Rows a sub-row's group can be moved to (Customer punches). */
  reassignOptions?: { id: number; label: string; disabled?: boolean }[];
  /** Moves the sub-row `rowId` under `parentId`. */
  onReassignRow?: (rowId: number, parentId: number) => void;
  /** Exact second the marker can't pass (e.g. an employee's punch-out while
   * one of their customers is still open). */
  sessionWallSec?: number;
  /** Hint centered over the grid while there's nothing recorded yet. */
  emptyGridMessage?: React.ReactNode;
}) => {
  // Employee and Customer punches both list employee rows instead of cameras.
  const isPunchesTab = activeTab === "employees" || activeTab === "customers";
  // Punches tabs don't draw diamonds, so they're left out: without them the
  // arrows/play step freely instead of snapping to or stopping at review
  // windows. Compliance violations gets the event points untouched.
  const mergedEventPoints = isPunchesTab
    ? NO_EVENT_POINTS
    : (cameraEventPoints ?? []);
  const data = snapshot || MOCK_SNAPSHOT;

  const tracksOverride =
    rowTracks ?? (isPunchesTab ? EMPLOYEE_TRACKS : undefined);
  const rowsData = useMemo(
    () =>
      tracksOverride
        ? { ...data, timeline: { ...data.timeline, tracks: tracksOverride } }
        : data,
    [data, tracksOverride],
  );

  const cameraRowsData = useFlatRows({
    data: rowsData,
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
  const hasMultipleRows = selectableRows.length >= 2;
  const { timelineStartSec, timelineEndSec, firstActivitySec } = cameraRowsData;

  const playWindowRef = useRef<PlayWindow | undefined>(undefined);

  const state = useTimelineBodyState({
    snapshot,
    flatRows,
    selectableRows,
    timelineStartSec,
    timelineEndSec,
    firstActivitySec,
    // The review wall only applies to Compliance violations' diamonds.
    pendingReviewWallSec: isPunchesTab ? undefined : pendingReviewWallSec,
    sessionWallSec,
    playWindowRef,
  });

  // Sessions opened by the parent (e.g. employee punch-ins) take precedence.
  const activeSessionStarts =
    activeSessionStartsProp ?? state.activeSessionStarts;
  const completedSessions = completedSessionsProp ?? state.completedSessions;

  // A selected bar belongs to its tab: switching tabs clears it.
  const [prevTab, setPrevTab] = useState(activeTab);
  if (prevTab !== activeTab) {
    setPrevTab(activeTab);
    state.setSelectedBar(null);
  }

  // Punches tabs: picking a row can move the marker (e.g. to the employee's
  // punch-in), panning to it if it's off-screen.
  const handleSelectRow = (rowId: number) => {
    const sec = rowSelectMarkerSec?.(rowId);
    if (sec === undefined) return;
    state.setMarkerSec(sec);
    const visibleEnd = state.panOffsetSec + state.visibleDuration;
    if (sec < state.panOffsetSec || sec > visibleEnd) {
      state.setPanOffsetSec(
        Math.max(
          0,
          Math.min(
            state.totalSec - state.visibleDuration,
            sec - state.visibleDuration * 0.2,
          ),
        ),
      );
    }
  };

  // Punches tabs: clicking a bar selects it (clicking it again deselects it)
  // along with its line — a customer group's bar selects the row attending it.
  const handleSelectBar = (rowId: number, start: number) => {
    const isSame =
      state.selectedBar?.rowId === rowId && state.selectedBar.start === start;
    state.setSelectedBar(isSame ? null : { rowId, start });
    if (isSame) return;
    const row = flatRows.find((r) => r.id === rowId);
    const lineId =
      row?.kind === "event" && row.parentCameraId !== undefined
        ? row.parentCameraId
        : rowId;
    state.setITrackId(lineId);
    state.setSelectedTracks(
      activeSessionStarts[lineId] !== undefined ? new Set([lineId]) : new Set(),
    );
  };

  // Let the parent move the selection to a row it just created.
  useEffect(() => {
    if (focusRowId === undefined || focusRowId === null) return;
    state.setITrackId(focusRowId);
    state.setSelectedTracks(new Set([focusRowId]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRowId]);

  useMarkerSync({
    targetMarkerSec,
    targetMarkerKey,
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

  // Green/red diamonds (any border) are still AI-linked (overlapsBlue) and must not be
  // bulk-deleted — only orange ones (correction or plain reviewed) are eligible.
  const targetOverlapsBlue = useMemo(() => {
    if (!targetEventPoint) return false;
    const rowPoints = mergedEventPoints.filter((ep) =>
      isActivityMode
        ? ep.label === targetEventPoint.label
        : ep.cameraId === targetEventPoint.cameraId &&
          ep.label === targetEventPoint.label,
    );
    return isOverlapsBlue(targetEventPoint, rowPoints);
  }, [targetEventPoint, mergedEventPoints, isActivityMode]);

  const handleDeleteEventPoint = () => {
    if (!targetEventPoint?.reviewed) return;
    if (targetOverlapsBlue) {
      // Can't bulk-delete an AI-linked diamond — archive it instead (hides locally,
      // sends status:"ARCHIVED" on save) rather than a no-op.
      onRejectEventPoint?.(targetEventPoint.id);
      state.setSelectedEventPointId(null);
      return;
    }
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
    activeSessionStarts,
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
    onMarkAiIncorrect,
    onUndo,
    onRedo,
    onTogglePlay: handleTogglePlay,
    setMarkerSecRaw: state.setMarkerSecRaw,
    selectedEventPointId: state.selectedEventPointId,
    setSelectedEventPointId: state.setSelectedEventPointId,
    flatRows,
    isActivityMode,
    // Free arrows/digits on both punches tabs; "i"/"o" only act when the
    // parent passes onPunchIn/onPunchOut (Employee punches).
    isSessionMode: isPunchesTab,
    onPunchIn,
    onPunchOut,
    onAddRow,
    // Ctrl+arrows step through the bars and Delete removes one (punches tabs).
    completedSessions,
    onDeleteSession,
    selectedBar: state.selectedBar,
    setSelectedBar: state.setSelectedBar,
    onSelectRow: isPunchesTab ? handleSelectRow : undefined,
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
        activeTab={activeTab}
        onTabChange={onTabChange}
        disabledTabs={disabledTabs}
      />

      <TimelineBody
        flatRows={flatRows}
        headerLabel={headerLabel}
        openDialog={state.openDialog}
        dialogOnClose={state.handleOnCloseDialog}
        onOpenDialog={onAddRow ?? state.handleOnOpenDialog}
        selectedTracks={state.selectedTracks}
        activeSessionStarts={activeSessionStarts}
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
        completedSessions={completedSessions}
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
        emptyRowsMessage={emptyRowsMessage}
        showAddButton={showAddButton}
        loadState={loadState}
        pendingReviewWallSec={state.pendingReviewWallSec}
        hasMultipleRows={hasMultipleRows}
        reassignOptions={reassignOptions}
        onReassignRow={onReassignRow}
        emptyGridMessage={emptyGridMessage}
        selectedBar={isPunchesTab ? state.selectedBar : null}
        onSelectBar={isPunchesTab ? handleSelectBar : undefined}
        rowNotice={isPunchesTab ? rowNotice : undefined}
        onSelectRow={isPunchesTab ? handleSelectRow : undefined}
      />
    </Box>
  );
};

export default memo(TimeLine);
