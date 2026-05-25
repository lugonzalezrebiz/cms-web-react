import { useState } from "react";
import { Box } from "@mui/system";
import { OutlinedInput, FormLabel } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../../theme";
import FormDialog from "../../../components/FormDialog";
import Button from "../../../components/Button";
import EmployeeTypeRadioGroup from "./EmployeeTypeRadioGroup";
import usePasswordValidation from "../../../hooks/usePasswordFormUserValidation";
import useCreateUser from "../hooks/useCreateUser";
import useCreateEmployeeForm from "../hooks/useCreateEmployeeForm";
import { generatePassword } from "../../../utils/generatePassword";
import PasswordInput from "../../../components/PasswordInput";

interface Props {
  open: boolean;
  onClose: () => void;
}

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

const ErrorText = styled("p")({
  margin: "4px 0 0",
  fontFamily: Fonts.secondary,
  fontSize: "12px",
  color: Colors.red,
  lineHeight: 1.4,
});

const CreateEmployeeDialog = ({ open, onClose }: Props) => {
  const [employeeType, setEmployeeType] = useState("monitoring_agent");
  const { fields, errors, isValid, setField, validate, reset } =
    useCreateEmployeeForm();
  const { employeeName, email, userName, password } = fields;

  const { validLength, validUpperCase } = usePasswordValidation({ password });

  const handleClose = () => {
    setEmployeeType("monitoring_agent");
    reset();
    onClose();
  };

  const { createUser, isPending, errorMessage } = useCreateUser({
    onSuccess: handleClose,
  });

  const handleCreate = () => {
    if (!validate()) return;
    createUser({
      username: userName,
      password,
      name: employeeName,
      email,
      employeeType: employeeType as "monitoring_agent" | "reviewer",
    });
  };

  return (
    <FormDialog open={open} onClose={handleClose} title="Create New Employee">
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
          onChange={(e) => setField("employeeName", e.target.value)}
          error={!!errors.employeeName}
        />
        {errors.employeeName && <ErrorText>{errors.employeeName}</ErrorText>}
      </Box>

      <Box>
        <Label>Email</Label>
        <StyledInput
          fullWidth
          size="small"
          type="email"
          value={email}
          onChange={(e) => setField("email", e.target.value)}
          error={!!errors.email}
        />
        {errors.email && <ErrorText>{errors.email}</ErrorText>}
      </Box>

      <Box>
        <Label>User Name</Label>
        <StyledInput
          fullWidth
          size="small"
          value={userName}
          onChange={(e) => setField("userName", e.target.value)}
          error={!!errors.userName}
        />
        {errors.userName && <ErrorText>{errors.userName}</ErrorText>}
      </Box>

      <Box>
        <PasswordInput
          label="Password"
          value={password}
          onChange={(value) => setField("password", value)}
          error={!!errors.password}
          errorText={errors.password}
          onGenerate={() => setField("password", generatePassword())}
          validations={[
            { valid: validLength, label: "8–20 characters" },
            { valid: validUpperCase, label: "At least one uppercase letter" },
          ]}
        />
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
        <Box sx={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Button
            fontSize="14px"
            sx={{ height: "36px" }}
            color="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            fontSize="14px"
            sx={{ height: "36px" }}
            color="primary"
            onClick={handleCreate}
            outfit
            disabled={!isValid || isPending}
          >
            Create New Employee
          </Button>
        </Box>
      </Box>
    </FormDialog>
  );
};

export default CreateEmployeeDialog;
