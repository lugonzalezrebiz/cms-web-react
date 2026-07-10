import React, { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { Box, Stack, Typography, TextField } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { Colors, Fonts } from "../../../theme";
import Button from "../../../components/Button";

dayjs.extend(utc);

export type MaybeDayjs = Dayjs | null;

const DEFAULT_RANGE: [MaybeDayjs, MaybeDayjs] = [null, null];

interface RangeCalendarProps {
  defaultRange?: [MaybeDayjs, MaybeDayjs];
  onApply?: (range: [MaybeDayjs, MaybeDayjs]) => void;
  minDate?: MaybeDayjs;
  maxDate?: MaybeDayjs;
  children?: React.ReactNode;
}

const StyledDateCalendar = styled(DateCalendar)({
  "&.MuiDateCalendar-root": {
    margin: "5px",
    width: "340px",
    height: "auto",
    "& .MuiPickersCalendarHeader-root": {
      width: "100%",
      padding: 0,
      marginTop: 0,
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
    "& .MuiDayCalendar-weekDayLabel": {
      fontSize: "14px",
      fontWeight: 500,
      fontFamily: Fonts.main,
      color: Colors.charcoalNavy,
    },
    '& div[role="row"]': {
      justifyContent: "space-around",
    },
    "& .MuiDayCalendar-slideTransition": {
      minHeight: "220px",
    },
    "& .MuiPickersDay-root": {
      height: "40px",
      width: "40px",
      fontSize: "14px",
      fontFamily: Fonts.main,
    },
  },
});

const RangeCalendar = ({
  defaultRange = DEFAULT_RANGE,
  onApply,
  minDate,
  maxDate,
  children,
}: RangeCalendarProps) => {
  const [committed, setCommitted] =
    useState<[MaybeDayjs, MaybeDayjs]>(defaultRange);
  const [temp, setTemp] = useState<[MaybeDayjs, MaybeDayjs]>(defaultRange);
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const handleDateClick = (date: Dayjs) => {
    const [start] = temp;

    if (selecting === "start") {
      setTemp([date.startOf("day"), null]);
      setSelecting("end");
    } else {
      if (!start) {
        setTemp([date.startOf("day"), null]);
        setSelecting("end");
      } else {
        const clicked = date.startOf("day");
        if (clicked.isBefore(start, "day")) {
          setTemp([clicked, start]);
        } else {
          setTemp([start, clicked]);
        }
        setSelecting("start");
      }
    }
  };

  const isInRange = (day: Dayjs) => {
    const [start, end] = temp;
    if (start && end) {
      const startDay = day.utc().startOf("day");
      const endDay = day.endOf("day");
      return startDay.isAfter(start, "day") && endDay.isBefore(end, "day");
    }
    return false;
  };

  const isStart = (day: Dayjs) => {
    const [start] = temp;
    if (start) {
      return day.utc().isSame(start, "day");
    }
    return false;
  };

  const isEnd = (day: Dayjs) => {
    const [, end] = temp;
    if (end) {
      return day.isSame(end, "day");
    }
    return false;
  };

  const getValue = () => {
    if (selecting === "start" && temp[0]) return temp[0];
    if (selecting === "end" && temp[1]) return temp[1];
    if (temp[0]) return temp[0];
    return dayjs();
  };

  const handleCancel = () => {
    setTemp(committed);
    setSelecting("start");
    setIsOpen(false);
  };

  const handleApply = () => {
    setCommitted(temp);
    onApply?.(temp);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setTemp(committed);
        setSelecting("start");
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [committed]);

  useEffect(() => {
    setCommitted(defaultRange);
    setTemp(defaultRange);
  }, [defaultRange]);

  return (
    <Box sx={{ position: "relative" }} ref={boxRef}>
      <TextField
        value={
          (temp[0] ? temp[0].format("MMM DD") : "-") +
          " to " +
          (temp[1] ? temp[1].format("MMM DD") : "-")
        }
        variant="outlined"
        sx={{
          "& .MuiInputBase-root": {
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: Fonts.main,
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "24px",
            padding: "10px 14px",
            color: Colors.charcoalNavy,
            height: "44px",
            borderRadius: "8px",
            border: `1px solid ${Colors.paleGray}`,
            width: "368px",
          },
          "& input": {
            padding: 0,
            fontFamily: Fonts.main,
            fontSize: "16px",
            color: Colors.dimGray,
          },
          "& fieldset": {
            border: "none",
          },
        }}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <img
              style={{
                width: 18,
                height: 18,
                cursor: "pointer",
              }}
              src="../assets/calendar.svg"
              alt="calendar"
              onClick={() => setIsOpen(true)}
            />
          ),
        }}
      />
      {isOpen && (
        <Box
          sx={{
            position: "absolute",
            top: "44px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            boxShadow: "0 2px 10px 0 rgba(0, 0, 0, 0.16)",
            borderRadius: "14px",
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box
              sx={{
                borderRadius: "14px",
                padding: "16px",
                backgroundColor: "white",
                width: "344px",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                columnGap="5px"
                marginBottom={1.5}
              >
                <Typography
                  variant="h6"
                  align="center"
                  sx={{
                    color: Colors.charcoalNavy,
                    fontWeight: 600,
                    fontFamily: Fonts.main,
                    marginRight: "5px",
                    fontSize: "18px",
                  }}
                >
                  Pick a Date Range
                </Typography>
                {children}
              </Box>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <TextField
                  size="small"
                  value={temp[0] ? temp[0].format("MMM D, YYYY") : ""}
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-root": {
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontFamily: Fonts.main,
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "24px",
                      padding: " 10px 14px",
                      color: Colors.charcoalNavy,
                      height: "44px",
                      borderRadius: "8px",
                      border: `1px solid ${Colors.paleGray}`,
                    },
                    "& input": {
                      padding: 0,
                      fontFamily: Fonts.main,
                      fontSize: "16px",
                      color: Colors.charcoalNavy,
                    },
                    "& fieldset": {
                      border: "none",
                    },
                  }}
                />
                <Typography sx={{ mx: 1 }}>-</Typography>
                <TextField
                  value={temp[1] ? temp[1].format("MMM D, YYYY") : ""}
                  InputProps={{ readOnly: true }}
                  sx={{
                    "& .MuiInputBase-root": {
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontFamily: Fonts.main,
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "24px",
                      padding: " 10px 14px",
                      color: Colors.charcoalNavy,
                      height: "44px",
                      borderRadius: "8px",
                      border: `1px solid ${Colors.paleGray}`,
                    },
                    "& input": {
                      padding: 0,
                      fontFamily: Fonts.main,
                      fontSize: "16px",
                      color: Colors.charcoalNavy,
                    },
                    "& fieldset": {
                      border: "none",
                    },
                  }}
                />
              </Stack>

              <StyledDateCalendar
                views={["day"]}
                value={getValue()}
                onChange={(newDate) => {
                  if (!newDate) return;
                  handleDateClick(newDate as Dayjs);
                }}
                disablePast
                minDate={minDate || undefined}
                maxDate={maxDate || undefined}
                slots={{
                  day: (props) => {
                    const { day, ...other } = props;
                    const inRange = isInRange(day as Dayjs);
                    const start = isStart(day as Dayjs);
                    const end = isEnd(day as Dayjs);

                    return (
                      <PickersDay
                        {...other}
                        day={day}
                        sx={{
                          ...((start || end) && {
                            backgroundColor: Colors.lightOrange,
                            color: Colors.white,
                            "&:hover": {
                              backgroundColor: Colors.lightOrange,
                            },
                            "&:focus": {
                              backgroundColor: Colors.lightOrange,
                            },
                          }),
                          ...(inRange && {
                            backgroundColor: "#EEF1F4",
                            color: Colors.lightBlack,
                            "&:hover": {
                              backgroundColor: "#EEF1F4",
                            },
                            "&:focus": {
                              backgroundColor: "#EEF1F4",
                            },
                          }),
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
                        }}
                      />
                    );
                  },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <Button
                  fontSize="14px"
                  sx={{ height: "36px" }}
                  color="secondary"
                  onClick={handleCancel}
                  outfit
                >
                  Cancel
                </Button>
                <Button
                  fontSize="14px"
                  sx={{ height: "36px" }}
                  color="primary"
                  onClick={handleApply}
                  outfit
                >
                  Apply
                </Button>
              </Box>
            </Box>
          </LocalizationProvider>
        </Box>
      )}
    </Box>
  );
};

export default RangeCalendar;
