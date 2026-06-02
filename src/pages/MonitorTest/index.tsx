import { Box } from "@mui/system";
import TimeLine from "../../components/TimeLine";
import CameraLayout from "../../components/CameraLayout";
import { MOCK_SNAPSHOT } from "../../components/timeline/constants";
import type { CameraInfo } from "../../components/CameraLayout";
import type { CameraEventPoint } from "../../components/timeline/types";

const MOCK_CAMERAS: CameraInfo[] = [];
const MOCK_EVENT_POINTS: CameraEventPoint[] = [];

const MonitorTest = () => {
  const timelineProps = {
    snapshot: MOCK_SNAPSHOT,
    cameraEventPoints: MOCK_EVENT_POINTS,
    onMarkerChange: () => {},
    markerTimeSec: null,
    targetMarkerSec: undefined,
    onUpdateEventPoint: () => {},
    onPopOut: () => {},
    headerLabel: "",
    onUndo: () => {},
    onRedo: () => {},
    canUndo: false,
    canRedo: false,
    onRemoveEventPoint: () => {},
    onConvertEventPointToLocal: (id: number) => id,
    viewMode: "activity" as const,
    menuItems: [],
    rangeSessions: {},
    expandedIcon: true,
    loadState: true,
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        gap: 1,
      }}
    >
      <Box sx={{ flex: 7, minHeight: 0, height: 0, position: "relative" }}>
        <CameraLayout
          count={MOCK_CAMERAS.length}
          maxHeight="100%"
          contextMenuItems={[]}
          cameraEventPoints={MOCK_EVENT_POINTS}
          markerSec={0}
          cameras={MOCK_CAMERAS}
          expandedCamera={null}
          onExpandCamera={() => {}}
          loadState
        />
      </Box>
      <Box sx={{ flex: 3, minHeight: 0, zIndex: 1000 }}>
        <TimeLine {...timelineProps} />
      </Box>
    </Box>
  );
};

export default MonitorTest;
