import { useEffect, useState } from "react";
import RenderPage from "./components/RenderPage";
import { useMediaQuery } from "@mui/material";
import { Breakpoints, Colors } from "./theme";
import Dashboard from "./pages/Dashboard";
import { Navigate, Route, Routes } from "react-router-dom";

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);
  const isMobile = useMediaQuery(Breakpoints.lg);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.backgroundColor = Colors.ghostoffWhite;
  }, []);

  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <RenderPage
            drawerOpen={drawerOpen}
            toggleDrawer={toggleDrawer}
            isMobile={isMobile}
          >
            <Dashboard />
          </RenderPage>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
