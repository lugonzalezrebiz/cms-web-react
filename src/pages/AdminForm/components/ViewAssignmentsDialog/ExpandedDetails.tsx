import { Box } from "@mui/system";
import StateBadge from "../../../../components/StateBadge";
import { Colors, Fonts } from "../../../../theme";
import type { AssignmentDetail } from "../../../../hooks/useUserAssignments";

const ExpandedDetails = ({
  details,
  isExpanded,
}: {
  details: AssignmentDetail[];
  isExpanded: boolean;
}) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateRows: isExpanded ? "1fr" : "0fr",
        transition: "grid-template-rows 0.25s ease",
      }}
    >
      <Box sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            padding: "8px 6px",
            borderBottom: `1px solid ${Colors.paleGray}`,
            gap: "1px",
          }}
        >
          {details.map((item, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                borderBottom:
                  i < details.length - (details.length % 2 === 0 ? 2 : 1)
                    ? `1px solid ${Colors.paleGray}`
                    : "none",
                padding: "6px 16px",
                gap: "8px",
              }}
            >
              <Box
                sx={{
                  fontFamily: Fonts.main,
                  fontSize: "14px",
                  color: Colors.lightBlack,
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {item.date}
              </Box>
              <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <StateBadge state={item.state} size="md" />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ExpandedDetails;
