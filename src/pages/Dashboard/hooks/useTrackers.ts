import { useGet } from "../../../hooks/useApi";
import { MONITORING_ID } from "../../../config";
import useAuth from "../../../hooks/useAuth";

type TrackersResponse = {
  success: boolean;
  trackers: { id: number; name: string }[];
};

export const useTrackers = () => {
  const { token } = useAuth();
  const { data } = useGet<TrackersResponse>(
    `tracker/${MONITORING_ID}`,
    {},
    { enabled: !!MONITORING_ID && !!token },
  );
  return data?.success ? data.trackers : [];
};
