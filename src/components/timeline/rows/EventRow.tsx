import { Box } from "@mui/system";
import { Colors } from "../../../theme";
import type React from "react";
import type { FlatRow, CameraEventPoint, SetResizing } from "../types";

const ROW_HEIGHT = 44;

// interface ResizeHandleProps {
//   epId: number;
//   side: "left" | "right";
//   setResizing: SetResizing;
// }

// const ResizeHandle = ({ epId, side, setResizing }: ResizeHandleProps) => {
//   return (
//     <Box
//       onMouseDown={(e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         setResizing({ id: epId, side });
//       }}
//       sx={{
//         position: "absolute",
//         [side]: 0,
//         top: 0,
//         bottom: 0,
//         width: 8,
//         cursor: "ew-resize",
//         bgcolor: Colors.green,
//         borderRadius: side === "left" ? "6px 0 0 6px" : "0 6px 6px 0",
//       }}
//     />
//   );
// };

interface EventPointBarProps {
  ep: CameraEventPoint;
  visibleStart: number;
  visibleEnd: number;
  visibleDuration: number;
  setResizing: SetResizing;
  isSelected: boolean;
  onSelect: () => void;
}

const EventPointBar = ({
  ep,
  visibleStart,
  visibleEnd,
  visibleDuration,
  //setResizing,
  isSelected,
  onSelect,
}: EventPointBarProps) => {
  const barStart = Math.max(ep.startSec, visibleStart);
  const barEnd = Math.min(ep.endSec, visibleEnd);
  if (barStart >= barEnd) return null;

  const leftPct = ((ep.startSec - visibleStart) / visibleDuration) * 100;
  const widthPct = ((ep.endSec - ep.startSec) / visibleDuration) * 100;
  const dotAbsolutePct = ((ep.timeSec - visibleStart) / visibleDuration) * 100;

  return (
    <>
      {/* Bar */}
      <Box
        onClick={onSelect}
        sx={{
          position: "absolute",
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          top: "50%",
          transform: "translateY(-50%)",
          borderRadius: "8px",
          background: "transparent",
          //border: `2px solid ${isSelected ? Colors.vividOrange : Colors.lightOrange}`,
          boxShadow: isSelected
            ? `0 0 8px 2px ${Colors.vividOrange}80`
            : "none",
          height: 15,
          zIndex: isSelected ? 3 : 2,
          pointerEvents: "auto",
          cursor: "pointer",
          transition: "box-shadow 0.15s, border-color 0.15s",
        }}
      />
      {/* Diamond — positioned in the row coordinate system (same as TimelineMarker) to avoid border-box offset */}
      <Box
        onClick={onSelect}
        sx={{
          position: "absolute",
          left: `${dotAbsolutePct}%`,
          top: "50%",
          transform: "translate(-50%, -50%) rotate(45deg)",
          width: 14,
          height: 14,
          bgcolor: isSelected ? Colors.vividOrange : Colors.lightOrange,
          outline: isSelected
            ? `1.5px solid ${Colors.white}`
            : `1px solid ${Colors.white}`,
          boxShadow: isSelected
            ? `0 0 6px 2px ${Colors.vividOrange}99`
            : "none",
          zIndex: isSelected ? 4 : 3,
          cursor: "pointer",
          pointerEvents: "auto",
          transition: "box-shadow 0.15s",
        }}
      />
    </>
  );
};

export interface EventRowProps {
  row: FlatRow;
  rowIndex: number;
  cameraEventPoints: CameraEventPoint[];
  visibleStart: number;
  visibleEnd: number;
  visibleDuration: number;
  setResizing: SetResizing;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedEventPointId: number | null;
  setSelectedEventPointId: React.Dispatch<React.SetStateAction<number | null>>;
}

export const EventRow = ({
  row,
  rowIndex,
  cameraEventPoints,
  visibleStart,
  visibleEnd,
  visibleDuration,
  setResizing,
  setMarkerSec,
  setITrackId,
  selectedEventPointId,
  setSelectedEventPointId,
}: EventRowProps) => {
  const points =
    row.kind === "activity"
      ? cameraEventPoints.filter((ep) => ep.label === row.name)
      : cameraEventPoints.filter(
          (ep) => ep.cameraId === row.parentCameraId && ep.label === row.name,
        );

  return (
    <Box
      sx={{
        position: "absolute",
        top: rowIndex * ROW_HEIGHT,
        left: 0,
        right: 0,
        height: ROW_HEIGHT,
        pointerEvents: "none",
      }}
    >
      {points.map((ep) => (
        <EventPointBar
          key={ep.id}
          ep={ep}
          visibleStart={visibleStart}
          visibleEnd={visibleEnd}
          visibleDuration={visibleDuration}
          setResizing={setResizing}
          isSelected={selectedEventPointId === ep.id}
          onSelect={() => {
            setMarkerSec(ep.timeSec);
            setSelectedEventPointId(ep.id);
            setITrackId(row.id);
          }}
        />
      ))}
    </Box>
  );
};
