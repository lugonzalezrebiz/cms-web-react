import { Grid } from "@mui/system";
import Menu from "../components/Menu";
import Header from "../sections/Header";
import Content from "../sections/Content";
import type { ReactNode } from "react";
import useAuth from "../hooks/useAuth";
import { ADMIN_ROLE } from "../config";

const RenderPage = ({
  children,
  drawerOpen,
  toggleDrawer,
  isMobile,
  withIconMenu = true,
  selectedTab,
  onTabChange,
}: {
  children: ReactNode;
  drawerOpen?: boolean;
  toggleDrawer?: () => void;
  isMobile?: boolean;
  withIconMenu?: boolean;
  selectedTab: string;
  onTabChange: (value: string) => void;
}) => {
  const positionerCondition = "calc(100% - 250px)";
  const { user } = useAuth();
  const isAdmin = user?.roleID === ADMIN_ROLE;
  const menuItems = isAdmin
    ? [{ text: "Admin Form", path: `/admin-form` }]
    : [{ text: "Monitor", path: `/dashboard` }];
  return (
    <Grid
      container={!!drawerOpen}
      justifyContent={drawerOpen ? "space-between" : undefined}
      sx={
        drawerOpen
          ? { height: "100%", overflow: "hidden" }
          : {
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }
      }
    >
      {drawerOpen && (
        <Grid width={"250px"} sx={{ height: "100%" }}>
          <Menu
            withIcon={false}
            items={menuItems}
            open={drawerOpen}
            toggleDrawer={toggleDrawer || (() => {})}
            isMobile={isMobile || false}
          />
        </Grid>
      )}
      <Grid
        width={drawerOpen ? positionerCondition : "100%"}
        sx={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Header
          withIconMenu={drawerOpen ? false : withIconMenu}
          toggleDrawer={toggleDrawer || (() => {})}
          selectedTab={selectedTab}
          onTabChange={onTabChange}
        />
        <Content>{children}</Content>
      </Grid>
    </Grid>
  );
};

export default RenderPage;
