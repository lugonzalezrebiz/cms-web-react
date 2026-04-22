import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useNavigateWithQuery from "../../hooks/useNavigate";
import { ADMIN_ROLE } from "../../config";
import AdminHeader from "./sections/AdminHeader";
import MonitorHeader from "./sections/MonitorHeader";
import usePopover from "./hooks/usePopover";
import useMonitorParams from "./hooks/useMonitorParams";
import AssignmentsHeader from "./sections/AssignmentsHeader";

const noDrag = {
  ["WebkitAppRegion" as string]: "no-drag",
} as React.CSSProperties;

const Header = ({
  toggleDrawer,
  withIconMenu = true,
  allowGoBack = false,
}: {
  toggleDrawer: () => void;
  withIconMenu?: boolean;
  allowGoBack?: boolean;
}) => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.roleID === ADMIN_ROLE;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const monitorParams = useMonitorParams();

  const navigate = useNavigateWithQuery();
  const goBack = () => navigate(-1);

  const menuHeader = usePopover();
  const notificationHeader = usePopover();
  const userPanelHeader = usePopover();
  const keyboardMenu = usePopover();

  const commonProps = {
    withIconMenu,
    toggleDrawer,
    allowGoBack,
    scrolled,
    goBack,
    noDrag,
  };

  if (pathname === "/monitor")
    return (
      <MonitorHeader
        {...commonProps}
        menuHeader={menuHeader}
        keyboardMenu={keyboardMenu}
        userPanelHeader={userPanelHeader}
        {...monitorParams}
      />
    );
  if (isAdmin)
    return (
      <AdminHeader
        {...commonProps}
        menuHeader={menuHeader}
        notificationHeader={notificationHeader}
        userPanelHeader={userPanelHeader}
      />
    );
  return (
    <AssignmentsHeader
      {...commonProps}
      menuHeader={menuHeader}
      userPanelHeader={userPanelHeader}
    />
  );
};

export default Header;
