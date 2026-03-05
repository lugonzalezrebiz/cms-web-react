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

const CLOCK_MENU_MOCK = {
  title: "External data",
  items: [
    {
      activity: "30 min Stretch",
      name: "Sebastian Castillo",
      hour: "08:30",
    },
    {
      activity: "30 min Stretch",
      name: "Jethro Nicolas",
      hour: "10:00",
    },
    {
      activity: "30 min Stretch",
      name: "David Guillory",
      hour: "13:30",
    },
    {
      activity: "60 min Stretch",
      name: "Sebastian Castillo",
      hour: "16:00",
    },
  ],
};

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
          {CLOCK_MENU_MOCK.title}
        </TitleClockMenu>
        {CLOCK_MENU_MOCK.items.map((item, index) => (
          <MenuClockContainer mt={index === 0 ? "8px" : undefined}>
            <Box>
              <TextClockMenu>{item.activity}</TextClockMenu>
              <SubTextClockMenu>{item.name}</SubTextClockMenu>
            </Box>
            <NumberClockMenu>{item.hour}</NumberClockMenu>
          </MenuClockContainer>
        ))}
      </Box>
    </PopoverMenu>
  );
};

export default ClockMenu;
