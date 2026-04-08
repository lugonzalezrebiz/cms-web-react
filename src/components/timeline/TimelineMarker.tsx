import { Box } from "@mui/system";
import {
  Colors,
  //, Fonts
} from "../../theme";
import { useEffect } from "react";
import type { FlatRow } from "./types";

interface TimelineMarkerProps {
  isCurrentVisible: boolean;
  currentLeft: number;
  selectedTracks: Set<number>;
  showPunchOut: boolean;
  iTrackId: number | null;
  flatRows: FlatRow[];
  listBodyRef: React.RefObject<HTMLDivElement | null>;
}

// const RULER_HEIGHT = 28;
// const ROW_HEIGHT = 44;

export const TimelineMarker = ({
  //isCurrentVisible,
  currentLeft,
  //selectedTracks,
  //showPunchOut,
  // iTrackId,
  // flatRows,
  listBodyRef,
}: TimelineMarkerProps) => {
  useEffect(() => {
    const el = listBodyRef.current;
    if (!el) return;
    const onScroll = () => {};
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [listBodyRef]);

  // const focusedNotBuilding = iTrackId !== null && !selectedTracks.has(iTrackId);
  // if (!isCurrentVisible) return null;

  // const rowIndex =
  //   iTrackId !== null ? flatRows.findIndex((r) => r.id === iTrackId) : -1;
  // const messageTop =
  //   rowIndex >= 0
  //     ? RULER_HEIGHT + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2 - 8 - scrollTop
  //     : 42;

  return (
    <>
      {/* Vertical line */}
      <Box
        sx={{
          position: "absolute",
          left: `${currentLeft}%`,
          top: 0,
          bottom: 0,
          width: "3px",
          background: Colors.vividOrange,
          transform: "translateX(-50%)",
          zIndex: 20,
        }}
      />

      {/* Top pill */}
      <Box
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
          pointerEvents: "none",
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

      {/* Punch-in hint */}
      {/* {focusedNotBuilding && !showPunchOut && (
        <Box
          sx={{
            position: "absolute",
            left: `${currentLeft + 1}%`,
            top: messageTop,
            color: Colors.dimGray,
            fontSize: 12,
            fontWeight: 400,
            zIndex: 1,
            pointerEvents: "none",
            lineHeight: 1.5,
            fontFamily: Fonts.main,
            bgcolor: "#ffffff94",
            padding: "0 4px",
            borderRadius: "8px",
          }}
        >
          Press <span style={{ color: Colors.vividOrange }}>i</span> to punch-in
        </Box>
      )} */}

      {/* Punch-out hint */}
      {/* {selectedTracks.size > 0 && !showPunchOut && !focusedNotBuilding && (
        <Box
          sx={{
            position: "absolute",
            left: `${currentLeft + 1}%`,
            top: messageTop,
            color: Colors.dimGray,
            fontSize: 12,
            fontWeight: 400,
            zIndex: 1,
            pointerEvents: "none",
            lineHeight: 1.5,
            fontFamily: Fonts.main,
            bgcolor: "#ffffff94",
            padding: "0 4px",
            borderRadius: "8px",
          }}
        >
          Press <span style={{ color: Colors.vividOrange }}>o</span> to
          punch-out
        </Box>
      )} */}

      {/* {showPunchOut && (
        <Box
          sx={{
            position: "absolute",
            left: `${currentLeft + 1}%`,
            top: messageTop,
            color: Colors.dimGray,
            fontSize: 12,
            fontWeight: 400,
            zIndex: 1,
            pointerEvents: "none",
            lineHeight: 1.5,
            fontFamily: Fonts.main,
          }}
        >
          Punch Out
        </Box>
      )} */}
    </>
  );
};
