import { Radio, RadioGroup, FormControlLabel } from "@mui/material";
import { Colors, Fonts } from "../../../theme";

interface Props {
  value: string;
  onChange: (value: string) => void;
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

const EmployeeTypeRadioGroup = ({ value, onChange }: Props) => (
  <RadioGroup
    row
    value={value}
    onChange={(e) => onChange(e.target.value)}
    sx={{ gap: "16px", ml: "-1px" }}
  >
    <FormControlLabel
      value="monitoring_agent"
      control={<Radio size="small" sx={radioSx} />}
      label={<span style={labelStyle}>Monitoring Agent</span>}
      sx={{ m: 0 }}
    />
    <FormControlLabel
      value="reviewer"
      control={<Radio size="small" sx={radioSx} />}
      label={<span style={labelStyle}>Reviewer</span>}
      sx={{ m: 0 }}
    />
  </RadioGroup>
);

export default EmployeeTypeRadioGroup;
