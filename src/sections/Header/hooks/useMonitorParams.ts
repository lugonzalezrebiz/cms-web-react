import { useSearchParams } from "react-router-dom";
import { MOCK_SNAPSHOT } from "../../../components/timeline/constants";

const useMonitorParams = () => {
  const [searchParams] = useSearchParams();
  const companyParam = searchParams.get("company") ?? "";
  const locationParam = searchParams.get("location") ?? "";
  const dateParam = searchParams.get("date") ?? "";

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

  const { start, end } = MOCK_SNAPSHOT.timeline.times;
  const toHHmm = (t: string) => t.slice(0, 5);
  const timeRange = `${toHHmm(start)} - ${toHHmm(end)}`;

  return { companyLabel, storeLabel, formattedDate, timeRange };
};

export type MonitorParams = ReturnType<typeof useMonitorParams>;

export default useMonitorParams;
