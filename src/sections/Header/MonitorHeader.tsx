import { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../theme";
import HeaderInfoMenu from "../../components/HeaderInfoMenu";
import KeyboardMenu, {
  type KeyboardMenuData,
} from "../../components/KeyboardMenu";
import UserPanel from "../../components/UserPanel";
import Divider from "../../components/Divider";
import Fix from "../../components/Fix";
import usePopover from "./hooks/usePopover";
import useMonitorParams from "./hooks/useMonitorParams";
import useNavigateWithQuery from "../../hooks/useNavigate";

const KEYBOARD_SHORTCUTS: KeyboardMenuData = {
  title: "Keyboard shortcuts",
  items: [
    {
      keys: [{ type: "img", src: "../assets/arrow-narrow-left.svg" }],
      label: "Move back in time",
    },
    {
      keys: [{ type: "img", src: "../assets/arrow-narrow-right.svg" }],
      label: "Move forward in time",
    },
    {
      keys: [
        { type: "text", label: "Ctrl", fontSize: "14px" },
        { type: "img", src: "../assets/arrow-narrow-left.svg" },
      ],
      label: "Back to person",
    },
    {
      keys: [
        { type: "text", label: "Ctrl", fontSize: "14px" },
        { type: "img", src: "../assets/arrow-narrow-right.svg" },
      ],
      label: "Forward to person",
    },
    {
      keys: [
        { type: "text", label: "Shift", fontSize: "12px" },
        { type: "text", label: "G", fontSize: "16px" },
      ],
      label: "Move to specific time",
    },
    {
      keys: [{ type: "text", label: "Home", fontSize: "12px" }],
      label: "Move to first frame",
    },
    {
      keys: [{ type: "text", label: "Q", fontSize: "16px" }],
      label: "Employee/Flag Mode",
    },
    {
      keys: [{ type: "text", label: "DEL", fontSize: "12px" }],
      label: "Delete selected employee",
    },
    {
      keys: [{ type: "img", src: "../assets/plus-1.svg" }],
      label: "Delete selected employee",
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
  const { companyLabel, storeLabel, formattedDate, timeRange } =
    useMonitorParams();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

            <Box display={"flex"}>
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
            </Box>
          </Box>
        </StyledContainer>

        <HeaderInfoMenu
          anchorEl={menuHeader.anchorEl}
          handleClose={menuHeader.handleClose}
          open={menuHeader.open}
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
