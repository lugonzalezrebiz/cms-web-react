import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Country, City, State } from "country-state-city";
import useAssignLocationForm from "./useAssignLocationForm";
import useCreateApprovedLocation from "./useCreateApprovedLocation";
import useAddressGeocoding from "./useAddressGeocoding";
import type { ResolvedLocation } from "./useAddressGeocoding";
import { stringSimilarity } from "../utils/stringSimilarity";

const ADDRESS_SIMILARITY_THRESHOLD = 0.5;

export interface SelectOption {
  label: string;
  code: string;
  /** Value submitted to the backend; falls back to `label` when omitted (e.g. countries). */
  value?: string;
}

export const COUNTRY_OPTIONS: SelectOption[] = Country.getAllCountries().map(
  (country) => ({ label: country.name, code: country.isoCode }),
);

export const EMPLOYEE_TYPE_OPTIONS = [
  { value: "permanent", label: "Permanent" },
  { value: "temporary", label: "Temporary" },
];

interface UseAssignLocationDialogParams {
  employeeId?: number;
  onClose: () => void;
}

const useAssignLocationDialog = ({
  employeeId,
  onClose,
}: UseAssignLocationDialogParams) => {
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
    const stateNameByCode = new Map(
      State.getStatesOfCountry(countryOption.code).map((state) => [
        state.isoCode,
        state.name,
      ]),
    );
    return (City.getCitiesOfCountry(countryOption.code) ?? []).map(
      (city, index) => {
        const stateName = stateNameByCode.get(city.stateCode);
        return {
          label: stateName ? `${city.name}, ${stateName}` : city.name,
          code: `${city.name}-${city.stateCode}-${index}`,
          value: city.name,
        };
      },
    );
  }, [countryOption]);

  const geocodeQuery = fields.addressLine1.trim()
    ? [fields.addressLine1, fields.addressLine2, fields.cityRegion, fields.country]
        .filter((part) => part.trim().length > 0)
        .join(", ")
    : "";

  const handleLocationResolved = (resolved: ResolvedLocation) => {
    const isSameAddress =
      stringSimilarity(fields.addressLine1, resolved.address) >=
      ADDRESS_SIMILARITY_THRESHOLD;
    if (!isSameAddress) {
      setField("addressLine1", resolved.address);
    }
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
    const matchedState = matchedCity
      ? State.getStateByCodeAndCountry(matchedCity.stateCode, matchedCountry.code)
      : undefined;
    const cityOpt: SelectOption = matchedCity
      ? {
          label: matchedState
            ? `${matchedCity.name}, ${matchedState.name}`
            : matchedCity.name,
          code: `${matchedCity.name}-${matchedCity.stateCode}`,
          value: matchedCity.name,
        }
      : { label: resolved.city, code: "custom", value: resolved.city };
    setCityOption(cityOpt);
    setField("cityRegion", cityOpt.value ?? cityOpt.label);
  };

  const {
    position,
    handleLocationSelect: handleMapLocationSelect,
    resetPosition,
  } = useAddressGeocoding(geocodeQuery, handleLocationResolved);

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

  const handleDueDateChange = (date: Date | null) => {
    setDueDate(date);
    setDueDateError(null);
  };

  const handleCountryChange = (newValue: SelectOption | null) => {
    setCountryOption(newValue);
    setField("country", newValue?.label ?? "");
    setCityOption(null);
    setField("cityRegion", "");
  };

  const handleCityChange = (newValue: SelectOption | null) => {
    setCityOption(newValue);
    setField("cityRegion", newValue?.value ?? newValue?.label ?? "");
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
      ...(position
        ? { latitude: position.lat, longitude: position.lng }
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

  return {
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
  };
};

export default useAssignLocationDialog;
