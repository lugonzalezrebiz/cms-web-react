import styled from "@emotion/styled";
import {
  ToggleButton as MuiToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Colors, Fonts } from "../theme";
import { Box } from "@mui/system";

const StyledToggleGroup = styled(ToggleButtonGroup)({
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

const StyledToggleButton = styled(MuiToggleButton)({
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
    //fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: Colors.white,
  },
  "&:not(.Mui-selected)": {
    backgroundColor: Colors.lightGray,
  },
});

const ToggleButton = ({
  value,
  setValue,
  label,
  groups,
}: {
  value: string;
  setValue: (value: string) => void;
  label: string;
  groups: { value: string; title: string }[];
}) => {
  return (
    <Box>
      <StyledToggleGroup
        value={value}
        exclusive
        onChange={(_event, newValue) => {
          if (newValue !== null) setValue(newValue);
        }}
        aria-label={label}
        //aria-label="Camera Groups"
      >
        {groups.map(({ value, title }) => (
          <StyledToggleButton key={value} value={value}>
            {title}
          </StyledToggleButton>
        ))}
      </StyledToggleGroup>
    </Box>
  );
};

export default ToggleButton;
