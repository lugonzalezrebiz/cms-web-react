import styled from "@emotion/styled";
import MuiButton, { type ButtonProps } from "@mui/material/Button";
import theme, { Fonts, Colors } from "../theme";

interface Props {
  outfit?: boolean;
  square?: boolean;
}

const Button = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== "outfit" && prop !== "square",
})<ButtonProps & Props>(({ color, outfit, disabled, square }) => ({
  borderRadius: square ? "12" : "18px",
  fontFamily: outfit ? Fonts.buttonFont : "Inter",
  fontSize: "16px",
  fontWeight: "400",
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
}));

export default Button;
