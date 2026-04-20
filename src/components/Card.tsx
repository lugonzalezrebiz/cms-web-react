import { Box } from "@mui/system";
import styled from "@emotion/styled";
import theme from "../theme";

interface StyledCardProps {
  noBorder?: boolean;
  borderRadius?: string;
}

const Card = styled(Box, {
  shouldForwardProp: (prop) => prop !== "noBorder" && prop !== "borderRadius",
})<StyledCardProps>(({ noBorder, borderRadius = "0.25rem" }) => ({
  boxShadow: theme.shadows[0],
  border: noBorder ? "none" : `1px solid ${theme.palette.grey[500]}`,
  borderRadius,
}));

export default Card;
