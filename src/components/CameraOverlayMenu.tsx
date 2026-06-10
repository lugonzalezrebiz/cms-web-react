import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import { Colors, Fonts } from "../theme";

export interface CameraContextMenuItem {
  id: number;
  name: string;
  label: string;
  icon?: string;
  shortcut?: string;
  dividerAfter?: boolean;
  reviewed?: boolean;
  onClick: (cameraId: number) => void;
}

interface CameraOverlayMenuProps {
  open: boolean;
  onClose: () => void;
  items: CameraContextMenuItem[];
  cameraId: number;
  title: string;
}

const CameraOverlayMenu = ({
  open,
  onClose,
  items,
  cameraId,
  title,
}: CameraOverlayMenuProps) => {
  if (!open) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.75)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "0",
        overflow: "hidden",
        containerType: "size",
      }}
    >
      <Box
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        sx={{
          position: "absolute",
          top: 16,
          right: 11,
          cursor: "pointer",
          color: Colors.main,
          fontSize: 16,
          fontWeight: "bold",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        ✕
      </Box>
      <Box p={"8px"} sx={{ borderBottom: "solid 1px #b3b3b3", width: "100%" }}>
        <Typography
          sx={{
            color: Colors.white,
            fontFamily: Fonts.main,
            fontWeight: 700,
            fontSize: 16,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          width: "100%",
          overflowY: "auto",
          flex: 1,
          alignContent: "start",
          "@container (min-height: 150px)": {
            alignContent: "center",
          },
          pb: "4px",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {items.map((item) => (
          <Box
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick(cameraId);
              onClose();
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: Colors.white,
              fontFamily: Fonts.main,
              fontWeight: 700,
              fontSize: 16,
              textAlign: "center",
              p: "4px 8px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background 0.15s",
              lineHeight: 1.5,
              "&:hover": { bgcolor: Colors.vividOrange },
            }}
          >
            {item.name}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default CameraOverlayMenu;
