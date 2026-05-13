import { Box } from "@mui/system";
import { Colors } from "../../../theme";
import { memo, useMemo } from "react";
import type React from "react";
import type { FlatRow, CameraEventPoint, SetResizing } from "../types";

const ROW_HEIGHT = 44;

type DragConfig = { target: "start" | "end"; minSec: number; maxSec: number };

interface EventPointBarProps {
  ep: CameraEventPoint;
  visibleStart: number;
  visibleEnd: number;
  visibleDuration: number;
  setResizing: SetResizing;
  isSelected: boolean;
  isEditing: boolean;
  totalSec: number;
  rowId: number;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedEventPointId: React.Dispatch<React.SetStateAction<number | null>>;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  onExtendStart: (
    epId: number,
    e: React.MouseEvent,
    config: DragConfig,
  ) => void;
}

const EventPointBar = memo(
  ({
    ep,
    visibleStart,
    visibleEnd,
    visibleDuration,
    //setResizing,
    isSelected,
    isEditing,
    totalSec,
    rowId,
    setMarkerSec,
    setSelectedEventPointId,
    setITrackId,
    onExtendStart,
  }: EventPointBarProps) => {
    const handleSelect = (e: React.MouseEvent) => {
      if (isEditing) e.stopPropagation();
      setMarkerSec(ep.timeSec);
      setSelectedEventPointId(ep.id);
      setITrackId(rowId);
    };

    const barStart = Math.max(ep.startSec, visibleStart);
    const barEnd = Math.min(ep.endSec, visibleEnd);
    const hasBar = barStart < barEnd;

    const dotAbsoluteInView =
      ep.timeSec >= visibleStart && ep.timeSec <= visibleEnd;
    if (!hasBar && !dotAbsoluteInView) return null;

    const leftPct =
      ((ep.startSec - visibleStart) / visibleDuration) * 100 + 0.28;
    const widthPct = ((ep.endSec - ep.startSec) / visibleDuration) * 100;
    const dotAbsolutePct =
      ((ep.timeSec - visibleStart) / visibleDuration) * 100;
    const endPct = ((ep.endSec - visibleStart) / visibleDuration) * 100;

    const activeColor = isEditing
      ? Colors.goldenAmber
      : ep.reviewed
        ? Colors.vividOrange
        : Colors.blue;
    const idleColor = isEditing
      ? Colors.creamYellow
      : ep.reviewed
        ? Colors.lightOrange
        : Colors.lightSkyBlue;

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

    const showEndDiamond =
      ep.mode === "RANGE" && (isEditing || ep.endSec > ep.timeSec);

    return (
      <>
        {/* Bar */}
        {hasBar && (
          <Box
            onClick={handleSelect}
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

        {/* Origin diamond at timeSec */}
        <Box
          onClick={handleSelect}
          onMouseDown={
            isEditing
              ? (e) =>
                  onExtendStart(ep.id, e, {
                    target: "start",
                    minSec: 0,
                    maxSec: ep.endSec,
                  })
              : ep.mode === "RANGE" && ep.endSec <= ep.timeSec
                ? (e) =>
                    onExtendStart(ep.id, e, {
                      target: "end",
                      minSec: ep.timeSec,
                      maxSec: totalSec,
                    })
                : undefined
          }
          sx={{
            ...diamondSx(isSelected),
            left: `${dotAbsolutePct}%`,
            cursor:
              isEditing || (ep.mode === "RANGE" && ep.endSec <= ep.timeSec)
                ? "ew-resize"
                : "pointer",
          }}
        />

        {/* End diamond at endSec */}
        {showEndDiamond && (
          <Box
            onClick={handleSelect}
            onMouseDown={(e) =>
              onExtendStart(ep.id, e, {
                target: "end",
                minSec: ep.timeSec,
                maxSec: totalSec,
              })
            }
            sx={{
              ...diamondSx(isSelected),
              left: `${endPct}%`,
              cursor: "ew-resize",
            }}
          />
        )}
      </>
    );
  },
);

export interface EventRowProps {
  row: FlatRow;
  rowIndex: number;
  cameraEventPoints: CameraEventPoint[];
  visibleStart: number;
  visibleEnd: number;
  visibleDuration: number;
  setResizing: SetResizing;
  totalSec: number;
  setMarkerSec: React.Dispatch<React.SetStateAction<number | null>>;
  setITrackId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedEventPointId: number | null;
  editingEventPointId: number | null;
  setSelectedEventPointId: React.Dispatch<React.SetStateAction<number | null>>;
  onExtendStart: (
    epId: number,
    e: React.MouseEvent,
    config: DragConfig,
  ) => void;
}

export const EventRow = memo(
  ({
    row,
    rowIndex,
    cameraEventPoints,
    visibleStart,
    visibleEnd,
    visibleDuration,
    setResizing,
    totalSec,
    setMarkerSec,
    setITrackId,
    selectedEventPointId,
    editingEventPointId,
    setSelectedEventPointId,
    onExtendStart,
  }: EventRowProps) => {
    const points = useMemo(
      () =>
        (row.kind === "activity"
          ? cameraEventPoints.filter((ep) => ep.label === row.name)
          : cameraEventPoints.filter(
              (ep) =>
                ep.cameraId === row.parentCameraId && ep.label === row.name,
            )
        ).sort((a, b) => Number(a.reviewed) - Number(b.reviewed)),
      [cameraEventPoints, row.kind, row.name, row.parentCameraId],
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
            isEditing={editingEventPointId === ep.id}
            totalSec={totalSec}
            rowId={row.id}
            setMarkerSec={setMarkerSec}
            setSelectedEventPointId={setSelectedEventPointId}
            setITrackId={setITrackId}
            onExtendStart={onExtendStart}
          />
        ))}
      </Box>
    );
  },
) as React.FC<EventRowProps>;
