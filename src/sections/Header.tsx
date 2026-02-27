import Divider from "../components/Divider";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import { useEffect, useState } from "react";
import { IconButton, ToggleButton, ToggleButtonGroup } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Box, Grid, useMediaQuery } from "@mui/system";

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

const ToggleButtonTitles = [
  { value: "1", title: "All" },
  { value: "2", title: "Tunnel" },
  { value: "3", title: "Offices" },
  { value: "4", title: "Drying Station" },
  { value: "5", title: "Parking Lot" },
];

const Header = ({
  toggleDrawer,
  withIconMenu = true,
}: {
  toggleDrawer: () => void;
  withIconMenu?: boolean;
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [selected, setSelected] = useState(ToggleButtonTitles[0].value);

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
                sx={{
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
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
                    if (newValue !== null) setSelected(newValue);
                  }}
                  aria-label="Time range"
                >
                  <StyledToggleButton value="1">All</StyledToggleButton>
                  <StyledToggleButton value="2">Tunnel</StyledToggleButton>
                  <StyledToggleButton value="3">Offices</StyledToggleButton>
                  <StyledToggleButton value="4">
                    Drying Station
                  </StyledToggleButton>
                  <StyledToggleButton value="5">Parking Lot</StyledToggleButton>
                </StyledToggleGroup>
              </Box>
              <Box display={"flex"}>
                <Box>
                  <StyledImg src="../assets/ai.svg" alt="" />
                  <StyledImg src="../assets/clock-check.svg" alt="" />
                  <StyledImg src="../assets/keyboard-02.svg" alt="" />
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
                  sx={{
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
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
                    <StyledImg src="../assets/clock-check.svg" alt="" />
                    <StyledImg src="../assets/keyboard-02.svg" alt="" />
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
                      if (newValue !== null) setSelected(newValue);
                    }}
                    aria-label="Time range"
                  >
                    <StyledToggleButton value="1">All</StyledToggleButton>
                    <StyledToggleButton value="2">Tunnel</StyledToggleButton>
                    <StyledToggleButton value="3">Offices</StyledToggleButton>
                    <StyledToggleButton value="4">
                      Drying Station
                    </StyledToggleButton>
                    <StyledToggleButton value="5">
                      Parking Lot
                    </StyledToggleButton>
                  </StyledToggleGroup>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* <Box
            display={"flex"}
            alignItems="center"
            justifyContent={"space-between"}
            width={"100%"}
          >
            <Box
              sx={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
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
                  if (newValue !== null) setSelected(newValue);
                }}
                aria-label="Time range"
              >
                <StyledToggleButton value="1">All</StyledToggleButton>
                <StyledToggleButton value="2">Tunnel</StyledToggleButton>
                <StyledToggleButton value="3">Offices</StyledToggleButton>
                <StyledToggleButton value="4">
                  Drying Station
                </StyledToggleButton>
                <StyledToggleButton value="5">Parking Lot</StyledToggleButton>
              </StyledToggleGroup>
            </Box>
            <Box display={"flex"}>
              <Box>
                <StyledImg src="../assets/ai.svg" alt="" />
                <StyledImg src="../assets/clock-check.svg" alt="" />
                <StyledImg src="../assets/keyboard-02.svg" alt="" />
                <StyledImg src="../assets/notification.svg" alt="" />
                <StyledImg src="../assets/user-circle.svg" alt="" />
              </Box>
              <Box ml={"20px"}>
                <StyledImg src="../assets/minus.svg" alt="" />
                <StyledImg src="../assets/x-close.svg" alt="" />
              </Box>
            </Box>
          </Box> */}
        </StyledContainer>
        <Divider marginBottom="0" />
      </Fix>
    </>
  );
};

export default Header;
