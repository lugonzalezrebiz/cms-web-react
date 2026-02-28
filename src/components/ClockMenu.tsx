import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import PopoverMenu from "./PopoverMenu";
import styled from "@emotion/styled";

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
}

const MenuClockContainer = styled(Box)({
  display: "flex",
  padding: "8px 0",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
  borderBottom: `1px solid ${Colors.paleGray}`,
});

const TitleClockMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: 1.56,
  color: Colors.lightBlack,
  textAlign: "left",
  borderBottom: `1px solid ${Colors.silverGrey}`,
});

const NumberClockMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.vividOrange,
  textAlign: "left",
});

const TextClockMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: 1.43,
  color: Colors.lightBlack,
  textAlign: "left",
});

const SubTextClockMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: "normal",
  lineHeight: 1.43,
  color: Colors.dimGray,
  textAlign: "left",
});

const ClockMenu = ({ anchorEl, open, handleClose }: Props) => {
  return (
    <PopoverMenu
      anchorEl={anchorEl}
      open={open}
      setAnchorEl={handleClose}
      height="270px"
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
        }}
      >
        <TitleClockMenu style={{ marginTop: "8px" }}>
          External data
        </TitleClockMenu>
        <MenuClockContainer mt={"8px"}>
          <Box>
            <TextClockMenu>30 min Stretch</TextClockMenu>
            <SubTextClockMenu>Sebastian Castillo</SubTextClockMenu>
          </Box>
          <NumberClockMenu>08:30</NumberClockMenu>
        </MenuClockContainer>
        <MenuClockContainer>
          <Box>
            <TextClockMenu>30 min Stretch Demo</TextClockMenu>
            <SubTextClockMenu>Jethro Nicolas</SubTextClockMenu>
          </Box>
          <NumberClockMenu>10:00</NumberClockMenu>
        </MenuClockContainer>
        <MenuClockContainer>
          <Box>
            <TextClockMenu>30 min Stretch</TextClockMenu>
            <SubTextClockMenu>David Guillory</SubTextClockMenu>
          </Box>
          <NumberClockMenu>13:30</NumberClockMenu>
        </MenuClockContainer>
        <MenuClockContainer>
          <Box>
            <TextClockMenu>60 min Stretching Consultation</TextClockMenu>
            <SubTextClockMenu>Sebastian Castillo</SubTextClockMenu>
          </Box>
          <NumberClockMenu>16:00</NumberClockMenu>
        </MenuClockContainer>
      </Box>
    </PopoverMenu>
  );
};

export default ClockMenu;
