import { usePostQuery } from "../../../hooks/useApi";
import { useDashboardParams } from "./useDashboardParams";
import type { Camera } from "../../../types";

type CameraSearchResponse = {
  success: boolean;
  cameras: Array<{ id: number; name: string; group: { id: number; name: string } }>;
};

export const useTrackerCameras=(groupID: number, trackerID: number): Camera[]=> {
  const { company, location } = useDashboardParams();
  const enabled = !!company && !!location;

  const { data } = usePostQuery<CameraSearchResponse>(
    "camera/search",
    { companyID: company, locationID: location, groupID, trackerID },
    {
      queryKey: ["camera/search", company, location, groupID, trackerID],
      enabled,
      staleTime: 5 * 60 * 1000,
    },
  );

  return data?.success ? data.cameras.map((c) => ({ id: c.id, name: c.name })) : [];
}
