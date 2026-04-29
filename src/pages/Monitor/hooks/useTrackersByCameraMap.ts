import { useQueries } from "@tanstack/react-query";
import { apiClient } from "../../../config/apiClient";
import useAuth from "../../../hooks/useAuth";
import { useDashboardParams } from "./useDashboardParams";

type Tracker = { id: number; name: string };

type TrackerSearchResponse = {
  success: boolean;
  data: Tracker[];
};

export const useTrackersByCameraMap = (cameras: { id: number }[]) => {
  const { token } = useAuth();
  const { company, location } = useDashboardParams();
  const baseEnabled = !!company && !!location && !!token;

  return useQueries({
    queries: cameras.map((_cam, i) => ({
      // use 1-based position as cameraID — the API does not accept 0
      queryKey: ["tracker/search", company, location, i + 1],
      queryFn: async (): Promise<TrackerSearchResponse> => {
        const res = await apiClient.post<TrackerSearchResponse>(
          "tracker/search",
          { companyID: company, locationID: location, cameraID: i + 1 },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );
        return res.data;
      },
      enabled: baseEnabled,
      staleTime: 5 * 60 * 1000,
    })),
    // combine runs only when query data actually changes, preventing unstable references
    combine: (results) => {
      const trackersByCamera: Record<number, Tracker[]> = {};
      for (let i = 0; i < cameras.length; i++) {
        trackersByCamera[cameras[i].id] =
          results[i]?.data?.success ? (results[i].data?.data ?? []) : [];
      }

      const seen = new Set<number>();
      const trackers: Tracker[] = [];
      for (const list of Object.values(trackersByCamera)) {
        for (const t of list) {
          if (!seen.has(t.id)) {
            seen.add(t.id);
            trackers.push(t);
          }
        }
      }

      return { trackersByCamera, trackers };
    },
  });
};
