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
    borderRadius: square ? "0px" : "18px",
    fontFamily: outfit ? Fonts.buttonFont : Fonts.secondary,
    fontSize: fontSize ? fontSize : "16px",
    fontWeight: "500",
    textTransform: "none",
    boxShadow: "none",
    padding: "6px 20px",
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
          backgroundColor: Colors.lightGray,
          border: `1px solid ${Colors.silverGrey}`,
          color: Colors.silverGrey,
          cursor: "not-allowed",
        }
      : {}),
  }),
);

export default Button;
