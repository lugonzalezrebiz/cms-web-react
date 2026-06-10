import type { ReactNode } from "react";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import Dialog from "./Dialog";
import Button from "./Button";

interface Props {
  open: boolean;
  onClose: () => void;
  message: ReactNode;
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

const SuccessDialog = ({ open, onClose, message }: Props) => (
  <Dialog open={open} onClose={onClose} maxWidth="387px" padding="24px">
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <img
        src="./assets/receipt-check.svg"
        alt="Success"
        width={88}
        height={80}
      />

      <Message>{message}</Message>

      <Button
        fontSize="16px"
        sx={{ height: "44px", p: "10px 24px", width: "90px" }}
        color="primary"
        outfit
        onClick={onClose}
      >
        Close
      </Button>
    </Box>
  </Dialog>
);

export default SuccessDialog;
