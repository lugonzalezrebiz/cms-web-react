import { Box } from "@mui/system";
import Dialog from "../../../components/Dialog";
import { CameraItem } from "../../../components/CameraLayout";
import Button from "../../../components/Button";
import type { CameraContextMenuItem } from "../../../components/EventMenu";
import Title from "../../../components/Title";

export interface ExpandedCameraDialogProps {
  open: boolean;
  onClose: () => void;
  cameraIndex: number;
  media: string;
  cameraItemList: () => void;
  expandCamera: (index: number) => void;
  tags: CameraContextMenuItem[];
  onDrop: (itemId: string) => void;
  cameraId?: number;
  cameraName?: string;
  company?: number;
  location?: number;
  date?: string;
  timestamp?: string;
  onRemoveTag: (tagId: number) => void;
}

const buttonText = [
  "E-Stop Activation",
  "Unattended Pay Station",
  "Human in Operation Tunnel",
  "Collision In Tunnel",
  "Collision In Tunnel",
];

export const ExpandedCameraDialog = ({
  open,
  onClose,
  cameraIndex,
  media,
  cameraItemList,
  expandCamera,
  tags,
  onDrop,
  cameraId,
  cameraName = "camera",
  company,
  location,
  date,
  timestamp,
  onRemoveTag,
}: ExpandedCameraDialogProps) => {
  return (
    <Dialog
      padding="0"
      open={open}
      onClose={onClose}
      maxWidth="90%"
      align="flex-start"
    >
      {open && (
        <Box>
          <Title smallText marginBottom="20px" title={cameraName + 1}>
            <Box sx={{ cursor: "pointer", marginRight: "16px" }}>
              <img onClick={onClose} src="./assets/x-close.svg" alt="Close" />
            </Box>
          </Title>
          <Box height="35vh" position="relative">
            <CameraItem
              index={cameraIndex}
              media={media}
              cameraItemList={cameraItemList}
              expandCamera={expandCamera}
              isExpanded
              tags={tags}
              onDrop={onDrop}
              cameraId={cameraId}
              cameraName={cameraName}
              company={company}
              location={location}
              date={date}
              timestamp={timestamp}
              onRemoveTag={onRemoveTag}
              cameraLabel={false}
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", m: 2 }}>
            {buttonText.map((text, index) => (
              <Button key={index} square color="secondary" sx={{ mr: 1 }}>
                {text}
              </Button>
            ))}
          </Box>
        </Box>
      )}
    </Dialog>
  );
};
