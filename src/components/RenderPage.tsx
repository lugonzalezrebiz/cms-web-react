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
  const positionerCondition = !isMobile ? "calc(100% - 250px)" : "100%";
  const menuItems = [{ text: "Monitor", path: `/dashboard` }];
  return (
    <>
      {drawerOpen ? (
        <Grid
          container
          justifyContent={"space-between"}
          sx={{ height: "100%", overflow: "hidden" }}
        >
          <Grid width={"250px"} sx={{ height: "100%" }}>
            <Menu
              withIcon={false}
              items={menuItems}
              open={drawerOpen}
              toggleDrawer={toggleDrawer || (() => {})}
              isMobile={isMobile || false}
            />
          </Grid>
          <Grid
            width={positionerCondition}
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <Header
              withIconMenu={false}
              toggleDrawer={toggleDrawer || (() => {})}
              selectedTab={selectedTab}
              onTabChange={onTabChange}
            />
            <Content>{children}</Content>
          </Grid>
        </Grid>
      ) : (
        <Grid
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Header
            withIconMenu={withIconMenu}
            toggleDrawer={toggleDrawer || (() => {})}
            selectedTab={selectedTab}
            onTabChange={onTabChange}
          />
          <Content>{children}</Content>
        </Grid>
      )}
    </>
  );
};

export default RenderPage;
