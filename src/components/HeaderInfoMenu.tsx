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

const HEADER_INFO_MOCK = {
  title: "Information",
  subTitle: {
    store: "7437 (0079)",
    user: "605",
  },
  date: "Mar 19, 2025",
  items: [
    {
      activity: "Open",
      complement: "09:00 (MST)",
    },
    {
      activity: "Close",
      complement: "19:00 (MST)",
    },
    {
      activity: "Open at",
      complement: "08:00",
    },
    {
      activity: "DVR",
      complement: "08:00",
    },
    {
      activity: "Diff",
      complement: "0",
    },
    {
      activity: "Interval",
      complement: "Events",
    },
  ],
};

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
          <TitleHeaderMenu>{HEADER_INFO_MOCK.title}</TitleHeaderMenu>
          <SubTitleHeaderMenu>
            Store: {HEADER_INFO_MOCK.subTitle.store}{" "}
            <span style={{ margin: "0 5px" }}> - </span> User:{" "}
            {HEADER_INFO_MOCK.subTitle.user}
          </SubTitleHeaderMenu>
        </Box>
        {HEADER_INFO_MOCK.items.map((item, index) => (
          <MenuHeaderContainer sx={{ mt: index === 0 ? "8px" : undefined }}>
            <TextHeaderMenu>{item.activity}</TextHeaderMenu>
            <SubTextHeaderMenu>{item.complement}</SubTextHeaderMenu>
          </MenuHeaderContainer>
        ))}
      </Box>
    </PopoverMenu>
  );
};

export default HeaderInfoMenu;
