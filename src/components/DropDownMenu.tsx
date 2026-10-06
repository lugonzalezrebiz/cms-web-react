import { Menu, MenuItem } from "@mui/material";
import type { PopoverOrigin } from "@mui/material";
import { Colors, Fonts } from "../theme";

interface Option {
  label: string;
  onClick: () => void;
  /** Highlights the option as the current choice. */
  selected?: boolean;
  /** Shown but not selectable. */
  disabled?: boolean;
}

interface DropDownMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  handleClose: () => void;
  options?: Option[];
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
  maxWidth?: string;
}

const DropDownMenu = ({
  anchorEl,
  open,
  handleClose,
  options,
  anchorOrigin = { vertical: "center", horizontal: "left" },
  transformOrigin = { vertical: "top", horizontal: "right" },
  maxWidth = "160px",
}: DropDownMenuProps) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      autoFocus={false}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      slotProps={{
        list: { disablePadding: true },
        paper: {
          sx: {
            borderRadius: "8px",
            boxShadow: "0 2px 10px 0 rgba(0, 0, 0, 0.16)",
            maxWidth,
            width: "100%",
          },
        },
      }}
    >
      {options?.map((option) => (
        <MenuItem
          key={option.label}
          sx={{
            fontFamily: Fonts.secondary,
            fontSize: "12px",
            p: "14px 20px",
            color: Colors.lightBlack,
            minHeight: 0,
            height: "43px",
            ":hover": {
              backgroundColor: Colors.transparentVividOrange,
              color: Colors.vividOrange,
            },
            ...(option.selected && {
              backgroundColor: Colors.vividOrange,
              color: Colors.white,
              ":hover": {
                backgroundColor: Colors.vividOrange,
                color: Colors.white,
              },
            }),
          }}
          disabled={option.disabled}
          onClick={option.onClick}
        >
          {option.label}
        </MenuItem>
      ))}
    </Menu>
  );
};

export default DropDownMenu;
