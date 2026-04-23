import { Box, Popover } from "@mui/material";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../theme";
import { CAMERA_OPTIONS } from "./constants";

const MenuCameraContainer = styled(Box)({
  display: "flex",
  padding: "8px",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
});

const TitleCameraMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: 1.5,
  color: Colors.lightBlack,
  textAlign: "left",
  display: "flex",
  justifyContent: "space-between",
  borderBottom: `1px solid ${Colors.silverGrey}`,
  padding: "4px 8px",
});

const TextCameraMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: 1.43,
  textAlign: "left",
});

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  selectedOption: string;
  onOptionChange: (option: string) => void;
}

const TimelineCameraPopover = ({
  open,
  anchorEl,
  onClose,
  selectedOption,
  onOptionChange,
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
          width: "100%",
          maxWidth: "199px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "8px",
          boxShadow: "0 2px 10px 0 rgba(0, 0, 0, 0.16)",
          borderRadius: "8px",
          marginTop: "-2px",
          marginLeft: "-8px",
        },
      },
    }}
  >
    <Box sx={{ width: "100%", height: "100%" }}>
      <TitleCameraMenu>
        Focused monitoring
        <img src="../assets/plus-1.svg" alt="" />
      </TitleCameraMenu>
      {CAMERA_OPTIONS.map((option) => {
        const isSelected = selectedOption === option;
        return (
          <MenuCameraContainer
            key={option}
            onClick={() => onOptionChange(option)}
            sx={{
              cursor: "pointer",
              backgroundColor: isSelected ? Colors.vividOrange : "transparent",
              "&:hover": {
                backgroundColor: isSelected
                  ? Colors.vividOrange
                  : Colors.lightPeach,
              },
            }}
          >
            <TextCameraMenu
              style={{
                color: isSelected ? Colors.white : Colors.lightBlack,
                fontWeight: isSelected ? 500 : 400,
              }}
            >
              {option}
            </TextCameraMenu>
            {isSelected && <img src="/assets/check.svg" alt="selected" />}
          </MenuCameraContainer>
        );
      })}
    </Box>
  </Popover>
);

export default TimelineCameraPopover;
