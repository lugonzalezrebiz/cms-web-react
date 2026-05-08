import { Box } from "@mui/system";
import Dialog from "../../../components/Dialog";
import { CameraItem } from "../../../components/CameraLayout";
import Button from "../../../components/Button";
import Title from "../../../components/Title";
import type { CameraContextMenuItem } from "../../../components/CameraOverlayMenu";

export interface ExpandedCameraDialogProps {
  open: boolean;
  onClose: () => void;
  cameraIndex: number;
  media: string;
  expandCamera: (index: number) => void;
  tags: CameraContextMenuItem[];
  contextMenuItems: CameraContextMenuItem[];
  cameraId?: number;
  cameraName?: string;
  company?: number;
  location?: number;
  date?: string;
  timestamp?: string;
  onRemoveTag: (tagId: number) => void;
}

export const ExpandedCameraDialog = ({
  open,
  onClose,
  cameraIndex,
  media,
  expandCamera,
  tags,
  contextMenuItems,
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
          <Title
            smallText
            marginBottom="20px"
            title={`Camera ${Number(cameraIndex) + 1}`}
          >
            <Box sx={{ cursor: "pointer", marginRight: "16px" }}>
              <img onClick={onClose} src="./assets/x-close.svg" alt="Close" />
            </Box>
          </Title>
          <Box height="35vh" position="relative">
            <CameraItem
              index={cameraIndex}
              media={media}
              expandCamera={expandCamera}
              isExpanded
              tags={tags}
              contextMenuItems={contextMenuItems}
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
          <Box sx={{ display: "flex", gap: 1, p: "16px" }}>
            {contextMenuItems.map((item) => (
              <Button
                key={item.id}
                square
                color="secondary"
                fontSize="14px"
                sx={{
                  flex: 1,
                  height: "50px",
                  overflow: "hidden",
                  //whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  //justifyContent: "left",
                }}
                onClick={() => item.onClick(cameraIndex)}
              >
                {item.name}
              </Button>
            ))}
          </Box>
        </Box>
      )}
    </Dialog>
  );
};
