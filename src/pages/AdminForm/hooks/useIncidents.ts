import { useGet } from "../../../hooks/useApi";

export interface IncidentMetadata {
  userAgent: string;
  origin: string;
  referer: string;
}

export interface Incident {
  id: number;
  userID: number;
  incidentType: string;
  incidentReason: string;
  severity: string;
  ip: string;
  latitude: number | null;
  longitude: number | null;
  metadata: IncidentMetadata;
  occurrenceCount: number;
  createdAt: string;
  modifiedAt: string;
}

export interface IncidentsResponse {
  success: boolean;
  incidents: Incident[];
}

const useIncidents = (userID?: number) => {
  const { data, isLoading, isError } = useGet<IncidentsResponse>(
    `user/${userID ?? 0}/incidents`,
    undefined,
    { enabled: userID !== undefined },
  );

  return {
    incidents: data?.incidents ?? [],
    isLoading,
    isError,
  };
};

export default useIncidents;
