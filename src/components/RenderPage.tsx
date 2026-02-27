import { Grid } from "@mui/system";
import Menu from "../components/Menu";
import Header from "../sections/Header";
import Content from "../sections/Content";
import type { ReactNode } from "react";

const RenderPage = ({
  children,
  drawerOpen,
  toggleDrawer,
  isMobile,
  withIconMenu = true,
}: {
  children: ReactNode;
  drawerOpen?: boolean;
  toggleDrawer?: () => void;
  isMobile?: boolean;
  withIconMenu?: boolean;
}) => {
  const positionerCondition = !isMobile ? "calc(100% - 250px)" : "100%";
  const menuItems = [
    { text: "Home", path: `/home` },
    { text: "Monitor", path: `/dashboard` },
  ];
  return (
    <>
      {drawerOpen ? (
        <Grid container justifyContent={"space-between"}>
          <Grid width={"250px"}>
            <Menu
              withIcon={false}
              items={menuItems}
              open={drawerOpen}
              toggleDrawer={toggleDrawer || (() => {})}
              isMobile={isMobile || false}
            />
          </Grid>
          <Grid width={positionerCondition}>
            <Header
              withIconMenu={false}
              toggleDrawer={toggleDrawer || (() => {})}
            />
            <Content>{children}</Content>
          </Grid>
        </Grid>
      ) : (
        <Grid>
          <Header
            withIconMenu={withIconMenu}
            toggleDrawer={toggleDrawer || (() => {})}
          />
          <Content>{children}</Content>
        </Grid>
      )}
    </>
  );
};

export default RenderPage;
