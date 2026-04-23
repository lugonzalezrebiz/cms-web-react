import { Box } from "@mui/system";
import { Colors } from "../../../theme";
import type { FlatRow, CameraEventPoint, SetResizing } from "../types";

const ROW_HEIGHT = 44;

interface ResizeHandleProps {
  epId: number;
  side: "left" | "right";
  setResizing: SetResizing;
}

const ResizeHandle = ({ epId, side, setResizing }: ResizeHandleProps) => {
  return (
    <Box
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing({ id: epId, side });
      }}
      sx={{
        position: "absolute",
        [side]: 0,
        top: 0,
        bottom: 0,
        width: 8,
        cursor: "ew-resize",
        bgcolor: Colors.green,
        borderRadius: side === "left" ? "6px 0 0 6px" : "0 6px 6px 0",
      }}
    />
  );
};

interface EventPointBarProps {
  ep: CameraEventPoint;
  visibleStart: number;
  visibleEnd: number;
  visibleDuration: number;
  setResizing: SetResizing;
}

const EventPointBar = ({
  ep,
  visibleStart,
  visibleEnd,
  visibleDuration,
  setResizing,
}: EventPointBarProps) => {
  const barStart = Math.max(ep.startSec, visibleStart);
  const barEnd = Math.min(ep.endSec, visibleEnd);
  if (barStart >= barEnd) return null;

  const leftPct = ((ep.startSec - visibleStart) / visibleDuration) * 100;
  const widthPct = ((ep.endSec - ep.startSec) / visibleDuration) * 100;
  const dotLeftPct =
    ((ep.timeSec - ep.startSec) / (ep.endSec - ep.startSec)) * 100;

  return (
    <Box
      sx={{
        position: "absolute",
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        top: "50%",
        transform: "translate(-50%)",
        borderRadius: "8px",
        background: `${Colors.green}33`,
        border: `2px solid ${Colors.green}`,
        height: 15,
        zIndex: 2,
        pointerEvents: "auto",
      }}
    >
      <ResizeHandle epId={ep.id} side="left" setResizing={setResizing} />
      <Box
        sx={{
          position: "absolute",
          left: `${dotLeftPct}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 7,
          height: 7,
          borderRadius: "50%",
          bgcolor: Colors.green,
          pointerEvents: "none",
        }}
      />
      <ResizeHandle epId={ep.id} side="right" setResizing={setResizing} />
    </Box>
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
}

export const EventRow = ({
  row,
  rowIndex,
  cameraEventPoints,
  visibleStart,
  visibleEnd,
  visibleDuration,
  setResizing,
}: EventRowProps) => {
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
      {cameraEventPoints
        .filter(
          (ep) => ep.cameraId === row.parentCameraId && ep.label === row.name,
        )
        .map((ep) => (
          <EventPointBar
            key={ep.id}
            ep={ep}
            visibleStart={visibleStart}
            visibleEnd={visibleEnd}
            visibleDuration={visibleDuration}
            setResizing={setResizing}
          />
        ))}
    </Box>
  );
};
