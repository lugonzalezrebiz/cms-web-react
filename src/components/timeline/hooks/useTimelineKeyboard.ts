import { useCallback, useEffect, useMemo, useRef } from "react";
import useNavigateWithQuery from "../../../hooks/useNavigate";
import useCompanyConfig from "../../../hooks/useCompanyConfig";
import { hasReviewedTwin } from "../utils";
import { TAG_TOLERANCE_SEC } from "../../../hooks/useTagsForCamera";
import { getMaxZoom } from "../constants";
import type { CameraEventPoint, FlatRow } from "../types";
import type { SelectedBar } from "./useTimelineBodyState";

interface UseTimelineKeyboardParams {
  selectableRows: FlatRow[];
  iTrackId: number | null;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  activeSessionStarts: Record<number, number>;
  setActiveSessionStarts: React.Dispatch<
    React.SetStateAction<Record<number, number>>
  >;
  markerSec: number | null;
  timelineStartSec: number;
  timelineEndSec: number;
  selectedTracks: Set<number>;
  setSelectedTracks: React.Dispatch<React.SetStateAction<Set<number>>>;
  setCompletedSessions: React.Dispatch<
    React.SetStateAction<Record<number, { start: number; end: number }[]>>
  >;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  setShowPunchOut: React.Dispatch<React.SetStateAction<boolean>>;
  punchOutTimerRef: React.RefObject<
    ReturnType<typeof setTimeout> | null
  >;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  panOffsetSec: number;
  setPanOffsetSec: React.Dispatch<React.SetStateAction<number>>;
  totalSec: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  cameraEventPoints?: CameraEventPoint[];
  menuItems?: {
    id: number;
    name: string;
    onClick?: (index: number) => void;
    onReject?: (index: number) => void;
  }[];
  onDeleteEventPoint?: () => void;
  onAcceptEventPoint?: (id: number) => void;
  onRejectEventPoint?: (id: number, skipHistory?: boolean) => void;
  onMarkAiIncorrect?: (id: number) => void;
  onUndo?: () => number | void;
  onRedo?: () => number | void;
  onTogglePlay?: () => void;
  setMarkerSecRaw?: React.Dispatch<React.SetStateAction<number | null>>;
  selectedEventPointId?: number | null;
  setSelectedEventPointId?: React.Dispatch<React.SetStateAction<number | null>>;
  flatRows?: FlatRow[];
  isActivityMode?: boolean;
  /** Employee punches: rows are session bars, not diamonds — see the early branches below. */
  isSessionMode?: boolean;
  onPunchIn?: (rowId: number, startSec: number) => boolean;
  onPunchOut?: (rowId: number, endSec: number) => void;
  /** "+" adds a row (session mode only), e.g. the add-employee dialog. */
  onAddRow?: () => void;
  /** Closed session bars by row id (session mode: Ctrl+arrows and Delete). */
  completedSessions?: Record<number, { start: number; end: number }[]>;
  /** Session mode: Delete removes the bar that starts at `startSec` on `rowId`. */
  onDeleteSession?: (rowId: number, startSec: number) => void;
  /** Session mode: the selected bar (clicked or reached with Ctrl+arrows). */
  selectedBar?: SelectedBar | null;
  setSelectedBar?: React.Dispatch<React.SetStateAction<SelectedBar | null>>;
  /** Session mode: called when a digit selects a row. */
  onSelectRow?: (rowId: number) => void;
  /** Session mode: the selected line's sub-row bars under the marker, in
   * list order (↑/↓ step through them). */
  subRowBars?: { rowId: number; start: number; isOpen: boolean }[];
  /** Session mode: the sub-selected open sub-row ("o" punches it out). */
  activeSubRowId?: number | null;
  setSelectedSubRowId?: React.Dispatch<React.SetStateAction<number | null>>;
  /** Session mode: number of the first row, for the digit shortcuts. */
  rowNumberStart?: number;
  /** Session mode: a letter key not handled here, for the selected line
   * (and its sub-selected sub-row); returns whether the tab handled it, or
   * the id of the line to select next. */
  onRowKey?: (
    key: string,
    lineId: number,
    subRowId: number | null,
    sec: number,
  ) => boolean | number;
}

