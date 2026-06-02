import styled from "@emotion/styled";
import MuiButton, { type ButtonProps } from "@mui/material/Button";
import theme, { Fonts, Colors } from "../theme";

interface Props {
  outfit?: boolean;
  square?: boolean;
  selected?: boolean;
  fontSize?: string;
}

const Button = styled(MuiButton, {
  shouldForwardProp: (prop) =>
    prop !== "outfit" && prop !== "square" && prop !== "selected",
})<ButtonProps & Props>(
  ({ color, outfit, disabled, square, selected, fontSize }) => ({
    borderRadius: square ? "6px" : "50px",
    fontFamily: outfit ? Fonts.buttonFont : Fonts.secondary,
    fontSize: fontSize ? fontSize : "16px",
    fontWeight: 600,
    textTransform: "none",
    boxShadow: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
    padding: "8px 12px",
    border: `1px solid ${Colors.main}`,
    ...(color === "primary" || !color
      ? {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }
      : {}),
    ...(color === "secondary"
      ? {
          backgroundColor: Colors.white,
          color: Colors.main,
          border: `1px solid ${Colors.main}`,
        }
      : {}),
    ...(selected
      ? {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          border: `1px solid ${theme.palette.primary.main}`,
        }
      : {}),
    ...(disabled
      ? {
          cursor: "not-allowed",
          backgroundColor: Colors.lightGray,
          border: `1px solid ${Colors.silverGrey}`,
          color: Colors.silverGrey,
        }
      : {}),
  }),
);

export default Button;
