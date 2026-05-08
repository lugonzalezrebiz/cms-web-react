import { Menu, MenuItem } from "@mui/material";
import { Colors, Fonts } from "../theme";

interface Option {
  label: string;
  onClick: () => void;
}

interface DropDownMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  handleClose: () => void;
  options?: Option[];
}

const DropDownMenu = ({
  anchorEl,
  open,
  handleClose,
  options,
}: DropDownMenuProps) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      anchorOrigin={{ vertical: "center", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "8px",
            boxShadow: "0 2px 10px 0 rgba(0,0,0,0.12)",
            minWidth: "200px",
          },
        },
      }}
    >
      {options?.map((option) => (
        <MenuItem
          sx={{
            fontFamily: Fonts.main,
            fontSize: "14px",
            p: "14px 22px 14px 20px",
            color: Colors.lightBlack,
            ":hover": {
              backgroundColor: Colors.blushWhite,
              color: Colors.vividOrange,
            },
          }}
          onClick={option.onClick}
        >
          {option.label}
        </MenuItem>
      ))}
    </Menu>
  );
};

export default DropDownMenu;
