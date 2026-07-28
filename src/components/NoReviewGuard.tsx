import { Dialog, Typography } from "@mui/material";
import { Colors } from "../theme";
import Button from "./Button";

interface NoReviewGuardProps {
  open: boolean;
  onGoBack: () => void;
}

export default function NoReviewGuard({ open, onGoBack }: NoReviewGuardProps) {
  if (!open) return null;

  return (
    <Dialog
      open
      disableEscapeKeyDown
      onClose={(_event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
      }}
      slotProps={{
        paper: {
          sx: {
            width: "min(480px, 100%)",
            border: `1px solid ${Colors.borderGray}`,
            borderRadius: 3,
            p: 4,
            textAlign: "center",
            boxShadow: "0 24px 80px rgba(15, 23, 42, 0.08)",
            m: 3,
          },
        },
        backdrop: {
          sx: {
            backdropFilter: "blur(4px)",
            bgcolor: Colors.semiTransparentBlackTwo,
          },
        },
      }}
    >
      <Typography variant="h5" fontWeight={700} mb={1}>
        Nothing to Review
      </Typography>
      <Typography color="text.secondary" mb={3}>
        There are no AI-flagged events for this assignment. Please go back
        and select a different assignment.
      </Typography>

      <Button fullWidth outfit square onClick={onGoBack}>
        Go Back
      </Button>
    </Dialog>
  );
}
