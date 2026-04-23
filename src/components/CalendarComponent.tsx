import { useState, useRef } from "react";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { enUS } from "date-fns/locale";
import { Colors, Fonts } from "../theme";
import { Dayjs } from "dayjs";

interface Props {
  selectedDate: Date | null;
  onChange: (newDate: Date | null) => void;
  showClearButton?: boolean;
  minDate?: Dayjs | null;
  maxDate?: Dayjs | null;
  onClear?: () => void;
  size?: string;
  disabled?: boolean;
}

const CalendarComponent = ({
  selectedDate,
  onChange,
  showClearButton = false,
  minDate,
  maxDate,
  onClear,
  size,
  disabled = false,
}: Props) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enUS}>
      <DatePicker
        disabled={disabled}
        sx={{ width: "100%" }}
        views={["day"]}
        open={disabled ? false : open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={selectedDate}
        onChange={(value) => {
          if (disabled) return;
          onChange(value instanceof Date ? value : null);
        }}
        format="MM/dd/yyyy"
        enableAccessibleFieldDOMStructure={false}
        minDate={minDate ? minDate.toDate() : undefined}
        maxDate={maxDate ? maxDate.toDate() : undefined}
        slotProps={{
          day: {
            sx: {
              "&.MuiPickersDay-today": {
                border: "none",
                backgroundColor: "#EEF1F4",
                color: `${Colors.black} !important`,
                "&:after": {
                  content: '""',
                  position: "absolute",
                  bottom: 4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: Colors.lightOrange,
                },
              },
              "&.MuiPickersDay-root.Mui-selected": {
                backgroundColor: Colors.lightOrange,
                color: Colors.white,
                "&:hover": {
                  backgroundColor: Colors.lightOrange,
                },
              },
            },
          },
          popper: {
            sx: {
              "& .MuiDayCalendar-weekDayLabel": {
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: Fonts.main,
                color: Colors.black,
              },
              '& div[role="row"]': {
                justifyContent: "space-around",
              },
              "& .MuiPickersDay-root": {
                height: "35px",
                width: "35px",
                fontSize: "12px",
                fontFamily: Fonts.main,
              },
              "& .MuiPickersCalendarHeader-root": {
                padding: "0px 10px",
                "& .MuiPickersCalendarHeader-label": {
                  fontSize: "16px",
                  fontWeight: 600,
                  fontFamily: Fonts.main,
                  marginLeft: "7px",
                },
                "& .MuiSvgIcon-root": {
                  fill: Colors.main,
                },
              },
            },
          },
          textField: {
            variant: "outlined",
            fullWidth: size === "100%",
            sx: {
              width: size || "152px",
              "& .MuiInputBase-root": {
                cursor: disabled ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: Fonts.main,
                fontSize: "16px",
                fontWeight: 400,
                lineHeight: "24px",
                padding: "0 8px",
                color: Colors.dimGray,
                width: size || "152px",
                flexGrow: size === "100%" ? 1 : undefined,
                height: "34px",
                borderRadius: "4px",
                border: `1px solid ${Colors.paleSteal}`,
                opacity: disabled ? 0.6 : 1,
              },
              "& input": {
                padding: 0,
                fontFamily: Fonts.main,
                fontSize: "16px",
                color: Colors.dimGray,
                pointerEvents: disabled ? "none" : "auto",
              },
              "& fieldset": {
                border: "none",
              },
            },
            inputRef,
            InputProps: {
              readOnly: true,
              endAdornment: (
                <>
                  {selectedDate && showClearButton && (
                    <HighlightOffIcon
                      fontSize="small"
                      style={{
                        cursor: "pointer",
                        marginRight: 2,
                        marginTop: 2,
                        width: 18,
                        height: 18,
                        marginBottom: 3,
                      }}
                      onClick={() => {
                        onChange(null);
                        onClear?.();
                      }}
                    />
                  )}
                  <img
                    style={{
                      width: 18,
                      height: 18,
                      marginRight: 8,
                      cursor: disabled ? "default" : "pointer",
                      marginBottom: 3,
                    }}
                    src="../../assets/calendar.svg"
                    alt="calendar"
                    onClick={() => {
                      if (disabled) return;
                      setOpen(true);
                    }}
                  />
                </>
              ),
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default CalendarComponent;
