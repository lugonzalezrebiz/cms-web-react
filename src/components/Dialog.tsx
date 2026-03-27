import {
  Dialog as DialogComponent,
  DialogActions,
  DialogContent,
} from "@mui/material";
import styled from "@emotion/styled";

export interface DialogComponentProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const DialogStyled = styled(DialogComponent)({
  "& .MuiDialog-paper": {
    width: "100%",
    maxWidth: "895px",
    backgroundColor: "#FFFFFFDE",
    padding: "16px 0px",
    borderRadius: "16px",
  },
});

const Dialog = ({ open, onClose, children, footer }: DialogComponentProps) => {
  return (
    <DialogStyled open={open} onClose={onClose}>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ mr: "26px", p: "0 0 6px 0" }}>
        {footer}
      </DialogActions>
    </DialogStyled>
  );
};

export default Dialog;
