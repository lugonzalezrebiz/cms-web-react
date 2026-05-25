import { Colors, Fonts } from "../../../theme";
import { Box } from "@mui/system";
import { FormLabel } from "@mui/material";
import styled from "@emotion/styled";
import FormDialog from "../../../components/FormDialog";
import Button from "../../../components/Button";
import SelectComponent from "../../../components/SelectComponent";
import useCompanies from "../../../hooks/useCompanies";
import useAssignUserLocation from "../hooks/useAssignUserLocation";
import { useState } from "react";

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

const ErrorText = styled("p")({
  margin: "4px 0 0",
  fontFamily: Fonts.secondary,
  fontSize: "12px",
  color: Colors.red,
  lineHeight: 1.4,
});

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
  employeeId?: number;
}

const AssignDialog = ({ open, onClose, employeeId }: AssignDialogProps) => {
  const [company, setCompany] = useState("");
  const [store, setStore] = useState("");
  const { companyFilters, getStoreFilters } = useCompanies();

  const clearForm = () => {
    setCompany("");
    setStore("");
  };

  const { assign, validateField, fieldErrors, isFormValid, reset, isPending, errorMessage } =
    useAssignUserLocation({
      onSuccess: () => {
        clearForm();
        onClose();
      },
    });

  const effectiveCompany = company || companyFilters[0]?.value || "";

  const handleClose = () => {
    clearForm();
    reset();
    onClose();
  };

  const handleSetCompany = (value: string) => {
    setCompany(value);
    setStore("");
    validateField("company", value);
  };

  const handleSetStore = (value: string) => {
    setStore(value);
    validateField("store", value);
  };

  const handleAssign = () => {
    if (employeeId === undefined) return;
    assign(employeeId, effectiveCompany, store);
  };

  return (
    <FormDialog title="Assign Assignment" open={open} onClose={handleClose}>
      <Box>
        <Label>Selected Company</Label>
        <SelectComponent
          filters={companyFilters}
          filter={effectiveCompany}
          setFilter={handleSetCompany}
          size="100%"
        />
        {fieldErrors.company && <ErrorText>{fieldErrors.company}</ErrorText>}
      </Box>
      <Box>
        <Label>Selected Store</Label>
        <SelectComponent
          filters={getStoreFilters(effectiveCompany)}
          filter={store}
          setFilter={handleSetStore}
          size="100%"
        />
        {fieldErrors.store && <ErrorText>{fieldErrors.store}</ErrorText>}
      </Box>
      {errorMessage && (
        <Box sx={{ color: Colors.red, fontSize: "12px", fontFamily: Fonts.main }}>
          {errorMessage}
        </Box>
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
          sx={{ height: "36px", width: "100px" }}
          color="primary"
          onClick={handleAssign}
          disabled={isPending || employeeId === undefined || !isFormValid(effectiveCompany, store)}
          outfit
        >
          {isPending ? "Assigning..." : "Assign"}
        </Button>
      </Box>
    </FormDialog>
  );
};

export default AssignDialog;
