import { Box } from "@mui/system";
import { Colors, Fonts } from "../../theme";
import type { FlatRow } from "./types";

interface TimelineRowListProps {
  flatRows: FlatRow[];
  selectedTracks: Set<number>;
  activeSessionStarts: Record<number, number>;
  isTunnel: boolean;
  headerLabel: string;
  listBodyRef: React.RefObject<HTMLDivElement | null>;
  rowsScrollRef: React.RefObject<HTMLDivElement | null>;
  setSelectedTracks: React.Dispatch<React.SetStateAction<Set<number>>>;
  setActiveSessionStarts: React.Dispatch<
    React.SetStateAction<Record<number, number>>
  >;
  setCompletedSessions: React.Dispatch<
    React.SetStateAction<Record<number, { start: number; end: number }[]>>
  >;
  markerSec: number | null;
  timelineStartSec: number;
}

export const TimelineRowList = ({
  flatRows,
  selectedTracks,
  activeSessionStarts,
  isTunnel,
  headerLabel,
  listBodyRef,
  rowsScrollRef,
  setSelectedTracks,
  setActiveSessionStarts,
  setCompletedSessions,
  markerSec,
  timelineStartSec,
}: TimelineRowListProps) => {
  return (
    <Box
      sx={{
        minWidth: 130,
        maxWidth: 220,
        background: Colors.white,
        borderRight: `1px solid ${Colors.lightGrayishBlue}`,
        display: "flex",
        flexDirection: "column",
        zIndex: 1,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${Colors.lightGrayishBlue}`,
          height: "28px",
          padding: "0 4px 0 8px",
        }}
      >
        <p
          style={{
            textTransform: "capitalize",
            fontFamily: Fonts.main,
            fontSize: 12,
            color: Colors.lightBlack,
            lineHeight: 1.5,
            margin: 0,
            fontWeight: 700,
          }}
        >
          {headerLabel}
        </p>
        <Box sx={{ cursor: "pointer" }}>
          <img src="../assets/plus-1.svg" alt="" />
        </Box>
      </Box>

      {/* List */}
      <Box
        ref={listBodyRef}
        onScroll={() => {
          if (rowsScrollRef.current && listBodyRef.current) {
            rowsScrollRef.current.scrollTop = listBodyRef.current.scrollTop;
          }
        }}
        sx={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {flatRows.map((row) => {
          const isSelected = selectedTracks.has(row.id);
          const isActivitySubRow = isTunnel && row.kind === "activity";
          const isCameraInTunnel = isTunnel && row.kind === "camera";

          const childSelected =
            isCameraInTunnel &&
            flatRows.some(
              (r) => r.parentCameraId === row.id && selectedTracks.has(r.id),
            );

          const handleClick = isCameraInTunnel
            ? undefined
            : () => {
                const currentMarker = markerSec ?? timelineStartSec;
                if (selectedTracks.has(row.id)) {
                  const sessionStart = activeSessionStarts[row.id];
                  if (
                    sessionStart !== undefined &&
                    currentMarker > sessionStart
                  ) {
                    setCompletedSessions((prev) => ({
                      ...prev,
                      [row.id]: [
                        ...(prev[row.id] ?? []),
                        { start: sessionStart, end: currentMarker },
                      ],
                    }));
                  }
                  setSelectedTracks((prev) => {
                    const next = new Set(prev);
                    next.delete(row.id);
                    return next;
                  });
                  setActiveSessionStarts((prev) => {
                    const next = { ...prev };
                    delete next[row.id];
                    return next;
                  });
                } else {
                  setSelectedTracks((prev) => {
                    const next = new Set(prev);
                    next.add(row.id);
                    return next;
                  });
                  setActiveSessionStarts((prev) => ({
                    ...prev,
                    [row.id]: currentMarker,
                  }));
                }
              };

          return (
            <Box
              key={row.id}
              onClick={handleClick}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: isActivitySubRow ? 0 : 1.5,
                pl: isActivitySubRow ? "50px" : "8px",
                pr: "8px",
                py: "6px",
                cursor: isCameraInTunnel ? "default" : "pointer",
                fontFamily: Fonts.main,
                fontSize: 14,
                height: "32px",
                lineHeight: 1.43,
                fontWeight: 400,
                backgroundColor: isCameraInTunnel
                  ? childSelected
                    ? Colors.vividOrange
                    : "transparent"
                  : isActivitySubRow
                    ? isSelected
                      ? Colors.blushWhite
                      : "transparent"
                    : isSelected
                      ? Colors.vividOrange
                      : "transparent",
                color:
                  isCameraInTunnel && childSelected
                    ? Colors.white
                    : isSelected
                      ? Colors.lightBlack
                      : Colors.lightBlack,
                transition: "all 0.15s ease",
                "&:hover": {
                  backgroundColor: isCameraInTunnel
                    ? childSelected
                      ? Colors.vividOrange
                      : "transparent"
                    : isActivitySubRow
                      ? isSelected
                        ? Colors.blushWhite
                        : Colors.white
                      : isSelected
                        ? Colors.vividOrange
                        : Colors.white,
                },
              }}
            >
              {!isActivitySubRow && (
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor:
                      (isCameraInTunnel && childSelected) || isSelected
                        ? Colors.white
                        : Colors.vividOrange,
                    color:
                      (isCameraInTunnel && childSelected) || isSelected
                        ? Colors.vividOrange
                        : Colors.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight:
                      (isCameraInTunnel && childSelected) || isSelected
                        ? 700
                        : 400,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {row.cameraNumber}
                </Box>
              )}
              {row.name}
            </Box>
          );
        })}
        {flatRows.filter((r) => r.kind === "camera").length === 0 && (
          <Box
            sx={{
              width: "129px",
              height: "54px",
              m: "25px auto",
              fontFamily: Fonts.main,
              fontSize: 12,
              color: Colors.dimGray,
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            Press <span style={{ color: Colors.vividOrange }}>+</span> on your
            keyboard to add a new employee
          </Box>
        )}
      </Box>
    </Box>
  );
};
