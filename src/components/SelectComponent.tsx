import { FormControl, MenuItem, Select } from "@mui/material";
import { Colors, Fonts } from "../theme";

interface Props {
  filters: {
    label: string;
    value: string;
  }[];
  filter: string;
  setFilter: (value: string) => void;
  size?: string;
  sizePaper?: string;
  borderRadius?: string;
  padding?: string;
}

const SelectComponent = ({
  filters,
  filter,
  setFilter,
  size,
  sizePaper,
  borderRadius,
  padding,
}: Props) => {
  return (
    <FormControl
      sx={{
        width: size ? size : "220px",
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
          borderRadius: borderRadius ? borderRadius : "4px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          p: padding ? padding : "auto",

          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            padding: "16px",
          },

          alignSelf: "stretch",
          fontFamily: Fonts.main,
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
        {filters?.map((f) => (
          <MenuItem
            key={f.value}
            value={f.value}
            sx={{
              fontFamily: Fonts.main,
              fontSize: "16px",
              fontWeight: 400,
              color: Colors.dimGray,
              lineHeight: "24px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {f.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SelectComponent;
