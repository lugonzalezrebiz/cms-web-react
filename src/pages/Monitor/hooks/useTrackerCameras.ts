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

  const { data, isLoading } = usePostQuery<CameraSearchResponse>(
    "camera/search",
    { companyID: company, locationID: location, groupID, trackerID },
    {
      queryKey: ["camera/search", company, location, groupID, trackerID],
      enabled,
      staleTime: 5 * 60 * 1000,
    },
  );

  const cameras = data?.success ? data.cameras.map((c) => ({ id: c.id, name: c.name })) : [];
  return { cameras, isLoading };
}
