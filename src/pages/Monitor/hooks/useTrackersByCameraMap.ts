import { usePostQueries } from "../../../hooks/useApi";
import { useDashboardParams } from "./useDashboardParams";

type Tracker = { id: number; name: string };

type TrackerSearchResponse = {
  success: boolean;
  data: Tracker[];
};

export const useTrackersByCameraMap = (cameras: { id: number }[]) => {
  const { company, location } = useDashboardParams();
  const baseEnabled = !!company && !!location;

  return usePostQueries<TrackerSearchResponse, object, { trackersByCamera: Record<number, Tracker[]>; trackers: Tracker[] }>(
    "tracker/search",
    // use 1-based position as cameraID — the API does not accept 0
    cameras.map((_, i) => ({ companyID: company, locationID: location, cameraID: i + 1 })),
    {
      queryKey: (_, i) => ["tracker/search", company, location, i + 1],
      enabled: baseEnabled,
      staleTime: 5 * 60 * 1000,
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
    },
  );
};
