import { Box, Popover } from "@mui/material";
import { Colors, Fonts } from "../../theme";
import type { NavTab } from "./types";
import { NAV_TABS } from "./constants";

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const TimelineNavPopover = ({
  open,
  anchorEl,
  onClose,
  activeTab,
  onTabChange,
}: Props) => (
  <Popover
    open={open}
    onClose={onClose}
    anchorEl={anchorEl}
    anchorOrigin={{ vertical: "top", horizontal: "left" }}
    transformOrigin={{ vertical: "bottom", horizontal: "left" }}
    slotProps={{
      paper: {
        sx: {
          background: Colors.white,
          borderRadius: "18px",
          p: "8px",
          boxShadow: "none",
          marginTop: "-10px",
          marginLeft: "-8px",  
        },
      },
    }}
  >
    <Box
      component="ul"
      sx={{
        listStyle: "none",
        padding: "0.25em",
        margin: 0,
        display: "flex",
        gap: "8px",
      }}
    >
      {NAV_TABS.map(({ id, label, iconClass }) => {
        const isSelected = id === activeTab;
        return (
          <Box
            component="li"
            key={id}
            sx={{ flex: 1 }}
            onClick={() => {
              onTabChange(id);
              onClose();
            }}
          >
            <Box
              sx={{
                fontFamily: Fonts.main,
                display: "flex",
                boxShadow: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
                flexDirection: "column",
                alignItems: "center",
                borderRadius: "4px",
                cursor: "pointer",
                padding: "8px",
                backgroundColor: isSelected ? Colors.vividOrange : Colors.white,
                color: isSelected ? Colors.white : "inherit",
                "&:hover": {
                  backgroundColor: isSelected
                    ? Colors.vividOrange
                    : Colors.lightGrayishBlue,
                },
                "& img": {
                  mb: "7px",
                  filter: isSelected ? "brightness(0) invert(1)" : "none",
                },
                "& span": {
                  height: "40px",
                  display: "flex",
                  fontSize: "14px",
                  fontWeight: "normal",
                  textAlign: "center",
                  lineHeight: 1.43,
                  fontFamily: Fonts.main,
                  alignItems: "center",
                },
              }}
            >
              <img src={`../assets/${iconClass}.svg`} alt={label} />
              <span>{label}</span>
            </Box>
          </Box>
        );
      })}
    </Box>
  </Popover>
);

export default TimelineNavPopover;
