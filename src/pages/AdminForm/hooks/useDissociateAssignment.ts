import { isAxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDeleteCallback } from "../../../hooks/useApi";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location/assignments", "user", userID] });
    },
  });

  const dissociate = (companyID: number, locationID: number) => {
    if (!userID) return;
    mutation.mutate({ companyID, locationID });
  };

  return {
    dissociate,
    isPending: mutation.isPending,
    errorMessage: mutation.error ? getErrorMessage(mutation.error) : null,
  };
};

export default useDissociateAssignment;
