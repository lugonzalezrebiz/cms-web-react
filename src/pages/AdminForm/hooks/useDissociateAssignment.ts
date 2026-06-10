import { isAxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDeleteCallback } from "../../../hooks/useApi";
import {
  userLocationQueryKey,
  type UserLocationResponse,
} from "../../../hooks/useUserAssignments";

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 400: return "Invalid request payload.";
      case 401: return "Unauthorized. Only supervisor role or above can assign locations.";
      case 404: return "User, company, or location not found.";
    }
  }
  return "An unexpected error occurred.";
};

interface DissociateVariables {
  companyID: number;
  locationID: number;
}

const useDissociateAssignment = (userID: number | null | undefined) => {
  const deleteReq = useDeleteCallback();
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, DissociateVariables>({
    mutationFn: ({ companyID, locationID }) =>
      deleteReq(`user/${userID}/dissociate`, {
        assignments: [{ companyID, locationIDs: [locationID] }],
      }),
    onSuccess: (_, { companyID, locationID }) => {
      queryClient.setQueryData<UserLocationResponse>(
        userLocationQueryKey(userID!),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            assignments: old.assignments
              .map((a) =>
                a.companyID === companyID
                  ? { ...a, locationIDs: a.locationIDs.filter((id) => id !== locationID) }
                  : a,
              )
              .filter((a) => a.locationIDs.length > 0),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ["location/assignments", "user", userID] });
      queryClient.invalidateQueries({ queryKey: userLocationQueryKey(userID!) });
    },
  });

  const dissociate = (companyID: number, locationID: number) => {
    if (!userID) return;
    mutation.mutate({ companyID, locationID });
  };

  const pendingKey =
    mutation.isPending && mutation.variables
      ? `${mutation.variables.companyID}-${mutation.variables.locationID}`
      : null;

  return {
    dissociate,
    pendingKey,
    errorMessage: mutation.error ? getErrorMessage(mutation.error) : null,
  };
};

export default useDissociateAssignment;
