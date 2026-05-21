import styled from "@emotion/styled";
import { FormControlLabel, FormGroup, Checkbox } from "@mui/material";
import { memo } from "react";
import { Colors, Fonts } from "../theme";

export interface Props {
  label: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  value?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

const TickBoxContainer = styled(FormGroup)({
  alignSelf: "center",
  display: "flex",
  alignItems: "center",
  "& .MuiFormControlLabel-root": {
    margin: "0px",
  },
});

const TickBoxLabel = styled(FormControlLabel)({
  "& .MuiFormControlLabel-label": {
    fontSize: "14px",
    fontFamily: Fonts.main,
    fontWeight: 400,
    color: Colors.dimGray,
    marginLeft: "8px",
    lineHeight: 1.43,
    height: "20px",
  },
});

const TickBoxStyled = styled(Checkbox)({
  color: Colors.silverGrey,
  transform: "scale(0.8)",
  padding: "0px",
  marginBottom: "2px",
  height: "18px",
  width: "18px",
  borderRadius: "4px",
  "&.Mui-checked": {
    color: Colors.vividOrange,
  },
});

const TickBox = memo(
  ({ label, checked, onChange, name, value, ref }: Props) => {
    return (
      <TickBoxContainer>
        <TickBoxLabel
          control={
            <TickBoxStyled
              checked={checked}
              onChange={onChange}
              name={name}
              value={value}
              ref={ref}
            />
          }
          label={label}
        />
      </TickBoxContainer>
    );
  },
);

export default TickBox;
