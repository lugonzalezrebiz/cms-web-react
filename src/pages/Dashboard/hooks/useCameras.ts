import { useState, useEffect } from "react";
import type { CameraInfo } from "../../../components/CameraLayout";

export const useCameras = (
  company: number,
  location: number,
  date: string,
) => {
  const [cameras, setCameras] = useState<CameraInfo[]>([]);

  useEffect(() => {
    if (!company || !location || !date) return;
    window.api
      .cameras({ company, location, date })
      .then((list) => {
        if (list.length > 0) setCameras(list);
      })
      .catch(() => {});
  }, [company, location, date]);

  return cameras;
};
