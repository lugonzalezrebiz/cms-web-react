import { Box } from "@mui/system";
import { Colors, Fonts } from "../theme";
import PopoverMenu from "./PopoverMenu";
import styled from "@emotion/styled";
import { stateColors } from "../pages/Assignments/components/stateColors";
import type { stateAssignments } from "../types";

export interface HeaderInfo {
  title: string;
  state: stateAssignments;
  subTitle: { store: string; user: string };
  items: { activity: string; complement: string }[];
  commentsTex: string[];
}

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  handleClose: () => void;
  info?: HeaderInfo;
}

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

const HeaderInfoMenu = ({ anchorEl, open, handleClose, info }: Props) => {
  if (!info) return null;
  const activeState = info.state;

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
            <TitleHeaderMenu>{info.title}</TitleHeaderMenu>
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
            Store: {info.subTitle.store}
            <span style={{ margin: "0 5px" }}>-</span>
            User: {info.subTitle.user}
          </SubTitleHeaderMenu>
        </Box>
        {info.items.map((item, index) => (
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
            {info.commentsTex.length}
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
          {info.commentsTex.map((comment, index) => (
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
