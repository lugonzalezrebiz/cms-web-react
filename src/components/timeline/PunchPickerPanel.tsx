import type { ReactNode } from "react";
import { Box } from "@mui/system";
import styled from "@emotion/styled";
import { Colors, Fonts } from "../../theme";
import { assetUrl } from "../../utils";

export type PunchPickerItem = {
  id: number;
  title: ReactNode;
  lines: ReactNode[];
};

interface Props {
  items: PunchPickerItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  cameraCount: number;
  selectedCamera: number;
  onSelectCamera: (index: number) => void;
  previewSrc: string;
}

const ListItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected?: boolean }>(({ selected }) => ({
  padding: "8px 16px",
  backgroundColor: selected ? Colors.blushWhite : "transparent",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: Colors.blushWhite,
  },
}));

const CameraSlot = styled(Box, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected?: boolean }>(({ selected }) => ({
  width: "39px",
  height: "33px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: Colors.blushWhite,
  border: `1px solid ${selected ? Colors.vividOrange : "transparent"}`,
  cursor: "pointer",
}));

export const PickerTitleText = styled("p")({
  margin: 0,
  color: Colors.charcoalNavy,
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: 700,
});

export const PickerSubText = styled("p")({
  margin: 0,
  color: Colors.dimGray,
  fontFamily: Fonts.main,
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: 400,
});

const LabelValue = styled("span")({ color: Colors.charcoalNavy });

/** "Label: value" with the label greyed out (use inside PickerSubText). */
export const LabeledValue = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => (
  <>
    {label}: <LabelValue>{value}</LabelValue>
  </>
);

// List on the left + camera slots + preview on the right, shared by the
// punch-in pickers (employees, re-entering customers).
const PunchPickerPanel = ({
  items,
  selectedId,
  onSelect,
  cameraCount,
  selectedCamera,
  onSelectCamera,
  previewSrc,
}: Props) => (
  <Box
    sx={{
      display: "flex",
      border: `1px solid ${Colors.silverGrey}`,
      borderRadius: "8px",
      overflow: "hidden",
    }}
  >
    <Box
      sx={{
        width: "210px",
        flexShrink: 0,
        height: "386px",
        bgcolor: Colors.white,
        borderRight: `1px solid ${Colors.silverGrey}`,
        overflowY: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {items.map((item) => (
        <ListItem
          key={item.id}
          selected={selectedId === item.id}
          onClick={() => onSelect(item.id)}
        >
          <PickerTitleText>{item.title}</PickerTitleText>
          {item.lines.map((line, i) => (
            <PickerSubText key={i}>{line}</PickerSubText>
          ))}
        </ListItem>
      ))}
    </Box>

    <Box sx={{ display: "flex", gap: "8px", p: "8px", flex: 1, minWidth: 0 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {Array.from({ length: cameraCount }, (_, i) => (
          <CameraSlot
            key={i}
            selected={selectedCamera === i}
            onClick={() => onSelectCamera(i)}
          >
            <img src={assetUrl("webcam-01.svg")} alt="Webcam" />
          </CameraSlot>
        ))}
      </Box>
      <Box
        component="img"
        src={previewSrc}
        alt="Camera thumbnail"
        sx={{
          flex: 1,
          minWidth: 0,
          height: "370px",
          objectFit: "cover",
          bgcolor: Colors.blushWhite,
        }}
      />
    </Box>
  </Box>
);

export default PunchPickerPanel;
