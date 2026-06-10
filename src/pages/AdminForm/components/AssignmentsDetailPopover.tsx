import { Box } from "@mui/system";
import PopoverMenu from "../../../components/PopoverMenu";
import StateBadge from "../../../components/StateBadge";
import { Colors, Fonts } from "../../../theme";
import type { stateAssignments } from "../../../components/stateColors";
import styled from "@emotion/styled";

export interface AssignmentDetail {
  date: string;
  state: stateAssignments;
}

interface Props {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  details: AssignmentDetail[];
}

const Title = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "18px",
  fontWeight: 600,
  color: Colors.charcoalNavy,
  height: "30px",
  lineHeight: 1.5,
});

const AssignmentsDetailPopover = ({
  open,
  anchorEl,
  onClose,
  details,
}: Props) => (
  <PopoverMenu
    open={open}
    anchorEl={anchorEl}
    setAnchorEl={onClose}
    maxWidth="300px"
    padding="14px"
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    transformOrigin={{ vertical: "top", horizontal: "center" }}
  >
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "100%",
      }}
    >
      <Title>Details</Title>
      {details.map((item, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom:
              i !== details.length - 1
                ? `1px solid ${Colors.paleGray}`
                : "none",
            paddingBottom: "6px",
          }}
        >
          <Box
            sx={{
              fontFamily: Fonts.main,
              fontSize: "14px",
              color: Colors.lightBlack,
              whiteSpace: "nowrap",
            }}
          >
            {item.date}
          </Box>
          <Box
            sx={{
              minWidth: "110px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <StateBadge state={item.state} />
          </Box>
        </Box>
      ))}
    </Box>
  </PopoverMenu>
);

export default AssignmentsDetailPopover;
