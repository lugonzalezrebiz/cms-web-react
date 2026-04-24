import {
  Dialog as DialogComponent,
  DialogActions,
  DialogContent,
} from "@mui/material";
import styled from "@emotion/styled";
import { Colors } from "../theme";

export interface DialogComponentProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  padding?: string;
}

const DialogStyled = styled(DialogComponent, {
  shouldForwardProp: (prop) => prop !== "customWidth",
})<{ customWidth?: string }>(({ customWidth }) => ({
  "& .MuiDialog-paper": {
    width: "100%",
    maxWidth: customWidth || "895px",
    backgroundColor: Colors.white,
    padding: "0px",
    borderRadius: "16px",
  },
}));

const Dialog = ({
  open,
  onClose,
  children,
  footer,
  maxWidth,
  padding,
}: DialogComponentProps) => {
  return (
    <DialogStyled
      open={open}
      onClose={onClose}
      maxWidth={false}
      customWidth={maxWidth}
    >
      <DialogContent>{children}</DialogContent>
      {footer && (
        <DialogActions sx={{ mr: "26px", p: padding ? padding : "0 0 6px 0" }}>
          {footer}
        </DialogActions>
      )}
    </DialogStyled>
  );
};

export default Dialog;
