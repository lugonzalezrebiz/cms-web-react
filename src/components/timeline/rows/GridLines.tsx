import { Box } from "@mui/system";
import { Colors } from "../../../theme";

interface GridLineProps {
  tickTime: number;
  visibleStart: number;
  visibleEnd: number;
  visibleDuration: number;
}

const GridLine = ({
  tickTime,
  visibleStart,
  visibleEnd,
  visibleDuration,
}: GridLineProps) => {
  if (tickTime < visibleStart || tickTime > visibleEnd) return null;
  const left = ((tickTime - visibleStart) / visibleDuration) * 100;
  return (
    <Box
      sx={{
        position: "absolute",
        left: `${left}%`,
        top: 0,
        bottom: 0,
        width: "1px",
        background: Colors.paleGray,
      }}
    />
  );
};

export interface GridLinesProps {
  totalSec: number;
  tickStepSec: number;
  startSec: number;
  visibleStart: number;
  visibleEnd: number;
  visibleDuration: number;
}

export const GridLines = ({
  totalSec,
  tickStepSec,
  startSec,
  visibleStart,
  visibleEnd,
  visibleDuration,
}: GridLinesProps) => {
  return (
    <Box>
      {Array.from({ length: Math.floor(totalSec / tickStepSec) + 1 }).map(
        (_, i) => (
          <GridLine
            key={startSec + i * tickStepSec}
            tickTime={startSec + i * tickStepSec}
            visibleStart={visibleStart}
            visibleEnd={visibleEnd}
            visibleDuration={visibleDuration}
          />
        ),
      )}
    </Box>
  );
};
