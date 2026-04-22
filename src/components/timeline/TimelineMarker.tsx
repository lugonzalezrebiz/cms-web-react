import { Box } from "@mui/system";
import { Colors } from "../../theme";
import { useEffect, useState } from "react";

interface TimelineMarkerProps {
  currentLeft: number;
  setMarkerSec: (sec: number) => void;
  visibleStart: number;
  visibleDuration: number;
  timelineStartSec: number;
  timelineEndSec: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export const TimelineMarker = ({
  currentLeft,
  setMarkerSec,
  visibleStart,
  visibleDuration,
  timelineStartSec,
  timelineEndSec,
  gridRef,
}: TimelineMarkerProps) => {
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);

  useEffect(() => {
    if (!isDraggingMarker) return;
    const handleMouseMove = (e: MouseEvent) => {
      const el = gridRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const newSec = visibleStart + relX * visibleDuration;
      setMarkerSec(
        Math.max(timelineStartSec, Math.min(timelineEndSec, newSec)),
      );
    };
    const handleMouseUp = () => setIsDraggingMarker(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDraggingMarker,
    visibleStart,
    visibleDuration,
    timelineStartSec,
    timelineEndSec,
    gridRef,
    setMarkerSec,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMarker(true);
  };
  return (
    <>
      {/* Vertical line */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          position: "absolute",
          left: `${currentLeft}%`,
          top: 0,
          bottom: 0,
          width: "11px",
          background: "transparent",
          transform: "translateX(-50%)",
          zIndex: 20,
          cursor: isDraggingMarker ? "grabbing" : "grab",
          display: "flex",
          justifyContent: "center",
          "&::after": {
            content: '""',
            display: "block",
            width: "3px",
            height: "100%",
            background: Colors.vividOrange,
          },
        }}
      />

      {/* Top pill */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          width: "18px",
          height: "7px",
          position: "absolute",
          left: `${currentLeft}%`,
          top: 22,
          transform: "translateX(-50%)",
          background: Colors.vividOrange,
          color: "white",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          zIndex: 21,
          cursor: isDraggingMarker ? "grabbing" : "grab",
          justifyContent: "space-between",
        }}
      >
        <img
          style={{ height: "7px", filter: "brightness(0) invert(1)" }}
          src="../assets/chevron-left.svg"
          alt=""
        />
        <img
          style={{ height: "7px", filter: "brightness(0) invert(1)" }}
          src="../assets/chevron-right.svg"
          alt=""
        />
      </Box>
    </>
  );
};
