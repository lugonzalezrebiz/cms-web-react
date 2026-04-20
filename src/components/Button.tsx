import styled from "@emotion/styled";
import MuiButton, { type ButtonProps } from "@mui/material/Button";
import theme, { Fonts, Colors } from "../theme";

interface Props {
  outfit?: boolean;
  square?: boolean;
  selected?: boolean;
}

const Button = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== "outfit" && prop !== "square" && prop !== "selected",
})<ButtonProps & Props>(({ color, outfit, disabled, square, selected }) => ({
  borderRadius: square ? "12px" : "18px",
  fontFamily: outfit ? Fonts.buttonFont : Fonts.secondary,
  fontSize: "16px",
  fontWeight: "600",
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
  ...(disabled
    ? {
        backgroundColor: Colors.paleGray,
        border: `1px solid ${Colors.paleGray}`,
        cursor: "not-allowed",
      }
    : {}),
  ...(selected !== undefined
    ? {
        border: `1px solid ${Colors.main}`,
        backgroundColor: selected ? Colors.main : Colors.white,
        color: selected ? Colors.white : Colors.main,
        "&:hover": {
          backgroundColor: selected ? Colors.orangeHover : Colors.secondary,
          boxShadow: "none",
        },
      }
    : {}),
}));

export default Button;
