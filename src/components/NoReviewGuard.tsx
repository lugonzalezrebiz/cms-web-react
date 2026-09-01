import { Dialog, Typography } from "@mui/material";
import { Colors } from "../theme";
import Button from "./Button";

type NoReviewReason = "no-trackers" | "no-groups" | "no-events";

interface NoReviewGuardProps {
  onGoBack: () => void;
  reason?: NoReviewReason;
}

const MESSAGES: Record<NoReviewReason, { title: string; body: string }> = {
  "no-trackers": {
    title: "No Trackers Configured",
    body: "This location has no trackers configured, so there is nothing to review. Please set up the trackers first.",
  },
  "no-groups": {
    title: "No Groups Configured",
    body: "This location has no tracker groups configured, so there is nothing to review. Please set up the groups first.",
  },
  "no-events": {
    title: "No Events Found",
    body: "This assignment has no recorded events to review. Please go back and select a different assignment.",
  },
};

export default function NoReviewGuard({
  onGoBack,
  reason,
}: NoReviewGuardProps) {
  if (!reason) return null;

  const { title, body } = MESSAGES[reason];

  return (
    <Dialog
      open
      disableEscapeKeyDown
      onClose={(_event, closeReason) => {
        if (closeReason === "backdropClick" || closeReason === "escapeKeyDown")
          return;
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
        {title}
      </Typography>
      <Typography color="text.secondary" mb={3}>
        {body}
      </Typography>

      <Button fullWidth outfit square onClick={onGoBack}>
        Go Back
      </Button>
    </Dialog>
  );
}
