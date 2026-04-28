import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import PopoverMenu from "./PopoverMenu";
import styled from "@emotion/styled";

export type StateAssignment = "Paused" | "New" | "Resolved" | "Rejected";

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
  state?: StateAssignment;
}

const HEADER_INFO_MOCK = {
  title: "February 25 - 2026",
  state: "New" as StateAssignment,
  subTitle: {
    store: "7437 (0079)",
    user: "605",
  },
  items: [
    { activity: "Open", complement: "09:00 (MST)" },
    { activity: "Close", complement: "19:00 (MST)" },
    { activity: "Open at", complement: "08:00" },
    { activity: "DVR", complement: "08:00" },
    { activity: "Diff", complement: "0" },
    { activity: "Interval", complement: "Events" },
  ],
  commentsTex: [
    "This comment is vey important, please be aware that the light whent out at 10:35 am untill 11:23 am",
    "Remember the key to our craft is to embrace lifelong learning and adapt to new challenges with unwavering enthusiasm.",
  ],
};

const stateColors: Record<
  StateAssignment,
  { border: string; bg: string; color: string }
> = {
  New: {
    border: Colors.leafGreen,
    bg: Colors.mintFoam,
    color: Colors.leafGreen,
  },
  Paused: {
    border: Colors.goldenAmber,
    bg: Colors.creamYellow,
    color: Colors.goldenAmber,
  },
  Resolved: {
    border: Colors.royalBlue,
    bg: Colors.lightSkyBlue,
    color: Colors.royalBlue,
  },
  Rejected: {
    border: Colors.blushRed,
    bg: Colors.palePink,
    color: Colors.blushRed,
  },
};

const TitleHeaderMenu = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: 1.5,
  color: Colors.lightBlack,
});

const SubTitleHeaderMenu = styled("p")({
  margin: "4px 0 0 0",
  fontFamily: Fonts.main,
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: 1.5,
  color: Colors.dimGray,
});

const MenuHeaderContainer = styled(Box)({
  display: "flex",
  padding: "8px 0",
  alignItems: "center",
  gap: "10px",
  justifyContent: "space-between",
  borderBottom: `1px solid ${Colors.paleGray}`,
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

const TextComments = styled("p")({
  margin: "16px 0 8px 0",
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: 1.43,
  color: Colors.lightBlack,
  textAlign: "left",
  fontWeight: 700,
});

const Comments = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: 1.43,
  color: Colors.lightBlack,
  textAlign: "left",
  fontWeight: 400,
});

const HeaderInfoMenu = ({ anchorEl, open, handleClose, state }: Props) => {
  const activeState = state ?? HEADER_INFO_MOCK.state;

  return (
    <PopoverMenu
      anchorEl={anchorEl}
      open={open}
      setAnchorEl={handleClose}
      maxWidth="280px"
      height="500px"
    >
      <Box sx={{ width: "100%" }}>
        <Box sx={{ pb: "8px", borderBottom: `1px solid ${Colors.silverGrey}` }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <TitleHeaderMenu>{HEADER_INFO_MOCK.title}</TitleHeaderMenu>
            <Box
              sx={{
                p: "4px 16px",
                border: `1px solid ${stateColors[activeState].border}`,
                borderRadius: "20px",
                bgcolor: stateColors[activeState].bg,
                color: stateColors[activeState].color,
                fontFamily: Fonts.main,
                fontSize: "12px",
                fontWeight: 700,
                ml: "7px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {activeState}
            </Box>
          </Box>
          <SubTitleHeaderMenu>
            Store: {HEADER_INFO_MOCK.subTitle.store}
            <span style={{ margin: "0 5px" }}>-</span>
            User: {HEADER_INFO_MOCK.subTitle.user}
          </SubTitleHeaderMenu>
        </Box>
        {HEADER_INFO_MOCK.items.map((item, index) => (
          <MenuHeaderContainer
            key={index}
            sx={{ mt: index === 0 ? "8px" : undefined }}
          >
            <TextHeaderMenu>{item.activity}</TextHeaderMenu>
            <SubTextHeaderMenu>{item.complement}</SubTextHeaderMenu>
          </MenuHeaderContainer>
        ))}
        <TextComments>
          <span style={{ marginRight: "8px" }}>
            {HEADER_INFO_MOCK.commentsTex.length}
          </span>
          Comments:
        </TextComments>
        <Box
          component="ol"
          sx={{
            "& li::marker": {
              content: "counter(list-item)",
              fontFamily: Fonts.main,
              fontWeight: "bold",
              fontSize: "14px",
            },
            margin: "0 0 0 7px",
            padding: 0,
          }}
        >
          {HEADER_INFO_MOCK.commentsTex.map((comment, index) => (
            <li key={index}>
              <Comments style={{ margin: "8px 0 8px 8px" }}>{comment}</Comments>
            </li>
          ))}
        </Box>
      </Box>
    </PopoverMenu>
  );
};

export default HeaderInfoMenu;
