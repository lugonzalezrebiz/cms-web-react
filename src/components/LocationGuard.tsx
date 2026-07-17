import { Box, Dialog, Typography } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import Button from "./Button";

interface LocationGuardProps {
  open: boolean;
  authenticated: boolean;
  opening: boolean;
  checking: boolean;
  secondsUntilCheck: number;
  onOpenSettings: () => void;
  onCancel: () => void;
}

const LinkLabel = styled("button")({
  appearance: "none",
  background: "transparent",
  border: "none",
  color: Colors.main,
  cursor: "pointer",
  fontFamily: Fonts.main,
  fontWeight: 400,
  fontSize: "14px",
  margin: "10px 0 0 0",
  textDecoration: "none",
});

const canOpenSettings =
  typeof window !== "undefined" && !!window.api?.openLocationSettings;

export default function LocationGuard({
  open,
  authenticated,
  opening,
  secondsUntilCheck,
  onOpenSettings,
  onCancel,
}: LocationGuardProps) {
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
        Enable Location Access
      </Typography>
      <Typography color="text.secondary" mb={3}>
        {authenticated
          ? "Location access has been disabled. Re-enable it to continue using the app, or log out."
          : canOpenSettings
            ? "Enable location services for this app to log in."
            : "Location access is required to use this app."}
      </Typography>

      {canOpenSettings && (
        <Button
          fullWidth
          outfit
          square
          disabled={opening}
          onClick={onOpenSettings}
          style={{ marginBottom: "10px" }}
        >
          {opening ? "Opening settings..." : "Open Location Settings"}
        </Button>
      )}

      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={1}
        mb={2}
      >
        <Typography color="text.secondary" fontSize="14px">
          Rechecking in {secondsUntilCheck}s
        </Typography>
      </Box>

      <Box display="flex" justifyContent="center">
        {authenticated && (
          <LinkLabel type="button" onClick={onCancel}>
            Log Out
          </LinkLabel>
        )}
      </Box>
    </Dialog>
  );
}
