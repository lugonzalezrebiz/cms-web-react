import { Box } from "@mui/system";
import { Colors, Fonts } from "../../theme";

interface TimelineTimeRulerProps {
  zoom: number;
  isDragging: boolean;
  panOffsetSec: number;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setDragStartX: React.Dispatch<React.SetStateAction<number | null>>;
  setDragStartOffset: React.Dispatch<React.SetStateAction<number>>;
  handleMouseMove: (e: React.MouseEvent) => void;
  timelineStartSec: number;
  timelineEndSec: number;
  visibleStart: number;
  visibleDuration: number;
  startSec: number;
  tickStepSec: number;
  isInActivityRange: (sec: number) => boolean;
}

const formatSec = (sec: number): string => {
  const h = Math.floor(sec / 3600) % 24;
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (s === 0 && m === 0) return `${h.toString().padStart(2, "0")}:00`;
  if (s === 0)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const TimelineTimeRuler = ({
  zoom,
  isDragging,
  panOffsetSec,
  setIsDragging,
  setDragStartX,
  setDragStartOffset,
  handleMouseMove,
  timelineStartSec,
  timelineEndSec,
  visibleStart,
  visibleDuration,
  startSec,
  tickStepSec,
  isInActivityRange,
}: TimelineTimeRulerProps) => {
  const visibleEnd = visibleStart + visibleDuration;
  const totalSec = 24 * 3600;

  const firstTick = Math.ceil(startSec / tickStepSec) * tickStepSec;
  const tickCount =
    Math.floor((startSec + totalSec - firstTick) / tickStepSec) + 1;

  return (
    <Box
      sx={{
        height: 28,
        position: "relative",
        borderBottom: `1px solid ${Colors.lightGrayishBlue}`,
        background: Colors.white,
        cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        userSelect: "none",
      }}
      onMouseDown={(e) => {
        if (zoom === 1) return;
        setIsDragging(true);
        setDragStartX(e.clientX);
        setDragStartOffset(panOffsetSec);
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      {/* Activity range bar */}
      {(() => {
        const start = Math.max(timelineStartSec, visibleStart);
        const end = Math.min(timelineEndSec, visibleEnd);
        if (end <= start) return null;
        const left = ((start - visibleStart) / visibleDuration) * 100;
        const width = ((end - start) / visibleDuration) * 100;
        return (
          <Box
            sx={{
              position: "absolute",
              left: `${left}%`,
              width: `${width}%`,
              top: 0,
              height: "2px",
              background: Colors.green,
              zIndex: 10,
            }}
          />
        );
      })()}

      {/* Second-based tick labels */}
      {Array.from({ length: tickCount }).map((_, i) => {
        const tickSec = firstTick + i * tickStepSec;
        if (tickSec < visibleStart || tickSec > visibleEnd) return null;
        const left = ((tickSec - visibleStart) / visibleDuration) * 100;
        return (
          <Box
            key={tickSec}
            sx={{
              position: "absolute",
              left: `${left}%`,
              top: 5,
              transform: "translateX(-50%)",
              fontSize: 14,
              fontFamily: Fonts.main,
              color: isInActivityRange(tickSec)
                ? Colors.vividOrange
                : Colors.mediumGray,
              fontWeight: 400,
            }}
          >
            {formatSec(tickSec)}
          </Box>
        );
      })}
    </Box>
  );
};