// A session bar and the line that selects it; `end` is undefined while open.
type SessionBar = { rowId: number; lineId: number; start: number; end?: number };

export const useTimelineKeyboard = ({
  selectableRows,
  iTrackId,
  setITrackId,
  activeSessionStarts,
  setActiveSessionStarts,
  markerSec,
  timelineStartSec,
  timelineEndSec,
  selectedTracks,
  setSelectedTracks,
  setCompletedSessions,
  setMarkerSec,
  setShowPunchOut,
  punchOutTimerRef,
  zoom,
  setZoom,
  panOffsetSec,
  setPanOffsetSec,
  totalSec,
  gridRef,
  cameraEventPoints,
  menuItems,
  onDeleteEventPoint,
  onAcceptEventPoint,
  onRejectEventPoint,
  onMarkAiIncorrect,
  onUndo,
  onRedo,
  onTogglePlay,
  setMarkerSecRaw,
  selectedEventPointId,
  setSelectedEventPointId,
  flatRows,
  isActivityMode,
  isSessionMode = false,
  onPunchIn,
  onPunchOut,
  onAddRow,
  completedSessions,
  onDeleteSession,
  selectedBar,
  setSelectedBar,
  onSelectRow,
  subRowBars,
  activeSubRowId,
  setSelectedSubRowId,
  rowNumberStart = 1,
  onRowKey,
}: UseTimelineKeyboardParams) => {
  const onPunchInRef = useRef(onPunchIn);
  const onPunchOutRef = useRef(onPunchOut);
  const onAddRowRef = useRef(onAddRow);
  const onDeleteSessionRef = useRef(onDeleteSession);
  const onSelectRowRef = useRef(onSelectRow);
  const onRowKeyRef = useRef(onRowKey);
  useEffect(() => {
    onPunchInRef.current = onPunchIn;
    onPunchOutRef.current = onPunchOut;
    onAddRowRef.current = onAddRow;
    onDeleteSessionRef.current = onDeleteSession;
    onSelectRowRef.current = onSelectRow;
    onRowKeyRef.current = onRowKey;
  });
  const onDeleteRef = useRef(onDeleteEventPoint);
  const onAcceptRef = useRef(onAcceptEventPoint);
  const onRejectRef = useRef(onRejectEventPoint);
  const onMarkAiIncorrectRef = useRef(onMarkAiIncorrect);
  const onUndoRef = useRef(onUndo);
  const onRedoRef = useRef(onRedo);
  const onTogglePlayRef = useRef(onTogglePlay);
  useEffect(() => {
    onDeleteRef.current = onDeleteEventPoint;
    onAcceptRef.current = onAcceptEventPoint;
    onRejectRef.current = onRejectEventPoint;
    onMarkAiIncorrectRef.current = onMarkAiIncorrect;
    onUndoRef.current = onUndo;
    onRedoRef.current = onRedo;
    onTogglePlayRef.current = onTogglePlay;
  });
  const navigate = useNavigateWithQuery();
  const { imagesInterval } = useCompanyConfig();

  const panTo = useCallback(
    (targetSec: number) => {
      const visibleDuration = totalSec / zoom;
      const visibleEnd = panOffsetSec + visibleDuration;
      if (targetSec < panOffsetSec || targetSec > visibleEnd) {
        const margin = visibleDuration * 0.2;
        const targetOffset = Math.max(0, Math.min(totalSec - visibleDuration, targetSec - margin));
        const startOffset = panOffsetSec;
        const duration = 500;
        const startTime = performance.now();
        const animate = (now: number) => {
          const t = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setPanOffsetSec(startOffset + (targetOffset - startOffset) * eased);
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    },
    [totalSec, zoom, panOffsetSec, setPanOffsetSec],
  );

  // Sub-rows hanging under a row (e.g. Customer punches groups).
  const childRowIds = useCallback(
    (rowId: number) =>
      (flatRows ?? [])
        .filter((r) => r.kind === "event" && r.parentCameraId === rowId)
        .map((r) => r.id),
    [flatRows],
  );

  // Session mode: every bar, ordered by start and then by row, each with the
  // line that selects it (a sub-row's bar selects its parent row).
  const sessionBars = useMemo((): SessionBar[] => {
    if (!isSessionMode) return [];
    const rows = flatRows ?? [];
    const bars: (SessionBar & { order: number })[] = [];
    rows.forEach((row, order) => {
      const lineId =
        row.kind === "event" && row.parentCameraId !== undefined
          ? row.parentCameraId
          : row.id;
      for (const { start, end } of completedSessions?.[row.id] ?? []) {
        bars.push({ rowId: row.id, lineId, start, end, order });
      }
      const openStart = activeSessionStarts[row.id];
      if (openStart !== undefined) {
        bars.push({ rowId: row.id, lineId, start: openStart, order });
      }
    });
    return bars
      .sort((a, b) => a.start - b.start || a.order - b.order)
      .map(({ order: _order, ...bar }) => bar);
  }, [isSessionMode, flatRows, completedSessions, activeSessionStarts]);

  // Position of the selected bar among sessionBars (-1 if none / gone).
  const selectedBarIndex = selectedBar
    ? sessionBars.findIndex(
        (b) => b.rowId === selectedBar.rowId && b.start === selectedBar.start,
      )
    : -1;

  // Track mouse X relative to the grid element
  const mouseXRef = useRef<number>(0);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseXRef.current = e.clientX - rect.left;
    };
    el.addEventListener("mousemove", onMouseMove);
    return () => el.removeEventListener("mousemove", onMouseMove);
  }, [gridRef]);

  // ── "i" (new event point on selected line) and "o" (punch-out all) ──────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;

      // Employee punches: "i" opens a new bar on the selected row at the marker,
      // "o" closes that row's open session at the marker, and digits jump to
      // any row (no diamond-proximity rule).
      if (isSessionMode && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // "+" adds a row (Employee punches' add-employee dialog), when offered.
        if (e.key === "+" && onAddRowRef.current) {
          e.preventDefault();
          onAddRowRef.current();
          return;
        }
        if (e.key === "i") {
          // No rows yet or none selected: "i" works like "+" (add a row),
          // when the tab offers it.
          if (
            iTrackId === null ||
            !selectableRows.some((r) => r.id === iTrackId)
          ) {
            if (onAddRowRef.current) {
              e.preventDefault();
              onAddRowRef.current();
            }
            return;
          }
          const start = markerSec ?? timelineStartSec;
          if (onPunchInRef.current?.(iTrackId, start)) {
            setSelectedTracks(new Set([iTrackId]));
          }
          return;
        }
        if (e.key === "o") {
          if (iTrackId === null) return;
          const end = markerSec ?? timelineStartSec;
          // The sub-selected open sub-row first (a customer group under its
          // employee: an employee can't leave mid-customer), else the selected
          // row's own session.
          const rowId =
            activeSubRowId ??
            (activeSessionStarts[iTrackId] !== undefined ? iTrackId : undefined);
          if (rowId === undefined) return;
          const start = activeSessionStarts[rowId];
          if (start === undefined || end <= start) return;
          onPunchOutRef.current?.(rowId, end);
          // The line is no longer punched in only if its own bar closed.
          if (rowId === iTrackId) setSelectedTracks(new Set());
          // The next open sub-row (if any) takes over the sub-selection.
          if (rowId !== iTrackId) setSelectedSubRowId?.(null);
          // Punching out the row itself (Employee punches) also deselects it;
          // closing a sub-row's session (a customer group) keeps its parent.
          if (rowId === iTrackId) setITrackId(null);
          return;
        }
        // ↑/↓ step from the selected line (no bar) through its sub-rows' bars
        // under the marker and back, selecting each bar; an open one also
        // becomes the sub-row "o" punches out. Without any they keep
        // scrolling the list.
        if (
          (e.key === "ArrowUp" || e.key === "ArrowDown") &&
          subRowBars &&
          subRowBars.length > 0
        ) {
          e.preventDefault();
          const current = subRowBars.findIndex(
            (b) =>
              selectedBar != null &&
              b.rowId === selectedBar.rowId &&
              b.start === selectedBar.start,
          );
          // Position 0 is the line itself, then one per sub-row bar.
          const stops = subRowBars.length + 1;
          const step = e.key === "ArrowDown" ? 1 : -1;
          const next = (current + 1 + step + stops) % stops;
          if (next === 0) {
            // Back on the line itself: no sub-row picked.
            setSelectedBar?.(null);
            setSelectedSubRowId?.(null);
            return;
          }
          const bar = subRowBars[next - 1];
          setSelectedBar?.({ rowId: bar.rowId, start: bar.start });
          if (bar.isOpen) setSelectedSubRowId?.(bar.rowId);
          return;
        }
        if (e.key === "Delete") {
          // Only the selected bar is deleted, like a selected diamond.
          const bar = sessionBars[selectedBarIndex];
          if (!bar || !onDeleteSessionRef.current) return;
          e.preventDefault();
          onDeleteSessionRef.current(bar.rowId, bar.start);
          setSelectedBar?.(null);
          // Deleting the line's own open bar leaves it punched out.
          if (bar.end === undefined && bar.rowId === iTrackId) {
            setSelectedTracks(new Set());
          }
          return;
        }
        if (/^[0-9]$/.test(e.key)) {
          // Digits match the numbers in the list: from rowNumberStart, with
          // "0" as the 10th row when the list starts at 1.
          const digit = Number(e.key);
          const index =
            rowNumberStart === 1 && digit === 0 ? 9 : digit - rowNumberStart;
          const row = selectableRows[index];
          // Inactive (greyed-out) lines can't be selected.
          if (!row || row.inactive) return;
          setITrackId(row.id);
          setSelectedTracks(
            activeSessionStarts[row.id] !== undefined
              ? new Set([row.id])
              : new Set(),
          );
          onSelectRowRef.current?.(row.id);
          return;
        }
        // Other letters the tab handles itself (e.g. Employee and Customer's
        // B / S), on the selected line and its sub-selected sub-row.
        if (/^[a-z]$/i.test(e.key) && iTrackId !== null) {
          const handled = onRowKeyRef.current?.(
            e.key.toLowerCase(),
            iTrackId,
            activeSubRowId ?? null,
            markerSec ?? timelineStartSec,
          );
          if (handled !== undefined && handled !== false) {
            e.preventDefault();
            // A row id: the line the tab wants selected next.
            if (typeof handled === "number") {
              setITrackId(handled);
              setSelectedTracks(new Set());
            }
            return;
          }
        }
      }

      if (
        e.key === "i" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        iTrackId !== null
      ) {
        const currentMarker = markerSec ?? timelineStartSec;
        const pending = cameraEventPoints?.find(
          (ep) =>
            ep.id === selectedEventPointId &&
            ep.reviewed === false &&
            !ep.rejected &&
            ep.timeSec === currentMarker,
        );
        if (pending) {
          onAcceptRef.current?.(pending.id);

          const sorted = [...(cameraEventPoints ?? [])].sort((a, b) => a.timeSec - b.timeSec);
          const nextTarget = sorted.find(
            (ep) =>
              ep.timeSec >= currentMarker &&
              ep.id !== pending.id &&
              ep.reviewed === false &&
              !ep.rejected &&
              !hasReviewedTwin(ep, cameraEventPoints ?? []),
          );
          if (nextTarget) {
            (setMarkerSecRaw ?? setMarkerSec)(nextTarget.timeSec);
            panTo(nextTarget.timeSec);
            const targetRow = flatRows?.find((r) =>
              isActivityMode
                ? r.kind === "activity" && r.name === nextTarget.label
                : r.kind === "event" &&
                  r.parentCameraId === nextTarget.cameraId &&
                  r.name === nextTarget.label,
            );
            if (targetRow) setITrackId(targetRow.id);
            setSelectedEventPointId?.(nextTarget.id);
          }
        } else {
          const belongsToRow = (ep: CameraEventPoint) =>
            flatRows?.find((r) =>
              isActivityMode
                ? r.kind === "activity" && r.name === ep.label
                : r.kind === "event" &&
                  r.parentCameraId === ep.cameraId &&
                  r.name === ep.label,
            )?.id === iTrackId;

          const nearbyPoints = (cameraEventPoints ?? []).filter(
            (ep) =>
              belongsToRow(ep) &&
              Math.abs(ep.timeSec - currentMarker) <= TAG_TOLERANCE_SEC,
          );
          if (nearbyPoints.length === 0) return;

          const selectedNearby = nearbyPoints.find(
            (ep) => ep.id === selectedEventPointId,
          );
          const target =
            selectedNearby ??
            [...nearbyPoints].sort(
              (a, b) =>
                Math.abs(a.timeSec - currentMarker) - Math.abs(b.timeSec - currentMarker),
            )[0];
          if (
            target.reviewed &&
            target.value === true &&
            (target.mode === "RANGE" || target.timeSec === currentMarker)
          )
            return;

          const item = menuItems?.find((m) => m.id === iTrackId);
          item?.onClick?.(target.cameraId);

          onRejectRef.current?.(target.id, true);

          const sorted = [...(cameraEventPoints ?? [])].sort((a, b) => a.timeSec - b.timeSec);
          const nextTarget = sorted.find(
            (ep) =>
              ep.timeSec >= target.timeSec &&
              ep.id !== target.id &&
              ep.reviewed === false &&
              !ep.rejected &&
              !hasReviewedTwin(ep, cameraEventPoints ?? []),
          );
          if (nextTarget) {
            (setMarkerSecRaw ?? setMarkerSec)(nextTarget.timeSec);
            panTo(nextTarget.timeSec);
            const targetRow = flatRows?.find((r) =>
              isActivityMode
                ? r.kind === "activity" && r.name === nextTarget.label
                : r.kind === "event" &&
                  r.parentCameraId === nextTarget.cameraId &&
                  r.name === nextTarget.label,
            );
            if (targetRow) setITrackId(targetRow.id);
            setSelectedEventPointId?.(nextTarget.id);
          }
        }
      } else if (
        e.key === "o" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        iTrackId !== null &&
        selectableRows.length >= 2
      ) {
        const currentMarker = markerSec ?? timelineStartSec;
        const pending = cameraEventPoints?.find(
          (ep) =>
            ep.id === selectedEventPointId &&
            ep.mode === "POINT" &&
            ep.reviewed === false &&
            !ep.rejected &&
            ep.timeSec === currentMarker,
        );
        if (pending) {
          onMarkAiIncorrectRef.current?.(pending.id);

          const sorted = [...(cameraEventPoints ?? [])].sort((a, b) => a.timeSec - b.timeSec);
          const nextTarget = sorted.find(
            (ep) =>
              ep.timeSec >= currentMarker &&
              ep.id !== pending.id &&
              ep.reviewed === false &&
              !ep.rejected &&
              !hasReviewedTwin(ep, cameraEventPoints ?? []),
          );
          if (nextTarget) {
            (setMarkerSecRaw ?? setMarkerSec)(nextTarget.timeSec);
            panTo(nextTarget.timeSec);
            const targetRow = flatRows?.find((r) =>
              isActivityMode
                ? r.kind === "activity" && r.name === nextTarget.label
                : r.kind === "event" &&
                  r.parentCameraId === nextTarget.cameraId &&
                  r.name === nextTarget.label,
            );
            if (targetRow) setITrackId(targetRow.id);
            setSelectedEventPointId?.(nextTarget.id);
          }
        } else {
          const belongsToRow = (ep: CameraEventPoint) =>
            flatRows?.find((r) =>
              isActivityMode
                ? r.kind === "activity" && r.name === ep.label
                : r.kind === "event" &&
                  r.parentCameraId === ep.cameraId &&
                  r.name === ep.label,
            )?.id === iTrackId;

          const nearbyPoints = (cameraEventPoints ?? []).filter(
            (ep) =>
              belongsToRow(ep) &&
              ep.mode === "POINT" &&
              Math.abs(ep.timeSec - currentMarker) <= TAG_TOLERANCE_SEC,
          );
          if (nearbyPoints.length === 0) return;

          const selectedNearby = nearbyPoints.find(
            (ep) => ep.id === selectedEventPointId,
          );
          const target =
            selectedNearby ??
            [...nearbyPoints].sort(
              (a, b) =>
                Math.abs(a.timeSec - currentMarker) - Math.abs(b.timeSec - currentMarker),
            )[0];
          if (target.reviewed && target.value === false && target.timeSec === currentMarker)
            return;

          const item = menuItems?.find((m) => m.id === iTrackId);
          item?.onReject?.(target.cameraId);

          onRejectRef.current?.(target.id, true);

          const sorted = [...(cameraEventPoints ?? [])].sort((a, b) => a.timeSec - b.timeSec);
          const nextTarget = sorted.find(
            (ep) =>
              ep.timeSec >= target.timeSec &&
              ep.id !== target.id &&
              ep.reviewed === false &&
              !ep.rejected &&
              !hasReviewedTwin(ep, cameraEventPoints ?? []),
          );
          if (nextTarget) {
            (setMarkerSecRaw ?? setMarkerSec)(nextTarget.timeSec);
            panTo(nextTarget.timeSec);
            const targetRow = flatRows?.find((r) =>
              isActivityMode
                ? r.kind === "activity" && r.name === nextTarget.label
                : r.kind === "event" &&
                  r.parentCameraId === nextTarget.cameraId &&
                  r.name === nextTarget.label,
            );
            if (targetRow) setITrackId(targetRow.id);
            setSelectedEventPointId?.(nextTarget.id);
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        const actionSec = onUndoRef.current?.();
        if (typeof actionSec === "number") {
          (setMarkerSecRaw ?? setMarkerSec)(actionSec);
          panTo(actionSec);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        const actionSec = onRedoRef.current?.();
        if (typeof actionSec === "number") {
          (setMarkerSecRaw ?? setMarkerSec)(actionSec);
          panTo(actionSec);
        }
      } else if (e.key === "Delete") {
        const target = cameraEventPoints?.find(
          (ep) => ep.id === selectedEventPointId,
        );
        if (target && target.reviewed === false && !target.rejected) {
          onRejectRef.current?.(target.id);
        } else {
          onDeleteRef.current?.();
        }
      } else if (e.key === "h") {
        setMarkerSec(timelineStartSec);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && /^[0-9]$/.test(e.key)) {
        const position = e.key === "0" ? 10 : Number(e.key);
        const row = selectableRows[position - 1];
        if (row) {
          const pointsForRow = (rowId: number, kind: FlatRow["kind"]) =>
            (cameraEventPoints ?? []).filter((ep) => {
              if (kind === "camera") return ep.cameraId === rowId;
              const r = flatRows?.find((fr) => fr.id === rowId);
              return r ? r.name === ep.label : false;
            });

          const currentRow = flatRows?.find((r) => r.id === iTrackId);
          if (currentRow && currentRow.id !== row.id) {
            const currentMarker = markerSec ?? timelineStartSec;
            const targetPoints = pointsForRow(row.id, row.kind);
            const shareTolerance = targetPoints.some(
              (tp) => Math.abs(tp.timeSec - currentMarker) <= TAG_TOLERANCE_SEC,
            );
            if (!shareTolerance) return;
          }

          setITrackId(row.id);
          setSelectedTracks(
            activeSessionStarts[row.id] !== undefined
              ? new Set([row.id])
              : new Set(),
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectableRows,
    iTrackId,
    activeSessionStarts,
    markerSec,
    timelineStartSec,
    setITrackId,
    setActiveSessionStarts,
    setSelectedTracks,
    setCompletedSessions,
    setShowPunchOut,
    punchOutTimerRef,
    setMarkerSec,
    menuItems,
    cameraEventPoints,
    panTo,
    setMarkerSecRaw,
    selectedEventPointId,
    setSelectedEventPointId,
    flatRows,
    isActivityMode,
    isSessionMode,
    childRowIds,
    sessionBars,
    selectedBarIndex,
    setSelectedBar,
    subRowBars,
    selectedBar,
    activeSubRowId,
    setSelectedSubRowId,
    rowNumberStart,
  ]);

  // ── Alt+ArrowLeft: go back ───────────────────────────────────────────────
  useEffect(() => {
    const handleBack = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener("keydown", handleBack);
    return () => window.removeEventListener("keydown", handleBack);
  }, [navigate]);

  // ── Arrow keys: move marker ──────────────────────────────────────────────
  useEffect(() => {
    const handleArrow = (e: KeyboardEvent) => {
      if (e.altKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      e.preventDefault();

      // Employee punches: plain steps both ways so an overshot bar can be pulled
      // back, but never before the selected row's punch-in.
      if (isSessionMode) {
        // Ctrl+arrows jump to the previous / next bar's start and select its line.
        if (e.ctrlKey || e.metaKey) {
          const base = markerSec ?? timelineStartSec;
          // From the selected bar while the marker is still on its start (so
          // bars sharing a start second are stepped one by one), else from
          // the marker.
          const current =
            sessionBars[selectedBarIndex]?.start === base ? selectedBarIndex : -1;
          const target =
            e.key === "ArrowRight"
              ? current >= 0
                ? sessionBars[current + 1]
                : sessionBars.find((b) => b.start > base)
              : current >= 0
                ? sessionBars[current - 1]
                : [...sessionBars].reverse().find((b) => b.start < base);
          if (!target) return;
          setSelectedBar?.({ rowId: target.rowId, start: target.start });
          setMarkerSec(target.start);
          panTo(target.start);
          setITrackId(target.lineId);
          setSelectedTracks(
            activeSessionStarts[target.lineId] !== undefined
              ? new Set([target.lineId])
              : new Set(),
          );
          return;
        }
        const delta = e.key === "ArrowRight" ? imagesInterval : -imagesInterval;
        const base = markerSec ?? timelineStartSec;
        const openStarts =
          iTrackId !== null
            ? [iTrackId, ...childRowIds(iTrackId)]
                .map((id) => activeSessionStarts[id])
                .filter((s): s is number => s !== undefined)
            : [];
        const minSec =
          openStarts.length > 0 ? Math.max(...openStarts) : timelineStartSec;
        const next = Math.max(minSec, Math.min(timelineEndSec, base + delta));
        setMarkerSec(next);
        panTo(next);
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const currentSec = markerSec ?? timelineStartSec;
        const onPendingDiamond = cameraEventPoints?.some(
          (ep) =>
            ep.timeSec === currentSec &&
            ep.reviewed === false &&
            !ep.rejected,
        );
        if (onPendingDiamond && e.key === "ArrowRight") return;
        const sorted = [...(cameraEventPoints ?? [])].sort((a, b) => a.timeSec - b.timeSec);
        let targetEp: CameraEventPoint | undefined;
        if (e.key === "ArrowLeft") {
          targetEp = [...sorted].reverse().find((ep) => ep.timeSec < currentSec);
        } else {
          targetEp = sorted.find((ep) => ep.timeSec > currentSec);
        }
        if (targetEp) {
          setMarkerSec(targetEp.timeSec);
          panTo(targetEp.timeSec);
          const targetRow = flatRows?.find((r) =>
            isActivityMode
              ? r.kind === "activity" && r.name === targetEp.label
              : r.kind === "event" &&
                r.parentCameraId === targetEp.cameraId &&
                r.name === targetEp.label,
          );
          if (targetRow && targetRow.id !== iTrackId) setITrackId(targetRow.id);
          setSelectedEventPointId?.(targetEp.id);
        }
        return;
      }

      if (selectedTracks.size > 0 && e.key !== "ArrowRight") return;
      const delta = e.key === "ArrowRight" ? imagesInterval : -imagesInterval;
      const base = markerSec ?? timelineStartSec;
      let next = Math.max(timelineStartSec, Math.min(timelineEndSec, base + delta));

      // Skip the dead zone between diamonds' review windows — nothing is
      // selectable there (useAutoSelectOnMarkerOverDiamond only hit-tests within
      // TAG_TOLERANCE_SEC of a diamond), so stepping past a window's edge jumps
      // straight to the start of the next diamond's window instead of
      // frame-stepping through empty space.
      const windows: { start: number; end: number }[] = [];
      for (const ep of cameraEventPoints ?? []) {
        if (ep.rejected) continue;
        const windowEnd =
          (ep.mode === "RANGE" && ep.endSec > ep.timeSec ? ep.endSec : ep.timeSec) +
          TAG_TOLERANCE_SEC;
        windows.push({ start: ep.timeSec - TAG_TOLERANCE_SEC, end: windowEnd });
      }
      windows.sort((a, b) => a.start - b.start);
      const merged: { start: number; end: number }[] = [];
      for (const w of windows) {
        const last = merged[merged.length - 1];
        if (last && w.start <= last.end) {
          last.end = Math.max(last.end, w.end);
        } else {
          merged.push({ ...w });
        }
      }

      const currentWindow = merged.find((w) => base >= w.start && base <= w.end);
      if (currentWindow) {
        if (e.key === "ArrowRight" && next > currentWindow.end) {
          const nextWindow = merged.find((w) => w.start > currentWindow.end);
          if (nextWindow) next = Math.min(timelineEndSec, nextWindow.start);
        } else if (e.key === "ArrowLeft" && next < currentWindow.start) {
          const prevWindow = [...merged].reverse().find((w) => w.end < currentWindow.start);
          if (prevWindow) next = Math.max(timelineStartSec, prevWindow.end);
        }
      }

      setMarkerSec(next);
      panTo(next);
    };

    window.addEventListener("keydown", handleArrow);
    return () => window.removeEventListener("keydown", handleArrow);
  }, [
    selectedTracks,
    timelineStartSec,
    timelineEndSec,
    setMarkerSec,
    markerSec,
    cameraEventPoints,
    imagesInterval,
    panTo,
    iTrackId,
    setITrackId,
    flatRows,
    isActivityMode,
    setSelectedEventPointId,
    isSessionMode,
    activeSessionStarts,
    childRowIds,
    sessionBars,
    setSelectedTracks,
    selectedBarIndex,
    setSelectedBar,
  ]);

  // ── Space: play / pause ──────────────────────────────────────────────────
  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      e.preventDefault();
      onTogglePlayRef.current?.();
    };
    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  }, []);

  // ── Ctrl/Cmd + "+" / "-": zoom centered on mouse position ────────────────
  useEffect(() => {
    const handleZoom = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      if (!e.ctrlKey && !e.metaKey) return;
      // "=" is the unshifted "+" key; preventDefault also stops the browser's
      // own page zoom on these shortcuts.
      const isZoomIn = e.key === "+" || e.key === "=";
      if (!isZoomIn && e.key !== "-") return;
      e.preventDefault();

      const el = gridRef.current;
      const width = el?.clientWidth ?? 1;
      const mouseX = Math.max(0, Math.min(mouseXRef.current, width));

      const oldZoom = zoom;
      const maxZoom = getMaxZoom(width, imagesInterval);
      const newZoom = Math.min(
        maxZoom,
        Math.max(1, oldZoom * (isZoomIn ? 1.25 : 1 / 1.25)),
      );
      if (newZoom === oldZoom) return;

      const oldVisibleDuration = totalSec / oldZoom;
      const newVisibleDuration = totalSec / newZoom;
      const cursorTime = panOffsetSec + (mouseX / width) * oldVisibleDuration;
      const newOffset = Math.max(
        0,
        Math.min(totalSec - newVisibleDuration, cursorTime - (mouseX / width) * newVisibleDuration),
      );

      setZoom(newZoom);
      setPanOffsetSec(newOffset);
    };

    window.addEventListener("keydown", handleZoom);
    return () => window.removeEventListener("keydown", handleZoom);
  }, [zoom, panOffsetSec, totalSec, gridRef, setZoom, setPanOffsetSec, imagesInterval]);
};
