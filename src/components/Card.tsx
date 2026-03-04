import { Box } from "@mui/system";
import styled from "@emotion/styled";
import theme from "../theme";

interface StyledCardProps {
  noBorder?: boolean;
}

const Card = styled(Box, {
  shouldForwardProp: (prop) => prop !== "noBorder",
})<StyledCardProps>(({ noBorder }) => ({
  boxShadow: theme.shadows[0],
  border: noBorder ? "none" : `1px solid ${theme.palette.grey[500]}`,
  borderRadius: "0.25rem",
}));

export default Card;
