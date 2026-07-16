import { Box, Dialog, Typography } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import Button from "./Button";

interface LocationGuardProps {
  open: boolean;
  authenticated: boolean;
  opening: boolean;
  onOpenSettings: () => void;
  onRetry: () => void;
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

// Electron builds expose window.api.openLocationSettings; browser builds don't, since
// the browser already owns its own location-permission prompt/padlock UI.
const canOpenSettings =
  typeof window !== "undefined" && !!window.api?.openLocationSettings;

export default function LocationGuard({
  open,
  authenticated,
  opening,
  onOpenSettings,
  onRetry,
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
        Location access required
      </Typography>
      <Typography color="text.secondary" mb={3}>
        {authenticated
          ? "Location access was lost. Re-enable it to keep using the app, or log out."
          : canOpenSettings
            ? "Enable location services for this app to log in."
            : "Enable location permissions for this site in your browser to log in."}
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

      <Button fullWidth outfit square color="secondary" onClick={onRetry}>
        Try Again
      </Button>

      <Box display="flex" justifyContent="center">
        <LinkLabel type="button" onClick={onCancel}>
          {authenticated ? "Log Out" : "Cancel"}
        </LinkLabel>
      </Box>
    </Dialog>
  );
}
