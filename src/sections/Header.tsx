import Divider from "../components/Divider";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import { useEffect, useState } from "react";
import type React from "react";
import { IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import { Box } from "@mui/system";
import HeaderInfoMenu from "../components/HeaderInfoMenu";
import KeyboardMenu from "../components/KeyboardMenu";
import ClockMenu from "../components/ClockMenu";
import AiMenu from "../components/AiMenu";
import NotificationMenu from "../components/NotificationMenu";
import UserPanel from "../components/UserPanel";
import { useLocation, useSearchParams } from "react-router-dom";
import useNavigateWithQuery from "../hooks/useNavigate";
import { MOCK_SNAPSHOT } from "../components/timeline/constants";

const Fix = styled("div")<{ scrolled: boolean }>(({ scrolled }) => ({
  position: "sticky",
  top: 0,
  zIndex: 1000,
  backgroundColor: Colors.white,
  boxShadow: scrolled ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
  transition: "all 0.2s ease-in-out",
  ["WebkitAppRegion" as string]: "drag",
}));

const StyledContainer = styled("div")({
  display: "flex",
  padding: "0.5em 1em 0.5em 1em",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
});

const noDrag = {
  ["WebkitAppRegion" as string]: "no-drag",
} as React.CSSProperties;

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

const usePopover = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  return {
    anchorEl,
    open: Boolean(anchorEl),
    handleOpen: (e: React.MouseEvent<HTMLElement>) =>
      setAnchorEl(e.currentTarget),
    handleClose: () => setAnchorEl(null),
  };
};

const Header = ({
  toggleDrawer,
  withIconMenu = true,
  allowGoBack = false,
}: {
  toggleDrawer: () => void;
  withIconMenu?: boolean;
  allowGoBack?: boolean;
}) => {
  const [scrolled, setScrolled] = useState(false);

  // ── Route params ─────────────────────────────────────────────────────────
  const [searchParams] = useSearchParams();
  const companyParam = searchParams.get("company") ?? "";
  const locationParam = searchParams.get("location") ?? "";
  const dateParam = searchParams.get("date") ?? ""; // YYYYMMDD

  const companyLabel = companyParam || "----";
  const storeLabel = locationParam || "----";

  const formattedDate = (() => {
    if (dateParam.length === 8) {
      const y = Number(dateParam.slice(0, 4));
      const m = Number(dateParam.slice(4, 6)) - 1;
      const d = Number(dateParam.slice(6, 8));
      return new Date(y, m, d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return dateParam || "----";
  })();

  const { start, end } = MOCK_SNAPSHOT.timeline.times;
  const toHHmm = (t: string) => t.slice(0, 5); // "09:00:00" → "09:00"
  const timeRange = `${toHHmm(start)} - ${toHHmm(end)}`;

  const { pathname } = useLocation();
  const navigate = useNavigateWithQuery();
  const monitoringPath = pathname === "/monitor";
  const goBack = () => navigate(-1);

  const MenuHeader = usePopover();
  const keyboardMenu = usePopover();
  const ClockMenuHeader = usePopover();
  const AiMenuHeader = usePopover();
  const NotificationHeader = usePopover();
  const UserPanelHeader = usePopover();

  const isAdmin = true

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

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
              style={noDrag}
              sx={{ color: Colors.main }}
              onClick={toggleDrawer}
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
          )}
          {allowGoBack && (
            <IconButton
              style={noDrag}
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
                onClick={MenuHeader.handleOpen}
                style={noDrag}
                sx={{
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  cursor: "pointer",
                }}
              >
                {isAdmin ? (
                  <StyledTitle>Admin Form</StyledTitle>
                ) : monitoringPath ? (
                  <Box display={"flex"} alignItems="center" gap={"12px"}>
                    <StyledTitle>Monitoring Dashboad</StyledTitle>
                    <Box
                      sx={{
                        bgcolor: Colors.lightLime,
                        p: "4px 12px",
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: "20px",
                        fontFamily: Fonts.main,
                        fontSize: "16px",
                        fontWeight: 600,
                        color: Colors.vividLime,
                      }}
                    >
                      <img src="./assets/online.svg" alt="" />
                      <p style={{ margin: "0 0 0 8px" }}>Online</p>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <StyledTitle>
                      Store: {storeLabel} ({companyLabel})
                    </StyledTitle>
                    <StyledSubTitle>
                      {formattedDate} / {timeRange} / Events
                    </StyledSubTitle>
                  </>
                )}
              </Box>

              <Box display={"flex"} style={noDrag}>
                <Box>
                  {monitoringPath && (
                    <StyledImg
                      onClick={NotificationHeader.handleOpen}
                      src="../assets/notification.svg"
                      alt=""
                    />
                  )}
                  {!monitoringPath && (
                    <StyledImg
                      onClick={keyboardMenu.handleOpen}
                      src="../assets/keyboard-02.svg"
                      alt=""
                    />
                  )}
                  <StyledImg
                    onClick={UserPanelHeader.handleOpen}
                    src="../assets/user-circle.svg"
                    alt=""
                  />
                </Box>
                <Box ml={"20px"}>
                  <StyledImg
                    src="../assets/minus.svg"
                    alt=""
                    onClick={() => window.api?.minimize()}
                  />
                  <StyledImg
                    style={{ marginBottom: "2px" }}
                    src="../assets/expand-03.svg"
                    alt=""
                    onClick={() => window.api?.maximize()}
                  />
                  <StyledImg
                    src="../assets/x-close.svg"
                    alt=""
                    onClick={() => window.api?.close()}
                  />
                </Box>
              </Box>
            </Box>
          
        </StyledContainer>

        <HeaderInfoMenu
          anchorEl={MenuHeader.anchorEl}
          handleClose={MenuHeader.handleClose}
          open={MenuHeader.open}
        />

        <KeyboardMenu
          anchorEl={keyboardMenu.anchorEl}
          open={keyboardMenu.open}
          handleClose={keyboardMenu.handleClose}
        />

        <ClockMenu
          anchorEl={ClockMenuHeader.anchorEl}
          open={ClockMenuHeader.open}
          handleClose={ClockMenuHeader.handleClose}
        />
        <AiMenu
          anchorEl={AiMenuHeader.anchorEl}
          handleClose={AiMenuHeader.handleClose}
          open={AiMenuHeader.open}
        />
        <NotificationMenu
          anchorEl={NotificationHeader.anchorEl}
          handleClose={NotificationHeader.handleClose}
          open={NotificationHeader.open}
        />
        <UserPanel
          anchorEl={UserPanelHeader.anchorEl}
          handleClose={UserPanelHeader.handleClose}
          open={UserPanelHeader.open}
        />
        <Divider marginBottom="0" />
      </Fix>
    </>
  );
};

export default Header;
