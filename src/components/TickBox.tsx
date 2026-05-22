import styled from "@emotion/styled";
import { FormControlLabel, FormGroup, Checkbox } from "@mui/material";
import { memo, type Ref } from "react";
import { Colors, Fonts } from "../theme";

export interface Props {
  label: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  value?: string;
  ref?: Ref<HTMLButtonElement>;
}

const TickBoxContainer = styled(FormGroup)({
  alignSelf: "center",
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
    lineHeight: 1.43,
  },
});

const TickBoxStyled = styled(Checkbox)({
  color: Colors.silverGrey,
  transform: "scale(0.89)",
  borderRadius: "4px",
  padding: "0px",
  height: "16px",
  width: "16px",
  marginBottom: "2.5px",
  marginRight: "8px",
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
