import styled from "@emotion/styled";
import { Colors } from "../../../theme";

const Fix = styled("div")<{ scrolled: boolean }>(({ scrolled }) => ({
  position: "sticky",
  top: 0,
  zIndex: 1000,
  backgroundColor: Colors.white,
  boxShadow: scrolled ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
  transition: "all 0.2s ease-in-out",
  ["WebkitAppRegion" as string]: "drag",
}));

export default Fix;
