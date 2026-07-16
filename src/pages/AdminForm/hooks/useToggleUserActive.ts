import { usePatch } from "../../../hooks/useApi";
import { getErrorMessage } from "../utils/errors";
import { usersQueryKey } from "./useUsers";

const TOGGLE_USER_ERRORS = {
  400: "Invalid request.",
  401: "Unauthorized.",
  403: "Forbidden.",
  404: "User not found.",
};

const useToggleUserActive = (userID: number | undefined) => {
  const { mutate, isPending, error } = usePatch<
    unknown,
    { is_active: boolean }
  >(`user/${userID}/status`, { invalidateKey: usersQueryKey });

  const toggleActive = (isActive: boolean, onSuccess?: () => void) =>
    mutate({ is_active: isActive }, { onSuccess });

  return {
    toggleActive,
    isPending,
    errorMessage: error ? getErrorMessage(error, TOGGLE_USER_ERRORS) : null,
  };
};

export default useToggleUserActive;
