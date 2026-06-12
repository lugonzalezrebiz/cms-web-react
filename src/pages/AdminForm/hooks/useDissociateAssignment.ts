import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "../utils/errors";
import { useDeleteCallback } from "../../../hooks/useApi";
import {
  userLocationQueryKey,
  type UserLocationResponse,
} from "../../../hooks/useUserAssignments";

const DISSOCIATE_ERRORS = {
  400: "Invalid request payload.",
  401: "Unauthorized. Only supervisor role or above can assign locations.",
  404: "User, company, or location not found.",
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
    errorMessage: mutation.error ? getErrorMessage(mutation.error, DISSOCIATE_ERRORS) : null,
  };
};

export default useDissociateAssignment;
