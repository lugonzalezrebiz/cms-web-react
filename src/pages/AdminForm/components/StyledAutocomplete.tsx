import { Autocomplete } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../../theme";

const StyledAutocomplete = styled(Autocomplete)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontFamily: Fonts.main,
    fontSize: "14px",
    minHeight: "44px",
    padding: "0 39px 0 14px",
    boxShadow: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
    color: Colors.dimGray,
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: Colors.paleGray,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: Colors.paleGray,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: Colors.main,
    },
  },
  "& .MuiAutocomplete-input": {
    padding: 0,
  },
}) as typeof Autocomplete;

export default StyledAutocomplete;
