import { Box } from "@mui/system";
import type { SxProps } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import { stateColors, type stateAssignments } from "./stateColors";

interface StateBadgeProps {
  state: stateAssignments;
  sx?: SxProps;
}

const StateBadge = ({ state, sx }: StateBadgeProps) => (
  <Box
    sx={{
      p: "4px 16px",
      border: `1px solid ${stateColors[state].border}`,
      borderRadius: "20px",
      bgcolor: stateColors[state].bg,
      color: stateColors[state].color,
      fontFamily: Fonts.main,
      fontSize: "12px",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...sx,
    }}
  >
    {state}
  </Box>
);

const AssignmentSubText = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "14px",
  fontWeight: 400,
  color: Colors.charcoalNavy,
  lineHeight: 1.43,
  margin: 0,
});

const AssignmentTitle = styled("p")({
  fontFamily: Fonts.main,
  fontSize: "20px",
  fontWeight: 700,
  color: Colors.charcoalNavy,
  margin: 0,
  lineHeight: 1.5,
});

interface AssignmentHeaderProps {
  location: number;
  store: number;
  date: string;
  state: stateAssignments;
}

export const AssignmentHeader = ({
  location,
  store,
  date,
  state,
}: AssignmentHeaderProps) => (
  <Box display="flex" flexDirection="column">
    <Box height="20px" sx={{ display: "flex", alignItems: "center" }}>
      <img
        style={{ margin: "0 6px 0 0" }}
        src="./assets/building-07.svg"
        alt="Location"
      />
      <AssignmentSubText style={{ marginRight: "18px" }}>
        {location}
      </AssignmentSubText>
      <img
        style={{ margin: "0 6px 0 0" }}
        src="./assets/building-02.svg"
        alt="Store"
      />
      <AssignmentSubText>{store}</AssignmentSubText>
    </Box>
    <Box height="30px" display="flex" flexDirection="row" alignItems="center">
      <AssignmentTitle>{date}</AssignmentTitle>
      <StateBadge state={state} sx={{ ml: "8px" }} />
    </Box>
  </Box>
);

export default StateBadge;
