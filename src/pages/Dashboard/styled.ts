import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../theme";

export const StyledToggleButton = styled(ToggleButton)({
  color: Colors.mediumGray,
  flex: 1,
  fontFamily: Fonts.main,
  textTransform: "none",
  fontWeight: "normal",
  backgroundColor: Colors.lightGray,
  border: "none",
  margin: 0,
  fontSize: "14px",
  borderRadius: 35,
  whiteSpace: "nowrap",
  "&.Mui-selected": {
    color: Colors.lightBlack,
    backgroundColor: Colors.white,
  },
  "&.Mui-selected:hover": {
    backgroundColor: Colors.white,
  },
  "&:not(.Mui-selected)": {
    backgroundColor: Colors.lightGray,
  },
});

export const StyledToggleGroup = styled(ToggleButtonGroup)({
  padding: 4,
  backgroundColor: Colors.lightGray,
  borderRadius: 30,
  height: "32px",
  width: "100%",
  boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.07)",
  "& .MuiToggleButtonGroup-lastButton": {
    margin: 0,
  },
  "& .MuiToggleButtonGroup-firstButton": {
    margin: 1,
  },
  "& .MuiToggleButtonGroup-grouped": {
    borderRadius: 35,
  },
});
