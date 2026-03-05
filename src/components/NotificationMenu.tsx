import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import PopoverMenu from "./PopoverMenu";
import styled from "@emotion/styled";

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
}

interface Notification {
  id: number;
  nameEmployee: string;
  timeAgo: string;
  activity: string;
  unread: boolean;
}

const NOTIFICATIONS_MOCK: Notification[] = [
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
  borderRadius: "10px",
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
  marginTop: "5px",
});

const NotificationMenu = ({ anchorEl, open, handleClose }: Props) => {
  const unreadCount = NOTIFICATIONS_MOCK.filter((n) => n.unread).length;

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
          {NOTIFICATIONS_MOCK.map((notif) => {
            return (
              <NotifRow key={notif.id} unread={notif.unread}>
                <InfoCol>
                  <NameText>{notif.nameEmployee}</NameText>
                  <ActivityText title={notif.activity}>
                    {notif.activity}
                  </ActivityText>
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
