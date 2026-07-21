import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../../../theme";

const DetailLabel = styled("span")({
  fontFamily: Fonts.main,
  fontSize: "12px",
  fontWeight: 600,
  color: Colors.dimGray,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
});

const DetailValue = styled("span")({
  fontFamily: Fonts.main,
  fontSize: "14px",
  color: Colors.dimGray,
});

const ExpandedDetailRow = ({
  items,
  isExpanded,
}: {
  items: { label: string; value: React.ReactNode }[];
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
            display: "flex",
            padding: "8px 6px",
            borderBottom: `1px solid ${Colors.paleGray}`,
          }}
        >
          {items.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "2px",
                padding: "6px 16px",
                flex: 1,
              }}
            >
              <DetailLabel>{item.label}</DetailLabel>
              <DetailValue>{item.value}</DetailValue>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ExpandedDetailRow;
