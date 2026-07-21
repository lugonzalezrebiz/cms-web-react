import { useGet } from "../../../hooks/useApi";

export interface ApprovedLocation {
  id: number;
  userID: number;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  locationType: string;
  dueDate: string | null;
  createdBy: number;
  isActive: boolean;
  isExpired: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovedLocationsResponse {
  success: boolean;
  locations: ApprovedLocation[];
}

const useApprovedLocations = (userID?: number) => {
  const { data, isLoading, isError } = useGet<ApprovedLocationsResponse>(
    `user/${userID ?? 0}/approved-locations`,
    undefined,
    { enabled: userID !== undefined },
  );

  return {
    locations: data?.locations ?? [],
    isLoading,
    isError,
  };
};

export default useApprovedLocations;
