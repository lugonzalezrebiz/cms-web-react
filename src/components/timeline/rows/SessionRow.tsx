import { Box } from "@mui/system";
import { Colors } from "../../../theme";

import type { FlatRow } from "../types";

const ROW_HEIGHT = 44;

// const toSeconds = (time: string) => {
//   const [h, m, s] = time.split(":").map(Number);
//   return h * 3600 + m * 60 + s;
// };

interface SessionBarProps {
  range: { start: number; end: number };
  visibleStart: number;
  visibleDuration: number;
}

const Diamond = ({ pct }: { pct: number }) => (
  <Box
    sx={{
      position: "absolute",
      left: `${pct}%`,
      top: "50%",
      transform: "translate(-50%, -50%) rotate(45deg)",
      width: 14,
      height: 14,
      bgcolor: Colors.lightOrange,
      outline: `1px solid ${Colors.white}`,
      zIndex: 2,
      pointerEvents: "none",
    }}
  />
);

const SessionBar = ({
  range,
  visibleStart,
  visibleDuration,
}: SessionBarProps) => {
  const left = ((range.start - visibleStart) / visibleDuration) * 100;
  const width = ((range.end - range.start) / visibleDuration) * 100;
  const rightPct = left + width;
  return (
    <>
      <Box
        sx={{
          position: "absolute",
          left: `${left}%`,
          width: `${width}%`,
          top: "50%",
          transform: "translateY(-50%)",
          height: 19,
          borderRadius: "8px",
          background: Colors.vividOrange,
        }}
      />
      <Diamond pct={left} />
      <Diamond pct={rightPct} />
    </>
  );
};

export interface SessionRowProps {
  row: FlatRow;
  rowIndex: number;
  isSelected: boolean;
  completedSessions: Record<number, { start: number; end: number }[]>;
  activeSessionStarts: Record<number, number>;
  resolvedMarkerSec: number;
  visibleStart: number;
  visibleDuration: number;
}

export const SessionRow = ({
  row,
  rowIndex,
  isSelected,
  completedSessions,
  activeSessionStarts,
  resolvedMarkerSec,
  visibleStart,
  visibleDuration,
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
  const allRanges = liveBar ? [...frozen, liveBar] : frozen;

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
      {allRanges.map((range, i) => (
        <SessionBar
          key={i}
          range={range}
          visibleStart={visibleStart}
          visibleDuration={visibleDuration}
        />
      ))}
    </Box>
  );
};
