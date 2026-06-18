import { Box } from "@mui/system";
import FormDialog from "../../../components/FormDialog";
import Button from "../../../components/Button";
import SelectComponent from "../../../components/SelectComponent";
import SuccessDialog from "../../../components/SuccessDialog";
import useCompanies from "../../../hooks/useCompanies";
import useAssignUserLocation from "../hooks/useAssignUserLocation";
import { useState } from "react";
import { Label, ErrorText } from "./StyledComponents";

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
  employeeId?: number;
}

const AssignDialog = ({ open, onClose, employeeId }: AssignDialogProps) => {
  const [company, setCompany] = useState("");
  const [store, setStore] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { companyFilters, getStoreFilters } = useCompanies();

  const clearForm = () => {
    setCompany("");
    setStore("");
  };

  const {
    assign,
    validateField,
    fieldErrors,
    isFormValid,
    reset,
    isPending,
    errorMessage,
  } = useAssignUserLocation({
    onSuccess: () => {
      clearForm();
      setShowSuccess(true);
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

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
  };

  return (
    <>
      <SuccessDialog
        open={showSuccess}
        onClose={handleSuccessClose}
        message="User assigned successfully."
      />
      <FormDialog
        title="Assign Assignment"
        open={open && !showSuccess}
        onClose={handleClose}
        gap={"12px"}
      >
        <Box>
          <Label>Company</Label>
          <SelectComponent
            filters={companyFilters}
            filter={effectiveCompany}
            setFilter={handleSetCompany}
            size="100%"
          />
          {fieldErrors.company && <ErrorText>{fieldErrors.company}</ErrorText>}
        </Box>
        <Box>
          <Label>Store</Label>
          <SelectComponent
            filters={getStoreFilters(effectiveCompany)}
            filter={store}
            setFilter={handleSetStore}
            size="100%"
          />
          {fieldErrors.store && <ErrorText>{fieldErrors.store}</ErrorText>}
        </Box>
        {errorMessage && (
          <Box
            sx={{ color: Colors.red, fontSize: "12px", fontFamily: Fonts.main }}
          >
            {errorMessage}
          </Box>
        )}
        <Box sx={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
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
              isPending ||
              employeeId === undefined ||
              !isFormValid(effectiveCompany, store)
            }
            outfit
          >
            {isPending ? "Loading..." : "Assign"}
          </Button>
        </Box>
      </FormDialog>
    </>
  );
};

export default AssignDialog;
