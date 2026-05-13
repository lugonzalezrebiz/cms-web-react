import { useState } from "react";
import styled from "@emotion/styled";
import {
  ToggleButton as MuiToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Colors, Fonts } from "../theme";
import { Box } from "@mui/system";

interface GroupOption {
  value: string;
  title: string;
}

interface GroupItem {
  value: string;
  title: string;
  options?: GroupOption[];
}

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

const StyledToggleButton = styled(MuiToggleButton)({
  color: Colors.mediumGray,
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
    color: Colors.lightBlack,
    backgroundColor: Colors.white,
  },
  "&.Mui-selected:hover": {
    backgroundColor: Colors.white,
  },
  "&:not(.Mui-selected)": {
    backgroundColor: Colors.lightGray,
  },
});

const ToggleButton = ({
  value,
  setValue,
  label,
  groups,
  selectValue,
  setSelectValue,
}: {
  value: string;
  setValue: (value: string) => void;
  label: string;
  groups: GroupItem[];
  selectValue?: string;
  setSelectValue?: (value: string) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeGroupValue, setActiveGroupValue] = useState<string | null>(null);

  const handleOptionsClick = (
    groupValue: string,
    event: React.MouseEvent<HTMLElement>,
  ) => {
    setAnchorEl(event.currentTarget);
    setActiveGroupValue(groupValue);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveGroupValue(null);
  };

  const activeGroup = groups.find((g) => g.value === activeGroupValue);

  return (
    <Box>
      <StyledToggleGroup
        value={value}
        exclusive
        onChange={(_event, newValue) => {
          if (newValue !== null) setValue(newValue);
        }}
        aria-label={label}
      >
        {groups.map((group) => {
          const selectedOption = group.options?.find(
            (o) => o.value === selectValue,
          );
          return (
            <StyledToggleButton
              key={group.value}
              value={group.value}
              onClick={
                group.options
                  ? (e) => handleOptionsClick(group.value, e)
                  : undefined
              }
            >
              {selectedOption ? selectedOption.title : group.title}
              {group.options && (
                <KeyboardArrowDownIcon sx={{ fontSize: 14, ml: 0.3 }} />
              )}
            </StyledToggleButton>
          );
        })}
      </StyledToggleGroup>

      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        marginThreshold={0}
        slotProps={{
          paper: {
            sx: {
              maxHeight: "50%",
              borderRadius: "4px",
              bgcolor: Colors.white,
              border: `1px solid ${Colors.paleSteal}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              mt: "2px",
            },
          },
        }}
      >
        {activeGroup?.options?.map((option) => (
          <MenuItem
            key={option.value}
            selected={selectValue === option.value}
            onClick={() => {
              setSelectValue?.(option.value);
              handleClose();
            }}
            sx={{
              fontFamily: Fonts.main,
              fontSize: "16px",
              fontWeight: 400,
              color: Colors.dimGray,
              lineHeight: "24px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              "&.Mui-selected": {
                color: Colors.white,
                backgroundColor: Colors.vividOrange,
              },
              "&.Mui-selected:hover": {
                backgroundColor: Colors.transparentVividOrange,
                color: Colors.lightBlack,
              },
            }}
          >
            {option.title}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ToggleButton;
