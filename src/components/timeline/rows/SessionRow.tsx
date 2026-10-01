import { Box } from "@mui/system";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Colors, Fonts } from "../../../theme";
import { assetUrl } from "../../../utils";
import DropDownMenu from "../../DropDownMenu";

import type { FlatRow } from "../types";

const ROW_HEIGHT = 32.8;
const PUNCHED_OUT_MESSAGE_MS = 5000;
const NOTICE_MS = 3000;
const REASSIGN_BUTTON_PX = 20;
// Gap between the marker and the attendance button (its dot sits 5px further in).
const REASSIGN_BUTTON_OFFSET_PX = 0;
// Extra gap while hovered, so the arrow circle doesn't touch the marker.
const REASSIGN_HOVER_SHIFT_PX = 4;

const hintTextSx = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  fontFamily: Fonts.main,
  fontWeight: 400,
  fontStyle: "normal",
  fontSize: 12,
  lineHeight: "18px",
  letterSpacing: 0,
  color: Colors.dimGray,
  whiteSpace: "nowrap",
  pointerEvents: "none",
  zIndex: 3,
} as const;

// const toSeconds = (time: string) => {
//   const [h, m, s] = time.split(":").map(Number);
//   return h * 3600 + m * 60 + s;
// };

interface SessionBarProps {
  range: { start: number; end: number };
  visibleStart: number;
  visibleDuration: number;
  color: string;
  isSelected?: boolean;
  /** Makes the bar clickable (punches tabs), to select it. */
  onSelect?: () => void;
  /** While selected, its ends get drag handles like a range diamond's. */
  onResizeStart?: (side: BarSide, e: MouseEvent) => void;
  /** Open bars end at the marker, so only their start can be dragged. */
  onlyStartResizable?: boolean;
}

type BarSide = "start" | "end";

// Width of the invisible grab zone on each end of a selected bar.
const BAR_HANDLE_PX = 8;

const SessionBar = ({
  range,
  visibleStart,
  visibleDuration,
  color,
  isSelected = false,
  onSelect,
  onResizeStart,
  onlyStartResizable = false,
}: SessionBarProps) => {
  const left = ((range.start - visibleStart) / visibleDuration) * 100;
  const width = ((range.end - range.start) / visibleDuration) * 100;
  const handle = (side: BarSide) => (
    <Box
      aria-label={side === "start" ? "Drag bar start" : "Drag bar end"}
      onMouseDown={(e: MouseEvent) => onResizeStart?.(side, e)}
      // Don't let the drag's click toggle the bar's selection.
      onClick={(e: MouseEvent) => e.stopPropagation()}
      // Nothing drawn: hovering an end just shows the resize cursor.
      sx={{
        position: "absolute",
        top: 0,
        left: side === "start" ? 0 : "100%",
        width: BAR_HANDLE_PX,
        height: "100%",
        transform: "translateX(-50%)",
        cursor: "ew-resize",
        pointerEvents: "auto",
        zIndex: 2,
      }}
    />
  );
  const showHandles = isSelected && onResizeStart !== undefined;
  return (
    <Box
      onMouseDown={onSelect ? (e: MouseEvent) => e.stopPropagation() : undefined}
      onClick={
        onSelect
          ? (e: MouseEvent) => {
              e.stopPropagation();
              onSelect();
            }
          : undefined
      }
      sx={{
        position: "absolute",
        left: `${left}%`,
        width: `${width}%`,
        top: "50%",
        transform: "translateY(-50%)",
        height: 19,
        borderRadius: "8px",
        background: color,
        // The rows layer ignores the mouse; selectable bars opt back in.
        pointerEvents: onSelect ? "auto" : "none",
        cursor: onSelect ? "pointer" : "default",
        // Selected like a diamond: a glow in the bar's own color (alpha 0x99,
        // blur 10), eased in and out.
        boxShadow: isSelected ? `0 0 10px ${color}99` : "none",
        transition: "box-shadow 200ms ease, background 200ms ease",
        // Drawn above its neighbors, as selected diamonds are.
        zIndex: isSelected ? 1 : "auto",
      }}
    >
      {showHandles && handle("start")}
      {showHandles && !onlyStartResizable && handle("end")}
    </Box>
  );
};

