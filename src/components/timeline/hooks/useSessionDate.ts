import { useSearchParams } from "react-router-dom";

export const useSessionDate = (): string => {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date") ?? "";
  return dateParam.length === 8
    ? `${dateParam.slice(0, 4)}-${dateParam.slice(4, 6)}-${dateParam.slice(6, 8)}`
    : new Date().toISOString().slice(0, 10);
};
