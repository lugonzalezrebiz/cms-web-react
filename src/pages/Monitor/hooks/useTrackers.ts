import { useGet } from "../../../hooks/useApi";
import useAuth from "../../../hooks/useAuth";

type TrackersResponse = {
  success: boolean;
  trackers: { id: number; name: string }[];
};

export const useTrackers = (monitoringID: string) => {
  const { token } = useAuth();
  const { data } = useGet<TrackersResponse>(
    `tracker/${monitoringID}`,
    {},
    { enabled: !!monitoringID && !!token },
  );
  return data?.success ? data.trackers : [];
};
