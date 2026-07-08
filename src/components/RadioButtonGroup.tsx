import { Radio, RadioGroup, FormControlLabel } from "@mui/material";
import { Colors, Fonts } from "../theme";

export interface RadioButtonOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: RadioButtonOption[];
}

const radioSx = {
  color: "#d0d5dd",
  "&.Mui-checked": { color: Colors.main },
  p: "4px 4px 4px 0",
  mr: "4px",
};

const labelStyle: React.CSSProperties = {
  fontFamily: Fonts.main,
  fontSize: "14px",
  color: Colors.lightBlack,
  height: "20px",
  fontWeight: 500,
  lineHeight: 1.43,
};

const RadioButtonGroup = ({ value, onChange, options }: Props) => (
  <RadioGroup
    row
    value={value}
    onChange={(e) => onChange(e.target.value)}
    sx={{ gap: "16px", ml: "-1px" }}
  >
    {options.map((option) => (
      <FormControlLabel
        key={option.value}
        value={option.value}
        control={<Radio size="small" sx={radioSx} />}
        label={<span style={labelStyle}>{option.label}</span>}
        sx={{ m: 0 }}
      />
    ))}
  </RadioGroup>
);

export default RadioButtonGroup;
