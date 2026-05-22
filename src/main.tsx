import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/Auth.tsx";
import CrashBoundary from "./components/CrashBoundary.tsx";
import { crashLogger } from "./services/CrashLogger.ts";

crashLogger.install();

const queryClient = new QueryClient();
const Router =
  window.location.protocol === "file:" ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <CrashBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </CrashBoundary>
      </Router>
    </QueryClientProvider>
  </StrictMode>,
);
