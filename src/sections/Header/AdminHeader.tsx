import { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../theme";
import UserPanel from "../../components/UserPanel";
import Divider from "../../components/Divider";
import Fix from "../../components/Fix";
import usePopover from "./hooks/usePopover";
import useNavigateWithQuery from "../../hooks/useNavigate";
import NotificationMenu from "../../components/NotificationMenu";
import { useNotifications } from "../../hooks/useNotifications";

const StyledContainer = styled("div")({
  display: "flex",
  padding: "0.5em 1em 0.5em 1em",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
  minHeight: "42px",
});

const StyledTitle = styled("p")({
  margin: 0,
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: 1.5,
  color: Colors.lightBlack,
  fontFamily: Fonts.main,
});

const StyledImg = styled("img")({
  margin: "0 8px",
  cursor: "pointer",
});

const AdminHeader = ({
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
  const userPanelHeader = usePopover();
  const notificationHeader = usePopover();
  const navigate = useNavigateWithQuery();
  const { notifications } = useNotifications();
  const goBack = () => navigate(-1);

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
              <Box display={"flex"} alignItems="center" gap={"12px"}>
                <StyledTitle>Monitoring Dashboard</StyledTitle>
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
                  <img src="./assets/online.svg" alt="Online status" />
                  <p style={{ margin: "0 0 0 8px" }}>Online</p>
                </Box>
              </Box>
            </Box>

            <Box display={"flex"}>
              <StyledImg
                onClick={notificationHeader.handleOpen}
                src="./assets/notification.svg"
                alt=""
              />
              <StyledImg
                onClick={userPanelHeader.handleOpen}
                src="./assets/user-circle.svg"
                alt=""
              />
            </Box>
          </Box>
        </StyledContainer>

        <NotificationMenu
          anchorEl={notificationHeader.anchorEl}
          handleClose={notificationHeader.handleClose}
          open={notificationHeader.open}
          notifications={notifications}
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

export default AdminHeader;
