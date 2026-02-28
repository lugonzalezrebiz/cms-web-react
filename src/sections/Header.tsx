import Divider from "../components/Divider";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import { useEffect, useState } from "react";
import type React from "react";
import { IconButton, ToggleButton, ToggleButtonGroup } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Box, Grid, useMediaQuery } from "@mui/system";
import HeaderInfoMenu from "../components/HeaderInfoMenu";
import KeyboardMenu from "../components/KeyboardMenu";
import ClockMenu from "../components/ClockMenu";

const Fix = styled("div")<{ scrolled: boolean }>(({ scrolled }) => ({
  position: "sticky",
  top: 0,
  zIndex: 1000,
  backgroundColor: Colors.white,
  boxShadow: scrolled ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
  transition: "all 0.2s ease-in-out",
}));

const StyledContainer = styled("div")({
  display: "flex",
  padding: "0.5em 1em 0.5em 1em",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
});

const StyledTitle = styled("p")({
  margin: 0,
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: 1.5,
  color: Colors.lightBlack,
  fontFamily: Fonts.main,
});

const StyledSubTitle = styled("p")({
  margin: 0,
  fontSize: "12px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.vividOrange,
  fontFamily: Fonts.main,
});

const StyledImg = styled("img")({
  margin: "0 8px",
  cursor: "pointer",
});

const StyledToggleButton = styled(ToggleButton)({
  flex: 1,
  fontFamily: Fonts.main,
  textTransform: "none",
  fontWeight: "normal",
  backgroundColor: Colors.lightGray,
  border: "none",
  margin: 0,
  fontSize: "14px",
  borderRadius: 35,
  whiteSpace: "nowrap",
  "&.Mui-selected": {
    backgroundColor: Colors.white,
    fontWeight: "bold",
  },
  "&.Mui-selected:hover": {
    backgroundColor: Colors.white,
  },
  "&:not(.Mui-selected)": {
    backgroundColor: Colors.lightGray,
  },
});

const StyledToggleGroup = styled(ToggleButtonGroup)({
  padding: 4,
  backgroundColor: Colors.lightGray,
  borderRadius: 30,
  height: "32px",
  width: "100%",
  boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.07)",
  "& .MuiToggleButtonGroup-lastButton": {
    margin: 0,
  },
  "& .MuiToggleButtonGroup-firstButton": {
    margin: 1,
  },
  "& .MuiToggleButtonGroup-grouped": {
    borderRadius: 35,
  },
});

export const ToggleButtonTitles = [
  { value: "1", title: "All", cameraCount: 16 },
  { value: "2", title: "Tunnel", cameraCount: 6 },
  { value: "3", title: "Offices", cameraCount: 3 },
  { value: "4", title: "Drying Station", cameraCount: 5 },
  { value: "5", title: "Parking Lot", cameraCount: 2 },
];

function usePopover() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  return {
    anchorEl,
    open: Boolean(anchorEl),
    handleOpen: (e: React.MouseEvent<HTMLElement>) =>
      setAnchorEl(e.currentTarget),
    handleClose: () => setAnchorEl(null),
  };
}

