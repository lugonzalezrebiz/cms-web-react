import { useEffect, useRef } from "react";
import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import PopoverMenu from "./PopoverMenu";
import styled from "@emotion/styled";
import { usePostCallback } from "../hooks/useApi";

export interface Notification {
  id: number;
  title: string;
  timeAgo: string;
  date: string;
  unread: boolean;
  // location?: string;
  // store?: string;
}

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
  notifications: Notification[];
}

const TitleRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: `1px solid ${Colors.silverGrey}`,
  paddingBottom: "10px",
  marginBottom: "4px",
});

const TitleText = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: 1.56,
  color: Colors.lightBlack,
});

const ScrollArea = styled(Box)({
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  flex: 1,
  "&::-webkit-scrollbar": { width: "4px" },
  "&::-webkit-scrollbar-track": { background: "transparent" },
  "&::-webkit-scrollbar-thumb": {
    background: Colors.paleGray,
    borderRadius: "4px",
  },
});

const NotifRow = styled(Box)<{ unread?: boolean }>(({ unread }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "10px 6px",
  borderRadius: 0,
  "&:first-child": {
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
  },
  "&:last-child": {
    borderBottomLeftRadius: "8px",
    borderBottomRightRadius: "8px",
  },
  background: unread ? Colors.blushWhite : "transparent",
  cursor: "pointer",
  transition: "background 0.15s",
  "&:hover": { background: Colors.offWhite },
}));

const InfoCol = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  flex: 1,
  minWidth: 0,
});

const NameText = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: 1.43,
  color: Colors.lightBlack,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const ActivityText = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "12px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.dimGray,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const TimeText = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "11px",
  fontWeight: "normal",
  color: Colors.vividOrange,
  whiteSpace: "nowrap",
});

const UnreadDot = styled(Box)({
  width: "7px",
  height: "7px",
  minWidth: "7px",
  borderRadius: "50%",
  background: Colors.vividOrange,
  marginTop: "35px",
  marginRight: "6px",
});

const AssignmentSubText = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.lightBlack,
  lineHeight: 1.43,
});

const NotificationMenu = ({
  anchorEl,
  open,
  handleClose,
  notifications,
}: Props) => {
  const unreadCount = notifications.filter((n) => n.unread).length;
  const post = usePostCallback({ invalidateKey: ["notification/all"] });
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      notificationsRef.current
        .filter((n) => n.unread)
        .forEach(({ id }) => {
          post(`notification/${id}/read`).catch(() => {});
        });
    }, 5_000);
    return () => clearTimeout(timer);
  }, [open, post]);

  return (
    <PopoverMenu
      anchorEl={anchorEl}
      open={open}
      setAnchorEl={handleClose}
      height="420px"
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          overflow: "hidden",
        }}
      >
        <TitleRow>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TitleText>Notifications</TitleText>
            {unreadCount > 0 && (
              <Box
                sx={{
                  background: Colors.vividOrange,
                  color: Colors.white,
                  fontFamily: Fonts.main,
                  fontSize: "11px",
                  fontWeight: 700,
                  borderRadius: "10px",
                  padding: "1px 7px",
                  lineHeight: 1.6,
                }}
              >
                {unreadCount}
              </Box>
            )}
          </Box>
        </TitleRow>

        <ScrollArea>
          {notifications.map((notif) => {
            return (
              <NotifRow key={notif.id} unread={notif.unread}>
                <InfoCol>
                  <NameText>{notif.title}</NameText>
                  {/* <Box sx={{ display: "flex", alignItems: "center" }}>
                    <img
                      style={{ margin: "0 6px 0 0" }}
                      src="./assets/building-07.svg"
                      alt="Location"
                    />
                    <AssignmentSubText style={{ margin: "0 18px 0 0" }}>
                      {notif.location}
                    </AssignmentSubText>
                    <img
                      style={{ margin: "0 6px 0 0" }}
                      src="./assets/building-02.svg"
                      alt="Store"
                    />
                    <AssignmentSubText style={{ margin: 0 }}>
                      {notif.store}
                    </AssignmentSubText>
                  </Box> */}
                  <ActivityText title={notif.date}>{notif.date}</ActivityText>
                  <TimeText>{notif.timeAgo}</TimeText>
                </InfoCol>
                {notif.unread && <UnreadDot />}
              </NotifRow>
            );
          })}
        </ScrollArea>
      </Box>
    </PopoverMenu>
  );
};

export default NotificationMenu;
