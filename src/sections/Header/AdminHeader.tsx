import { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Box } from "@mui/system";
import { Colors } from "../../theme";
import { StyledContainer, StyledTitle, StyledImg } from "./styles";
import NotificationMenu from "../../components/NotificationMenu";
import UserPanel from "../../components/UserPanel";
import Divider from "../../components/Divider";
import Fix from "../../components/Fix";
import usePopover from "./hooks/usePopover";
import { useNotifications } from "../../hooks/useNotifications";

const AdminHeader = ({
  toggleDrawer,
  withIconMenu = true,
}: {
  toggleDrawer: () => void;
  withIconMenu?: boolean;
}) => {
  const [scrolled, setScrolled] = useState(false);
  const menuHeader = usePopover();
  const notificationHeader = usePopover();
  const userPanelHeader = usePopover();
  const { notifications } = useNotifications();

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
              <StyledTitle>Assignments Form</StyledTitle>
            </Box>

            <Box display={"flex"}>
              <StyledImg
                onClick={notificationHeader.handleOpen}
                src="../assets/notification.svg"
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
