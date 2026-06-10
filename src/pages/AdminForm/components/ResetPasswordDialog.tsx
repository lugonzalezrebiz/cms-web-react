import { useState } from "react";
import { Box } from "@mui/system";
import { Colors, Fonts } from "../../../theme";
import FormDialog from "../../../components/FormDialog";
import PasswordInput from "../../../components/PasswordInput";
import Button from "../../../components/Button";
import SuccessDialog from "../../../components/SuccessDialog";
import usePasswordValidation from "../../../hooks/usePasswordValidation";
import { generatePassword } from "../../../utils/generatePassword";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string, onSuccess: () => void) => void;
  isPending?: boolean;
  errorMessage?: string | null;
}

const ResetPasswordDialog = ({
  open,
  onClose,
  onSubmit,
  isPending = false,
  errorMessage,
}: Props) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  const { validLength, validUpperCase, passwordsMatch, isValid } =
    usePasswordValidation({ password, confirmPassword });

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSuccess = () => {
    resetForm();
    setSuccessOpen(true);
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(password, handleSuccess);
  };

  return (
    <>
    <FormDialog open={open && !successOpen} onClose={handleClose} title="Reset Password">
      <PasswordInput
        label="New Password"
        value={password}
        onChange={setPassword}
        onGenerate={() => setPassword(generatePassword())}
        validations={[
          { valid: validLength, label: "8–20 characters" },
          { valid: validUpperCase, label: "At least one uppercase letter" },
        ]}
      />
      <PasswordInput
        label="Confirm Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        errorText={confirmPassword.length > 0 && !passwordsMatch ? "Passwords do not match" : undefined}
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", pb: "8px" }}>
        {errorMessage && (
          <span
            style={{
              fontFamily: Fonts.main,
              fontSize: "12px",
              color: Colors.red,
              textAlign: "left",
            }}
          >
            {errorMessage}
          </span>
        )}
        <Box sx={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Button
            fontSize="14px"
            sx={{ height: "36px" }}
            color="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            fontSize="14px"
            sx={{ height: "36px" }}
            color="primary"
            outfit
            disabled={!isValid || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Loading..." : "Reset"}
          </Button>
        </Box>
      </Box>
    </FormDialog>

    <SuccessDialog
      open={successOpen}
      onClose={handleSuccessClose}
      message="Password has been reset successfully."
    />
    </>
  );
};

export default ResetPasswordDialog;
