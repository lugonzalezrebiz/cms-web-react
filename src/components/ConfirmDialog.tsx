import type { ReactNode } from "react";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import { Colors, Fonts } from "../theme";
import Dialog from "./Dialog";
import Button from "./Button";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
}

const Message = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.lightBlack,
  textAlign: "center",
  lineHeight: 1.6,
});

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  message,
  confirmLabel = "Yes",
  cancelLabel = "No",
  isPending,
}: Props) => (
  <Dialog open={open} onClose={onClose} maxWidth="387px" padding="24px">
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <HelpOutlineRoundedIcon
        sx={{ fontSize: 60, color: Colors.vividOrange }}
      />

      <Message>{message}</Message>

      <Box sx={{ display: "flex", gap: "12px" }}>
        <Button
          fontSize="16px"
          sx={{ height: "36px" }}
          color="secondary"
          outfit
          onClick={onClose}
          disabled={isPending}
        >
          {cancelLabel}
        </Button>
        <Button
          fontSize="16px"
          sx={{ height: "36px" }}
          color="primary"
          outfit
          onClick={onConfirm}
          disabled={isPending}
        >
          {confirmLabel}
        </Button>
      </Box>
    </Box>
  </Dialog>
);

export default ConfirmDialog;
