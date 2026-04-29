import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../config/apiClient";
import useAuth from "../../../hooks/useAuth";
import { useDashboardParams } from "./useDashboardParams";

type TrackerSearchResponse = {
  success: boolean;
  trackers: { id: number; name: string }[];
};

export const useTrackersByCamera = (cameraId: number | null | undefined) => {
  const { token } = useAuth();
  const { company, location } = useDashboardParams();
  const enabled = !!company && !!location && !!cameraId && !!token;

  const { data } = useQuery<TrackerSearchResponse>({
    queryKey: ["tracker/search", company, location, cameraId],
    queryFn: async () => {
      const res = await apiClient.post<TrackerSearchResponse>(
        "tracker/search",
        { companyID: company, locationID: location, cameraID: cameraId },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      return res.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return data?.success ? data.trackers : [];
};
