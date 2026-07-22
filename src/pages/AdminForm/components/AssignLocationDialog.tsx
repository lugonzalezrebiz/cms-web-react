import { useState } from "react";
import { Box } from "@mui/system";
import { Collapse, OutlinedInput } from "@mui/material";
import styled from "@emotion/styled";
import dayjs from "dayjs";
import FormDialog from "../../../components/FormDialog";
import Button from "../../../components/Button";
import SuccessDialog from "../../../components/SuccessDialog";
import RadioButtonGroup from "../../../components/RadioButtonGroup";
import CalendarComponent from "../../../components/CalendarComponent";
import useAssignLocationForm from "../hooks/useAssignLocationForm";
import useCreateApprovedLocation from "../hooks/useCreateApprovedLocation";
import { Label, ErrorText } from "./StyledComponents";
import { Colors, Fonts } from "../../../theme";

interface AssignLocationDialogProps {
  open: boolean;
  onClose: () => void;
  employeeId?: number;
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

const EMPLOYEE_TYPE_OPTIONS = [
  { value: "permanent", label: "Permanent" },
  { value: "temporary", label: "Temporary" },
];

const AssignLocationDialog = ({
  open,
  onClose,
  employeeId,
}: AssignLocationDialogProps) => {
  const [employeeType, setEmployeeType] = useState("permanent");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueDateError, setDueDateError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { fields, errors, isValid, setField, validate, reset } =
    useAssignLocationForm();
  const {
    create,
    isPending,
    errorMessage: createError,
    clearError,
  } = useCreateApprovedLocation(employeeId);

  const isTemporary = employeeType === "temporary";
  const isDueDateValid = !isTemporary || dueDate !== null;

  const clearForm = () => {
    setEmployeeType("permanent");
    setDueDate(null);
    setDueDateError(null);
    clearError();
    reset();
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  const handleAssign = async () => {
    if (employeeId === undefined) return;
    const fieldsValid = validate();
    setDueDateError(isDueDateValid ? null : "Select a due date");
    if (!fieldsValid || !isDueDateValid) return;
    const ok = await create({
      phone: fields.phone,
      address_line_1: fields.addressLine1,
      address_line_2: fields.addressLine2,
      country: fields.country,
      city: fields.cityRegion,
      location_type: isTemporary ? "Temporary" : "Permanent",
      ...(isTemporary && dueDate
        ? { due_date: dayjs(dueDate).format("YYYY-MM-DD") }
        : {}),
    });
    if (!ok) return;
    clearForm();
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
  };

  return (
    <>
      <SuccessDialog
        open={showSuccess}
        onClose={handleSuccessClose}
        message="Location created successfully."
      />
      <FormDialog
        title="Create Location"
        open={open && !showSuccess}
        onClose={handleClose}
        gap={"12px"}
      >
        <Box>
          <RadioButtonGroup
            value={employeeType}
            onChange={setEmployeeType}
            options={EMPLOYEE_TYPE_OPTIONS}
          />
        </Box>
        <Collapse in={isTemporary} unmountOnExit>
          <Box>
            <Label>Due Date</Label>
            <CalendarComponent
              selectedDate={dueDate}
              onChange={(date) => {
                setDueDate(date);
                setDueDateError(null);
              }}
              minDate={dayjs()}
              size="100%"
            />
            {dueDateError && <ErrorText>{dueDateError}</ErrorText>}
          </Box>
        </Collapse>
        <Box>
          <Label>Phone number</Label>
          <StyledInput
            fullWidth
            size="small"
            type="tel"
            value={fields.phone}
            onChange={(e) => setField("phone", e.target.value)}
            error={!!errors.phone}
          />
          {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
        </Box>
        <Box>
          <Label>Address Line 1</Label>
          <StyledInput
            fullWidth
            size="small"
            value={fields.addressLine1}
            onChange={(e) => setField("addressLine1", e.target.value)}
            error={!!errors.addressLine1}
          />
          {errors.addressLine1 && <ErrorText>{errors.addressLine1}</ErrorText>}
        </Box>
        <Box>
          <Label>Address Line 2</Label>
          <StyledInput
            fullWidth
            size="small"
            value={fields.addressLine2}
            onChange={(e) => setField("addressLine2", e.target.value)}
            error={!!errors.addressLine2}
          />
          {errors.addressLine2 && <ErrorText>{errors.addressLine2}</ErrorText>}
        </Box>
        <Box>
          <Label>Country</Label>
          <StyledInput
            fullWidth
            size="small"
            value={fields.country}
            onChange={(e) => setField("country", e.target.value)}
            error={!!errors.country}
          />
          {errors.country && <ErrorText>{errors.country}</ErrorText>}
        </Box>
        <Box>
          <Label>City/Region</Label>
          <StyledInput
            fullWidth
            size="small"
            value={fields.cityRegion}
            onChange={(e) => setField("cityRegion", e.target.value)}
            error={!!errors.cityRegion}
          />
          {errors.cityRegion && <ErrorText>{errors.cityRegion}</ErrorText>}
        </Box>
        {createError && <ErrorText>{createError}</ErrorText>}
        <Box
          sx={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            mt: "12px",
          }}
        >
          <Button
            fontSize="14px"
            sx={{ height: "36px" }}
            color="secondary"
            onClick={handleClose}
            outfit
          >
            Cancel
          </Button>
          <Button
            fontSize="14px"
            sx={{ height: "36px", width: "100px" }}
            color="primary"
            onClick={handleAssign}
            disabled={
              employeeId === undefined || !isValid || !isDueDateValid || isPending
            }
            outfit
          >
            Create
          </Button>
        </Box>
      </FormDialog>
    </>
  );
};

export default AssignLocationDialog;
