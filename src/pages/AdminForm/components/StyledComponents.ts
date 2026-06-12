import { FormLabel } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../../theme";

export const Label = styled(FormLabel)({
  fontFamily: Fonts.secondary,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.charcoalNavy,
  marginBottom: "6px",
  display: "block",
  height: "20px",
  lineHeight: 1.43,
  "&.Mui-focused": { color: Colors.lightBlack },
});

export const ErrorText = styled("p")({
  margin: "4px 0 0",
  fontFamily: Fonts.secondary,
  fontSize: "12px",
  color: Colors.red,
  lineHeight: 1.4,
});
