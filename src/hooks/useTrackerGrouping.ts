import { useSearchParams } from "react-router-dom";
import { useGet } from "./useApi";

interface TrackerCamera {
  id: number;
  name: string;
}

interface TrackerGroupingItem {
  id: number;
  name: string;
  joinCamera: boolean;
  cameras: TrackerCamera[];
}

interface TrackerGroupingResponse {
  success: boolean;
  data: TrackerGroupingItem[];
}

const useTrackerGrouping = () => {
  const [searchParams] = useSearchParams();
  const companyID = Number(searchParams.get("company") ?? 0);
  const locationID = Number(searchParams.get("location") ?? 0);

  const { data, isLoading } = useGet<TrackerGroupingResponse>(
    `tracker/grouping/${companyID}/${locationID}`,
    undefined,
    {
      enabled: !!companyID && !!locationID,
    },
  );

  return { trackers: data?.success ? (data.data ?? []) : [], isLoading };
};

export default useTrackerGrouping;
