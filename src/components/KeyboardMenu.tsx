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
  //fontSize: "14px",
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

const KeyboardMenu = ({ anchorEl, open, handleClose }: Props) => {
  return (
    <PopoverMenu anchorEl={anchorEl} open={open} setAnchorEl={handleClose}>
      <Box
        sx={{
          width: "100%",
          height: "100%",
        }}
      >
        <TitleKeyboardMenu>Keyboard shortcuts</TitleKeyboardMenu>
        <MenuKeyboardContainer mt={"8px"}>
          <IconKeyboardContainer>
            <img src="../assets/arrow-narrow-left.svg" alt="" />
          </IconKeyboardContainer>
          <TextKeyBoardMenu>Move back in time</TextKeyBoardMenu>
        </MenuKeyboardContainer>
        <MenuKeyboardContainer>
          <IconKeyboardContainer>
            <img src="../assets/arrow-narrow-right.svg" alt="" />
          </IconKeyboardContainer>
          <TextKeyBoardMenu>Move forward in time</TextKeyBoardMenu>
        </MenuKeyboardContainer>
        <MenuKeyboardContainer>
          <Box display={"flex"} gap={"8px"}>
            <IconKeyboardContainer fontSize={"14px"}>
              Ctrl
            </IconKeyboardContainer>
            <IconKeyboardContainer>
              <img src="../assets/arrow-narrow-left.svg" alt="" />
            </IconKeyboardContainer>
          </Box>
          <TextKeyBoardMenu>Back to person</TextKeyBoardMenu>
        </MenuKeyboardContainer>
        <MenuKeyboardContainer>
          <Box display={"flex"} gap={"8px"}>
            <IconKeyboardContainer fontSize={"14px"}>
              Ctrl
            </IconKeyboardContainer>
            <IconKeyboardContainer>
              <img src="../assets/arrow-narrow-right.svg" alt="" />
            </IconKeyboardContainer>
          </Box>
          <TextKeyBoardMenu>Forward to person</TextKeyBoardMenu>
        </MenuKeyboardContainer>
        <MenuKeyboardContainer>
          <Box display={"flex"} gap={"8px"}>
            <IconKeyboardContainer fontSize={"12px"}>
              Shift
            </IconKeyboardContainer>
            <IconKeyboardContainer fontSize={"16px"}>G</IconKeyboardContainer>
          </Box>
          <TextKeyBoardMenu>Move to specific time</TextKeyBoardMenu>
        </MenuKeyboardContainer>
        <MenuKeyboardContainer>
          <IconKeyboardContainer fontSize={"12px"}>Home</IconKeyboardContainer>
          <TextKeyBoardMenu>Move to first frame</TextKeyBoardMenu>
        </MenuKeyboardContainer>
        <MenuKeyboardContainer>
          <IconKeyboardContainer fontSize={"16px"}>Q</IconKeyboardContainer>
          <TextKeyBoardMenu>Employee/Flag Mode</TextKeyBoardMenu>
        </MenuKeyboardContainer>
        <MenuKeyboardContainer>
          <IconKeyboardContainer fontSize={"12px"}>DEL</IconKeyboardContainer>
          <TextKeyBoardMenu>Delete selected employee</TextKeyBoardMenu>
        </MenuKeyboardContainer>
        <MenuKeyboardContainer>
          <IconKeyboardContainer fontSize={"12px"}>
            <img src="../assets/plus-1.svg" alt="" />
          </IconKeyboardContainer>
          <TextKeyBoardMenu>Delete selected employee</TextKeyBoardMenu>
        </MenuKeyboardContainer>
      </Box>
    </PopoverMenu>
  );
};

export default KeyboardMenu;
