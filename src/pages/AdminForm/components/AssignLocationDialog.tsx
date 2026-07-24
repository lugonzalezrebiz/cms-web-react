import { useMemo, useState } from "react";
import { Box, Grid } from "@mui/system";
import { Collapse, OutlinedInput, TextField } from "@mui/material";
import styled from "@emotion/styled";
import dayjs from "dayjs";
import { Country, City } from "country-state-city";
import FormDialog from "../../../components/FormDialog";
import Button from "../../../components/Button";
import SuccessDialog from "../../../components/SuccessDialog";
import RadioButtonGroup from "../../../components/RadioButtonGroup";
import CalendarComponent from "../../../components/CalendarComponent";
import useAssignLocationForm from "../hooks/useAssignLocationForm";
import useCreateApprovedLocation from "../hooks/useCreateApprovedLocation";
import useAddressGeocoding from "../hooks/useAddressGeocoding";
import type { LatLng, ResolvedLocation } from "../hooks/useAddressGeocoding";
import LocationMap from "./LocationMap";
import StyledAutocomplete from "./StyledAutocomplete";
import { Label, ErrorText } from "./StyledComponents";
import { Colors, Fonts } from "../../../theme";

interface SelectOption {
  label: string;
  code: string;
}

const COUNTRY_OPTIONS: SelectOption[] = Country.getAllCountries().map(
  (country) => ({ label: country.name, code: country.isoCode }),
);

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
  const [countryOption, setCountryOption] = useState<SelectOption | null>(
    null,
  );
  const [cityOption, setCityOption] = useState<SelectOption | null>(null);

  const cityOptions: SelectOption[] = useMemo(() => {
    if (!countryOption) return [];
    return (City.getCitiesOfCountry(countryOption.code) ?? []).map(
      (city, index) => ({
        label: city.name,
        code: `${city.name}-${city.stateCode}-${index}`,
      }),
    );
  }, [countryOption]);

  const geocodeQuery = [
    fields.addressLine1,
    fields.addressLine2,
    fields.cityRegion,
    fields.country,
  ]
    .filter((part) => part.trim().length > 0)
    .join(", ");

  const handleLocationResolved = (resolved: ResolvedLocation) => {
    setField("addressLine1", resolved.address);
    if (!resolved.countryCode) return;
    const matchedCountry = COUNTRY_OPTIONS.find(
      (option) =>
        option.code.toLowerCase() === resolved.countryCode?.toLowerCase(),
    );
    if (!matchedCountry) return;
    setCountryOption(matchedCountry);
    setField("country", matchedCountry.label);

    if (!resolved.city) {
      setCityOption(null);
      setField("cityRegion", "");
      return;
    }
    const citiesOfCountry = City.getCitiesOfCountry(matchedCountry.code) ?? [];
    const matchedCity = citiesOfCountry.find(
      (city) => city.name.toLowerCase() === resolved.city?.toLowerCase(),
    );
    const cityOpt: SelectOption = matchedCity
      ? {
          label: matchedCity.name,
          code: `${matchedCity.name}-${matchedCity.stateCode}`,
        }
      : { label: resolved.city, code: "custom" };
    setCityOption(cityOpt);
    setField("cityRegion", cityOpt.label);
  };

  const {
    position,
    suggestions,
    selectSuggestion,
    handleLocationSelect,
    resetPosition,
  } = useAddressGeocoding(geocodeQuery, handleLocationResolved);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<LatLng | null>(null);

  const isTemporary = employeeType === "temporary";
  const isDueDateValid = !isTemporary || dueDate !== null;

  const clearForm = () => {
    setEmployeeType("permanent");
    setDueDate(null);
    setDueDateError(null);
    setCountryOption(null);
    setCityOption(null);
    clearError();
    reset();
    resetPosition();
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
                <Label>Country</Label>
                <StyledAutocomplete
                  fullWidth
                  size="small"
                  options={COUNTRY_OPTIONS}
                  value={countryOption}
                  isOptionEqualToValue={(option, value) =>
                    option.code === value.code
                  }
                  getOptionKey={(option) => option.code}
                  onChange={(_event, newValue) => {
                    setCountryOption(newValue);
                    setField("country", newValue?.label ?? "");
                    setCityOption(null);
                    setField("cityRegion", "");
                  }}
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
                  options={cityOptions}
                  value={cityOption}
                  disabled={!countryOption}
                  isOptionEqualToValue={(option, value) =>
                    option.code === value.code
                  }
                  getOptionKey={(option) => option.code}
                  onChange={(_event, newValue) => {
                    setCityOption(newValue);
                    setField("cityRegion", newValue?.label ?? "");
                  }}
                  renderInput={(params) => (
                    <TextField {...params} error={!!errors.cityRegion} />
                  )}
                />
                {errors.cityRegion && (
                  <ErrorText>{errors.cityRegion}</ErrorText>
                )}
              </Box>
              <Box sx={{ position: "relative" }}>
                <Label>Address Line 1</Label>
                <StyledInput
                  fullWidth
                  size="small"
                  value={fields.addressLine1}
                  onChange={(e) => setField("addressLine1", e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setShowSuggestions(false)}
                  error={!!errors.addressLine1}
                />
                {errors.addressLine1 && (
                  <ErrorText>{errors.addressLine1}</ErrorText>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 10,
                      mt: "4px",
                      maxHeight: "220px",
                      overflowY: "auto",
                      backgroundColor: Colors.white,
                      border: `1px solid ${Colors.paleGray}`,
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px 0 rgba(16, 24, 40, 0.1)",
                    }}
                  >
                    {suggestions.map((suggestion) => (
                      <Box
                        key={suggestion.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setPreviewPosition(null);
                          selectSuggestion(suggestion);
                        }}
                        onMouseEnter={() =>
                          setPreviewPosition(suggestion.position)
                        }
                        onMouseLeave={() => setPreviewPosition(null)}
                        sx={{
                          padding: "8px 14px",
                          fontFamily: Fonts.main,
                          fontSize: "13px",
                          color: Colors.dimGray,
                          cursor: "pointer",
                          "&:hover": { backgroundColor: Colors.offWhite },
                        }}
                      >
                        {suggestion.label}
                      </Box>
                    ))}
                  </Box>
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
            </Box>
          </Grid>
          <Grid size={6}>
            <LocationMap
              position={previewPosition ?? position}
              onLocationSelect={(newPosition) => {
                setPreviewPosition(null);
                handleLocationSelect(newPosition);
              }}
            />
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
};

export default AssignLocationDialog;
