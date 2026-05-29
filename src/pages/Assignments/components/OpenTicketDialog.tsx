import { useRef, useState } from "react";
import { Box } from "@mui/system";
import { TextareaAutosize } from "@mui/material";
import SelectComponent from "../../../components/SelectComponent";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import styled from "@emotion/styled";
import FormDialog from "../../../components/FormDialog";
import Divider from "../../../components/Divider";
import Button from "../../../components/Button";
import { Colors, Fonts } from "../../../theme";
import type { Assignment } from "../../../hooks/useAssignments";
import useTicketValidation from "../hooks/useTicketValidation";
import useIssueTypes from "../hooks/useIssueTypes";
import useOpenTicket from "../hooks/useOpenTicket";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedAssignment: Assignment;
}

const StyledTextarea = styled(TextareaAutosize)<{ hasError?: boolean }>(
  ({ hasError }) => ({
    width: "100%",
    fontFamily: Fonts.secondary,
    fontSize: "16px",
    color: Colors.lightBlack,
    border: `1px solid ${hasError ? Colors.red : Colors.paleSteal}`,
    borderRadius: "4px",
    padding: "12px",
    resize: "none",
    boxSizing: "border-box",
    outline: "none",
    overflowY: "auto",
    height: "101px",
    "&::-webkit-scrollbar": { display: "none" },
    scrollbarWidth: "none",
  }),
);

const FieldLabel = styled("p")({
  margin: "0 0 6px 0",
  fontFamily: Fonts.secondary,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.charcoalNavy,
  lineHeight: 1.43,
  height: "20px",
});

const ErrorText = styled("p")({
  margin: "4px 0 0 0",
  fontFamily: Fonts.main,
  fontSize: "12px",
  color: Colors.red,
});

const OpenTicketDialog = ({
  open,
  onClose,
  onSuccess,
  selectedAssignment,
}: Props) => {
  const { options: issueTypeOptions } = useIssueTypes();
  const { submit, isPending, submitError, clearError } = useOpenTicket();
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [issueTypeTouched, setIssueTypeTouched] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [fileTouched, setFileTouched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { issueTypeError, descriptionError, fileError, isValid } =
    useTicketValidation({
      issueType,
      description,
      file,
    });

  const handleClose = () => {
    setIssueType("");
    setDescription("");
    setFile(null);
    setIssueTypeTouched(false);
    setDescriptionTouched(false);
    setFileTouched(false);
    clearError();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setFileTouched(true);
  };

  const handleSubmit = async () => {
    const ok = await submit({
      companyID: selectedAssignment.location,
      locationID: selectedAssignment.store,
      monitoringID: selectedAssignment.monitoringID,
      statusID: selectedAssignment.statusID,
      issueTypeID: Number(issueType),
      description,
      file,
    });
    if (ok) {
      onClose();
      onSuccess();
    }
  };

  const handleIssueTypeChange = (value: string) => {
    setIssueType(value);
    setIssueTypeTouched(true);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(e.target.value);
    setDescriptionTouched(true);
  };

  const showIssueTypeError = issueTypeTouched && !!issueTypeError;
  const showDescriptionError = descriptionTouched && !!descriptionError;
  const showFileError = fileTouched && !!fileError;

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      maxWidth="500px"
      assignment={selectedAssignment}
    >
      <Box display="flex" flexDirection="column" gap="16px">
        <Box
          sx={{
            fontFamily: Fonts.main,
            fontSize: "16px",
            fontWeight: 500,
            color: Colors.charcoalNavy,
            height: "24px",
            lineHeight: 1.5,
          }}
        >
          Open Ticket
          <Divider marginBottom="0" />
        </Box>

        <Box>
          <FieldLabel>Select most appropriate Issue type</FieldLabel>
          <SelectComponent
            filters={issueTypeOptions}
            filter={issueType}
            setFilter={handleIssueTypeChange}
            size="100%"
            font="secondary"
          />
          {showIssueTypeError && <ErrorText>{issueTypeError}</ErrorText>}
          <FieldLabel style={{ marginTop: "8px" }}>
            Provide an specific description of the issue
          </FieldLabel>
          <StyledTextarea
            minRows={4}
            maxRows={8}
            value={description}
            onChange={handleDescriptionChange}
            hasError={showDescriptionError}
          />
          {showDescriptionError && <ErrorText>{descriptionError}</ErrorText>}
        </Box>

        <Box>
          <FieldLabel>Attach a file</FieldLabel>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Button
              color="secondary"
              onClick={() => fileInputRef.current?.click()}
              startIcon={<FileUploadOutlinedIcon />}
              outfit
              fontSize="14px"
              sx={{ marginTop: "2px" }}
            >
              Browse file
            </Button>
            {file && (
              <span
                style={{
                  fontFamily: Fonts.secondary,
                  fontSize: "14px",
                  color: Colors.dimGray,
                }}
              >
                {file.name}
              </span>
            )}
          </Box>
          {showFileError && <ErrorText>{fileError}</ErrorText>}
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "8px",
        }}
      >
        {submitError && (
          <ErrorText style={{ textAlign: "left", width: "100%" }}>
            {submitError}
          </ErrorText>
        )}
        <Box sx={{ display: "flex", gap: "10px" }}>
          <Button
            fontSize="14px"
            outfit
            color="secondary"
            onClick={handleClose}
            sx={{ height: "32px" }}
          >
            Cancel
          </Button>
          <Button
            fontSize="14px"
            outfit
            color="primary"
            disabled={!isValid || isPending}
            onClick={handleSubmit}
            sx={{ height: "32px" }}
          >
            Submit Ticket
          </Button>
        </Box>
      </Box>
    </FormDialog>
  );
};

export default OpenTicketDialog;