const Header = ({
  toggleDrawer,
  withIconMenu = true,
  selectedTab,
  onTabChange,
}: {
  toggleDrawer: () => void;
  withIconMenu?: boolean;
  selectedTab: string;
  onTabChange: (value: string) => void;
}) => {
  const [scrolled, setScrolled] = useState(false);
  const selected = selectedTab;
  const menuHeader = usePopover();
  const keyboardMenu = usePopover();
  const ClockMenuHeader = usePopover();

  const mini = useMediaQuery("(max-width:1100px)");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Fix scrolled={scrolled}>
        <StyledContainer>
          {withIconMenu && (
            <IconButton
              edge="start"
              sx={{
                color: Colors.main,
              }}
              onClick={toggleDrawer}
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
          )}

          {!mini ? (
            <Box
              display={"flex"}
              alignItems="center"
              justifyContent={"space-between"}
              width={"100%"}
            >
              <Box
                onClick={menuHeader.handleOpen}
                sx={{
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  cursor: "pointer",
                }}
              >
                <StyledTitle>Store: 7437 (0079)</StyledTitle>
                <StyledSubTitle>
                  Mar 19, 2025 / 09:00 (MST) - 19:00 (MST) / Events
                </StyledSubTitle>
              </Box>
              <Box>
                <StyledToggleGroup
                  value={selected}
                  exclusive
                  onChange={(_event, newValue) => {
                    if (newValue !== null) onTabChange(newValue);
                  }}
                  aria-label="Time range"
                >
                  {ToggleButtonTitles.map(({ value, title }) => (
                    <StyledToggleButton key={value} value={value}>
                      {title}
                    </StyledToggleButton>
                  ))}
                </StyledToggleGroup>
              </Box>
              <Box display={"flex"}>
                <Box>
                  <StyledImg src="../assets/ai.svg" alt="" />
                  <StyledImg
                    onClick={ClockMenuHeader.handleOpen}
                    src="../assets/clock-check.svg"
                    alt=""
                  />
                  <StyledImg
                    onClick={keyboardMenu.handleOpen}
                    src="../assets/keyboard-02.svg"
                    alt=""
                  />
                  <StyledImg src="../assets/notification.svg" alt="" />
                  <StyledImg src="../assets/user-circle.svg" alt="" />
                </Box>
                <Box ml={"20px"}>
                  <StyledImg src="../assets/minus.svg" alt="" />
                  <StyledImg src="../assets/x-close.svg" alt="" />
                </Box>
              </Box>
            </Box>
          ) : (
            <Grid container alignItems="center" width={"100%"}>
              <Grid
                display={"flex"}
                justifyContent={"space-between"}
                alignItems="center"
                size={12}
              >
                <Box
                  onClick={menuHeader.handleOpen}
                  sx={{
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    cursor: "pointer",
                  }}
                >
                  <StyledTitle>Store: 7437 (0079)</StyledTitle>
                  <StyledSubTitle>
                    Mar 19, 2025 / 09:00 (MST) - 19:00 (MST) / Events
                  </StyledSubTitle>
                </Box>
                <Box display={"flex"}>
                  <Box>
                    <StyledImg src="../assets/ai.svg" alt="" />
                    <StyledImg
                      onClick={ClockMenuHeader.handleOpen}
                      src="../assets/clock-check.svg"
                      alt=""
                    />
                    <StyledImg
                      onClick={keyboardMenu.handleOpen}
                      src="../assets/keyboard-02.svg"
                      alt=""
                    />
                    <StyledImg src="../assets/notification.svg" alt="" />
                    <StyledImg src="../assets/user-circle.svg" alt="" />
                  </Box>
                  <Box ml={"20px"}>
                    <StyledImg src="../assets/minus.svg" alt="" />
                    <StyledImg src="../assets/x-close.svg" alt="" />
                  </Box>
                </Box>
              </Grid>
              <Grid
                size={12}
                display={"flex"}
                alignItems="center"
                justifyContent={"center"}
                mt={"5px"}
              >
                <Box>
                  <StyledToggleGroup
                    value={selected}
                    exclusive
                    onChange={(_event, newValue) => {
                      if (newValue !== null) onTabChange(newValue);
                    }}
                    aria-label="Time range"
                  >
                    {ToggleButtonTitles.map(({ value, title }) => (
                      <StyledToggleButton key={value} value={value}>
                        {title}
                      </StyledToggleButton>
                    ))}
                  </StyledToggleGroup>
                </Box>
              </Grid>
            </Grid>
          )}
        </StyledContainer>

        <HeaderInfoMenu
          anchorEl={menuHeader.anchorEl}
          handleClose={menuHeader.handleClose}
          open={menuHeader.open}
        />

        <KeyboardMenu
          anchorEl={keyboardMenu.anchorEl}
          open={keyboardMenu.open}
          handleClose={keyboardMenu.handleClose}
        />

        <ClockMenu
          anchorEl={ClockMenuHeader.anchorEl}
          open={ClockMenuHeader.open}
          handleClose={ClockMenuHeader.handleClose}
        />
        <Divider marginBottom="0" />
      </Fix>
    </>
  );
};

export default Header;
