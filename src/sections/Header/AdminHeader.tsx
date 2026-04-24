import { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../theme";
import NotificationMenu, {
  type Notification,
} from "../../components/NotificationMenu";
import UserPanel from "../../components/UserPanel";
import Divider from "../../components/Divider";
import Fix from "../../components/Fix";
import usePopover from "./hooks/usePopover";

const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "New Assignment",
    timeAgo: "2 min ago",
    date: "February 25 - 2026",
    unread: true,
    location: "162",
    store: "6015",
  },
  {
    id: 2,
    title: "Ticket Resolved",
    timeAgo: "8 min ago",
    date: "February 25 - 2026",
    unread: true,
    location: "166",
    store: "1243",
  },
  {
    id: 3,
    title: "New Assignment",
    timeAgo: "15 min ago",
    date: "February 22 - 2026",
    unread: true,
    location: "162",
    store: "456",
  },
  {
    id: 4,
    title: "Monitoring Rejected",
    timeAgo: "32 min ago",
    date: "February 21 - 2026",
    unread: true,
    location: "162",
    store: "456",
  },
  {
    id: 5,
    title: "New Assignment",
    timeAgo: "1 hr ago",
    date: "February 25 - 2026",
    unread: false,
    location: "162",
    store: "456",
  },
  {
    id: 6,
    title: "Ticket Resolved",
    timeAgo: "2 hr ago",
    date: "February 25 - 2026",
    unread: false,
    location: "162",
    store: "456",
  },
];

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
}: {
  toggleDrawer: () => void;
  withIconMenu?: boolean;
}) => {
  const [scrolled, setScrolled] = useState(false);
  const menuHeader = usePopover();
  const notificationHeader = usePopover();
  const userPanelHeader = usePopover();

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
          notifications={NOTIFICATIONS}
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
