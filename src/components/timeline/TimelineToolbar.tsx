import { Box } from "@mui/material";
import { Grid } from "@mui/system";
import { Colors, Fonts } from "../../theme";
import { secToTimeString } from "./hooks/useTimelineMarker";
import type { TimelineSnapshot } from "./types";

interface Props {
  snapshot: TimelineSnapshot;
  markerTimeSec: number | null;
  isPlaying: boolean;
  onStepMarker: (delta: number) => void;
  onTogglePlay: () => void;
  onPopOut?: () => void;
}

const TimelineToolbar = ({
  snapshot,
  markerTimeSec,
  isPlaying,
  onStepMarker,
  onTogglePlay,
  onPopOut,
}: Props) => {
  return (
    <Grid
      container
      display={"flex"}
      alignItems={"center"}
      sx={{
        background: Colors.white,
        borderBlockEnd: `1px solid ${Colors.lightGrayishBlue}`,
        display: "flex",
        alignItems: "center",
        fontSize: "14px",
        padding: "4px 16px 4px 8px",
        width: "100%",
      }}
    >
      <Grid
        size={{ md: 1.5, lg: 1.5, xl: 1 }}
        container
        spacing={"18px"}
        alignItems={"center"}
        justifyContent={"start"}
      >
        <Box>
          <img
            style={{ opacity: 0.5 }}
            src="../assets/layers-three-02.svg"
            alt=""
          />
        </Box>
        <Box onClick={() => {}}>
          <img src="../assets/user-plus-01.svg" alt="" />
        </Box>
        <Box
          position={"relative"}
          sx={{
            opacity: 0.5,
          }}
        >
          <img src="../assets/camera-02.svg" alt="" />
        </Box>
      </Grid>

      <Grid
        size={{ md: 2.5, lg: 2, xl: 1.5 }}
        alignItems={"center"}
        container
        spacing={"18px"}
        justifyContent={"start"}
      >
        <Box onClick={() => {}}>
          <img
            style={{ opacity: 0.5 }}
            src="../assets/reverse-left.svg"
            alt=""
          />
        </Box>
        <Box onClick={() => {}}>
          <img
            style={{ opacity: 0.5 }}
            src="../assets/reverse-right.svg"
            alt=""
          />
        </Box>
        <Box onClick={() => {}}>
          <img src="../assets/trash-02.svg" alt="" />
        </Box>
        <Box onClick={() => {}}>
          <img src="../assets/divider.svg" alt="" />
        </Box>
        <Box onClick={() => {}}>
          <img src="../assets/link-02.svg" alt="" />
        </Box>
      </Grid>

      <Grid
        size={{ md: 1, lg: 1, xl: 1.5 }}
        alignItems={"center"}
        container
        spacing={"8px"}
        justifyContent={"flex-start"}
      >
        <Box onClick={() => {}} ml={"18px"}>
          <img src="../assets/punch-in.svg" alt="" />
        </Box>
        <Box onClick={() => {}}>
          <img src="../assets/punch-out.svg" alt="" />
        </Box>
      </Grid>

      <Grid
        size={{ md: 2.5, lg: 3, xl: 4 }}
        container
        alignItems={"center"}
        justifyContent={"center"}
      >
        <Box mr={"4px"} onClick={() => onStepMarker(-3600)}>
          <img
            style={{ cursor: "pointer" }}
            src="../assets/align-left-01.svg"
            alt=""
          />
        </Box>
        <Box mr={"8px"} onClick={() => onStepMarker(-600)}>
          <img
            style={{ cursor: "pointer" }}
            src="../assets/chevron-left.svg"
            alt=""
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            background: "#fef7f6",
            padding: "0px 4px",
            borderRadius: "50px",
          }}
        >
          <Box mr={"8px"} onClick={() => {}}>
            <img src="../assets/clock.svg" alt="" />
          </Box>
          <Box
            sx={{
              textAlign: "center",
              color: Colors.vividOrange,
              fontFamily: Fonts.main,
              lineHeight: 1.43,
              m: "0 8px 2px 0",
            }}
          >
            {markerTimeSec !== null
              ? secToTimeString(markerTimeSec)
              : snapshot.timeline.times.start}
          </Box>
          <Box onClick={onTogglePlay} sx={{ cursor: "pointer" }}>
            <img
              src={isPlaying ? "../assets/pause.svg" : "../assets/play.svg"}
              alt={isPlaying ? "Pause" : "Play"}
            />
          </Box>
        </Box>
        <Box onClick={() => onStepMarker(+600)}>
          <img
            style={{ cursor: "pointer" }}
            src="../assets/chevron-right.svg"
            alt=""
          />
        </Box>
        <Box onClick={() => onStepMarker(+3600)}>
          <img
            style={{ cursor: "pointer" }}
            src="../assets/align-right-01.svg"
            alt=""
          />
        </Box>
      </Grid>

      <Grid
        size={{ md: 1.6, lg: 2, xl: 2 }}
        container
        alignItems={"center"}
        padding={"0 8px"}
      >
        <Grid
          size={{ md: 2, lg: 4 }}
          display={"flex"}
          justifyContent={"flex-end"}
        >
          <Box onClick={() => {}}>
            <img
              style={{ opacity: 0.5 }}
              src="../assets/dots-grid.svg"
              alt=""
            />
          </Box>
        </Grid>

        <Grid
          size={{ md: 10, lg: 8 }}
          display={"flex"}
          justifyContent={"flex-end"}
        >
          <Box
            sx={{
              width: "87px",
              height: "7px",
              display: "flex",
              justifyContent: "center",
              borderRadius: "8px",
              bgcolor: "#fef7f6",
              mb: "4px",
            }}
          >
            <Box
              sx={{
                width: "13px",
                height: "7px",
                borderRadius: "6px",
                bgcolor: Colors.vividOrange,
              }}
            />
          </Box>
        </Grid>
      </Grid>

      <Grid
        size={{ xs: 12, sm: 12, md: 2.9, lg: 2.5, xl: 2 }}
        container
        display={"flex"}
        alignItems={"center"}
        justifyContent={"space-between"}
        padding={"0 8px"}
      >
        <Grid display={"flex"} justifyContent={"flex-end"} size={4}>
          <Box onClick={() => {}}>
            <img
              style={{ opacity: 0.5 }}
              src="../assets/search-sm.svg"
              alt=""
            />
          </Box>
        </Grid>
        <Grid
          size={8}
          justifyContent={"flex-end"}
          container
          alignItems={"center"}
        >
          <Box
            sx={{
              width: "87px",
              height: "7px",
              display: "flex",
              justifyContent: "center",
              borderRadius: "8px",
              bgcolor: "#fef7f6",
              mb: "4px",
            }}
          >
            <Box
              sx={{
                width: "13px",
                height: "7px",
                borderRadius: "6px",
                bgcolor: Colors.vividOrange,
              }}
            />
          </Box>
          <Box
            ml={"18px"}
            onClick={onPopOut}
            sx={{ cursor: onPopOut ? "pointer" : "default" }}
          >
            <img
              style={{ opacity: 0.5 }}
              src="../assets/expand-06.svg"
              alt=""
            />
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default TimelineToolbar;
