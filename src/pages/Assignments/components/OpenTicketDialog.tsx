import { useRef, useState } from "react";
import { Box } from "@mui/system";
import { TextareaAutosize } from "@mui/material";
import SelectComponent from "../../../components/SelectComponent";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import styled from "@emotion/styled";
import Dialog from "../../../components/Dialog";
import Divider from "../../../components/Divider";
import Button from "../../../components/Button";
import { Colors, Fonts } from "../../../theme";
import { stateColors } from "./stateColors";
import type { Assignment } from "./InfoAssignment";
import useTicketValidation from "../hooks/useTicketValidation";
import useIssueTypes from "../hooks/useIssueTypes";
import useOpenTicket from "../hooks/useOpenTicket";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedAssignment: Assignment;
}

const AssignmentSubText = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.charcoalNavy,
  lineHeight: 1.43,
  margin: 0,
  height: "20px",
});

const AssignmentTitle = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "20px",
  fontWeight: 500,
  color: Colors.charcoalNavy,
  margin: "0 3px 0 0",
  lineHeight: 1.5,
  height: "30px",
});

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

const OpenTicketDialog = ({ open, onClose, onSuccess, selectedAssignment }: Props) => {
  const { options: issueTypeOptions } = useIssueTypes();
  const { submit, isPending, submitError, clearError } = useOpenTicket();
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [issueTypeTouched, setIssueTypeTouched] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { issueTypeError, descriptionError, isValid } = useTicketValidation({
    issueType,
    description,
  });

  const handleClose = () => {
    setIssueType("");
    setDescription("");
    setFile(null);
    setIssueTypeTouched(false);
    setDescriptionTouched(false);
    clearError();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="576px" padding="16px">
      <Box display={"flex"} flexDirection={"column"} gap={"16px"}>
        <Box>
          <Box
            onClick={handleClose}
            sx={{ position: "absolute", top: 16, right: 16, cursor: "pointer" }}
          >
            <img src="./assets/x-close.svg" alt="Close" />
          </Box>
          <Box height="20px" sx={{ display: "flex", alignItems: "center" }}>
            <img
              style={{ margin: "0 6px 0 0" }}
              src="./assets/building-07.svg"
              alt="Location"
            />
            <AssignmentSubText style={{ marginRight: "18px" }}>
              {selectedAssignment.location}
            </AssignmentSubText>
            <img
              style={{ margin: "0 6px 0 0" }}
              src="./assets/building-02.svg"
              alt="Store"
            />
            <AssignmentSubText>{selectedAssignment.store}</AssignmentSubText>
          </Box>
          <Box
            height="30px"
            display="flex"
            flexDirection="row"
            alignItems="center"
          >
            <AssignmentTitle>{selectedAssignment.date}</AssignmentTitle>
            <Box
              sx={{
                p: "4px 16px",
                border: `1px solid ${stateColors[selectedAssignment.state].border}`,
                borderRadius: "20px",
                bgcolor: stateColors[selectedAssignment.state].bg,
                color: stateColors[selectedAssignment.state].color,
                fontFamily: Fonts.main,
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
              }}
            >
              {selectedAssignment.state}
            </Box>
          </Box>
        </Box>
        <Box display={"flex"} flexDirection={"column"} gap={"16px"}>
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
              placeholder="Select Option"
              value={description}
              onChange={handleDescriptionChange}
              hasError={showDescriptionError}
            />
            {showDescriptionError && <ErrorText>{descriptionError}</ErrorText>}
          </Box>

          <Box>
            <FieldLabel>Attache files if needed</FieldLabel>

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
          {submitError && <ErrorText style={{ margin: 0 }}>{submitError}</ErrorText>}
          <Box sx={{ display: "flex", gap: "10px" }}>
            <Button
              fontSize="14px"
              outfit
              color="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              fontSize="14px"
              outfit
              color="primary"
              disabled={!isValid || isPending}
              onClick={handleSubmit}
            >
              Submit Ticket
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default OpenTicketDialog;
