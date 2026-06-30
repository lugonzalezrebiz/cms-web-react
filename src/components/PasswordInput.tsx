import { useState } from "react";
import { Box } from "@mui/system";
import {
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormLabel,
} from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import { assetUrl } from "../utils";

export interface PasswordValidation {
  valid: boolean;
  label: string;
}

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  errorText?: string;
  onGenerate?: () => void;
  validations?: PasswordValidation[];
  fullWidth?: boolean;
}

const StyledInput = styled(OutlinedInput)({
  borderRadius: "8px",
  fontFamily: Fonts.main,
  fontSize: "14px",
  height: "44px",
  minHeight: 0,
  padding: "10px 14px",
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
  "& .MuiInputBase-input": {
    padding: 0,
  },
});

const ErrorText = styled("p")({
  margin: "4px 0 0",
  fontFamily: Fonts.secondary,
  fontSize: "12px",
  color: Colors.red,
  lineHeight: 1.4,
});

const HintText = styled("p")({
  margin: 0,
  fontFamily: Fonts.secondary,
  fontSize: "12px",
  color: Colors.dimGray,
  height: "16px",
});

const StyledLabel = styled(FormLabel)({
  fontFamily: Fonts.secondary,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.charcoalNavy,
  height: "20px",
  lineHeight: 1.43,
  "&.Mui-focused": { color: Colors.lightBlack },
});

const HintDot = styled(Box)({
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  backgroundColor: Colors.softSteelBlue,
  flexShrink: 0,
});

const ValidationRule = ({ valid, label }: PasswordValidation) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
    {valid ? (
      <img src={assetUrl("check-circle.svg")} alt="" width={16} height={16} />
    ) : (
      <HintDot />
    )}
    <HintText>{label}</HintText>
  </Box>
);

const PasswordInput = ({
  label,
  value,
  onChange,
  error,
  errorText,
  onGenerate,
  validations,
  fullWidth = true,
}: Props) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleGenerate = () => {
    onGenerate?.();
    setShowPassword(true);
  };

  const hasExtras = validations && validations.length > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {(label || onGenerate) && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {label && <StyledLabel>{label}</StyledLabel>}
          {onGenerate && (
            <Box
              onClick={handleGenerate}
              sx={{
                fontSize: "12px",
                fontWeight: 500,
                color: Colors.vividOrange,
                fontFamily: Fonts.secondary,
                cursor: "pointer",
              }}
            >
              Generate password
            </Box>
          )}
        </Box>
      )}
      <Box>
        <StyledInput
          fullWidth={fullWidth}
          size="small"
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
                size="small"
                sx={{ color: Colors.main }}
              >
                <img
                  src={
                    showPassword ? "./assets/close-eye.svg" : "./assets/eye.svg"
                  }
                  alt=""
                  width={20}
                  height={20}
                />
              </IconButton>
            </InputAdornment>
          }
        />
        {errorText && <ErrorText>{errorText}</ErrorText>}
      </Box>

      {hasExtras && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {validations?.map((v) => <ValidationRule key={v.label} {...v} />)}
        </Box>
      )}
    </Box>
  );
};

export default PasswordInput;
