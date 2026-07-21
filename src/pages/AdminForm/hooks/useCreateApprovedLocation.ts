import { usePost } from "../../../hooks/useApi";
import { getErrorMessage } from "../utils/errors";

const CREATE_LOCATION_ERRORS = {
  400: "Invalid request, or due date is missing for a Temporary location.",
  401: "Unauthorized access.",
  403: "You do not have permission to create locations.",
  404: "The target user could not be found.",
  422: "The address could not be resolved to coordinates.",
};

export interface CreateApprovedLocationPayload {
  phone: string;
  address_line_1: string;
  address_line_2: string;
  country: string;
  city: string;
  location_type: "Permanent" | "Temporary";
  due_date?: string;
}

const useCreateApprovedLocation = (userID: number | undefined) => {
  const { mutateAsync, isPending, error, reset } = usePost<
    unknown,
    CreateApprovedLocationPayload
  >(`user/${userID}/approved-locations`, {
    invalidateKey: [`user/${userID}/approved-locations`],
  });

  const create = async (payload: CreateApprovedLocationPayload) => {
    try {
      await mutateAsync(payload);
      return true;
    } catch {
      return false;
    }
  };

  return {
    create,
    isPending,
    errorMessage: error ? getErrorMessage(error, CREATE_LOCATION_ERRORS) : null,
    clearError: reset,
  };
};

export default useCreateApprovedLocation;
