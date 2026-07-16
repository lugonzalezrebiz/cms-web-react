import { useEffect, useState } from "react";
import RenderPage from "./components/RenderPage";
import { useMediaQuery } from "@mui/material";
import { Breakpoints, Colors } from "./theme";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import useAuth from "./hooks/useAuth";
import type { ReactNode } from "react";
import AdminForm from "./pages/AdminForm";
import { REVIEWER_ROLE, ADMIN_ROLE, AGENT_ROLE } from "./config";
import Assignments from "./pages/Assignments";
import Monitor from "./pages/Monitor";
import MonitorTimeline from "./pages/MonitorTimeline";
import MonitorHeader from "./sections/Header/MonitorHeader";
import AdminHeader from "./sections/Header/AdminHeader";
import AssignmentsHeader from "./sections/Header/AssignmentsHeader";
import { MonitorProvider } from "./contexts/MonitorContext";
import UpdatePrompt from "./components/UpdatePrompt";
import VpnGuard from "./components/VpnGuard";
import { LocationGuardProvider } from "./contexts/LocationGuardProvider";
import { crashLogger } from "./services/CrashLogger";

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
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { user, authenticated } = useAuth();
    const location = useLocation();

    const toggleDrawer = () => setDrawerOpen((prev) => !prev);
    const isMobile = useMediaQuery(Breakpoints.lg);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        crashLogger.setWorkflow({
            route: `${location.pathname}${location.search}${location.hash}`,
            monitoringID: params.get("monitoringID"),
            companyID: params.get("company") ?? params.get("companyID"),
            locationID: params.get("location") ?? params.get("locationID"),
            storeID:
                params.get("store") ??
                params.get("storeID") ??
                params.get("location"),
            cameraID: params.get("camera") ?? params.get("cameraID"),
            trackerID: params.get("tracker") ?? params.get("trackerID"),
        });
        crashLogger.addBreadcrumb("navigation", "Route changed", {
            route: `${location.pathname}${location.search}${location.hash}`,
        });
    }, [location]);

    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.documentElement.style.height = "100%";
        document.documentElement.style.backgroundColor = Colors.ghostOffWhite;
        const root = document.getElementById("root");
        if (root) {
            root.style.height = "100%";
        }
    }, []);

    return (
        <LocationGuardProvider>
            <UpdatePrompt />
            {authenticated && <VpnGuard />}
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/monitor"
                    element={
                        <ProtectedRole roles={[REVIEWER_ROLE, AGENT_ROLE]}>
                            <MonitorProvider>
                                <RenderPage
                                    drawerOpen={drawerOpen}
                                    toggleDrawer={toggleDrawer}
                                    isMobile={isMobile}
                                    header={
                                        <MonitorHeader
                                            toggleDrawer={toggleDrawer}
                                            withIconMenu={false}
                                            allowGoBack
                                        />
                                    }
                                >
                                    <Monitor />
                                </RenderPage>
                            </MonitorProvider>
                        </ProtectedRole>
                    }
                />
                <Route
                    path="/assignments"
                    element={
                        user && user.roleID === ADMIN_ROLE ? (
                            <ProtectedRole roles={[ADMIN_ROLE]}>
                                <RenderPage
                                    drawerOpen={drawerOpen}
                                    toggleDrawer={toggleDrawer}
                                    isMobile={isMobile}
                                    header={
                                        <AdminHeader
                                            toggleDrawer={toggleDrawer}
                                            withIconMenu={false}
                                        />
                                    }
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
                                    header={
                                        <AssignmentsHeader
                                            toggleDrawer={toggleDrawer}
                                            withIconMenu={false}
                                        />
                                    }
                                >
                                    <Assignments />
                                </RenderPage>
                            </ProtectedRole>
                        )
                    }
                />

                <Route
                    path="/monitor/timeline"
                    element={
                        <ProtectedRole roles={[REVIEWER_ROLE, AGENT_ROLE]}>
                            <MonitorTimeline />
                        </ProtectedRole>
                    }
                />
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </LocationGuardProvider>
    );
}

export default App;
