import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import { assetUrl } from "../utils";

const StyledImg = styled("img")({
  margin: "0 8px",
  cursor: "pointer",
});

const NotificationBell = ({
  unreadCount,
  onClick,
}: {
  unreadCount: number;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}) => (
  <Box position="relative" mt={"3px"}>
    {unreadCount > 0 && (
      <Box
        sx={{
          minWidth: "8px",
          height: "8px",
          bgcolor: Colors.vividOrange,
          borderRadius: "100%",
          position: "absolute",
          top: 0,
          right: 7,
          border: "2px solid #fff",
          fontSize: "7px",
          fontFamily: Fonts.main,
          fontWeight: 700,
          color: Colors.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: "1px",
          textAlign: "center",
        }}
      >
        {unreadCount > 9 ? "+9" : unreadCount}
      </Box>
    )}
    <StyledImg
      onClick={onClick}
      src={assetUrl("notification.svg")}
      alt="Notifications"
    />
  </Box>
);

export default NotificationBell;
