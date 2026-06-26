import { useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { Grid } from "@mui/system";
import { Colors, Fonts } from "../../theme";
import { secToTimeString, assetUrl } from "./utils";
import type { NavTab, TimelineSnapshot } from "./types";
import TimelineNavPopover from "./TimelineNavPopover";
import { usePopover } from "./hooks/usePopover";

interface Props {
  snapshot: TimelineSnapshot;
  markerTimeSec: number | null;
  isPlaying: boolean;
  onStepMarker: (delta: number) => void;
  onTogglePlay: () => void;
  onPopOut?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onDeleteEventPoint?: () => void;
  canDelete?: boolean;
  onGoPrevEventPoint?: () => void;
  onGoNextEventPoint?: () => void;
  hasPrevEventPoint?: boolean;
  hasNextEventPoint?: boolean;
  expanded?: boolean;
}

const SmallSize = ({
  snapshot,
  markerTimeSec,
  isPlaying,
  onStepMarker,
  onTogglePlay,
  onPopOut,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onDeleteEventPoint,
  canDelete = false,
  onGoPrevEventPoint,
  onGoNextEventPoint,
  hasPrevEventPoint = false,
  hasNextEventPoint = false,
  expanded = false,
}: Props) => {
  const [activeTab, setActiveTab] = useState<NavTab>("compliances");
  const navPopover = usePopover();

  return (
    <Grid
      container
      display={"flex"}
      alignItems={"center"}
      sx={{
        background: Colors.white,
        //borderBlockEnd: `1px solid ${Colors.lightGrayishBlue}`,
        display: "flex",
        alignItems: "center",
        fontSize: "14px",
        padding: "4px 8px 4px 8px",
        width: "100%",
      }}
    >
      <Grid size={2}>
        <Grid
          container
          spacing={"18px"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <TimelineNavPopover
            open={navPopover.open}
            anchorEl={navPopover.anchorEl}
            onClose={navPopover.handleClose}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <Box sx={{ cursor: "pointer" }} onClick={navPopover.handleOpen}>
            <img src={assetUrl("layers-three-02.svg")} alt="Layers" />
          </Box>
          {/* <Box onClick={() => {}}>
            <img src="../assets/user-plus-01.svg" alt="Add user" />
          </Box> */}
          {/* <Box
            position={"relative"}
            sx={{
              opacity: 0.5,
            }}
          >
            <img src="../assets/camera-02.svg" alt="Camera" />
          </Box> */}
        </Grid>

        <Grid
          alignItems={"center"}
          container
          spacing={"18px"}
          justifyContent={"center"}
        >
          <Box
            onClick={canUndo ? onUndo : undefined}
            sx={{ cursor: canUndo ? "pointer" : "default" }}
          >
            <img
              style={{ opacity: canUndo ? 1 : 0.5 }}
              src={assetUrl("reverse-left.svg")}
              alt="Undo"
            />
          </Box>
          <Box
            onClick={canRedo ? onRedo : undefined}
            sx={{ cursor: canRedo ? "pointer" : "default" }}
          >
            <img
              style={{ opacity: canRedo ? 1 : 0.5 }}
              src={assetUrl("reverse-right.svg")}
              alt="Redo"
            />
          </Box>
          <Box
            onClick={canDelete ? onDeleteEventPoint : undefined}
            sx={{ cursor: canDelete ? "pointer" : "default" }}
          >
            <img
              style={{ opacity: canDelete ? 1 : 0.5 }}
              src={assetUrl("trash-02.svg")}
              alt="Delete"
            />
          </Box>
          {/*
        <Box onClick={() => {}}>
          <img src="../assets/divider.svg" alt="Divider" />
        </Box>
         <Box onClick={() => {}}>
          <img src="../assets/link-02.svg" alt="Link" />
        </Box> */}
        </Grid>
      </Grid>

      {/* <Grid
        size={{ md: 1, lg: 1, xl: 1.5 }}
        alignItems={"center"}
        container
        spacing={"8px"}
        justifyContent={"flex-start"}
        bgcolor={"yellow"}
      >
         <Box onClick={() => {}} ml={"18px"}>
          <img src="../assets/punch-in.svg" alt="Punch in" />
        </Box>
        <Box onClick={() => {}}>
          <img src="../assets/punch-out.svg" alt="Punch out" />
        </Box> 
      </Grid> */}

      <Grid
        size={6.5}
        container
        alignItems={"center"}
        justifyContent={"center"}
      >
        <Box
          mr={"4px"}
          onClick={hasPrevEventPoint ? onGoPrevEventPoint : undefined}
          sx={{ cursor: hasPrevEventPoint ? "pointer" : "default" }}
        >
          <img
            style={{ opacity: hasPrevEventPoint ? 1 : 0.5 }}
            src={assetUrl("align-left-01.svg")}
            alt="Previous event point"
          />
        </Box>
        <Box mr={"8px"} onClick={() => onStepMarker(-600)}>
          <img
            style={{ cursor: "pointer" }}
            src={assetUrl("chevron-left.svg")}
            alt="Step backward"
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
            <img src={assetUrl("clock.svg")} alt="Clock" />
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
              src={isPlaying ? assetUrl("pause.svg") : assetUrl("play.svg")}
              alt={isPlaying ? "Pause" : "Play"}
            />
          </Box>
        </Box>
        <Box onClick={() => onStepMarker(+600)}>
          <img
            style={{ cursor: "pointer" }}
            src={assetUrl("chevron-right.svg")}
            alt="Step forward"
          />
        </Box>
        <Box
          onClick={hasNextEventPoint ? onGoNextEventPoint : undefined}
          sx={{ cursor: hasNextEventPoint ? "pointer" : "default" }}
        >
          <img
            style={{ opacity: hasNextEventPoint ? 1 : 0.5 }}
            src={assetUrl("align-right-01.svg")}
            alt="Next event point"
          />
        </Box>
      </Grid>

      <Grid size={3.5}>
        <Grid
          container
          alignItems={"center"}
          padding={"0 8px"}
          justifyContent={"space-between"}
        >
          <Grid display={"flex"} justifyContent={"flex-end"}>
            {/* <Box onClick={() => {}}>
              <img
                style={{ opacity: 0.5 }}
                src="../assets/dots-grid.svg"
                alt="Grid options"
              />
            </Box> */}
          </Grid>

          <Grid display={"flex"} justifyContent={"flex-end"}>
            {/* <Box
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
            </Box> */}
          </Grid>
        </Grid>

        <Grid
          container
          alignItems={"center"}
          justifyContent={"space-between"}
          padding={"0 8px"}
        >
          {/* <Box onClick={() => {}}>
            <img
              style={{ opacity: 0.5 }}
              src="../assets/search-sm.svg"
              alt="Search"
            />
          </Box> */}
          {/* <Box
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
          </Box> */}
          <Box ml={"18px"} onClick={onPopOut} sx={{ cursor: "pointer" }}>
            {!expanded ? (
              <img
                style={{ opacity: 0.5, cursor: "pointer" }}
                src={assetUrl("minimize.svg")}
                alt="Minimize"
              />
            ) : (
              <img
                style={{ opacity: 0.5 }}
                src={assetUrl("expand-06.svg")}
                alt="Expand"
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

const NormalSize = ({
  snapshot,
  markerTimeSec,
  isPlaying,
  onStepMarker,
  onTogglePlay,
  onPopOut,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onDeleteEventPoint,
  canDelete = false,
  onGoPrevEventPoint,
  onGoNextEventPoint,
  hasPrevEventPoint = false,
  hasNextEventPoint = false,
  expanded = false,
}: Props) => {
  const [activeTab, setActiveTab] = useState<NavTab>("compliances");
  const navPopover = usePopover();

  return (
    <Box display={"flex"} alignItems={"center"} bgcolor={Colors.white}>
      <Box
        sx={{
          cursor: "pointer",
          maxWidth: "232px",
          width: "100%",
          bgcolor: Colors.white,
          ml: "6px",
        }}
        onClick={navPopover.handleOpen}
      >
        <img src={assetUrl("layers-three-02.svg")} alt="Layers" />
      </Box>
      <TimelineNavPopover
        open={navPopover.open}
        anchorEl={navPopover.anchorEl}
        onClose={navPopover.handleClose}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <Grid
        container
        display={"flex"}
        alignItems={"center"}
        sx={{
          background: Colors.white,
          display: "flex",
          alignItems: "center",
          fontSize: "14px",
          padding: "0px 16px 0px 8px",
          width: "100%",
          height: "24px",
        }}
      >
        <Grid
          size={{ md: 4, lg: 4, xl: 4 }}
          alignItems={"center"}
          container
          spacing={"18px"}
          justifyContent={"start"}
          // bgcolor={"red"}
        >
          <Box
            onClick={canUndo ? onUndo : undefined}
            sx={{ display: "flex", cursor: canUndo ? "pointer" : "default" }}
          >
            <img
              style={{ opacity: canUndo ? 1 : 0.5 }}
              src={assetUrl("reverse-left.svg")}
              alt="Undo"
            />
          </Box>
          <Box
            onClick={canRedo ? onRedo : undefined}
            sx={{ display: "flex", cursor: canRedo ? "pointer" : "default" }}
          >
            <img
              style={{ opacity: canRedo ? 1 : 0.5 }}
              src={assetUrl("reverse-right.svg")}
              alt="Redo"
            />
          </Box>
          <Box
            onClick={canDelete ? onDeleteEventPoint : undefined}
            sx={{ display: "flex", cursor: canDelete ? "pointer" : "default" }}
          >
            <img
              style={{ opacity: canDelete ? 1 : 0.5 }}
              src={assetUrl("trash-02.svg")}
              alt="Delete"
            />
          </Box>
          {/*
        <Box onClick={() => {}}>
          <img src="../assets/divider.svg" alt="Divider" />
        </Box>
         <Box onClick={() => {}}>
          <img src="../assets/link-02.svg" alt="Link" />
        </Box> */}
        </Grid>

        <Grid
          size={{ md: 4, lg: 3, xl: 2 }}
          container
          alignItems={"center"}
          justifyContent={"center"}
          // bgcolor={"yellow"}
        >
          <Box
            mr={"4px"}
            onClick={hasPrevEventPoint ? onGoPrevEventPoint : undefined}
            sx={{
              display: "flex",
              cursor: hasPrevEventPoint ? "pointer" : "default",
            }}
          >
            <img
              style={{ opacity: hasPrevEventPoint ? 1 : 0.5 }}
              src={assetUrl("align-left-01.svg")}
              alt="Previous event point"
            />
          </Box>
          <Box
            sx={{ display: "flex" }}
            mr={"8px"}
            onClick={() => onStepMarker(-600)}
          >
            <img
              style={{ cursor: "pointer" }}
              src={assetUrl("chevron-left.svg")}
              alt="Step backward"
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              background: Colors.blushWhite,
              padding: "0px 4px",
              borderRadius: "50px",
              height: "20px",
            }}
          >
            <Box sx={{ display: "flex" }} mr={"8px"} onClick={() => {}}>
              <img src={assetUrl("clock.svg")} alt="Clock" />
            </Box>
            <Box
              sx={{
                textAlign: "center",
                color: Colors.vividOrange,
                fontFamily: Fonts.main,
                lineHeight: 1.43,
                m: "0 8px 0px 0",
              }}
            >
              {markerTimeSec !== null
                ? secToTimeString(markerTimeSec)
                : snapshot.timeline.times.start}
            </Box>
            <Box
              onClick={onTogglePlay}
              sx={{ display: "flex", cursor: "pointer" }}
            >
              <img
                src={isPlaying ? assetUrl("pause.svg") : assetUrl("play.svg")}
                alt={isPlaying ? "Pause" : "Play"}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex" }} onClick={() => onStepMarker(+600)}>
            <img
              style={{ cursor: "pointer" }}
              src={assetUrl("chevron-right.svg")}
              alt="Step forward"
            />
          </Box>
          <Box
            onClick={hasNextEventPoint ? onGoNextEventPoint : undefined}
            sx={{
              display: "flex",
              cursor: hasNextEventPoint ? "pointer" : "default",
            }}
          >
            <img
              style={{ opacity: hasNextEventPoint ? 1 : 0.5 }}
              src={assetUrl("align-right-01.svg")}
              alt="Next event point"
            />
          </Box>
        </Grid>

        <Grid
          size={{ md: 4, lg: 5, xl: 6 }}
          container
          display={"flex"}
          alignItems={"center"}
          justifyContent={"flex-end"}
          padding={"0 8px"}
          // bgcolor={"cadetblue"}
        >
          {/*<Grid display={"flex"} justifyContent={"flex-end"} size={4}>
           <Box onClick={() => {}}>
            <img
              style={{ opacity: 0.5 }}
              src="../assets/search-sm.svg"
              alt="Search"
            />
          </Box> 
        </Grid>*/}
          <Grid justifyContent={"flex-end"} container alignItems={"center"}>
            {/* <Box
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
          </Box> */}
            <Box
              ml={"18px"}
              onClick={onPopOut}
              sx={{ display: "flex", cursor: "pointer" }}
            >
              {!expanded ? (
                <img
                  style={{ opacity: 0.5 }}
                  src={assetUrl("minimize.svg")}
                  alt="Minimize"
                />
              ) : (
                <img
                  style={{ opacity: 0.5 }}
                  src={assetUrl("expand-06.svg")}
                  alt="Expand"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

const TimelineToolbar = (props: Props) => {
  const isSmall = useMediaQuery("(max-width: 900px)");
  return isSmall ? <SmallSize {...props} /> : <NormalSize {...props} />;
};

export default TimelineToolbar;

{
  /* <Grid
        size={{ md: 1, lg: 1, xl: 1 }}
        alignItems={"center"}
        container
        spacing={"8px"}
        justifyContent={"flex-start"}
        bgcolor={"blue"}
      >
        {/*
         <Box onClick={() => {}} ml={"18px"}>
          <img src="../assets/punch-in.svg" alt="Punch in" />
        </Box>
        <Box onClick={() => {}}>
          <img src="../assets/punch-out.svg" alt="Punch out" />
        </Box> 
        
      </Grid> */
}

{
  /* <Grid
        size={{ md: 1.6, lg: 2, xl: 2 }}
        container
        alignItems={"center"}
        padding={"0 8px"}
        bgcolor={"yellowgreen"}
      >
        <Grid
          size={{ md: 2, lg: 4 }}
          display={"flex"}
          justifyContent={"flex-end"}
        >
          {/* <Box onClick={() => {}}>
            <img
              style={{ opacity: 0.5 }}
              src="../assets/dots-grid.svg"
              alt="Grid options"
            />
          </Box>
        </Grid>

        <Grid
          size={{ md: 10, lg: 8 }}
          display={"flex"}
          justifyContent={"flex-end"}
        >
          {/* <Box
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
      </Grid> */
}
