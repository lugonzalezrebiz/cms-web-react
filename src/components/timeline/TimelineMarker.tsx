import { Box } from "@mui/system";
import { Colors, Fonts } from "../../theme";

interface TimelineMarkerProps {
  isCurrentVisible: boolean;
  currentLeft: number;
  selectedTracks: Set<number>;
  showPunchOut: boolean;
}

export const TimelineMarker = ({
  isCurrentVisible,
  currentLeft,
  selectedTracks,
  showPunchOut,
}: TimelineMarkerProps) => {
  if (!isCurrentVisible) return null;

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

      {/* Punch hint */}
      {selectedTracks.size > 0 && !showPunchOut && (
        <Box
          sx={{
            position: "absolute",
            left: `${currentLeft + 1}%`,
            top: 40,
            color: Colors.dimGray,
            fontSize: 12,
            fontWeight: 400,
            zIndex: 1,
            pointerEvents: "none",
            lineHeight: 1.5,
            fontFamily: Fonts.main,
          }}
        >
          Press <span style={{ color: Colors.vividOrange }}>o</span> to
          punch-out
        </Box>
      )}

      {showPunchOut && (
        <Box
          sx={{
            position: "absolute",
            left: `${currentLeft + 1}%`,
            top: 40,
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
      )}
    </>
  );
};
