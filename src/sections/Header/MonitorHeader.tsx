import { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../theme";
import HeaderInfoMenu, {
  type HeaderInfo,
} from "../../components/HeaderInfoMenu";
import useAssignments from "../../hooks/useAssignments";
import KeyboardMenu, {
  type KeyboardMenuData,
} from "../../components/KeyboardMenu";
import UserPanel from "../../components/UserPanel";
import Divider from "../../components/Divider";
import Fix from "../../components/Fix";
import usePopover from "./hooks/usePopover";
import useMonitorParams from "./hooks/useMonitorParams";
import useNavigateWithQuery from "../../hooks/useNavigate";
import { useMonitorState, useCameraGroup } from "../../contexts/MonitorContext";
import Button from "../../components/Button";
import ToggleButton from "../../components/ToggleButton";
import useTrackerOptions from "./hooks/useTrackerOptions";
import useCameraGroups from "../../hooks/useCameraGroups";

const KEYBOARD_SHORTCUTS: KeyboardMenuData = {
  title: "Keyboard shortcuts",
  items: [
    {
      keys: [{ type: "img", src: "../assets/arrow-narrow-left.svg" }],
      label: "Move marker back 3 min",
    },
    {
      keys: [{ type: "img", src: "../assets/arrow-narrow-right.svg" }],
      label: "Move marker forward 3 min",
    },
    {
      keys: [
        { type: "text", label: "Ctrl", fontSize: "14px" },
        { type: "img", src: "../assets/arrow-narrow-left.svg" },
      ],
      label: "Previous event point",
    },
    {
      keys: [
        { type: "text", label: "Ctrl", fontSize: "14px" },
        { type: "img", src: "../assets/arrow-narrow-right.svg" },
      ],
      label: "Next event point",
    },
    {
      keys: [
        { type: "text", label: "Alt", fontSize: "12px" },
        { type: "img", src: "../assets/arrow-narrow-left.svg" },
      ],
      label: "Go back",
    },
    {
      keys: [
        { type: "text", label: "Shift", fontSize: "12px" },
        { type: "text", label: "G", fontSize: "16px" },
      ],
      label: "Go to specific time",
    },
    {
      keys: [{ type: "text", label: "H", fontSize: "16px" }],
      label: "Move to start",
    },
    {
      keys: [{ type: "text", label: "DEL", fontSize: "12px" }],
      label: "Delete event point under marker",
    },
    {
      keys: [{ type: "text", label: "Space", fontSize: "12px" }],
      label: "Play / Pause",
    },
    {
      keys: [{ type: "text", label: "+", fontSize: "16px" }],
      label: "Zoom in",
    },
    {
      keys: [{ type: "text", label: "-", fontSize: "16px" }],
      label: "Zoom out",
    },
  ],
};

const StyledContainer = styled("div")({
  display: "flex",
  padding: "0.5em 1em 0.5em 1em",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
});

const StyledTitle = styled("p")({
  margin: 0,
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: 1.5,
  color: Colors.lightBlack,
  fontFamily: Fonts.main,
});

const StyledSubTitle = styled("p")({
  margin: 0,
  fontSize: "12px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.vividOrange,
  fontFamily: Fonts.main,
});

const StyledImg = styled("img")({
  margin: "0 8px",
  cursor: "pointer",
});

const MonitorHeader = ({
  toggleDrawer,
  withIconMenu = true,
  allowGoBack = false,
}: {
  toggleDrawer: () => void;
  withIconMenu?: boolean;
  allowGoBack?: boolean;
}) => {
  const [scrolled, setScrolled] = useState(false);
  const menuHeader = usePopover();
  const keyboardMenu = usePopover();
  const userPanelHeader = usePopover();
  const navigate = useNavigateWithQuery();
  const goBack = () => navigate(-1);
  const { companyLabel, storeLabel, formattedDate, timeRange, companyID, locationID, monitoringID } =
    useMonitorParams();
  const { assignments } = useAssignments(companyID, locationID);
  const assignment = assignments.find((a) => a.monitoringID === monitoringID) ?? null;
  const headerInfo: HeaderInfo | undefined = assignment
    ? {
        title: assignment.date,
        state: assignment.state,
        subTitle: {
          store: `${assignment.store} (${assignment.location})`,
          user: String(assignment.userID),
        },
        items: assignment.items,
        commentsTex: assignment.commentsTex,
      }
    : undefined;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { handleDone, showFinalizeButton } = useMonitorState();
  const { cameraGroup, setCameraGroup, trackerOption, setTrackerOption } =
    useCameraGroup();
  const { cameraGroups: cameraGroupsBase } = useCameraGroups();
  const { trackerOptions } = useTrackerOptions();
  const cameraGroups = [
    { value: "0", title: "All" },
    ...cameraGroupsBase,
    {
      value: "tracker",
      title: "Tracker",
      options: trackerOptions,
    },
  ];

  return (
    <>
      <Fix scrolled={scrolled}>
        <StyledContainer>
          {withIconMenu && (
            <IconButton
              edge="start"
              sx={{ color: Colors.main }}
              onClick={toggleDrawer}
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
          )}
          {allowGoBack && (
            <IconButton
              sx={{ color: Colors.main }}
              onClick={goBack}
              aria-label="go back"
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          )}

          <Box
            display={"flex"}
            alignItems="center"
            justifyContent={"space-between"}
            width={"100%"}
          >
            <Box
              onClick={menuHeader.handleOpen}
              sx={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                cursor: "pointer",
              }}
            >
              <StyledTitle>
                Store: {storeLabel} ({companyLabel})
              </StyledTitle>
              <StyledSubTitle>
                {formattedDate} / {timeRange} / Events
              </StyledSubTitle>
            </Box>

            <Box mr={"80px"}>
              <ToggleButton
                value={cameraGroup}
                setValue={setCameraGroup}
                label="Camera Groups"
                groups={cameraGroups}
                selectValue={trackerOption}
                setSelectValue={setTrackerOption}
              />
            </Box>

            <Box display={"flex"} alignItems="center" gap={1}>
              <StyledImg
                onClick={keyboardMenu.handleOpen}
                src="../assets/keyboard-02.svg"
                alt=""
              />
              <StyledImg
                onClick={userPanelHeader.handleOpen}
                src="../assets/user-circle.svg"
                alt=""
              />

              <Box>
                <Button onClick={handleDone} disabled={!showFinalizeButton}>
                  Done
                </Button>
              </Box>
            </Box>
          </Box>
        </StyledContainer>

        <HeaderInfoMenu
          anchorEl={menuHeader.anchorEl}
          handleClose={menuHeader.handleClose}
          open={menuHeader.open}
          info={headerInfo}
        />

        <KeyboardMenu
          anchorEl={keyboardMenu.anchorEl}
          open={keyboardMenu.open}
          handleClose={keyboardMenu.handleClose}
          data={KEYBOARD_SHORTCUTS}
        />

        <UserPanel
          anchorEl={userPanelHeader.anchorEl}
          handleClose={userPanelHeader.handleClose}
          open={userPanelHeader.open}
        />
        <Divider marginBottom="0" />
      </Fix>
    </>
  );
};

export default MonitorHeader;
