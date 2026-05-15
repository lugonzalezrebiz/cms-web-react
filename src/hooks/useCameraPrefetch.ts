import { useEffect } from "react";
import { useTimestampIndex, snapToNearest } from "./useTimestampIndex";
import { timestampToSec, secToCompact } from "./utils";

type Params = {
  company: number;
  location: number;
  date: string;
  camera: number;
  timestamp: string;
  windowFrames?: number;
};

export const useCameraPrefetch = ({
  company,
  location,
  date,
  camera,
  timestamp,
  windowFrames = 15,
}: Params): void => {
  const index = useTimestampIndex(company, location, date, camera);

  useEffect(() => {
    if (index.length === 0 || !timestamp) return;

    const id = requestIdleCallback(() => {
      const targetSec = timestampToSec(timestamp);
      const nearest = snapToNearest(index, targetSec);
      if (nearest === null) return;

      const pos = index.indexOf(nearest);
      const start = Math.max(0, pos - windowFrames);
      const end = Math.min(index.length - 1, pos + windowFrames);

      for (let i = start; i <= end; i++) {
        if (i === pos) continue;
        const ts = secToCompact(index[i]);
        new Image().src = `dvr://local/${company}/${location}/${date}/${camera}/${date.slice(2)}_${ts}.jpg`;
      }
    });

    return () => cancelIdleCallback(id);
  }, [index, company, location, date, camera, timestamp, windowFrames]);
};
