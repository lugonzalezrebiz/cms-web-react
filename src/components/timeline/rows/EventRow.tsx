import { Box } from "@mui/system";
import { Colors } from "../../../theme";
import type React from "react";
import type { FlatRow, CameraEventPoint, SetResizing } from "../types";

const ROW_HEIGHT = 44;

interface EventPointBarProps {
  ep: CameraEventPoint;
  visibleStart: number;
  visibleEnd: number;
  visibleDuration: number;
  setResizing: SetResizing;
  isSelected: boolean;
  onSelect: () => void;
  onExtendStart: (epId: number, e: React.MouseEvent, minSec: number) => void;
}

const EventPointBar = ({
  ep,
  visibleStart,
  visibleEnd,
  visibleDuration,
  //setResizing,
  isSelected,
  onSelect,
  onExtendStart,
}: EventPointBarProps) => {
  const barStart = Math.max(ep.startSec, visibleStart);
  const barEnd = Math.min(ep.endSec, visibleEnd);
  const hasBar = barStart < barEnd;

  const dotAbsoluteInView =
    ep.timeSec >= visibleStart && ep.timeSec <= visibleEnd;
  if (!hasBar && !dotAbsoluteInView) return null;

  const leftPct = ((ep.startSec - visibleStart) / visibleDuration) * 100 + 0.28;
  const widthPct = ((ep.endSec - ep.startSec) / visibleDuration) * 100;
  const dotAbsolutePct = ((ep.timeSec - visibleStart) / visibleDuration) * 100;
  const endPct = ((ep.endSec - visibleStart) / visibleDuration) * 100;

  const activeColor = ep.reviewed ? Colors.vividOrange : Colors.blue;
  const idleColor = ep.reviewed ? Colors.lightOrange : Colors.lightSkyBlue;

  const diamondSx = (selected: boolean) => ({
    position: "absolute" as const,
    top: "50%",
    transform: "translate(-50%, -50%) rotate(45deg)",
    width: 14,
    height: 14,
    bgcolor: selected ? activeColor : idleColor,
    outline: selected
      ? `1.5px solid ${Colors.white}`
      : `1px solid ${Colors.white}`,
    boxShadow: selected ? `0 0 6px 2px ${activeColor}99` : "none",
    zIndex: selected ? 4 : 3,
    pointerEvents: "auto" as const,
    transition: "box-shadow 0.15s",
  });

  return (
    <>
      {/* Bar — only when there is actual width */}
      {hasBar && (
        <Box
          onClick={onSelect}
          sx={{
            position: "absolute",
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            top: "50%",
            transform: "translateY(-50%)",
            borderRadius: "8px",
            bgcolor:
              widthPct <= 1.3
                ? "transparent"
                : isSelected
                  ? `${activeColor}99`
                  : `${activeColor}55`,
            boxShadow: isSelected ? `0 0 8px 2px ${idleColor}99` : "none",
            height: 15,
            zIndex: isSelected ? 3 : 2,
            pointerEvents: "auto",
            cursor: "pointer",
            transition: "box-shadow 0.15s, background-color 0.15s",
          }}
        />
      )}
      {/* Origin diamond at timeSec — drag handle when no extension yet (RANGE only) */}
      <Box
        onClick={onSelect}
        onMouseDown={
          ep.mode === "RANGE" && ep.endSec <= ep.timeSec
            ? (e) => onExtendStart(ep.id, e, ep.timeSec)
            : undefined
        }
        sx={{
          ...diamondSx(isSelected),
          left: `${dotAbsolutePct}%`,
          cursor:
            ep.mode === "RANGE" && ep.endSec <= ep.timeSec
              ? "ew-resize"
              : "pointer",
        }}
      />
      {/* End diamond at endSec — visible and draggable only when RANGE bar has been extended */}
      {ep.mode === "RANGE" && ep.endSec > ep.timeSec && (
        <Box
          onClick={onSelect}
          onMouseDown={(e) => onExtendStart(ep.id, e, ep.timeSec)}
          sx={{
            ...diamondSx(isSelected),
            left: `${endPct}%`,
            cursor: "ew-resize",
          }}
        />
      )}
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
  onExtendStart: (epId: number, e: React.MouseEvent, minSec: number) => void;
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
  onExtendStart,
}: EventRowProps) => {
  const points = (
    row.kind === "activity"
      ? cameraEventPoints.filter((ep) => ep.label === row.name)
      : cameraEventPoints.filter(
          (ep) => ep.cameraId === row.parentCameraId && ep.label === row.name,
        )
  ).sort((a, b) => Number(a.reviewed) - Number(b.reviewed));

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
          onExtendStart={onExtendStart}
        />
      ))}
    </Box>
  );
};