/** A bar's new bounds; `end` is left out for an open bar. */
export type BarEdit = { start: number; end?: number };

// Bars can't shrink below this.
const MIN_BAR_SEC = 1;

export interface SessionRowProps {
  row: FlatRow;
  rowIndex: number;
  /** Sub-rows whose sessions this row mirrors as lighter bars. */
  childRowIds?: number[];
  isSelected: boolean;
  completedSessions: Record<number, { start: number; end: number }[]>;
  activeSessionStarts: Record<number, number>;
  resolvedMarkerSec: number;
  visibleStart: number;
  visibleDuration: number;
  /** Rows a sub-row's group can be moved to (Customer punches). */
  reassignOptions?: { id: number; label: string; disabled?: boolean }[];
  /** Moves the sub-row `rowId` under `parentId`. */
  onReassign?: (rowId: number, parentId: number) => void;
  /** Start second of this row's selected bar, if it has one. */
  selectedBarStart?: number;
  /** Punches tabs: clicking one of this row's bars selects it. */
  onSelectBar?: (rowId: number, start: number) => void;
  /** Message shown at the marker for a few seconds, each time `key` changes. */
  notice?: RowNotice;
  /** Punches tabs: this sub-row is the sub-selected one (highlighted). */
  isSubSelected?: boolean;
  /** Show "Press o to punch-out" while open (only the sub-selected sub-row). */
  showPunchOutHint?: boolean;
  /** Punches tabs: this is the selected line and none of its sub-rows' bars is
   * selected, so its mirror bar under the marker shows as selected. */
  highlightChildBars?: boolean;
  /** Punches tabs: dragging a selected bar's ends saves its new bounds here. */
  onEditBar?: (rowId: number, oldStart: number, next: BarEdit) => void;
  /** Outer limits for a bar's ends (timeline span, attendance rules). */
  getEditBounds?: (
    rowId: number,
    start: number,
  ) => { min: number; max: number } | undefined;
}

/** A short message for one row, shown again whenever `key` changes. */
export type RowNotice = {
  rowId: number;
  text: string;
  key: number;
  /** Stays up for as long as it is passed, instead of a few seconds. */
  sticky?: boolean;
};

