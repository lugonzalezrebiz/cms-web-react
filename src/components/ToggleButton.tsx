import { useState, type MouseEvent } from "react";
import styled from "@emotion/styled";
import {
  ToggleButton as MuiToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
  Grow,
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
  selectOnClick?: boolean;
}

interface CustomToggleButtonProps {
  onCustomClick?: () => void;
  customCreated?: boolean;
}

interface ToggleButtonProps {
  value: string;
  setValue: (value: string) => void;
  label: string;
  groups: GroupItem[];
  onCustomClick?: () => void;
  customCreated?: boolean;
}

const StyledToggleGroup = styled(ToggleButtonGroup)({
  padding: 4,
  backgroundColor: Colors.lightGray,
  borderRadius: 30,
  height: "32px",
  width: "100%",
  gap: "5px",
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
  fontSize: "14px",
  borderRadius: 35,
  width: "100%",
  maxWidth: "120px",
  "& .toggle-label": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: "50px",
  },
  "&.Mui-selected": {
    color: Colors.lightBlack,
    backgroundColor: Colors.white,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
  },
  "&.Mui-selected:hover": {
    backgroundColor: Colors.white,
  },
  "&:not(.Mui-selected)": {
    backgroundColor: Colors.lightGray,
  },
});

const CustomToggleButton = ({
  onCustomClick,
  customCreated,
}: CustomToggleButtonProps) => {
  return (
    <StyledToggleButton value="__custom__">
      <span className="toggle-label">Custom</span>
      <img
        onClick={(e) => {
          e.stopPropagation();
          onCustomClick?.();
        }}
        src={customCreated ? "./assets/edit-05.svg" : "./assets/plus-1.svg"}
        alt=""
        style={{
          width: 14,
          height: 14,
          marginLeft: 4,
          cursor: "pointer",
        }}
      />
    </StyledToggleButton>
  );
};

interface GroupToggleButtonProps {
  group: GroupItem;
  value: string;
  handleOptionsClick: (
    groupValue: string,
    event: React.MouseEvent<HTMLElement | SVGSVGElement>,
  ) => void;
  setAnchorEl: (el: Element | null) => void;
  setActiveGroupValue: (value: string | null) => void;
}

const GroupToggleButton = ({
  group,
  value,
  handleOptionsClick,
  setAnchorEl,
  setActiveGroupValue,
}: GroupToggleButtonProps) => {
  const selectedOption = group.options?.find((o) => o.value === value);
  const effectiveValue = selectedOption?.value ?? group.value;

  return (
    <StyledToggleButton
      key={group.value}
      value={effectiveValue}
      onClick={
        group.options && !group.selectOnClick
          ? (e) => handleOptionsClick(group.value, e)
          : undefined
      }
    >
      <span className="toggle-label">
        {selectedOption ? selectedOption.title : group.title}
      </span>
      {group.options && (
        <KeyboardArrowDownIcon
          sx={{ fontSize: 14, ml: 0.3 }}
          onClick={
            group.selectOnClick
              ? (e) => {
                  e.stopPropagation();
                  const btn = (e.currentTarget as Element).closest("button");
                  setAnchorEl(btn ?? e.currentTarget);
                  setActiveGroupValue(group.value);
                }
              : undefined
          }
        />
      )}
    </StyledToggleButton>
  );
};

const menuItemSx = {
  fontFamily: Fonts.secondary,
  fontSize: "12px",
  p: "8px 16px",
  color: Colors.lightBlack,
  minHeight: 0,
  height: "43px",
  display: "block",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  "&&.Mui-selected": {
    color: Colors.vividOrange,
    backgroundColor: Colors.transparentVividOrange,
  },
  "&&.Mui-selected:hover": {
    color: Colors.vividOrange,
    backgroundColor: Colors.transparentVividOrange,
  },
};

interface ToggleMenuItemsProps {
  anchorEl: Element | null;
  options?: GroupOption[];
  value: string;
  setValue: (value: string) => void;
  handleClose: () => void;
}

const ToggleMenuItems = ({
  anchorEl,
  options,
  value,
  setValue,
  handleClose,
}: ToggleMenuItemsProps) => {
  return (
    <Menu
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={handleClose}
      slots={{ transition: Grow }}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      marginThreshold={0}
      slotProps={{
        transition: { timeout: 5000 },
        list: { disablePadding: true },
        paper: {
          sx: {
            width: "100%",
            maxWidth: "180px",
            borderRadius: "8px",
            bgcolor: Colors.white,
            boxShadow: "0 2px 10px 0 rgba(0, 0, 0, 0.16)",
            p: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        },
      }}
    >
      {options?.length ? (
        options.map((option) => (
          <MenuItem
            key={option.value}
            selected={value === option.value}
            onClick={() => {
              setValue(option.value);
              handleClose();
            }}
            sx={menuItemSx}
          >
            {option.title}
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled sx={menuItemSx}>
          No options available
        </MenuItem>
      )}
    </Menu>
  );
};

const ToggleButton = ({
  value,
  setValue,
  label,
  groups,
  onCustomClick,
  customCreated = false,
}: ToggleButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [activeGroupValue, setActiveGroupValue] = useState<string | null>(null);

  const handleOptionsClick = (
    groupValue: string,
    event: React.MouseEvent<HTMLElement | SVGSVGElement>,
  ) => {
    setAnchorEl(event.currentTarget);
    setActiveGroupValue(groupValue);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveGroupValue(null);
  };

  const activeGroup = groups.find((g) => g.value === activeGroupValue);

  const handleCustom = (
    _event: MouseEvent<HTMLElement>,
    newValue: string | null,
  ) => {
    if (newValue === null) return;
    if (newValue === "__custom__" && !customCreated) {
      onCustomClick?.();
      return;
    }
    const selectOnClickGroup = groups.find(
      (g) => g.selectOnClick && g.options?.some((o) => o.value === newValue),
    );
    if (selectOnClickGroup) {
      setValue(selectOnClickGroup.value);
      return;
    }
    const isPlaceholder = groups.some(
      (g) => g.value === newValue && g.options?.length && !g.selectOnClick,
    );
    if (!isPlaceholder) setValue(newValue);
  };

  return (
    <Box>
      <StyledToggleGroup
        value={value}
        exclusive
        onChange={handleCustom}
        aria-label={label}
      >
        {groups.map((group) => (
          <GroupToggleButton
            key={group.value}
            group={group}
            value={value}
            handleOptionsClick={handleOptionsClick}
            setAnchorEl={setAnchorEl}
            setActiveGroupValue={setActiveGroupValue}
          />
        ))}

        {onCustomClick && (
          <CustomToggleButton
            onCustomClick={onCustomClick}
            customCreated={customCreated}
          />
        )}
      </StyledToggleGroup>

      <ToggleMenuItems
        anchorEl={anchorEl}
        options={activeGroup?.options}
        value={value}
        setValue={setValue}
        handleClose={handleClose}
      />
    </Box>
  );
};

export default ToggleButton;
