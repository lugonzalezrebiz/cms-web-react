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
import {
  EMPLOYEE_TRACKS,
  MOCK_SNAPSHOT,
  isPunchesNavTab,
} from "./timeline/constants";
import { useFlatRows } from "./timeline/hooks/useFlatRows";
import { useActivityRows } from "./timeline/hooks/useActivityRows";
import { useTimelineBodyState } from "./timeline/hooks/useTimelineBodyState";
import { useAutoSelectOnEventPoint } from "./timeline/hooks/useAutoSelectOnEventPoint";
import { useAutoSelectOnMarkerOverDiamond } from "./timeline/hooks/useAutoSelectOnMarkerOverDiamond";
import { useTimelineKeyboard } from "./timeline/hooks/useTimelineKeyboard";
import { useMarkerSync } from "./timeline/hooks/useMarkerSync";
import { TAG_TOLERANCE_SEC } from "../hooks/useTagsForCamera";
import { isOverlapsBlue } from "./timeline/utils";
import type { BarEdit, RowNotice } from "./timeline/rows/SessionRow";

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
  showAddButton,
  onAddRow,
  rowTracks,
  activeSessionStarts: activeSessionStartsProp,
  focusRow,
  completedSessions: completedSessionsProp,
  onPunchIn,
  onPunchOut,
  onDeleteSession,
  canDeleteSession,
  onDeleteLine,
  onUpdateSession,
  getSessionBounds,
  rowNotice,
  rowNumberStart,
  onRowKey,
  getOpenHint,
  canReassignRow,
  getSelectedHint,
  reassignOptions,
  onReassignRow,
  sessionWallSec,
  sessionFloorSec,
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
  showAddButton?: boolean;
  onAddRow?: () => void;
  /** Replaces the snapshot's tracks as the timeline rows (camera view mode). */
  rowTracks?: TimelineSnapshot["timeline"]["tracks"];
  /** Open sessions by row id → start second; overrides the internal state. */
  activeSessionStarts?: Record<number, number>;
  /** Row to select whenever `key` changes (e.g. one just created): a line
   * gets selected; a sub-row gets picked under its line. */
  focusRow?: { rowId: number; key: number };
  /** Closed sessions by row id; overrides the internal state. */
  completedSessions?: Record<number, { start: number; end: number }[]>;
  /** Employee punches: "i" opens a session on the selected row; returns whether it did. */
  onPunchIn?: (rowId: number, startSec: number) => boolean;
  /** Employee punches: "o" closes the selected row's open session at `endSec`. */
  onPunchOut?: (rowId: number, endSec: number) => void;
  /** Punches tabs: Delete removes the bar starting at `startSec` on `rowId`;
   * returning false means it was refused (the bar stays selected). */
  onDeleteSession?: (rowId: number, startSec: number) => boolean | void;
  /** Punches tabs: whether that bar can be deleted (the trash greys out). */
  canDeleteSession?: (rowId: number, startSec: number) => boolean;
  /** Punches tabs: Delete on the selected line with no bar picked. */
  onDeleteLine?: (lineId: number, sec: number) => void;
  /** Punches tabs: saves a bar whose ends were dragged (start `oldStart`). */
  onUpdateSession?: (rowId: number, oldStart: number, next: BarEdit) => void;
  /** Punches tabs: how far a bar's ends may go (e.g. the employee's shift). */
  getSessionBounds?: (
    rowId: number,
    start: number,
  ) => { min: number; max: number } | undefined;
  /** Punches tabs: a message shown at the marker on one row. */
  rowNotice?: RowNotice;
  /** Number shown on the first row (and its digit shortcut); default 1. */
  rowNumberStart?: number;
  /** Punches tabs: letter keys the tab handles itself (e.g. B / S) on the
   * selected line and its sub-selected sub-row; returns whether it did, or
   * the id of the line to select next. */
  onRowKey?: (
    key: string,
    lineId: number,
    subRowId: number | null,
    sec: number,
  ) => boolean | number;
  /** Punches tabs: per-row text next to the marker while its bar is open. */
  getOpenHint?: (rowId: number) => React.ReactNode | undefined;
  /** Punches tabs: whether a sub-row gets the change-attendance button. */
  canReassignRow?: (rowId: number) => boolean;
  /** Punches tabs: text next to the marker on the selected line. */
  getSelectedHint?: (rowId: number) => React.ReactNode | undefined;
  /** Rows a sub-row's group can be moved to (Customer punches). */
  reassignOptions?: { id: number; label: string; disabled?: boolean }[];
  /** Moves the sub-row `rowId` under `parentId`; returns the sub-row it
   * continues on there, if it moved. */
  onReassignRow?: (rowId: number, parentId: number) => number | void;
  /** Exact second the marker can't pass (e.g. an employee's punch-out while
   * one of their customers is still open). */
  sessionWallSec?: number;
  /** Exact second the marker can't go back past (e.g. where a still-open
   * customer was punched in or handed over). */
  sessionFloorSec?: number;
  /** Hint centered over the grid while there's nothing recorded yet. */
  emptyGridMessage?: React.ReactNode;
}) => {
  // Employee and Customer punches both list employee rows instead of cameras.
  const isPunchesTab = isPunchesNavTab(activeTab);
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
    sessionFloorSec,
    playWindowRef,
  });

  // Sessions opened by the parent (e.g. employee punch-ins) take precedence.
  const activeSessionStarts =
    activeSessionStartsProp ?? state.activeSessionStarts;
  const completedSessions = completedSessionsProp ?? state.completedSessions;

  // A line that turns inactive (greyed out, e.g. Employee and Customer's
  // defaults once nobody is punched in) can't stay selected.
  if (flatRows.find((r) => r.id === state.iTrackId)?.inactive) {
    state.setITrackId(null);
    state.setSelectedTracks(new Set());
  }

  // Punches tabs: the row just punched out with "o" (and where), so only
  // that shows "Punched Out" — not bars closed by a break or a hand-over.
  const [punchedOut, setPunchedOut] = useState<
    { rowId: number; sec: number; key: number } | undefined
  >(undefined);
  const handlePunchedOut = (rowId: number, sec: number) =>
    setPunchedOut({ rowId, sec, key: Date.now() });

  // A selected bar belongs to its tab: switching tabs clears it.
  const [prevTab, setPrevTab] = useState(activeTab);
  if (prevTab !== activeTab) {
    setPrevTab(activeTab);
    state.setSelectedBar(null);
  }

  // Punches tabs: the selected line's open sub-rows (list order) and the
  // sub-selected one — the one picked while it's still open, else the one
  // punched in last. "o" punches out only that one.
  const openSubRowIds = useMemo(
    () =>
      isPunchesTab && state.iTrackId !== null
        ? flatRows
            .filter(
              (r) =>
                r.kind === "event" &&
                r.parentCameraId === state.iTrackId &&
                activeSessionStarts[r.id] !== undefined,
            )
            .map((r) => r.id)
        : [],
    [isPunchesTab, state.iTrackId, flatRows, activeSessionStarts],
  );
  // The selected line's sub-row bars under the marker (punched-out ones that
  // contain it, open ones that started before it), in list order: what ↑/↓
  // step through.
  const subRowBars = useMemo(() => {
    const line = state.iTrackId;
    if (!isPunchesTab || line === null) return [];
    const marker = state.resolvedMarkerSec;
    return flatRows
      .filter((r) => r.kind === "event" && r.parentCameraId === line)
      .flatMap((r) => {
        const closed = (completedSessions[r.id] ?? [])
          .filter((s) => marker >= s.start && marker <= s.end)
          .map((s) => ({ rowId: r.id, start: s.start, isOpen: false }));
        const openStart = activeSessionStarts[r.id];
        return openStart !== undefined && marker >= openStart
          ? [...closed, { rowId: r.id, start: openStart, isOpen: true }]
          : closed;
      });
  }, [
    isPunchesTab,
    state.iTrackId,
    state.resolvedMarkerSec,
    flatRows,
    completedSessions,
    activeSessionStarts,
  ]);
  let activeSubRowId: number | null = null;
  if (
    state.selectedSubRowId !== null &&
    openSubRowIds.includes(state.selectedSubRowId)
  ) {
    activeSubRowId = state.selectedSubRowId;
  } else {
    for (const id of openSubRowIds) {
      if (
        activeSubRowId === null ||
        activeSessionStarts[id] >= activeSessionStarts[activeSubRowId]
      )
        activeSubRowId = id;
    }
  }

  // Punches tabs: a newly selected line (digits, Ctrl+arrows…) or sub-selected
  // sub-row (↑/↓) scrolls smoothly into view in the list; the grid follows
  // through the list's scroll sync.
  const scrollRowIntoView = (rowId: number | null) => {
    const list = state.listBodyRef.current;
    const index = flatRows.findIndex((r) => r.id === rowId);
    const item = list?.children[index] as HTMLElement | undefined;
    if (!list || index < 0 || !item) return;
    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    if (itemRect.top < listRect.top) {
      list.scrollBy({ top: itemRect.top - listRect.top, behavior: "smooth" });
    } else if (itemRect.bottom > listRect.bottom) {
      list.scrollBy({
        top: itemRect.bottom - listRect.bottom,
        behavior: "smooth",
      });
    }
  };
  const scrollRowIntoViewRef = useRef(scrollRowIntoView);
  useEffect(() => {
    scrollRowIntoViewRef.current = scrollRowIntoView;
  });

  // Punches tabs: a bar dragged by its ends is saved by the parent; if it was
  // the selected one it stays selected under its new start.
  const handleEditBar = (rowId: number, oldStart: number, next: BarEdit) => {
    onUpdateSession?.(rowId, oldStart, next);
    if (
      state.selectedBar?.rowId === rowId &&
      state.selectedBar.start === oldStart
    ) {
      state.setSelectedBar({ rowId, start: next.start });
    }
  };
  // Its ends stay within the timeline and the parent's own limits.
  const getEditBounds = (rowId: number, start: number) => {
    const bounds = getSessionBounds?.(rowId, start);
    return {
      min: Math.max(timelineStartSec, bounds?.min ?? -Infinity),
      max: Math.min(timelineEndSec, bounds?.max ?? Infinity),
    };
  };

  // Punches tabs: like a diamond, a punched-out bar of the selected line gets
  // selected when the marker lands on it, and loses the selection when the
  // marker leaves it. Sub-rows' bars (customer groups) aren't auto-picked: the
  // line stays selected and ↑/↓ step into them. Only reacts to the marker
  // moving or the line changing, so a bar picked by click isn't overridden.
  // Open bars always reach the marker, so they're left to an explicit pick.
  const autoSelectBar = (markerMoved: boolean) => {
    const marker = state.resolvedMarkerSec;
    const line = state.iTrackId;
    const rowIds =
      line === null
        ? []
        : [
            line,
            ...flatRows
              .filter((r) => r.kind === "event" && r.parentCameraId === line)
              .map((r) => r.id),
          ];
    const candidates = (line === null ? [] : [line]).flatMap((rowId) =>
      (completedSessions[rowId] ?? [])
        .filter((r) => marker >= r.start && marker <= r.end)
        .map((r) => ({ rowId, start: r.start })),
    );
    const selected = state.selectedBar;
    const isSelectedHere =
      selected !== null && rowIds.includes(selected.rowId);
    if (candidates.length > 0) {
      const keep =
        selected !== null &&
        candidates.some(
          (c) => c.rowId === selected.rowId && c.start === selected.start,
        );
      // A line change keeps a bar already picked on that line (e.g. a click).
      if (keep || (!markerMoved && isSelectedHere)) return;
      state.setSelectedBar(
        candidates.find((c) => c.rowId === activeSubRowId) ??
          candidates[candidates.length - 1],
      );
      return;
    }
    if (selected === null) return;
    // A selected bar always belongs to the selected line.
    if (!isSelectedHere) {
      state.setSelectedBar(null);
      return;
    }
    if (!markerMoved) return;
    // The marker left the selected bar (an open one keeps reaching it).
    const range = completedSessions[selected.rowId]?.find(
      (r) => r.start === selected.start,
    );
    const stillOn = range
      ? marker >= range.start && marker <= range.end
      : activeSessionStarts[selected.rowId] === selected.start;
    if (!stillOn) state.setSelectedBar(null);
  };
  const autoSelectBarRef = useRef(autoSelectBar);
  useEffect(() => {
    autoSelectBarRef.current = autoSelectBar;
  });
  const prevAutoSelectRef = useRef<{ marker: number; line: number | null }>({
    marker: state.resolvedMarkerSec,
    line: state.iTrackId,
  });
  useEffect(() => {
    const prev = prevAutoSelectRef.current;
    prevAutoSelectRef.current = {
      marker: state.resolvedMarkerSec,
      line: state.iTrackId,
    };
    if (!isPunchesTab) return;
    autoSelectBarRef.current(prev.marker !== state.resolvedMarkerSec);
  }, [isPunchesTab, state.resolvedMarkerSec, state.iTrackId]);

  // Punches tabs: the toolbar's trash deletes the selected bar, like Delete.
  const selectedBar = state.selectedBar;
  const canDeleteBar =
    onDeleteSession !== undefined &&
    selectedBar !== null &&
    ((completedSessions[selectedBar.rowId] ?? []).some(
      (r) => r.start === selectedBar.start,
    ) ||
      activeSessionStarts[selectedBar.rowId] === selectedBar.start) &&
    // …and the tab allows deleting it (e.g. no customers on an employee bar).
    canDeleteSession?.(selectedBar.rowId, selectedBar.start) !== false;
  const handleDeleteBar = () => {
    if (!canDeleteBar || selectedBar === null) return;
    const wasOpen = activeSessionStarts[selectedBar.rowId] === selectedBar.start;
    // The tab may refuse (e.g. an employee bar with customers on it).
    if (onDeleteSession?.(selectedBar.rowId, selectedBar.start) === false)
      return;
    state.setSelectedBar(null);
    // Deleting the line's own open bar leaves it punched out.
    if (wasOpen && selectedBar.rowId === state.iTrackId) {
      state.setSelectedTracks(new Set());
    }
  };

  // The sub-row the user actually picked under the selected line: the one
  // whose bar is selected (↑/↓, click), else an open one clicked in the list.
  // Unlike activeSubRowId, there's no default — the line alone picks none.
  const selectedBarRow =
    state.selectedBar !== null
      ? flatRows.find((r) => r.id === state.selectedBar?.rowId)
      : undefined;
  const highlightedSubRowId =
    selectedBarRow?.kind === "event" &&
    selectedBarRow.parentCameraId === state.iTrackId
      ? selectedBarRow.id
      : state.selectedSubRowId !== null &&
          openSubRowIds.includes(state.selectedSubRowId)
        ? state.selectedSubRowId
        : null;

  // Scroll target: the customer (sub-row) in play under the selected line —
  // the picked one, else the open one "o" would close — or the line itself.
  const scrollTargetRowId =
    highlightedSubRowId ?? activeSubRowId ?? state.iTrackId;
  useEffect(() => {
    if (isPunchesTab) scrollRowIntoViewRef.current(scrollTargetRowId);
  }, [isPunchesTab, scrollTargetRowId]);

  // Clicking a line's sub-rows block selects the line itself: no bar or
  // sub-row picked, so its block shows as the selected one.
  const handleSelectLine = (rowId: number) => {
    state.setITrackId(rowId);
    state.setSelectedTracks(
      activeSessionStarts[rowId] !== undefined ? new Set([rowId]) : new Set(),
    );
    state.setSelectedBar(null);
    state.setSelectedSubRowId(null);
  };

  // Clicking an open sub-row in the list sub-selects it (and its line).
  const handleSelectSubRow = (rowId: number) => {
    const parentId = flatRows.find((r) => r.id === rowId)?.parentCameraId;
    if (parentId === undefined) return;
    state.setITrackId(parentId);
    state.setSelectedTracks(
      activeSessionStarts[parentId] !== undefined
        ? new Set([parentId])
        : new Set(),
    );
    state.setSelectedSubRowId(rowId);
  };

  // A group handed over to another row follows it: that row becomes the
  // selected line and the group, in its new place, the sub-selected one —
  // so "o" punches it out from there.
  const handleReassignRow = (rowId: number, parentId: number) => {
    const movedRowId = onReassignRow?.(rowId, parentId);
    state.setITrackId(parentId);
    state.setSelectedTracks(
      activeSessionStarts[parentId] !== undefined
        ? new Set([parentId])
        : new Set(),
    );
    if (typeof movedRowId === "number") state.setSelectedSubRowId(movedRowId);
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
    // An open sub-row's bar also sub-selects that sub-row.
    if (lineId !== rowId && activeSessionStarts[rowId] !== undefined) {
      state.setSelectedSubRowId(rowId);
    }
  };

  // Let the parent move the selection to a row it just created (keyed, so the
  // same row can be focused again); a sub-row is picked under its line (only
  // it looks selected).
  const focusRowKey = focusRow?.key;
  useEffect(() => {
    if (!focusRow) return;
    const row = flatRows.find((r) => r.id === focusRow.rowId);
    const parentId =
      row?.kind === "event" ? row.parentCameraId : undefined;
    if (parentId !== undefined) {
      state.setITrackId(parentId);
      state.setSelectedTracks(new Set());
      state.setSelectedSubRowId(focusRow.rowId);
      return;
    }
    state.setITrackId(focusRow.rowId);
    state.setSelectedTracks(
      activeSessionStarts[focusRow.rowId] !== undefined
        ? new Set([focusRow.rowId])
        : new Set(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRowKey]);

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
    rowNumberStart,
    onRowKey: isPunchesTab ? onRowKey : undefined,
    onPunchedOut: handlePunchedOut,
    onDeleteLine: isPunchesTab ? onDeleteLine : undefined,
    onPunchIn,
    onPunchOut,
    onAddRow,
    // Ctrl+arrows step through the bars and Delete removes one (punches tabs).
    completedSessions,
    onDeleteSession,
    selectedBar: state.selectedBar,
    setSelectedBar: state.setSelectedBar,
    subRowBars,
    activeSubRowId,
    setSelectedSubRowId: state.setSelectedSubRowId,
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
        onDeleteEventPoint={
          isPunchesTab ? handleDeleteBar : handleDeleteEventPoint
        }
        canDelete={
          isPunchesTab ? canDeleteBar : targetEventPoint?.reviewed === true
        }
        onGoPrevEventPoint={handleGoToPrevEventPoint}
        onGoNextEventPoint={handleGoToNextEventPoint}
        hasPrevEventPoint={prevEventPoint !== undefined}
        hasNextEventPoint={nextEventPoint !== undefined}
        expanded={expandedIcon}
        activeTab={activeTab}
        onTabChange={onTabChange}
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
        showAddButton={showAddButton}
        loadState={loadState}
        pendingReviewWallSec={state.pendingReviewWallSec}
        hasMultipleRows={hasMultipleRows}
        reassignOptions={reassignOptions}
        onReassignRow={onReassignRow ? handleReassignRow : undefined}
        emptyGridMessage={emptyGridMessage}
        selectedBar={isPunchesTab ? state.selectedBar : null}
        onSelectBar={isPunchesTab ? handleSelectBar : undefined}
        rowNotice={isPunchesTab ? rowNotice : undefined}
        highlightedSubRowId={highlightedSubRowId}
        onSelectSubRow={isPunchesTab ? handleSelectSubRow : undefined}
        rowNumberStart={rowNumberStart}
        getOpenHint={isPunchesTab ? getOpenHint : undefined}
        canReassignRow={canReassignRow}
        getSelectedHint={isPunchesTab ? getSelectedHint : undefined}
        punchedOut={isPunchesTab ? punchedOut : undefined}
        onSelectLine={isPunchesTab ? handleSelectLine : undefined}
        onEditBar={isPunchesTab && onUpdateSession ? handleEditBar : undefined}
        getEditBounds={getEditBounds}
      />
    </Box>
  );
};

export default memo(TimeLine);
