import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "../../../hooks/useApi";
import { getErrorMessage } from "../utils/errors";
import type { ApprovedLocationsResponse } from "./useApprovedLocations";

const DEACTIVATE_LOCATION_ERRORS = {
  400: "Invalid request.",
  401: "Unauthorized access.",
  403: "You do not have permission to remove this location.",
  404: "Location not found.",
};

interface DeactivateVariables {
  locationID: number;
}

const useDeactivateApprovedLocation = (userID: number | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = [`user/${userID}/approved-locations`];

  const { mutate, isPending, variables, error } = usePatch<
    unknown,
    DeactivateVariables
  >(
    ({ locationID }) => `user/${userID}/approved-locations/${locationID}/status`,
    {
      getBody: () => ({ is_active: false }),
      onSuccess: (_data, { locationID }) => {
        queryClient.setQueryData<ApprovedLocationsResponse>(queryKey, (old) =>
          old
            ? {
                ...old,
                locations: old.locations.filter((l) => l.id !== locationID),
              }
            : old,
        );
      },
    },
  );

  const deactivate = (locationID: number) => {
    if (!userID) return;
    mutate({ locationID });
  };

  const pendingKey =
    isPending && variables ? `${variables.locationID}-${variables.locationID}` : null;

  return {
    deactivate,
    pendingKey,
    errorMessage: error ? getErrorMessage(error, DEACTIVATE_LOCATION_ERRORS) : null,
  };
};

export default useDeactivateApprovedLocation;
