import { useMemo } from "react";
import { useGet } from "./useApi";

interface ApiEvent {
  trackerId: number;
  cameraId: number;
}

interface MonitoringResponse {
  success: boolean;
  monitoring: {
    events: ApiEvent[];
  };
}

const useTrackerCameraMap = (monitoringID: string) => {
  const { data } = useGet<MonitoringResponse>(
    `monitoring/${monitoringID}/load2`,
    undefined,
    { refetchOnWindowFocus: false, gcTime: 0 },
  );

  return useMemo(() => {
    const map = new Map<number, Set<number>>();
    if (!data?.success) return map;
    for (const event of data.monitoring.events) {
      if (!map.has(event.trackerId)) map.set(event.trackerId, new Set());
      map.get(event.trackerId)!.add(event.cameraId);
    }
    return map;
  }, [data]);
};

export default useTrackerCameraMap;
