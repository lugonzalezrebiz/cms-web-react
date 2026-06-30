import { useState, useEffect } from "react";
import { usePostQuery } from "../../../hooks/useApi";
import { useDashboardParams } from "./useDashboardParams";
import type { CameraInfo } from "../../../components/CameraLayout";

type CameraSearchResponse = {
  success: boolean;
  cameras: Array<{ id: number; name: string; group: { id: number; name: string } }>;
};

export const useTrackerCameras = (groupID: number, trackerID: number): { cameras: CameraInfo[]; isLoading: boolean } => {
  const { company, location } = useDashboardParams();
  const enabled = !!company && !!location;

  const queryKey = `${groupID}-${trackerID}`;
  const [committedKey, setCommittedKey] = useState(queryKey);
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey);

  if (prevQueryKey !== queryKey) {
    setPrevQueryKey(queryKey);
    setCommittedKey("");
  }

  const { data, isLoading } = usePostQuery<CameraSearchResponse>(
    "camera/search",
    { companyID: company, locationID: location, groupID, trackerID },
    {
      queryKey: ["camera/search", company, location, groupID, trackerID],
      enabled,
      staleTime: 5 * 60 * 1000,
    },
  );

  useEffect(() => {
    if (!isLoading) setCommittedKey(queryKey);
  }, [queryKey, isLoading]);

  const ready = committedKey === queryKey && !isLoading;
  const cameras = ready && data?.success ? data.cameras.map((c) => ({ id: c.id, name: c.name })) : [];
  return { cameras, isLoading: !ready };
};
