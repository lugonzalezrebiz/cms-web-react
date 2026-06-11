import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import PopoverMenu from "./PopoverMenu";
import styled from "@emotion/styled";
import { Divider } from "@mui/material";
import useNavigateWithQuery from "../hooks/useNavigate";
import useAuth from "../hooks/useAuth";
import useChangePassword from "../hooks/useChangePassword";
import ResetPasswordDialog from "./ResetPasswordDialog";
import SuccessDialog from "./SuccessDialog";
import { useState } from "react";

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
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

const Avatar = styled(Box)({
  width: "52px",
  height: "52px",
  borderRadius: "50%",
  background: Colors.secondary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: Fonts.main,
  fontSize: "20px",
  fontWeight: 700,
  color: Colors.main,
  flexShrink: 0,
});

const UserName = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "15px",
  fontWeight: 600,
  lineHeight: 1.4,
  color: Colors.lightBlack,
});

const UserRole = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "12px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.vividOrange,
});

const UserEmail = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "12px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.dimGray,
});

const MenuRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "9px 6px",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "background 0.15s",
  "&:hover": { background: Colors.offWhite },
});

const MenuRowText = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: 1.43,
  color: Colors.lightBlack,
});

const LogoutText = styled(MenuRowText)({
  color: Colors.lightBlack,
});

const UserPanel = ({ anchorEl, open, handleClose }: Props) => {
  const navigate = useNavigateWithQuery();
  const { user, logout } = useAuth();
  const [openResetPassword, setOpenResetPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { mutate: changePassword, isError, isPending, errorMessage } = useChangePassword();

  const handlePasswordSubmit = (
    payload: { oldPassword: string; newPassword: string },
    onReset: () => void
  ) => {
    changePassword(payload, {
      onSuccess: () => {
        onReset();
        setOpenResetPassword(false);
        setShowSuccess(true);
      },
    });
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <PopoverMenu
      anchorEl={anchorEl}
      open={open}
      setAnchorEl={handleClose}
      height="255px"
      padding="12px"
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
          <TitleText>Account</TitleText>
        </TitleRow>

        <Box
          sx={{ display: "flex", alignItems: "center", gap: "12px", py: "6px" }}
        >
          <Avatar>{initials}</Avatar>
          <Box>
            <UserName>{user?.name}</UserName>
            <UserRole>{user?.username}</UserRole>
            <UserEmail>{user?.email}</UserEmail>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Divider sx={{ borderColor: Colors.paleGray, my: "4px" }} />
          <MenuRow onClick={() => setOpenResetPassword(true)}>
            <img
              src="./assets/passcode.svg"
              alt="Reset Password"
              width={18}
              height={18}
            />
            <LogoutText>Reset Password</LogoutText>
          </MenuRow>
          <Divider sx={{ borderColor: Colors.paleGray, my: "4px" }} />
          <MenuRow onClick={handleLogout}>
            <img
              src="./assets/log-out-03.svg"
              alt="Close"
              width={18}
              height={18}
            />
            <LogoutText>Log Out</LogoutText>
          </MenuRow>
        </Box>
      </Box>

      <ResetPasswordDialog
        open={openResetPassword}
        onClose={() => setOpenResetPassword(false)}
        onSubmit={handlePasswordSubmit}
        isError={isError}
        isPending={isPending}
        errorMessage={errorMessage}
      />

      <SuccessDialog
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        message="Password changed successfully."
      />
    </PopoverMenu>
  );
};

export default UserPanel;
