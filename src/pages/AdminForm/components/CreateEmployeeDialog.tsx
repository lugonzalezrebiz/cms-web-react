import { useState } from "react";
import { Box } from "@mui/system";
import {
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormLabel,
} from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../../theme";
import Dialog from "../../../components/Dialog";
import Button from "../../../components/Button";
import EmployeeTypeRadioGroup from "./EmployeeTypeRadioGroup";
import usePasswordValidation from "../../../hooks/usePasswordValidation";
import useCreateUser from "../hooks/useCreateUser";

interface Props {
  open: boolean;
  onClose: () => void;
}

const Title = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "20px",
  fontWeight: 600,
  color: Colors.charcoalNavy,
  height: "30px",
  lineHeight: 1.5,
});

const Label = styled(FormLabel)({
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

const HintText = styled("p")({
  margin: 0,
  fontFamily: Fonts.secondary,
  fontSize: "12px",
  color: Colors.dimGray,
  height: "16px",
});

const HintDot = styled(Box)({
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  backgroundColor: Colors.softSteelBlue,
  flexShrink: 0,
});

const ValidationRule = ({
  valid,
  label,
}: {
  valid: boolean;
  label: string;
}) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {valid ? (
        <img src="/assets/check-circle.svg" alt="" width={16} height={16} />
      ) : (
        <HintDot />
      )}
      <HintText>{label}</HintText>
    </Box>
  );
};

const CreateEmployeeDialog = ({ open, onClose }: Props) => {
  const [employeeType, setEmployeeType] = useState("monitoring_agent");
  const [employeeName, setEmployeeName] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const all = upper + lower + digits;
    const length = Math.floor(Math.random() * 5) + 10; // 10–14 chars
    const chars = [
      upper[Math.floor(Math.random() * upper.length)],
      ...Array.from(
        { length: length - 1 },
        () => all[Math.floor(Math.random() * all.length)],
      ),
    ];
    setPassword(chars.sort(() => Math.random() - 0.5).join(""));
    setShowPassword(true);
  };

  const { validLength, validUpperCase, isValid } = usePasswordValidation({
    password,
  });

  const handleClose = () => {
    setEmployeeType("monitoring_agent");
    setEmployeeName("");
    setEmail("");
    setUserName("");
    setPassword("");
    setShowPassword(false);
    onClose();
  };

  const { createUser, isPending, errorMessage } = useCreateUser({
    onSuccess: handleClose,
  });

  const handleCreate = () => {
    if (!isValid) return;
    createUser({
      username: userName,
      password,
      name: employeeName,
      email,
      employeeType: employeeType as "monitoring_agent" | "reviewer",
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="400px" padding="16px">
      <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title>Create New Employee</Title>
          <Box sx={{ position: "absolute", top: "14px", right: "14px" }}>
            <img src="./assets/x-close.svg" alt="" />
          </Box>
        </Box>

        <Box>
          <Label>Select type of employee</Label>
          <EmployeeTypeRadioGroup
            value={employeeType}
            onChange={setEmployeeType}
          />
        </Box>

        <Box>
          <Label>Employee Name</Label>
          <StyledInput
            fullWidth
            size="small"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
          />
        </Box>

        <Box>
          <Label>Email</Label>
          <StyledInput
            fullWidth
            size="small"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Box>

        <Box>
          <Label>User Name</Label>
          <StyledInput
            fullWidth
            size="small"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Box>
            <Label>Set password</Label>
            <StyledInput
              fullWidth
              size="small"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                        showPassword
                          ? "/assets/close-eye.svg"
                          : "/assets/eye.svg"
                      }
                      alt=""
                      width={20}
                      height={20}
                    />
                  </IconButton>
                </InputAdornment>
              }
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Button
              color="secondary"
              onClick={generatePassword}
              sx={{
                alignSelf: "flex-end",
                height: "20px",
              }}
              fontSize="12px"
            >
              Generate password
            </Button>
            <ValidationRule valid={validLength} label="8–20 characters" />
            <ValidationRule
              valid={validUpperCase}
              label="At least one uppercase letter"
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            pb: "8px",
          }}
        >
          {errorMessage && (
            <span
              style={{
                fontFamily: Fonts.main,
                fontSize: "12px",
                color: Colors.red,
                textAlign: "left",
              }}
            >
              {errorMessage}
            </span>
          )}
          <Box
            sx={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
          >
            <Button color="secondary" onClick={handleClose} sx={{ px: "28px" }}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleCreate}
              outfit
              sx={{ px: "20px" }}
              disabled={!isValid || isPending}
            >
              Create New Employee
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default CreateEmployeeDialog;
