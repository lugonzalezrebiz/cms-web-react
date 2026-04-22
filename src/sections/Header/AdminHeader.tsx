import type React from "react";
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
    nameEmployee: "James Rodriguez",
    timeAgo: "2 min ago",
    activity: "Completed express wash on Bay #3",
    unread: true,
  },
  {
    id: 2,
    nameEmployee: "Sarah Mitchell",
    timeAgo: "8 min ago",
    activity: "Started full detail service — Station 1",
    unread: true,
  },
  {
    id: 3,
    nameEmployee: "Carlos Rivera",
    timeAgo: "15 min ago",
    activity: "Vehicle check-in: Sedan • License #4KGT21",
    unread: true,
  },
  {
    id: 4,
    nameEmployee: "Tyler Hayes",
    timeAgo: "32 min ago",
    activity: "Payment processed — Premium Package $34.99",
    unread: true,
  },
  {
    id: 5,
    nameEmployee: "Amanda Brooks",
    timeAgo: "1 hr ago",
    activity: "Wash tunnel offline — maintenance required",
    unread: false,
  },
  {
    id: 6,
    nameEmployee: "James Rodriguez",
    timeAgo: "2 hr ago",
    activity: "Applied tire shine & wax on Bay #1",
    unread: false,
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

const noDrag = {
  ["WebkitAppRegion" as string]: "no-drag",
} as React.CSSProperties;

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
              style={noDrag}
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
              style={noDrag}
              sx={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                cursor: "pointer",
              }}
            >
              <StyledTitle>Assignments Form</StyledTitle>
            </Box>

            <Box display={"flex"} style={noDrag}>
              <Box>
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
