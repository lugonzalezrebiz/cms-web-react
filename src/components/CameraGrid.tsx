import { CameraFrame } from "./CameraFrame";
import { useCameraPrefetch } from "../hooks/useCameraPrefetch";
import { Box } from "@mui/system";

import type { Camera } from "./types";

export type { Camera };

export type CameraGridProps = {
  company: number;
  location: number;
  date: string;
  cameras: Camera[];
  timestamp: string;
};

const CameraPrefetch = ({
  company,
  location,
  date,
  camera,
  timestamp,
}: {
  company: number;
  location: number;
  date: string;
  camera: number;
  timestamp: string;
}) => {
  useCameraPrefetch({ company, location, date, camera, timestamp });
  return null;
};

export const CameraGrid = ({
  company,
  location,
  date,
  cameras,
  timestamp,
}: CameraGridProps) => {
  return (
    <Box sx={{ display: "contents" }}>
      {cameras.map((cam) => (
        <Box>
          <CameraPrefetch
            key={`prefetch-${cam.id}`}
            company={company}
            location={location}
            date={date}
            camera={cam.id}
            timestamp={timestamp}
          />
          <CameraFrame
            key={cam.id}
            company={company}
            location={location}
            date={date}
            camera={cam.id}
            cameraName={cam.name}
            timestamp={timestamp}
          />
        </Box>
      ))}
    </Box>
  );
};
