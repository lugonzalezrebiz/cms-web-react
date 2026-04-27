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
  align?: "flex-start" | "center";
}

const DialogStyled = styled(DialogComponent, {
  shouldForwardProp: (prop) => prop !== "customWidth" && prop !== "align",
})<{ customWidth?: string; align?: "flex-start" | "center" }>(
  ({ customWidth, align = "center" }) => ({
    "& .MuiDialog-container": {
      alignItems: align,
    },
    "& .MuiDialog-paper": {
      width: "100%",
      maxWidth: customWidth || "895px",
      backgroundColor: Colors.white,
      padding: "0px",
      borderRadius: "16px",
    },
  }),
);

const Dialog = ({
  open,
  onClose,
  children,
  footer,
  maxWidth,
  padding,
  align,
}: DialogComponentProps) => {
  return (
    <>
      <DialogStyled
        open={open}
        onClose={onClose}
        maxWidth={false}
        customWidth={maxWidth}
        align={align}
      >
        <DialogContent sx={{ padding: padding }}>{children}</DialogContent>
        {footer && (
          <DialogActions
            sx={{ mr: "26px", p: padding ? padding : "0 0 6px 0" }}
          >
            {footer}
          </DialogActions>
        )}
      </DialogStyled>
    </>
  );
};

export default Dialog;
