import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import PopoverMenu from "./PopoverMenu";
import styled from "@emotion/styled";

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
}

const MenuHeaderContainer = styled(Box)({
  display: "flex",
  padding: "8px 0",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
  borderBottom: `1px solid ${Colors.paleGray}`,
});

const TitleHeaderMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: 1.56,
  color: Colors.lightBlack,
  textAlign: "left",
});

const SubTitleHeaderMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "12px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.dimGray,
  textAlign: "left",
});

const TextHeaderMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.lightBlack,
  textAlign: "left",
});

const SubTextHeaderMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: "normal",
  lineHeight: 1.5,
  color: Colors.dimGray,
  textAlign: "left",
});

const HeaderInfoMenu = ({ anchorEl, open, handleClose }: Props) => {
  return (
    <PopoverMenu anchorEl={anchorEl} open={open} setAnchorEl={handleClose}>
      <Box
        sx={{
          width: "100%",
          height: "100%",
        }}
      >
        <Box sx={{ borderBottom: `1px solid ${Colors.silverGrey}` }}>
          <TitleHeaderMenu>Information</TitleHeaderMenu>
          <SubTitleHeaderMenu>
            Store: 7437 (0079) <span style={{ margin: "0 5px" }}> - </span>{" "}
            User: 605
          </SubTitleHeaderMenu>
        </Box>
        <MenuHeaderContainer sx={{ mt: "8px" }}>
          <TextHeaderMenu>Date</TextHeaderMenu>
          <SubTextHeaderMenu>Mar 19, 2025</SubTextHeaderMenu>
        </MenuHeaderContainer>
        <MenuHeaderContainer sx={{ mt: "8px" }}>
          <TextHeaderMenu>Open</TextHeaderMenu>
          <SubTextHeaderMenu>09:00 (MST)</SubTextHeaderMenu>
        </MenuHeaderContainer>
        <MenuHeaderContainer sx={{ mt: "8px" }}>
          <TextHeaderMenu>Close</TextHeaderMenu>
          <SubTextHeaderMenu>19:00 (MST)</SubTextHeaderMenu>
        </MenuHeaderContainer>
        <MenuHeaderContainer sx={{ mt: "8px" }}>
          <TextHeaderMenu>Open at</TextHeaderMenu>
          <SubTextHeaderMenu>08:00 </SubTextHeaderMenu>
        </MenuHeaderContainer>
        <MenuHeaderContainer sx={{ mt: "8px" }}>
          <TextHeaderMenu>DVR</TextHeaderMenu>
          <SubTextHeaderMenu>08:00 </SubTextHeaderMenu>
        </MenuHeaderContainer>
        <MenuHeaderContainer sx={{ mt: "8px" }}>
          <TextHeaderMenu>Diff</TextHeaderMenu>
          <SubTextHeaderMenu>0</SubTextHeaderMenu>
        </MenuHeaderContainer>
        <MenuHeaderContainer sx={{ mt: "8px" }}>
          <TextHeaderMenu>Interval</TextHeaderMenu>
          <SubTextHeaderMenu>Events</SubTextHeaderMenu>
        </MenuHeaderContainer>
      </Box>
    </PopoverMenu>
  );
};

export default HeaderInfoMenu;
