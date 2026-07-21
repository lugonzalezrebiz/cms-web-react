import { Box } from "@mui/system";

const DetailToggle = ({
  activeKey,
  rowKey,
  onToggle,
}: {
  activeKey: string | null;
  rowKey: string;
  onToggle: (key: string) => void;
}) => {
  return (
    <Box
      onClick={() => onToggle(rowKey)}
      sx={{
        cursor: "pointer",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      Details
      <img
        src="./assets/chevron-down-2.svg"
        alt="Expand"
        style={{
          transform: activeKey === rowKey ? "rotate(180deg)" : "none",
          transition: "transform 0.2s ease",
        }}
      />
    </Box>
  );
};

export default DetailToggle;
