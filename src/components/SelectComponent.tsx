import { FormControl, ListSubheader, MenuItem, Select } from "@mui/material";
import { Colors, Fonts } from "../theme";

interface Filter {
  label: string;
  value: string;
  group?: string;
}

interface Props {
  filters: Filter[];
  filter: string;
  setFilter: (value: string) => void;
  size?: string;
  sizePaper?: string;
  font?: "main" | "secondary";
}

const menuItemSx = (fontFamily: string) => ({
  fontFamily,
  fontSize: "16px",
  fontWeight: 400,
  color: Colors.dimGray,
  lineHeight: "24px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  ":hover": {
    backgroundColor: Colors.transparentVividOrange,
    color: Colors.vividOrange,
  },
  "&&.Mui-selected": {
    backgroundColor: Colors.transparentVividOrange,
    color: Colors.vividOrange,
  },
  "&&.Mui-selected:hover": {
    backgroundColor: Colors.transparentVividOrange,
    color: Colors.vividOrange,
  },
});

const renderMenuItems = (filters: Filter[], fontFamily: string) => {
  const hasGroups = filters.some((f) => f.group);

  if (!hasGroups) {
    return filters.map((f) => (
      <MenuItem key={f.value} value={f.value} sx={menuItemSx(fontFamily)}>
        {f.label}
      </MenuItem>
    ));
  }

  const groups = filters.reduce<Record<string, Filter[]>>((acc, f) => {
    const key = f.group ?? "";
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  return Object.entries(groups).flatMap(([group, options]) => [
    <ListSubheader
      key={`header-${group}`}
      sx={{
        fontFamily,
        fontSize: "13px",
        fontWeight: 700,
        color: Colors.dimGray,
        lineHeight: "32px",
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        backgroundColor: Colors.white,
      }}
    >
      {group}
    </ListSubheader>,
    ...options.map((f) => (
      <MenuItem
        key={f.value}
        value={f.value}
        sx={{ ...menuItemSx(fontFamily), pl: "24px" }}
      >
        {f.label}
      </MenuItem>
    )),
  ]);
};

const SelectComponent = ({
  filters,
  filter,
  setFilter,
  size,
  sizePaper,
  font = "secondary",
}: Props) => {
  const fontFamily = Fonts[font];
  return (
    <FormControl
      sx={{
        width: size ? size : "220px",
        marginBottom: "10px",
      }}
    >
      <Select
        id="filter-select"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value as string);
        }}
        displayEmpty
        renderValue={(selected) => {
          const selectedOption = filters.find((f) => f.value === selected);

          return selectedOption ? (
            <span
              style={{
                display: "inline-block",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
              title={selectedOption.label}
            >
              {selectedOption.label}
            </span>
          ) : (
            "Select"
          );
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: "50%",
              width: sizePaper ? sizePaper : "193px",
              borderRadius: "8px",
              boxShadow: "0 2px 10px 0 rgba(0, 0, 0, 0.16)",
            },
          },
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "center",
          },
          transformOrigin: {
            vertical: "top",
            horizontal: "center",
          },
          marginThreshold: 0,
        }}
        sx={{
          width: "100%",
          height: "38px",
          borderRadius: "4px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",

          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            padding: "16px",
          },

          alignSelf: "stretch",
          fontFamily,
          fontSize: "16px",
          fontWeight: "normal",
          lineHeight: "24px",
          color: Colors.dimGray,

          "&:hover": {
            border: "none",
            backgroundColor: "transparent",
            borderColor: "transparent",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: Colors.paleSteal,
            borderWidth: "1px",
          },
          bgcolor: Colors.white,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderWidth: "1px",
            borderColor: Colors.paleSteal,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: "1px",
            borderColor: Colors.paleSteal,
          },
          "& .MuiSvgIcon-root": {
            color: Colors.paleSteal,
          },
        }}
      >
        {renderMenuItems(filters, fontFamily)}
      </Select>
    </FormControl>
  );
};

export default SelectComponent;
