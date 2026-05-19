import CircularProgress from "@mui/material/CircularProgress";
import { Colors } from "../theme";

interface SpinnerProps {
  size?: number;
  m?: string;
}

const Spinner = ({ size = 40, m = "0px" }: SpinnerProps) => (
  <CircularProgress size={size} sx={{ color: Colors.vividOrange, m: m }} />
);

export default Spinner;
