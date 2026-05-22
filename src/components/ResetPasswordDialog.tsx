import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import styled from "@emotion/styled";
import { InputAdornment, TextField } from "@mui/material";
import Dialog from "./Dialog";
import Button from "./Button";
import { useState } from "react";
import usePasswordValidation from "../hooks/usePasswordValidation";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    payload: { oldPassword: string; newPassword: string },
    onReset: () => void,
  ) => void;
  isError: boolean;
  isPending: boolean;
  errorMessage: string | null;
}

const DialogHeading = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "20px",
  fontWeight: 600,
  color: Colors.charcoalNavy,
  lineHeight: 1.5,
  height: "30px",
});

const FieldLabel = styled("p")({
  margin: "0 0 6px 0",
  fontFamily: Fonts.secondary,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.charcoalNavy,
  lineHeight: 1.43,
  height: "20px",
});

const HintText = styled("p")({
  margin: 0,
  fontFamily: Fonts.secondary,
  fontSize: "12px",
  color: Colors.dimGray,
  height: "16px",
});

const ErrorText = styled("p")({
  margin: "4px 0 0 0",
  fontFamily: Fonts.main,
  fontSize: "12px",
  color: Colors.red,
});

const HintDot = styled(Box)({
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  backgroundColor: Colors.softSteelBlue,
  flexShrink: 0,
});

const textFieldSx = {
  width: "100%",
  minHeight: "44px",
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: Colors.white,
    "& fieldset": {
      borderColor: Colors.paleSteal,
    },
    "&:hover fieldset": { borderColor: Colors.softSteelBlue },
    "&.Mui-focused fieldset": {
      borderColor: Colors.vividOrange,
      borderWidth: "1px",
    },
  },
  "& .MuiInputBase-input": {
    padding: "10px 14px",
    fontFamily: Fonts.main,
    fontSize: "16px",
    color: Colors.slateGray,
    lineHeight: 1.5,
  },
};

const ResetPasswordDialog = ({
  open,
  onClose,
  onSubmit,
  isError,
  isPending,
  errorMessage,
}: Props) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const eyeAdornment = (toggle: () => void, show: boolean) => (
    <InputAdornment position="end">
      <img
        src={show ? "./assets/close-eye.svg" : "./assets/eye.svg"}
        alt="toggle visibility"
        onClick={toggle}
        style={{ cursor: "pointer", width: "20px", height: "20px" }}
      />
    </InputAdornment>
  );

  const { validLength, validUpperCase, passwordsMatch, isValid } =
    usePasswordValidation({ oldPassword, newPassword, confirmPassword });

  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onSubmit({ oldPassword, newPassword }, resetForm);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="424px" padding="16px">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "16px",
        }}
      >
        <DialogHeading>Reset Your Password</DialogHeading>
        <Box
          component="button"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <img
            src="./assets/x-close.svg"
            alt="Close"
            style={{ width: "24px", height: "24" }}
          />
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: "16px" }}>
          <FieldLabel>Type your old password</FieldLabel>
          <TextField
            id="old-password"
            variant="outlined"
            type={showOld ? "text" : "password"}
            onChange={(e) => setOldPassword(e.target.value)}
            value={oldPassword}
            autoComplete="current-password"
            sx={textFieldSx}
            slotProps={{
              input: {
                endAdornment: eyeAdornment(
                  () => setShowOld((v) => !v),
                  showOld,
                ),
              },
            }}
          />
        </Box>

        <Box sx={{ mb: "16px" }}>
          <FieldLabel>Type your new password</FieldLabel>
          <TextField
            id="new-password"
            variant="outlined"
            type={showNew ? "text" : "password"}
            onChange={(e) => setNewPassword(e.target.value)}
            value={newPassword}
            autoComplete="new-password"
            sx={textFieldSx}
            slotProps={{
              input: {
                endAdornment: eyeAdornment(
                  () => setShowNew((v) => !v),
                  showNew,
                ),
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            mb: "16px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {validLength ? (
              <img
                src="./assets/check-circle.svg"
                alt="valid"
                width={18}
                height={18}
              />
            ) : (
              <HintDot />
            )}
            <HintText>Between 8 and 20 characters</HintText>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {validUpperCase ? (
              <img
                src="./assets/check-circle.svg"
                alt="valid"
                width={18}
                height={18}
              />
            ) : (
              <HintDot />
            )}
            <HintText>At least 1 Upper Case Letter</HintText>
          </Box>
        </Box>

        <Box sx={{ mb: "16px" }}>
          <FieldLabel>Confirm your new password</FieldLabel>
          <TextField
            id="confirm-password"
            variant="outlined"
            type={showConfirm ? "text" : "password"}
            onChange={(e) => setConfirmPassword(e.target.value)}
            value={confirmPassword}
            autoComplete="new-password"
            sx={textFieldSx}
            slotProps={{
              input: {
                endAdornment: eyeAdornment(
                  () => setShowConfirm((v) => !v),
                  showConfirm,
                ),
              },
            }}
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <ErrorText>Passwords do not match</ErrorText>
          )}
        </Box>

        {isError && (
          <ErrorText style={{ margin: "0 0 12px 0" }}>{errorMessage}</ErrorText>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <Button outfit color="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            outfit
            color="primary"
            type="submit"
            disabled={!isValid || isPending}
          >
            {isPending ? "Loading..." : "Reset Password"}
          </Button>
        </Box>
      </form>
    </Dialog>
  );
};

export default ResetPasswordDialog;
