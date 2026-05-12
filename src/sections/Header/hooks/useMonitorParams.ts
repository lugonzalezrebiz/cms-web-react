import { useSearchParams } from "react-router-dom";

const useMonitorParams = () => {
  const [searchParams] = useSearchParams();
  const companyParam = searchParams.get("company") ?? "";
  const locationParam = searchParams.get("location") ?? "";
  const dateParam = searchParams.get("date") ?? "";
  const monitoringID = searchParams.get("monitoringID") ?? "";

  const companyID = companyParam ? Number(companyParam) : null;
  const locationID = locationParam ? Number(locationParam) : null;

  const companyLabel = companyParam || "----";
  const storeLabel = locationParam || "----";

  const formattedDate = (() => {
    if (dateParam.length === 8) {
      const y = Number(dateParam.slice(0, 4));
      const m = Number(dateParam.slice(4, 6)) - 1;
      const d = Number(dateParam.slice(6, 8));
      return new Date(y, m, d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return dateParam || "----";
  })();

  return { companyLabel, storeLabel, formattedDate, companyID, locationID, monitoringID };
};

export type MonitorParams = ReturnType<typeof useMonitorParams>;

export default useMonitorParams;
