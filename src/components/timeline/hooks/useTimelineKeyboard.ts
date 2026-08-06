import { useCallback, useEffect, useRef } from "react";
import useNavigateWithQuery from "../../../hooks/useNavigate";
import useCompanyConfig from "../../../hooks/useCompanyConfig";
import { hasReviewedTwin } from "../utils";
import { TAG_TOLERANCE_SEC } from "../../../hooks/useTagsForCamera";
import { getMaxZoom } from "../constants";
import type { CameraEventPoint, FlatRow } from "../types";

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
}

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
}: UseTimelineKeyboardParams) => {
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

  // ── + / - keys: zoom centered on mouse position ───────────────────────────
  useEffect(() => {
    const handleZoom = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      if (e.key !== "+" && e.key !== "-") return;
      e.preventDefault();

      const el = gridRef.current;
      const width = el?.clientWidth ?? 1;
      const mouseX = Math.max(0, Math.min(mouseXRef.current, width));

      const oldZoom = zoom;
      const maxZoom = getMaxZoom(width, imagesInterval);
      const newZoom = Math.min(
        maxZoom,
        Math.max(1, oldZoom * (e.key === "+" ? 1.25 : 1 / 1.25)),
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
