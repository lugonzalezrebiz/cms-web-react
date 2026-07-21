import { Box } from "@mui/system";
import type { AssignmentDetail } from "../../../../hooks/useUserAssignments";

const AssignmentToggle = ({
  details,
  activeKey,
  rowKey,
  onToggle,
}: {
  details: AssignmentDetail[];
  activeKey: string | null;
  rowKey: string;
  onToggle: (key: string) => void;
}) => {
  const hasDetails = details.length > 0;
  return (
    <Box
      onClick={() => hasDetails && onToggle(rowKey)}
      sx={{
        cursor: hasDetails ? "pointer" : "default",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {details.length} {details.length === 1 ? "assignment" : "assignments"}
      {hasDetails && (
        <img
          src="./assets/chevron-down-2.svg"
          alt="Expand"
          style={{
            transform: activeKey === rowKey ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
          }}
        />
      )}
    </Box>
  );
};

export default AssignmentToggle;
