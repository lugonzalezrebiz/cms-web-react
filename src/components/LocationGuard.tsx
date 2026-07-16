import { useState } from "react";
import { Box, Typography } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import Button from "./Button";

interface LocationGuardProps {
  onRetry: () => void;
  onDismiss: () => void;
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
const canOpenSettings = typeof window !== "undefined" && !!window.api?.openLocationSettings;

export default function LocationGuard({ onRetry, onDismiss }: LocationGuardProps) {
  const [opening, setOpening] = useState(false);

  const handleOpenSettings = async () => {
    if (!window.api?.openLocationSettings) return;
    setOpening(true);
    try {
      await window.api.openLocationSettings();
    } finally {
      setOpening(false);
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "grid",
        placeItems: "center",
        bgcolor: Colors.mistWhite,
        p: 3,
      }}
    >
      <Box
        sx={{
          width: "min(480px, 100%)",
          bgcolor: Colors.white,
          border: `1px solid ${Colors.borderGray}`,
          borderRadius: 3,
          p: 4,
          textAlign: "center",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.08)",
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={1}>
          Location access required
        </Typography>
        <Typography color="text.secondary" mb={3}>
          {canOpenSettings
            ? "Enable location services for this app to log in."
            : "Enable location permissions for this site in your browser to log in."}
        </Typography>

        {canOpenSettings && (
          <Button
            fullWidth
            outfit
            square
            disabled={opening}
            onClick={handleOpenSettings}
            style={{ marginBottom: "10px" }}
          >
            {opening ? "Opening settings..." : "Open Location Settings"}
          </Button>
        )}

        <Button
          fullWidth
          outfit
          square
          color="secondary"
          onClick={onRetry}
        >
          Try Again
        </Button>

        <Box display="flex" justifyContent="center">
          <LinkLabel type="button" onClick={onDismiss}>
            Cancel
          </LinkLabel>
        </Box>
      </Box>
    </Box>
  );
}
