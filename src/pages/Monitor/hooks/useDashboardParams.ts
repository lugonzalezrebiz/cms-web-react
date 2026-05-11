import { useSearchParams } from "react-router-dom";

export const useDashboardParams = () => {
  const [searchParams] = useSearchParams();
  const company = Number(searchParams.get("company") ?? 0);
  const location = Number(searchParams.get("location") ?? 0);
  const date = searchParams.get("date") ?? ""; // YYYYMMDD
  const monitoringID = searchParams.get("monitoringID") ?? "";
  return { company, location, date, monitoringID };
}
