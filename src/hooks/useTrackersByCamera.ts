import { usePostQuery } from "./useApi";

type Tracker = { id: number; name: string; mode: "POINT" | "RANGE" };

type TrackerSearchResponse = {
  success: boolean;
  data: Tracker[];
};

export function useTrackersByCamera(
  company: number,
  location: number,
  cameraPosition: number,
  enabled: boolean,
) {
  const { data } = usePostQuery<TrackerSearchResponse>(
    "tracker/search",
    { companyID: company, locationID: location, cameraID: cameraPosition },
    {
      queryKey: ["tracker/search", company, location, cameraPosition],
      enabled: enabled && !!company && !!location,
      staleTime: 5 * 60 * 1000,
    },
  );
  return data?.success ? (data.data ?? []) : [];
}
