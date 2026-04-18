import { useEffect, useState } from "react";
import RenderPage from "./components/RenderPage";
import { useMediaQuery } from "@mui/material";
import { Breakpoints, Colors } from "./theme";
import Dashboard from "./pages/Dashboard";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import useAuth from "./hooks/useAuth";
import type { ReactNode } from "react";
import AdminForm from "./pages/AdminForm";
import { REVIEWER_ROLE, ADMIN_ROLE } from "./config";
import Monitor from "./pages/Monitor";

function ProtectedRole({
  role,
  children,
}: {
  role: number;
  children: ReactNode;
}) {
  const { authenticated, user } = useAuth();
  if (!authenticated) return <Navigate to="/login" replace />;
  if (user && user.roleID !== role) {
    const fallback = user.roleID === ADMIN_ROLE ? "/admin-form" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("1");

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);
  const isMobile = useMediaQuery(Breakpoints.lg);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.height = "100%";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.height = "100%";
    document.documentElement.style.backgroundColor = Colors.ghostoffWhite;
    const root = document.getElementById("root");
    if (root) {
      root.style.height = "100%";
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRole role={REVIEWER_ROLE}>
            <RenderPage
              drawerOpen={drawerOpen}
              toggleDrawer={toggleDrawer}
              isMobile={isMobile}
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
            >
              <Dashboard
                onTabChange={setSelectedTab}
                selectedTab={selectedTab}
                drawerOpen={drawerOpen}
              />
            </RenderPage>
          </ProtectedRole>
        }
      />
      <Route
        path="/monitor"
        element={
          <ProtectedRole role={REVIEWER_ROLE}>
            <RenderPage
              drawerOpen={drawerOpen}
              toggleDrawer={toggleDrawer}
              isMobile={isMobile}
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
            >
              {/* <Dashboard
                onTabChange={setSelectedTab}
                selectedTab={selectedTab}
                drawerOpen={drawerOpen}
              /> */}
              <Monitor />
            </RenderPage>
          </ProtectedRole>
        }
      />
      <Route
        path="/admin-form"
        element={
          <ProtectedRole role={ADMIN_ROLE}>
            <RenderPage
              drawerOpen={drawerOpen}
              toggleDrawer={toggleDrawer}
              isMobile={isMobile}
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
            >
              <AdminForm />
            </RenderPage>
          </ProtectedRole>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
