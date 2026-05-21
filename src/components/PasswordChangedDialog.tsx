import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import Dialog from "./Dialog";
import Button from "./Button";

interface Props {
  open: boolean;
  onClose: () => void;
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

const PasswordChangedDialog = ({ open, onClose }: Props) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="320px" padding="32px 28px">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <img src="/assets/receipt-check.svg" alt="Success" width={88} height={80} />

        <Message>
          Password changed successfully.
        </Message>

        <Button color="primary" onClick={onClose} sx={{ px: "40px" }}>
          Close
        </Button>
      </Box>
    </Dialog>
  );
};

export default PasswordChangedDialog;
