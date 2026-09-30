import { Box, Popover } from "@mui/material";
import { Colors, Fonts } from "../../theme";
import { assetUrl } from "../../utils";
import type { NavTab } from "./types";
import { NAV_TABS } from "./constants";

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  /** Tabs shown but not selectable (e.g. Customer punches with no employees). */
  disabledTabs?: NavTab[];
}

// Tab labels always take two lines: the first word, then the rest.
const twoLineLabel = (label: string) => {
  const [first, ...rest] = label.split(" ");
  return rest.length > 0 ? `${first}\n${rest.join(" ")}` : label;
};

const TimelineNavPopover = ({
  open,
  anchorEl,
  onClose,
  activeTab,
  onTabChange,
  disabledTabs = [],
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
        const isDisabled = !isSelected && disabledTabs.includes(id);
        return (
          <Box
            component="li"
            key={id}
            sx={{ flex: 1 }}
            aria-disabled={isDisabled || undefined}
            onClick={() => {
              if (isDisabled) return;
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
                // Design card: 100×77, 4px radius, 8px padding, 5px icon–label gap.
                boxSizing: "border-box",
                width: "100px",
                height: "77px",
                gap: "5px",
                borderRadius: "4px",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.4 : 1,
                padding: "8px",
                backgroundColor: isSelected ? Colors.vividOrange : Colors.white,
                color: isSelected ? Colors.white : "inherit",
                // Hover looks like the selected tab (disabled tabs don't react).
                "&:hover": isDisabled
                  ? {}
                  : {
                      backgroundColor: Colors.vividOrange,
                      color: Colors.white,
                      "& img": { filter: "brightness(0) invert(1)" },
                    },
                "& img": {
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
                  // Honors the line break added by twoLineLabel.
                  whiteSpace: "pre-line",
                },
              }}
            >
              <img src={assetUrl(`${iconClass}.svg`)} alt={label} />
              <span>{twoLineLabel(label)}</span>
            </Box>
          </Box>
        );
      })}
    </Box>
  </Popover>
);

export default TimelineNavPopover;