export const SessionRow = ({
  row,
  rowIndex,
  childRowIds,
  isSelected,
  completedSessions,
  activeSessionStarts,
  resolvedMarkerSec,
  visibleStart,
  visibleDuration,
  reassignOptions,
  onReassign,
  selectedBarStart,
  onSelectBar,
  notice,
  isSubSelected = false,
  showPunchOutHint = true,
  onEditBar,
  getEditBounds,
  highlightChildBars = false,
}: SessionRowProps) => {
  const rowRef = useRef<HTMLDivElement | null>(null);
  // === OLD: sessions preloaded from API rangeSessions ===
  // const snapshotRanges: { start: number; end: number }[] = [];
  // let currentIn: number | null = null;
  // for (const s of row.sessions) {
  //   if (s.type === "in") currentIn = toSeconds(s.timestamp);
  //   if (s.type === "out" && currentIn !== null) {
  //     snapshotRanges.push({ start: currentIn, end: toSeconds(s.timestamp) });
  //     currentIn = null;
  //   }
  // }
  // const frozen = [...snapshotRanges, ...(completedSessions[row.id] ?? [])];

  // === NEW: sessions created by dragging on the timeline ===
  const frozen = completedSessions[row.id] ?? [];
  const sessionStart = activeSessionStarts[row.id];

  // Dragging a selected bar's end: a live preview, saved once on release so
  // it's a single undo step. Limits: the row's other bars, a minimum length,
  // the marker for an open bar, and the outer bounds from getEditBounds.
  const [drag, setDrag] = useState<
    | (BarEdit & { originalStart: number; originalEnd?: number; side: BarSide })
    | null
  >(null);
  const dragRef = useRef(drag);
  const dragLimitsRef = useRef({ min: -Infinity, max: Infinity });

  const beginResize = (
    range: { start: number; end?: number },
    side: BarSide,
    e: MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const bounds = getEditBounds?.(row.id, range.start);
    const others = [
      ...frozen.filter((r) => r.start !== range.start),
      ...(sessionStart !== undefined && sessionStart !== range.start
        ? [{ start: sessionStart, end: Infinity }]
        : []),
    ];
    const barEnd = range.end ?? resolvedMarkerSec;
    const prevEnd = Math.max(
      -Infinity,
      ...others.filter((r) => r.end <= range.start).map((r) => r.end),
    );
    const nextStart = Math.min(
      Infinity,
      ...others.filter((r) => r.start >= barEnd).map((r) => r.start),
    );
    dragLimitsRef.current =
      side === "start"
        ? {
            min: Math.max(prevEnd, bounds?.min ?? -Infinity),
            max: barEnd - MIN_BAR_SEC,
          }
        : {
            min: range.start + MIN_BAR_SEC,
            max: Math.min(nextStart, bounds?.max ?? Infinity),
          };
    const next = {
      ...range,
      originalStart: range.start,
      originalEnd: range.end,
      side,
    };
    dragRef.current = next;
    setDrag(next);
  };

  const isDragging = drag !== null;
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const current = dragRef.current;
      const rect = rowRef.current?.getBoundingClientRect();
      if (!current || !rect || rect.width === 0) return;
      const raw =
        visibleStart + ((e.clientX - rect.left) / rect.width) * visibleDuration;
      const { min, max } = dragLimitsRef.current;
      const sec = Math.round(Math.max(min, Math.min(max, raw)));
      const next =
        current.side === "start"
          ? { ...current, start: sec }
          : { ...current, end: sec };
      dragRef.current = next;
      setDrag(next);
    };
    const handleMouseUp = () => {
      const current = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!current) return;
      const changed =
        current.start !== current.originalStart ||
        current.end !== current.originalEnd;
      if (changed) {
        onEditBar?.(row.id, current.originalStart, {
          start: current.start,
          end: current.end,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, visibleStart, visibleDuration, onEditBar, row.id]);

  // Bars as drawn: the one being dragged shows its preview bounds.
  const shownRange = (range: { start: number; end: number }) =>
    drag && drag.originalStart === range.start && drag.end !== undefined
      ? { start: drag.start, end: drag.end }
      : range;
  const shownOpenStart =
    drag && drag.originalStart === sessionStart && drag.end === undefined
      ? drag.start
      : sessionStart;

  const liveBar =
    shownOpenStart !== undefined && resolvedMarkerSec > shownOpenStart
      ? { start: shownOpenStart, end: resolvedMarkerSec }
      : null;
  const markerPct =
    ((resolvedMarkerSec - visibleStart) / visibleDuration) * 100;

  // Parent mirror of the sub-rows' sessions: one block per stretch covered by
  // any of them (overlaps merged), so they never pile up on each other.
  const childRanges = (childRowIds ?? []).flatMap((id) => {
    const start = activeSessionStarts[id];
    return [
      ...(completedSessions[id] ?? []),
      ...(start !== undefined && resolvedMarkerSec > start
        ? [{ start, end: resolvedMarkerSec }]
        : []),
    ];
  });
  const childBlocks: { start: number; end: number }[] = [];
  for (const range of [...childRanges].sort((a, b) => a.start - b.start)) {
    const last = childBlocks[childBlocks.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      childBlocks.push({ ...range });
    }
  }

  // A punch-out = the open session closed and a new frozen bar appeared (an
  // undone punch-in only removes the open session, so it doesn't count).
  const closedCount = frozen.length;
  const [prevSessions, setPrevSessions] = useState({
    open: sessionStart,
    closedCount,
  });
  const [punchedOutSec, setPunchedOutSec] = useState<number | null>(null);
  if (
    prevSessions.open !== sessionStart ||
    prevSessions.closedCount !== closedCount
  ) {
    if (
      prevSessions.open !== undefined &&
      sessionStart === undefined &&
      closedCount > prevSessions.closedCount
    ) {
      setPunchedOutSec(frozen[closedCount - 1].end);
    }
    setPrevSessions({ open: sessionStart, closedCount });
  }

  useEffect(() => {
    if (punchedOutSec === null) return;
    const t = setTimeout(() => setPunchedOutSec(null), PUNCHED_OUT_MESSAGE_MS);
    return () => clearTimeout(t);
  }, [punchedOutSec]);

  // A new notice (new key) shows at the marker for a few seconds.
  const [prevNoticeKey, setPrevNoticeKey] = useState(notice?.key);
  const [shownNoticeKey, setShownNoticeKey] = useState<number | null>(null);
  if (prevNoticeKey !== notice?.key) {
    setPrevNoticeKey(notice?.key);
    setShownNoticeKey(notice?.key ?? null);
  }

  useEffect(() => {
    if (shownNoticeKey === null) return;
    const t = setTimeout(() => setShownNoticeKey(null), NOTICE_MS);
    return () => clearTimeout(t);
  }, [shownNoticeKey]);

  const punchedOutPct =
    punchedOutSec !== null
      ? ((punchedOutSec - visibleStart) / visibleDuration) * 100
      : null;

  // Customer group sub-rows with an open session get a button at the marker to
  // move the group to another row (dot → arrow on hover → menu on click).
  const showReassign =
    row.kind === "event" &&
    sessionStart !== undefined &&
    onReassign !== undefined &&
    (reassignOptions?.length ?? 0) > 0;
  const [isReassignHovered, setIsReassignHovered] = useState(false);
  const [reassignAnchor, setReassignAnchor] = useState<HTMLElement | null>(
    null,
  );
  const isReassignActive =
    showReassign && (isReassignHovered || reassignAnchor !== null);
  const reassignLeftPx =
    REASSIGN_BUTTON_OFFSET_PX + (isReassignActive ? REASSIGN_HOVER_SHIFT_PX : 0);
  const hintLeft = showReassign
    ? `calc(${markerPct}% + ${reassignLeftPx + REASSIGN_BUTTON_PX + 6}px)`
    : `calc(${markerPct}% + 6px)`;

  return (
    <Box
      ref={rowRef}
      sx={{
        position: "absolute",
        top: rowIndex * ROW_HEIGHT,
        left: 0,
        right: 0,
        height: ROW_HEIGHT,
        bgcolor:
          isSelected || isSubSelected
            ? Colors.transparentVividOrange
            : "transparent",
      }}
    >
      {childBlocks.map((range, i) => {
        // The selected line's block under the marker reads as selected,
        // until ↑/↓ moves the selection into one of its sub-rows.
        const isLineBar =
          highlightChildBars &&
          resolvedMarkerSec >= range.start &&
          resolvedMarkerSec <= range.end;
        return (
          <SessionBar
            key={`child-block-${i}`}
            range={range}
            visibleStart={visibleStart}
            visibleDuration={visibleDuration}
            // One colour for now (pending design): the light orange of an
            // open customer, the vivid one when selected.
            color={isLineBar ? Colors.vividOrange : Colors.lightOrange}
            isSelected={isLineBar}
          />
        );
      })}
      {/* Punched-out bars are grey; the one still growing stays orange. */}
      {frozen.map((range, i) => (
        <SessionBar
          key={i}
          range={shownRange(range)}
          visibleStart={visibleStart}
          visibleDuration={visibleDuration}
          // A selected (editable) punched-out bar turns orange.
          color={
            selectedBarStart === range.start
              ? Colors.vividOrange
              : Colors.lightSteelGray
          }
          isSelected={selectedBarStart === range.start}
          onSelect={
            onSelectBar ? () => onSelectBar(row.id, range.start) : undefined
          }
          onResizeStart={
            onEditBar ? (side, e) => beginResize(range, side, e) : undefined
          }
        />
      ))}
      {liveBar && sessionStart !== undefined && (
        <SessionBar
          range={liveBar}
          visibleStart={visibleStart}
          visibleDuration={visibleDuration}
          color={Colors.vividOrange}
          // Keyed by its saved start, so dragging it keeps it selected.
          isSelected={selectedBarStart === sessionStart}
          onSelect={
            onSelectBar ? () => onSelectBar(row.id, sessionStart) : undefined
          }
          onResizeStart={
            onEditBar
              ? (side, e) => beginResize({ start: sessionStart }, side, e)
              : undefined
          }
          onlyStartResizable
        />
      )}
      {showReassign && (
        <Box
          component="button"
          type="button"
          aria-label="Change customer attendance"
          onMouseEnter={() => setIsReassignHovered(true)}
          onMouseLeave={() => setIsReassignHovered(false)}
          // Keep the grid's drag-to-pan from starting under the button.
          onMouseDown={(e: MouseEvent) => e.stopPropagation()}
          onClick={(e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            setReassignAnchor(e.currentTarget);
          }}
          sx={{
            position: "absolute",
            left: `calc(${markerPct}% + ${reassignLeftPx}px)`,
            top: "50%",
            transform: "translateY(-50%)",
            width: REASSIGN_BUTTON_PX,
            height: REASSIGN_BUTTON_PX,
            p: 0,
            border: "none",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            pointerEvents: "auto",
            zIndex: 4,
          }}
        >
          {isReassignActive ? (
            <Box
              sx={{
                width: REASSIGN_BUTTON_PX,
                height: REASSIGN_BUTTON_PX,
                borderRadius: "50%",
                bgcolor: Colors.vividOrange,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img src={assetUrl("arrow-narrow-right-02.svg")} alt="" />
            </Box>
          ) : (
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: Colors.coralPeach,
              }}
            />
          )}
        </Box>
      )}
      {showReassign && (
        <DropDownMenu
          anchorEl={reassignAnchor}
          open={reassignAnchor !== null}
          handleClose={() => setReassignAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          maxWidth="150px"
          options={reassignOptions?.map((option) => ({
            label: option.label,
            selected: option.id === row.parentCameraId,
            disabled: option.disabled && option.id !== row.parentCameraId,
            onClick: () => {
              if (option.disabled) return;
              setReassignAnchor(null);
              setIsReassignHovered(false);
              if (option.id !== row.parentCameraId) onReassign?.(row.id, option.id);
            },
          }))}
        />
      )}
      {sessionStart !== undefined && isReassignActive && (
        <Box
          component="span"
          sx={{ ...hintTextSx, left: hintLeft }}
        >
          Click to change customer attendance
        </Box>
      )}
      {showPunchOutHint && sessionStart !== undefined && !isReassignActive && (
        <Box
          component="span"
          sx={{ ...hintTextSx, left: hintLeft }}
        >
          Press{" "}
          <span
            style={{
              fontFamily: Fonts.main,
              fontWeight: 400,
              fontStyle: "normal",
              fontSize: 12,
              lineHeight: "18px",
              letterSpacing: 0,
              color: Colors.vividOrange,
            }}
          >
            o
          </span>{" "}
          to punch-out
        </Box>
      )}
      {sessionStart === undefined && punchedOutPct !== null && (
        <Box
          component="span"
          sx={{ ...hintTextSx, left: `calc(${punchedOutPct}% + 6px)` }}
        >
          Punched Out
        </Box>
      )}
      {notice && (notice.sticky || shownNoticeKey === notice.key) && (
        <Box
          component="span"
          sx={{
            ...hintTextSx,
            left: `calc(${markerPct}% + 6px)`,
            color: Colors.red,
          }}
        >
          {notice.text}
        </Box>
      )}
    </Box>
  );
};
