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
  hourStep: number;
  isInActivityRange: (sec: number) => boolean;
}

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
  hourStep,
  isInActivityRange,
}: TimelineTimeRulerProps) => {
  const visibleEnd = visibleStart + visibleDuration;

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

      {/* Hour labels */}
      {Array.from({ length: 24 }).map((_, i) => {
        if (i % hourStep !== 0) return null;
        const hourTime = startSec + i * 3600;
        if (hourTime < visibleStart || hourTime > visibleEnd) return null;
        const left = ((hourTime - visibleStart) / visibleDuration) * 100;
        const hour = Math.floor((hourTime / 3600) % 24);
        return (
          <Box
            key={i}
            sx={{
              position: "absolute",
              left: `${left}%`,
              top: 5,
              transform: "translateX(-50%)",
              fontSize: 14,
              fontFamily: Fonts.main,
              color: isInActivityRange(hourTime)
                ? Colors.vividOrange
                : Colors.mediumGray,
              fontWeight: 400,
            }}
          >
            {`${hour.toString().padStart(2, "0")}:00`}
          </Box>
        );
      })}
    </Box>
  );
};
