import {
  Autocomplete,
  Collapse,
  OutlinedInput,
  TextField,
} from "@mui/material";
import { Box, Grid } from "@mui/system";
import styled from "@emotion/styled";
import dayjs from "dayjs";
import FormDialog from "../../../components/FormDialog";
import Button from "../../../components/Button";
import SuccessDialog from "../../../components/SuccessDialog";
import RadioButtonGroup from "../../../components/RadioButtonGroup";
import CalendarComponent from "../../../components/CalendarComponent";
import useAssignLocationDialog, {
  COUNTRY_OPTIONS,
  EMPLOYEE_TYPE_OPTIONS,
} from "../hooks/useAssignLocationDialog";
import LocationMap from "./LocationMap";
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

const StyledAutocomplete = styled(Autocomplete)({
  "&& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontFamily: Fonts.main,
    fontSize: "14px",
    minHeight: "44px",
    padding: "0 39px 0 14px",
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
  },
  "&& .MuiAutocomplete-input": {
    padding: "0 !important",
  },
}) as typeof Autocomplete;

const popupIcon = <img src="./assets/chevron-down-2.svg" alt="" />;

const autocompleteSlotProps = {
  paper: {
    sx: {
      borderRadius: "8px",
      boxShadow: "0 2px 10px 0 rgba(0, 0, 0, 0.16)",
      marginTop: "4px",
    },
  },
  listbox: {
    sx: {
      scrollbarWidth: "0px",
      "&::-webkit-scrollbar": {
        width: "0px",
      },
      maxHeight: "240px",
      padding: "4px",
      "& .MuiAutocomplete-option": {
        fontFamily: Fonts.main,
        fontSize: "14px",
        color: Colors.dimGray,
        borderRadius: "6px",
        padding: "10px 14px",
        '&[aria-selected="true"]': {
          backgroundColor: Colors.transparentVividOrange,
          color: Colors.vividOrange,
        },
        "&.Mui-focused": {
          backgroundColor: Colors.transparentVividOrange,
          color: Colors.vividOrange,
        },
      },
    },
  },
};

const AssignLocationDialog = ({
  open,
  onClose,
  employeeId,
}: AssignLocationDialogProps) => {
  const {
    employeeType,
    setEmployeeType,
    isTemporary,
    dueDate,
    dueDateError,
    handleDueDateChange,
    isDueDateValid,
    fields,
    errors,
    isValid,
    setField,
    countryOption,
    cityOption,
    cityOptions,
    handleCountryChange,
    handleCityChange,
    position,
    handleMapLocationSelect,
    createError,
    isPending,
    showSuccess,
    handleClose,
    handleAssign,
    handleSuccessClose,
  } = useAssignLocationDialog({ employeeId, onClose });

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
        maxWidth="800px"
      >
        <Grid container spacing={2}>
          <Grid size={6}>
            <Box display="flex" flexDirection="column" gap={"12px"}>
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
                    onChange={handleDueDateChange}
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
                <Label>Country</Label>
                <StyledAutocomplete
                  fullWidth
                  size="small"
                  popupIcon={popupIcon}
                  slotProps={autocompleteSlotProps}
                  options={COUNTRY_OPTIONS}
                  value={countryOption}
                  isOptionEqualToValue={(option, value) =>
                    option.code === value.code
                  }
                  getOptionKey={(option) => option.code}
                  onChange={(_event, newValue) =>
                    handleCountryChange(newValue)
                  }
                  renderInput={(params) => (
                    <TextField {...params} error={!!errors.country} />
                  )}
                />
                {errors.country && <ErrorText>{errors.country}</ErrorText>}
              </Box>
              <Box>
                <Label>City/Region</Label>
                <StyledAutocomplete
                  fullWidth
                  size="small"
                  popupIcon={popupIcon}
                  slotProps={autocompleteSlotProps}
                  options={cityOptions}
                  value={cityOption}
                  disabled={!countryOption}
                  isOptionEqualToValue={(option, value) =>
                    option.code === value.code
                  }
                  getOptionKey={(option) => option.code}
                  onChange={(_event, newValue) => handleCityChange(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} error={!!errors.cityRegion} />
                  )}
                />
                {errors.cityRegion && (
                  <ErrorText>{errors.cityRegion}</ErrorText>
                )}
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
                {errors.addressLine1 && (
                  <ErrorText>{errors.addressLine1}</ErrorText>
                )}
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
                {errors.addressLine2 && (
                  <ErrorText>{errors.addressLine2}</ErrorText>
                )}
              </Box>
              {createError && <ErrorText>{createError}</ErrorText>}
            </Box>
          </Grid>
          <Grid size={6}>
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <LocationMap
                position={position}
                onLocationSelect={handleMapLocationSelect}
                height="437px"
              />
            </Box>
          </Grid>
        </Grid>
        <Box
          sx={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
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
              employeeId === undefined ||
              !isValid ||
              !isDueDateValid ||
              isPending
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
