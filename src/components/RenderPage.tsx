import { Grid } from "@mui/system";
import Menu from "../components/Menu";
import Content from "../sections/Content";
import type { ReactNode } from "react";
import useAuth from "../hooks/useAuth";
import { ADMIN_ROLE } from "../config";
import Header from "../sections/Header";

const RenderPage = ({
  children,
  drawerOpen,
  toggleDrawer,
  isMobile,
  withIconMenu = true,
  allowGoBack,
}: {
  children: ReactNode;
  drawerOpen?: boolean;
  toggleDrawer?: () => void;
  isMobile?: boolean;
  withIconMenu?: boolean;
  allowGoBack?: boolean;
}) => {
  const positionerCondition = "calc(100% - 250px)";
  const { user } = useAuth();
  const isAdmin = user?.roleID === ADMIN_ROLE;
  const menuItems = isAdmin
    ? [{ text: "Admin Form", path: "/assignments" }]
    : [{ text: "Monitor", path: "/monitor" }];

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
          allowGoBack={allowGoBack}
        />
        <Content>{children}</Content>
      </Grid>
    </Grid>
  );
};

export default RenderPage;
