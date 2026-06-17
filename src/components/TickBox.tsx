import styled from "@emotion/styled";
import { FormControlLabel, FormGroup, Checkbox, SvgIcon } from "@mui/material";
import { memo, type Ref } from "react";
import { Colors, Fonts } from "../theme";

const UncheckedIcon = () => (
  <SvgIcon viewBox="0 0 24 24" sx={{ width: "16px", height: "16px" }}>
    <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="#b3b3b3" strokeWidth="1.5" />
  </SvgIcon>
);

const CheckedIcon = () => (
  <SvgIcon viewBox="0 0 24 24" sx={{ width: "16px", height: "16px" }}>
    <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
    <path d="M7 13l3 3 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </SvgIcon>
);

export interface Props {
  label: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  value?: string;
  disabled?: boolean;
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

const TickBoxStyled = styled(Checkbox, {
  shouldForwardProp: (prop) => prop !== "hasLabel",
})<{ hasLabel?: boolean }>(({ hasLabel }) => ({
  color: Colors.silverGrey,
  backgroundColor: "transparent",
  transform: "scale(1)",
  borderRadius: "4px",
  padding: "0px",
  height: "16px",
  width: "16px",
  marginBottom: "2.5px",
  marginRight: hasLabel ? "8px" : "0px",
  "&.Mui-checked": {
    color: Colors.vividOrange,
  },
}));

const TickBox = memo(
  ({ label, checked, onChange, name, value, disabled, ref }: Props) => {
    return (
      <TickBoxContainer>
        <TickBoxLabel
          control={
            <TickBoxStyled
              hasLabel={!!label}
              checked={checked}
              onChange={onChange}
              name={name}
              value={value}
              disabled={disabled}
              ref={ref}
              icon={<UncheckedIcon />}
              checkedIcon={<CheckedIcon />}
            />
          }
          label={label}
        />
      </TickBoxContainer>
    );
  },
);

export default TickBox;
