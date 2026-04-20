import { useSearchParams } from "react-router-dom";

export function useDashboardParams() {
  const [searchParams] = useSearchParams();
  const company = Number(searchParams.get("company") ?? 0);
  const location = Number(searchParams.get("location") ?? 0);
  const date = searchParams.get("date") ?? ""; // YYYYMMDD
  return { company, location, date };
}
