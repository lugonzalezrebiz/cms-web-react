import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Colors } from "../theme";
import useAuth from "../hooks/useAuth";

const CHECK_INTERVAL_MS = 3000;
const GRACE_PERIOD_MS = 10000;

export default function VpnGuard() {
  const { authenticated, logout } = useAuth();
  const [vpnActive, setVpnActive] = useState(false);

  useEffect(() => {
    if (!authenticated || !window.api?.checkVpn) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const active = await window.api.checkVpn();
        if (!cancelled) setVpnActive(active);
      } catch {
        // Ignore transient IPC errors; the next poll will retry.
      }
    };

    poll();
    const interval = setInterval(poll, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [authenticated]);

  // Remounted fresh every time vpnActive flips to true, so the countdown
  // always starts from GRACE_PERIOD_MS without needing a reset effect.
  if (!vpnActive) return null;
  return <VpnCountdownOverlay onExpire={logout} />;
}

function VpnCountdownOverlay({ onExpire }: { onExpire: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(GRACE_PERIOD_MS / 1000);

  useEffect(() => {
    // Timestamp-based so the countdown stays accurate even if the tab is throttled.
    const deadline = Date.now() + GRACE_PERIOD_MS;
    const tick = () => {
      const remaining = deadline - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(remaining / 1000)));
      if (remaining <= 0) onExpire();
    };
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [onExpire]);

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
          VPN detected
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Using a VPN while signed in is not allowed. Disable it now or you will
          be signed out automatically.
        </Typography>
        <Typography variant="h2" fontWeight={700} color={Colors.vividOrange}>
          {secondsLeft}
        </Typography>
      </Box>
    </Box>
  );
}
