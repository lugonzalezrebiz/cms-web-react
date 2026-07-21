import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import PopoverMenu from "./PopoverMenu";
import styled from "@emotion/styled";

export interface Notification {
  id: number;
  title: string;
  timeAgo: string;
  date: string;
  unread: boolean;
  meta?: Record<string, unknown>;
  // location?: string;
  // store?: string;
}

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
  notifications: Notification[];
  onNotificationClick?: (notif: Notification) => void;
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

const NotifRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== "unread",
})<{ unread?: boolean }>(({ unread }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "10px 6px",
  borderRadius: 0,
  "&:first-of-type": {
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
  },
  "&:last-of-type": {
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
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
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

const NotificationMenu = ({
  anchorEl,
  open,
  handleClose,
  notifications,
  onNotificationClick,
}: Props) => {
  const unreadCount = notifications.filter((n) => n.unread).length;

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
          maxHeight: "420px",
        }}
      >
        <TitleRow>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
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

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {notifications.map((notif) => (
            <NotifRow
              key={notif.id}
              unread={notif.unread}
              onClick={() => onNotificationClick?.(notif)}
            >
              <InfoCol>
                <NameText title={notif.title}>{notif.title}</NameText>
                <ActivityText title={notif.date}>{notif.date}</ActivityText>
                <TimeText>{notif.timeAgo}</TimeText>
              </InfoCol>
              {notif.unread && <UnreadDot />}
            </NotifRow>
          ))}
        </Box>
      </Box>
    </PopoverMenu>
  );
};

export default NotificationMenu;
