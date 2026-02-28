import styled from "@emotion/styled";

interface DividerProps {
  marginBottom?: string;
}

const Divider = styled.div(({ marginBottom }: DividerProps) => ({
  height: "1px",
  alignSelf: "stretch",
  flexGrow: 0,
  transform: "rotate(-360deg)",
  backgroundColor: "#e6e9ec",
  marginBottom: marginBottom || "20px",
}));

export default Divider;
