import { useSearchParams } from "react-router-dom";
import { usePostQuery } from "./useApi";

interface CameraGroup {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

interface CameraGroupsResponse {
  success: boolean;
  cameraGroups: CameraGroup[];
}

const useCameraGroups = () => {
  const [searchParams] = useSearchParams();
  const companyID = Number(searchParams.get("company") ?? 0);
  const locationID = Number(searchParams.get("location") ?? 0);

  const { data, isLoading } = usePostQuery<CameraGroupsResponse, { companyID: number; locationID: number }>(
    "camera/group/list",
    { companyID, locationID },
    {
      queryKey: ["camera/group/list", companyID, locationID],
      enabled: !!companyID && !!locationID,
    }
  );

  const cameraGroups = (data?.cameraGroups ?? []).map((g) => ({
    value: String(g.id),
    title: g.name,
  }));

  return { cameraGroups, isLoading };
};

export default useCameraGroups;
