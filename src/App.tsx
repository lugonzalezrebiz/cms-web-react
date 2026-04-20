import { useEffect, useState } from "react";
import RenderPage from "./components/RenderPage";
import { useMediaQuery } from "@mui/material";
import { Breakpoints, Colors } from "./theme";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import useAuth from "./hooks/useAuth";
import type { ReactNode } from "react";
import AdminForm from "./pages/AdminForm";
import { REVIEWER_ROLE, ADMIN_ROLE, AGENT_ROLE } from "./config";
import Assigments from "./pages/Assignments";
import Monitor from "./pages/Monitor";


function ProtectedRole({
  roles,
  children,
}: {
  roles: number[];
  children: ReactNode;
}) {
  const { authenticated, user } = useAuth();
  if (!authenticated) return <Navigate to="/" replace />;
  if (user && !roles.includes(user.roleID)) {
    return <Navigate to="/"replace />;
  }
  return <>{children}</>;
}

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();

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
        path="/monitor"
        element={
          <ProtectedRole roles={[REVIEWER_ROLE, AGENT_ROLE]}>
            <RenderPage
              drawerOpen={drawerOpen}
              toggleDrawer={toggleDrawer}
              isMobile={isMobile}
              allowGoBack
            >
              <Monitor />
            </RenderPage>
          </ProtectedRole>
        }
      />
      <Route
        path="/assignments"
        element={user && user.roleID === ADMIN_ROLE ? (
          <ProtectedRole roles={[ADMIN_ROLE]}>
            <RenderPage
              drawerOpen={drawerOpen}
              toggleDrawer={toggleDrawer}
              isMobile={isMobile}
              >
                <AdminForm />
            </RenderPage>
          </ProtectedRole>
        ) : (
          <ProtectedRole roles={[REVIEWER_ROLE, AGENT_ROLE]}>
            <RenderPage
              drawerOpen={drawerOpen}
              toggleDrawer={toggleDrawer}
              isMobile={isMobile}
            >
              <Assigments />
            </RenderPage>
          </ProtectedRole>
        )}
      />
      
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
