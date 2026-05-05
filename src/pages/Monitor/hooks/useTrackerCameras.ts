import { usePostQuery } from "../../../hooks/useApi";
import { useDashboardParams } from "./useDashboardParams";
import type { CameraInfo } from "../../../components/CameraLayout";

type CameraSearchResponse = {
  success: boolean;
  cameras: Array<{ id: number; name: string; group: { id: number; name: string } }>;
};

export function useTrackerCameras(trackerOption: string): CameraInfo[] {
  const { company, location } = useDashboardParams();
  const trackerID = trackerOption ? Number(trackerOption) : null;
  const enabled = !!company && !!location && !!trackerID;

  const { data } = usePostQuery<CameraSearchResponse>(
    "camera/search",
    { companyID: company, locationID: location, trackerID },
    {
      queryKey: ["camera/search", company, location, trackerID],
      enabled,
      staleTime: 5 * 60 * 1000,
    },
  );

  return data?.success ? data.cameras.map((c) => ({ id: c.id, name: c.name })) : [];
}
