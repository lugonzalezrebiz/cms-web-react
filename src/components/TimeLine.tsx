import { Box, Popover } from "@mui/material";
import { Colors, Fonts } from "../theme";
import { Grid } from "@mui/system";
import { useCallback, useEffect, useState } from "react";
import TimelineBody from "./TimelineBody";
import styled from "@emotion/styled";
import Tooltip from "./Tooltip";
import type { NavTab } from "./timeline/types";
import { NAV_TABS, CAMERA_OPTIONS, MOCK_SNAPSHOT } from "./timeline/constants";
import { usePopover } from "./timeline/hooks/usePopover";

const MenuCameraContainer = styled(Box)({
  display: "flex",
  padding: "8px",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
});

const TitleCameraMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: 1.5,
  color: Colors.lightBlack,
  textAlign: "left",
  display: "flex",
  justifyContent: "space-between",
  borderBottom: `1px solid ${Colors.silverGrey}`,
  padding: "4px 8px",
});

const TextCameraMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: 1.43,
  textAlign: "left",
});

const TimeLine = ({
  selectedTab,
  cameraActivities,
  drawerOpen,
  onTimeChange,
}: {
  selectedTab?: string;
  cameraActivities?: {
    id: number;
    cameraIndex: number;
    activityLabel: string;
  }[];
  drawerOpen?: boolean;
  onTimeChange?: (timestamp: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState<NavTab>("employees");
  const [selectedCameraOption, setSelectedCameraOption] = useState("Off");
  const [markerTimeSec, setMarkerTimeSec] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMarkerChange = useCallback((sec: number) => {
    setMarkerTimeSec(sec);
  }, []);

  useEffect(() => {
    if (markerTimeSec === null) return;
    onTimeChange?.(secToTimeString(markerTimeSec));
  }, [markerTimeSec, onTimeChange]);

  const secToTimeString = (sec: number) => {
    const h = Math.floor(sec / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const nav = usePopover();
  const cameraMenu = usePopover();

  return (
    <Box height={"100%"}>
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
          <Box onClick={nav.handleOpen}>
            <img src="../assets/layers-three-02.svg" alt="" />
          </Box>
          {selectedTab !== "2" && (
            <Box onClick={() => {}}>
              <img src="../assets/user-plus-01.svg" alt="" />
            </Box>
          )}
          <Box
            position={"relative"}
            onClick={selectedTab === "2" ? cameraMenu.handleOpen : undefined}
            sx={{
              opacity: selectedTab === "2" ? 1 : 0.3,
              cursor: selectedTab === "2" ? "pointer" : "default",
            }}
          >
            {selectedCameraOption !== "Off" && selectedTab === "2" && (
              <Box
                sx={{
                  width: "5px",
                  height: "5px",
                  border: `1px solid ${Colors.white}`,
                  bgcolor: Colors.green,
                  borderRadius: "100%",
                  position: "absolute",
                  right: -1,
                  top: -1,
                }}
              ></Box>
            )}
            {selectedCameraOption !== "Off" && selectedTab === "2" ? (
              <Tooltip
                withoutIcon
                textAlign="center"
                position={drawerOpen ? "top" : "right"}
                detail={
                  <Box>
                    <Box sx={{ color: "#959fa9", fontWeight: 400 }}>
                      Focused monitoring
                    </Box>
                    <Box sx={{ color: Colors.lightBlack, fontWeight: 700 }}>
                      {selectedCameraOption}
                    </Box>
                  </Box>
                }
              >
                <img src="../assets/camera-02.svg" alt="" />
              </Tooltip>
            ) : (
              <img src="../assets/camera-02.svg" alt="" />
            )}
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
            <img src="../assets/reverse-left.svg" alt="" />
          </Box>
          <Box onClick={() => {}}>
            <img src="../assets/reverse-right.svg" alt="" />
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
          <Box mr={"4px"} onClick={() => {}}>
            <img src="../assets/align-left-01.svg" alt="" />
          </Box>
          <Box mr={"8px"} onClick={() => {}}>
            <img src="../assets/chevron-left.svg" alt="" />
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
                : MOCK_SNAPSHOT.timeline.times.start}
            </Box>
            <Box onClick={() => setIsPlaying((p) => !p)} sx={{ cursor: "pointer" }}>
              <img
                src={isPlaying ? "../assets/pause.svg" : "../assets/play.svg"}
                alt={isPlaying ? "Pause" : "Play"}
              />
            </Box>
          </Box>
          <Box onClick={() => {}}>
            <img src="../assets/chevron-right.svg" alt="" />
          </Box>
          <Box onClick={() => {}}>
            <img src="../assets/align-right-01.svg" alt="" />
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
              <img src="../assets/dots-grid.svg" alt="" />
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
              ></Box>
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
              <img src="../assets/search-sm.svg" alt="" />
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
              ></Box>
            </Box>
            <Box ml={"18px"} onClick={() => {}}>
              <img src="../assets/expand-06.svg" alt="" />
            </Box>
          </Grid>
        </Grid>
      </Grid>

      <Popover
        open={nav.open}
        onClose={nav.handleClose}
        anchorEl={nav.anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              background: Colors.white,
              borderRadius: "18px",
              p: "8px",
              boxShadow: "none",
              marginTop: "-10px",
              marginLeft: drawerOpen ? "0" : "-8px",
            },
          },
        }}
      >
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            padding: "0.25em",
            margin: 0,
            display: "flex",
            gap: "8px",
          }}
        >
          {NAV_TABS.map(({ id, label, iconClass }) => {
            const isSelected = id === activeTab;
            return (
              <Box
                component="li"
                key={id}
                sx={{ flex: 1 }}
                onClick={() => {
                  setActiveTab(id);
                  nav.handleClose();
                }}
              >
                <Box
                  sx={{
                    fontFamily: Fonts.main,
                    display: "flex",
                    boxShadow: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
                    flexDirection: "column",
                    alignItems: "center",
                    borderRadius: "4px",
                    cursor: "pointer",
                    padding: "8px",
                    backgroundColor: isSelected
                      ? Colors.vividOrange
                      : Colors.white,
                    color: isSelected ? Colors.white : "inherit",
                    "&:hover": {
                      backgroundColor: isSelected
                        ? Colors.vividOrange
                        : Colors.lightGrayishBlue,
                    },
                    "& img": {
                      mb: "7px",
                      filter: isSelected ? "brightness(0) invert(1)" : "none",
                    },
                    "&.selected": {
                      backgroundColor: Colors.vividOrange,
                      color: Colors.white,
                      "& img": {
                        filter: "brightness(0) invert(1)",
                      },
                    },
                    "& span": {
                      height: "40px",
                      display: "flex",
                      fontSize: "14px",
                      fontWeight: "normal",
                      textAlign: "center",
                      lineHeight: 1.43,
                      fontFamily: Fonts.main,
                      alignItems: "center",
                    },
                  }}
                  onClick={() => {}}
                >
                  <img src={`../assets/${iconClass}.svg`} alt="" />
                  <span>{label}</span>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Popover>

      <Popover
        open={cameraMenu.open}
        onClose={cameraMenu.handleClose}
        anchorEl={cameraMenu.anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              background: Colors.white,
              width: "100%",
              maxWidth: "199px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "8px",
              boxShadow: " 0 2px 10px 0 rgba(0, 0, 0, 0.16)",
              borderRadius: "8px",
              marginTop: "-2px",
              marginLeft: drawerOpen ? "-5px" : "-8px",
            },
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
          }}
        >
          <TitleCameraMenu>
            Focused monitoring
            <img src="../assets/plus-1.svg" alt="" />
          </TitleCameraMenu>
          {CAMERA_OPTIONS.map((option) => {
            const isSelected = selectedCameraOption === option;
            return (
              <MenuCameraContainer
                key={option}
                onClick={() => {
                  setSelectedCameraOption(option);
                  cameraMenu.handleClose();
                }}
                sx={{
                  cursor: "pointer",
                  backgroundColor: isSelected
                    ? Colors.vividOrange
                    : "transparent",
                  "&:hover": {
                    backgroundColor: isSelected
                      ? Colors.vividOrange
                      : Colors.lightPeach,
                  },
                }}
              >
                <TextCameraMenu
                  style={{
                    color: isSelected ? Colors.white : Colors.lightBlack,
                    fontWeight: isSelected ? 500 : 400,
                  }}
                >
                  {option}
                </TextCameraMenu>
                {isSelected && <img src="/assets/check.svg" alt="selected" />}
              </MenuCameraContainer>
            );
          })}
        </Box>
      </Popover>

      <TimelineBody
        snapshot={MOCK_SNAPSHOT}
        activeTab={activeTab}
        selectedTab={selectedTab}
        cameraActivities={cameraActivities}
        onMarkerChange={handleMarkerChange}
        onPlayingChange={setIsPlaying}
      />
    </Box>
  );
};

export default TimeLine;
