import { useEffect, useState } from "react";
import useAuth from "../../../hooks/useAuth";

const monitoringId = import.meta.env.VITE_MONITORING_ID;

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

export function useSalesTransactions() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    fetch(`${import.meta.env.VITE_URL_API}sales/${monitoringId}/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: SalesResponse) => {
        if (data.success) setTransactions(data.transactions);
        else setError("Failed to load sales data");
      })
      .catch(() => setError("Connection error"))
      .finally(() => setLoading(false));
  }, [token]);

  return { transactions, loading, error };
}
