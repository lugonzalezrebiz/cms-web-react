import type { ReactNode } from "react";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../theme";
import Dialog from "./Dialog";
import type { stateAssignments } from "./stateColors";
import { AssignmentHeader } from "./StateBadge";

interface AssignmentInfo {
  location: number;
  store: number;
  date: string;
  state: stateAssignments;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
  gap?: string | number;
  padding?: string;
  assignment?: AssignmentInfo;
}

const Title = styled("p")({
  margin: 0,
  fontFamily: Fonts.main,
  fontSize: "20px",
  fontWeight: 600,
  color: Colors.charcoalNavy,
  height: "30px",
  lineHeight: 1.5,
});

const FormDialog = ({
  open,
  onClose,
  title,
  children,
  maxWidth = "400px",
  gap = "16px",
  padding = "16px",
  assignment,
}: Props) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} padding={padding}>
      <form>
        <Box sx={{ display: "flex", flexDirection: "column", gap }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              {assignment && <AssignmentHeader {...assignment} />}
              {title && <Title>{title}</Title>}
            </Box>
            <Box
              sx={{
                position: "absolute",
                top: "14px",
                right: "14px",
                cursor: "pointer",
              }}
            >
              <img onClick={onClose} src="./assets/x-close.svg" alt="" />
            </Box>
          </Box>
          {children}
        </Box>
      </form>
    </Dialog>
  );
};

export default FormDialog;
