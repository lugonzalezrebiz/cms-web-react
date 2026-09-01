import { useSearchParams } from "react-router-dom";
import { usePostQuery } from "./useApi";

interface Tracker {
  id: number;
  name: string;
  mode: "POINT" | "RANGE";
  values: string[];
}

interface TrackersResponse {
  success: boolean;
  data: Tracker[];
}

const useTrackers = () => {
  const [searchParams] = useSearchParams();
  const companyID = Number(searchParams.get("company") ?? 0);
  const locationID = Number(searchParams.get("location") ?? 0);

  const { data, isLoading } = usePostQuery<TrackersResponse, { companyID: number; locationID: number }>(
    "tracker/all",
    { companyID, locationID },
    {
      queryKey: ["tracker/all", companyID, locationID],
      enabled: !!companyID && !!locationID,
    }
  );

  return { trackers: data?.data ?? [], isLoading };
};

export default useTrackers;
