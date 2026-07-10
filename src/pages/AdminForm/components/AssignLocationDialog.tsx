import { useState } from "react";
import { Box } from "@mui/system";
import { Collapse, OutlinedInput } from "@mui/material";
import styled from "@emotion/styled";
import FormDialog from "../../../components/FormDialog";
import Button from "../../../components/Button";
import SuccessDialog from "../../../components/SuccessDialog";
import RadioButtonGroup from "../../../components/RadioButtonGroup";
import RangeCalendar, { type MaybeDayjs } from "./DateRangePicker";
import useAssignLocationForm from "../hooks/useAssignLocationForm";
import { addLocationRecord } from "../hooks/useLocationRecords";
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
  const [dateRange, setDateRange] = useState<[MaybeDayjs, MaybeDayjs]>([
    null,
    null,
  ]);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { fields, errors, isValid, setField, validate, reset } =
    useAssignLocationForm();

  const isTemporary = employeeType === "temporary";
  const isRangeValid =
    !isTemporary || (dateRange[0] !== null && dateRange[1] !== null);

  const clearForm = () => {
    setEmployeeType("permanent");
    setDateRange([null, null]);
    setDateRangeError(null);
    reset();
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  const handleAssign = () => {
    if (employeeId === undefined) return;
    const fieldsValid = validate();
    setDateRangeError(isRangeValid ? null : "Select a temporary period");
    if (!fieldsValid || !isRangeValid) return;
    addLocationRecord(employeeId, { employeeType, dateRange, ...fields });
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
        <Collapse in={employeeType === "temporary"} unmountOnExit>
          <Box>
            <Label>Temporary Period</Label>
            <RangeCalendar
              defaultRange={dateRange}
              onApply={(range) => {
                setDateRange(range);
                setDateRangeError(null);
              }}
            />
            {dateRangeError && <ErrorText>{dateRangeError}</ErrorText>}
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
            disabled={employeeId === undefined || !isValid || !isRangeValid}
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
