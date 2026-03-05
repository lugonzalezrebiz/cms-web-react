import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import PopoverMenu from "./PopoverMenu";
import styled from "@emotion/styled";

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
}

const MenuKeyboardContainer = styled(Box)({
  display: "flex",
  padding: "8px 0",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
  borderBottom: `1px solid ${Colors.paleGray}`,
});

const IconKeyboardContainer = styled(Box)({
  height: "32px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "2px 8px",
  gap: "10px",
  borderRadius: "4px",
  backgroundColor: Colors.blushWhite,
  color: Colors.vividOrange,
  lineHeight: 1.43,
  fontFamily: Fonts.main,
});

const TitleKeyboardMenu = styled("p")({
  margin: "10px 0 0 0",
  fontFamily: Fonts.main,
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: 1.56,
  color: Colors.lightBlack,
  textAlign: "left",
  borderBottom: `1px solid ${Colors.silverGrey}`,
});

const TextKeyBoardMenu = styled("p")({
  margin: "0 8px 0 0",
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: "normal",
  lineHeight: 1.43,
  color: Colors.lightBlack,
  textAlign: "left",
});

const KEYBOARD_MENU_MOCK = {
  title: "Keyboard shortcuts",
  items: [
    {
      keys: [{ type: "img", src: "../assets/arrow-narrow-left.svg" }],
      label: "Move back in time",
    },
    {
      keys: [{ type: "img", src: "../assets/arrow-narrow-right.svg" }],
      label: "Move forward in time",
    },
    {
      keys: [
        { type: "text", label: "Ctrl", fontSize: "14px" },
        { type: "img", src: "../assets/arrow-narrow-left.svg" },
      ],
      label: "Back to person",
    },
    {
      keys: [
        { type: "text", label: "Ctrl", fontSize: "14px" },
        { type: "img", src: "../assets/arrow-narrow-right.svg" },
      ],
      label: "Forward to person",
    },
    {
      keys: [
        { type: "text", label: "Shift", fontSize: "12px" },
        { type: "text", label: "G", fontSize: "16px" },
      ],
      label: "Move to specific time",
    },
    {
      keys: [{ type: "text", label: "Home", fontSize: "12px" }],
      label: "Move to first frame",
    },
    {
      keys: [{ type: "text", label: "Q", fontSize: "16px" }],
      label: "Employee/Flag Mode",
    },
    {
      keys: [{ type: "text", label: "DEL", fontSize: "12px" }],
      label: "Delete selected employee",
    },
    {
      keys: [{ type: "img", src: "../assets/plus-1.svg" }],
      label: "Delete selected employee",
    },
  ],
};

const KeyboardMenu = ({ anchorEl, open, handleClose }: Props) => {
  return (
    <PopoverMenu anchorEl={anchorEl} open={open} setAnchorEl={handleClose}>
      <Box sx={{ width: "100%", height: "100%" }}>
        <TitleKeyboardMenu>{KEYBOARD_MENU_MOCK.title}</TitleKeyboardMenu>
        {KEYBOARD_MENU_MOCK.items.map((item, index) => (
          <MenuKeyboardContainer
            key={index}
            mt={index === 0 ? "8px" : undefined}
          >
            {item.keys.length > 1 ? (
              <Box display="flex" gap="8px">
                {item.keys.map((key, i) =>
                  key.type === "img" ? (
                    <IconKeyboardContainer key={i}>
                      <img src={key.src} alt="" />
                    </IconKeyboardContainer>
                  ) : (
                    <IconKeyboardContainer key={i} fontSize={key.fontSize}>
                      {key.label}
                    </IconKeyboardContainer>
                  ),
                )}
              </Box>
            ) : item.keys[0].type === "img" ? (
              <IconKeyboardContainer>
                <img src={item.keys[0].src} alt="" />
              </IconKeyboardContainer>
            ) : (
              <IconKeyboardContainer fontSize={item.keys[0].fontSize}>
                {item.keys[0].label}
              </IconKeyboardContainer>
            )}
            <TextKeyBoardMenu>{item.label}</TextKeyBoardMenu>
          </MenuKeyboardContainer>
        ))}
      </Box>
    </PopoverMenu>
  );
};

export default KeyboardMenu;
