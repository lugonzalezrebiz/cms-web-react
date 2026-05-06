import { useGet } from "../../../hooks/useApi";

interface Terminal {
  id: number;
  code: string;
}

interface Zone {
  id: number;
  name: string;
}

export interface SalesTransaction {
  terminal: Terminal;
  zone: Zone;
  invoice: unknown;
  customer: unknown;
  timestamp: string; // "2026-04-07 08:12:00"
  quantity: number;
  gross: number;
  meta: unknown;
}

interface SalesResponse {
  success: boolean;
  transactions: SalesTransaction[];
}

export function useSalesTransactions(monitoringID: string) {
  const { data, isPending: loading, error } = useGet<SalesResponse>(
    `sales/${monitoringID}/list`,
    {},
    { enabled: !!monitoringID },
  );

  return {
    transactions: data?.success ? data.transactions : [],
    loading,
    error: error ? error.message : null,
  };
}
