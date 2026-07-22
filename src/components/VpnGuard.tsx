import { useEffect, useState, type ReactNode } from "react";
import { Dialog, Typography } from "@mui/material";
import { Colors } from "../theme";
import useAuth from "../hooks/useAuth";

const CHECK_INTERVAL_MS = 3000;
const GRACE_PERIOD_MS = 10000;

export default function VpnGuard() {
  const { authenticated, logout } = useAuth();
  const [vpnActive, setVpnActive] = useState(false);

  useEffect(() => {
    if (!window.api?.checkVpn) return;

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
  }, []);

  if (!vpnActive) return null;

  // Pre-login there's no session to expire, so just block access without a
  // countdown/grace period. Switching component type on login/logout forces a
  // fresh mount, so the countdown always restarts from GRACE_PERIOD_MS.
  if (!authenticated) {
    return (
      <VpnDialog description="VPN connections are not allowed. Please disable your VPN to log in." />
    );
  }
  return <VpnCountdownOverlay onExpire={logout} />;
}

function VpnDialog({
  description,
  extra,
}: {
  description: ReactNode;
  extra?: ReactNode;
}) {
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
          },
        },
      }}
    >
      <Typography variant="h5" fontWeight={700} mb={1}>
        VPN Detected
      </Typography>
      <Typography color="text.secondary" mb={3}>
        {description}
      </Typography>
      {extra}
    </Dialog>
  );
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
    <VpnDialog
      description="Using a VPN while signed in is not allowed. Disable it now or you will be signed out automatically."
      extra={
        <Typography variant="h2" fontWeight={700} color={Colors.vividOrange}>
          {secondsLeft}
        </Typography>
      }
    />
  );
}
