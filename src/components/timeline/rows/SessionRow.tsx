import { Box } from "@mui/system";
import { useEffect, useState, type MouseEvent } from "react";
import { Colors, Fonts } from "../../../theme";
import { assetUrl } from "../../../utils";
import DropDownMenu from "../../DropDownMenu";

import type { FlatRow } from "../types";

const ROW_HEIGHT = 32.8;
const PUNCHED_OUT_MESSAGE_MS = 5000;
const REASSIGN_BUTTON_PX = 20;
// Gap between the marker and the attendance button (its dot sits 5px further in).
const REASSIGN_BUTTON_OFFSET_PX = 0;

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
}

const SessionBar = ({
  range,
  visibleStart,
  visibleDuration,
  color,
  isSelected = false,
  onSelect,
}: SessionBarProps) => {
  const left = ((range.start - visibleStart) / visibleDuration) * 100;
  const width = ((range.end - range.start) / visibleDuration) * 100;
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
    />
  );
};

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
}

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
}: SessionRowProps) => {
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
  const liveBar =
    sessionStart !== undefined && resolvedMarkerSec > sessionStart
      ? { start: sessionStart, end: resolvedMarkerSec }
      : null;
  const markerPct =
    ((resolvedMarkerSec - visibleStart) / visibleDuration) * 100;

  // Parent mirror of the sub-rows' sessions: growing ones in light orange,
  // punched-out ones grey like the sub-row itself.
  const childClosed = (childRowIds ?? []).flatMap(
    (id) => completedSessions[id] ?? [],
  );
  const childLive = (childRowIds ?? []).flatMap((id) => {
    const start = activeSessionStarts[id];
    return start !== undefined && resolvedMarkerSec > start
      ? [{ start, end: resolvedMarkerSec }]
      : [];
  });

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
  const hintLeft = showReassign
    ? `calc(${markerPct}% + ${REASSIGN_BUTTON_OFFSET_PX + REASSIGN_BUTTON_PX + 6}px)`
    : `calc(${markerPct}% + 6px)`;

  return (
    <Box
      sx={{
        position: "absolute",
        top: rowIndex * ROW_HEIGHT,
        left: 0,
        right: 0,
        height: ROW_HEIGHT,
        bgcolor: isSelected ? Colors.transparentVividOrange : "transparent",
      }}
    >
      {childClosed.map((range, i) => (
        <SessionBar
          key={`child-closed-${i}`}
          range={range}
          visibleStart={visibleStart}
          visibleDuration={visibleDuration}
          // A shade darker than the sub-row's own grey bar.
          color={Colors.softSlate}
        />
      ))}
      {childLive.map((range, i) => (
        <SessionBar
          key={`child-live-${i}`}
          range={range}
          visibleStart={visibleStart}
          visibleDuration={visibleDuration}
          color={Colors.lightOrange}
        />
      ))}
      {/* Punched-out bars are grey; the one still growing stays orange. */}
      {frozen.map((range, i) => (
        <SessionBar
          key={i}
          range={range}
          visibleStart={visibleStart}
          visibleDuration={visibleDuration}
          // A selected punched-out bar turns a darker grey so it stands out.
          color={
            selectedBarStart === range.start
              ? Colors.blueGray
              : Colors.lightSteelGray
          }
          isSelected={selectedBarStart === range.start}
          onSelect={
            onSelectBar ? () => onSelectBar(row.id, range.start) : undefined
          }
        />
      ))}
      {liveBar && (
        <SessionBar
          range={liveBar}
          visibleStart={visibleStart}
          visibleDuration={visibleDuration}
          color={Colors.vividOrange}
          isSelected={selectedBarStart === liveBar.start}
          onSelect={
            onSelectBar ? () => onSelectBar(row.id, liveBar.start) : undefined
          }
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
            left: `calc(${markerPct}% + ${REASSIGN_BUTTON_OFFSET_PX}px)`,
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
                bgcolor: Colors.lightOrange,
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
          maxWidth="280px"
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
      {sessionStart !== undefined && !isReassignActive && (
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
    </Box>
  );
};
