import { useSyncExternalStore } from "react";
import type { MaybeDayjs } from "../components/DateRangePicker";

export interface LocationRecord {
  id: number;
  employeeType: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  cityRegion: string;
  ip: string;
  dateRange: [MaybeDayjs, MaybeDayjs];
}

const store = new Map<number, LocationRecord[]>();
const listeners = new Set<() => void>();
const EMPTY: LocationRecord[] = [];

const emit = () => listeners.forEach((listener) => listener());

export const addLocationRecord = (
  employeeId: number,
  record: Omit<LocationRecord, "id">,
) => {
  const existing = store.get(employeeId) ?? [];
  store.set(employeeId, [...existing, { ...record, id: Date.now() }]);
  emit();
};

export const removeLocationRecord = (employeeId: number, id: number) => {
  const existing = store.get(employeeId) ?? [];
  store.set(
    employeeId,
    existing.filter((record) => record.id !== id),
  );
  emit();
};

export const useLocationRecords = (employeeId?: number) =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => (employeeId === undefined ? EMPTY : (store.get(employeeId) ?? EMPTY)),
  );
