import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import { Colors, Fonts } from "../theme";
import Divider from "./Divider";
import styled from "@emotion/styled";

interface Props {
  // This prop is deprecated and will be removed in future versions.
  withIcon?: boolean; //@deprecated
  items: MenuItem[];
  open: boolean;
  toggleDrawer: () => void;
  isMobile: boolean;
}

type MenuItem = {
  category?: string;
  text?: string;
  path?: string;
  children?: MenuItem[];
};

const TitleContent = styled("div")({
  flexGrow: 0,
  fontFamily: Fonts.main,
  fontSize: 28,
  fontWeight: 500,
  lineHeight: "normal",
  letterSpacing: 0.56,
  margin: "20px 16px 0.565em 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const isCategory = (
  item: MenuItem,
): item is Required<Pick<MenuItem, "category" | "children">> => {
  return !!item.category && Array.isArray(item.children);
};

const Menu = ({
  withIcon = true, //@deprecated
  items,
  open,
  toggleDrawer,
  isMobile,
}: Props) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {},
  );

  const mini = useMediaQuery("(max-width:1100px)");

  const marginLeftCondition = !isMobile ? (open ? "237px" : "-10px") : "-10px";

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const renderMenuItems = (menuItems: MenuItem[], level = 0) =>
    menuItems.map((item) =>
      isCategory(item) ? (
        <div key={item.category}>
          <ListItem
            component="button"
            onClick={() => toggleCategory(item.category)}
            sx={{
              cursor: "pointer",
              bgcolor: Colors.white,
              border: "none",
              padding: "15px 26px 15px 3px",
              paddingLeft: `${level * 10 + 15}px`,
              fontSize: "15px",
              height: "47px",
              "& .MuiTypography-root": {
                fontFamily: Fonts.main,
                fontWeight: 500,
                color: Colors.lightBlack,
              },
              ":hover": {
                color: Colors.main,
              },
              ...(openCategories[item.category] &&
                level === 0 && {
                  bgcolor: Colors.paleGray,
                  color: Colors.main,
                  borderLeft: `3px solid ${Colors.main}`,
                }),
              ...(openCategories[item.category] &&
                level > 0 && {
                  bgcolor: Colors.paleGray,
                  color: Colors.main,
                }),
            }}
          >
            <ListItemText primary={item.category} />
            {openCategories[item.category] ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse
            in={openCategories[item.category]}
            timeout="auto"
            unmountOnExit
          >
            <List component="div" disablePadding>
              {renderMenuItems(item.children, level + 1)}
            </List>
          </Collapse>
        </div>
      ) : (
        <ListItem
          key={item.text}
          component="button"
          onClick={() => {}}
          sx={{
            cursor: "pointer",
            fontSize: "15px",
            height: "47px",
            padding: "15px 26px 15px 3px",
            paddingLeft: `${level * 10 + 15}px`,
            bgcolor: Colors.white,
            border: "none",
            fontWeight: 500,
            fontFamily: Fonts.main,
            "&:hover": {
              backgroundColor: Colors.offWhite,
              color: Colors.main,
            },
            ...(location.pathname === (item.path ?? "*") && {
              borderRight: `3px solid ${Colors.vividOrange}`,
              color: Colors.main,
              fontWeight: 700,
              backgroundColor: Colors.offWhite,
            }),
          }}
        >
          <ListItemText
            disableTypography
            primary={item.text}
            sx={{
              fontFamily: Fonts.main,
              fontWeight: 500,
              fontSize: "15px",
              margin: 0,
            }}
          />
        </ListItem>
      ),
    );

  return (
    <>
      {withIcon && (
        <IconButton
          edge="start"
          sx={{
            color: Colors.main,
            marginLeft: marginLeftCondition,
          }}
          onClick={toggleDrawer}
          aria-label="menu"
        >
          <MenuIcon />
        </IconButton>
      )}
      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer}
        variant={isMobile ? "temporary" : "persistent"}
        sx={{
          "& .MuiDrawer-paper": {
            width: 250,
            boxSizing: "border-box",
          },
        }}
      >
        <TitleContent>
          <img
            style={{
              cursor: "pointer",
              height: !mini ? "22px" : "27px",
              margin: !mini ? "0" : "20px 0",
            }}
            onClick={() => {}}
            src="../assets/rebiz-logo-1.svg"
            alt=""
          />
          <img
            src="../assets/Icon.svg"
            alt=""
            style={{
              cursor: "pointer",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease-in-out",
            }}
            onClick={toggleDrawer}
          />
        </TitleContent>
        <Divider marginBottom="0px" />
        <List
          sx={{
            padding: 0,
            paddingTop: 0,
            paddingBottom: 0,
          }}
        >
          {renderMenuItems(items)}
        </List>
      </Drawer>
    </>
  );
};

export default Menu;
