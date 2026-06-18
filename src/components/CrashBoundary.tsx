import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
import { crashLogger } from "../services/CrashLogger";
import { Colors } from "../theme";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class CrashBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void crashLogger.log({
      eventType: "react-error-boundary",
      severity: "fatal",
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: Colors.mistWhite,
          p: 3,
        }}
      >
        <Box
          sx={{
            width: "min(520px, 100%)",
            bgcolor: Colors.white,
            border: `1px solid ${Colors.borderGray}`,
            borderRadius: 3,
            p: 4,
            boxShadow: "0 24px 80px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Typography variant="h5" fontWeight={700} mb={1}>
            Something went wrong
          </Typography>
          <Typography color="text.secondary" mb={3}>
            The crash was logged for support. Please reload the app and continue
            your workflow.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload app
          </Button>
        </Box>
      </Box>
    );
  }
}
