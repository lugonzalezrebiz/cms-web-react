import type React from "react";
import { IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuIcon from "@mui/icons-material/Menu";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../../theme";
import UserPanel from "../../../components/UserPanel";
import Divider from "../../../components/Divider";
import Fix from "../components/Fix";
import type { PopoverState } from "../hooks/usePopover";

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

const StyledImg = styled("img")({
  margin: "0 8px",
  cursor: "pointer",
});

const AssignmentsHeader = ({
  toggleDrawer,
  withIconMenu = true,
  allowGoBack = false,
  scrolled,
  goBack,
  menuHeader,
  userPanelHeader,
  noDrag,
}: {
  toggleDrawer: () => void;
  withIconMenu?: boolean;
  allowGoBack?: boolean;
  scrolled: boolean;
  goBack: () => void;
  menuHeader: PopoverState;
  userPanelHeader: PopoverState;
  noDrag: React.CSSProperties;
}) => {
  return (
    <>
      <Fix scrolled={scrolled}>
        <StyledContainer>
          {withIconMenu && (
            <IconButton
              edge="start"
              style={noDrag}
              sx={{ color: Colors.main }}
              onClick={toggleDrawer}
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
          )}
          {allowGoBack && (
            <IconButton
              style={noDrag}
              sx={{ color: Colors.main }}
              onClick={goBack}
              aria-label="go back"
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          )}

          <Box
            display={"flex"}
            alignItems="center"
            justifyContent={"space-between"}
            width={"100%"}
          >
            <Box
              onClick={menuHeader.handleOpen}
              style={noDrag}
              sx={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                cursor: "pointer",
              }}
            >
              <Box display={"flex"} alignItems="center" gap={"12px"}>
                <StyledTitle>Monitoring Dashboad</StyledTitle>
                <Box
                  sx={{
                    bgcolor: Colors.lightLime,
                    p: "4px 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "20px",
                    fontFamily: Fonts.main,
                    fontSize: "16px",
                    fontWeight: 600,
                    color: Colors.vividLime,
                  }}
                >
                  <img src="./assets/online.svg" alt="" />
                  <p style={{ margin: "0 0 0 8px" }}>Online</p>
                </Box>
              </Box>
            </Box>

            <Box display={"flex"} style={noDrag}>
              <Box>
                <StyledImg
                  onClick={userPanelHeader.handleOpen}
                  src="../assets/user-circle.svg"
                  alt=""
                />
              </Box>
              <Box ml={"20px"}>
                <StyledImg
                  src="../assets/minus.svg"
                  alt=""
                  onClick={() => window.api?.minimize()}
                />
                <StyledImg
                  style={{ marginBottom: "2px" }}
                  src="../assets/expand-03.svg"
                  alt=""
                  onClick={() => window.api?.maximize()}
                />
                <StyledImg
                  src="../assets/x-close.svg"
                  alt=""
                  onClick={() => window.api?.close()}
                />
              </Box>
            </Box>
          </Box>
        </StyledContainer>

        <UserPanel
          anchorEl={userPanelHeader.anchorEl}
          handleClose={userPanelHeader.handleClose}
          open={userPanelHeader.open}
        />
        <Divider marginBottom="0" />
      </Fix>
    </>
  );
};

export default AssignmentsHeader;
