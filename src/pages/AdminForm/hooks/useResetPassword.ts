import { usePost } from "../../../hooks/useApi";
import { getErrorMessage } from "../utils/errors";

const RESET_PASSWORD_ERRORS = {
  400: "Invalid request.",
  401: "Unauthorized.",
  403: "Forbidden.",
  404: "User not found.",
};

const useResetPassword = (userID: number | undefined) => {
  const { mutate, isPending, error } = usePost<unknown, { password: string }>(
    `user/${userID}/reset-password`,
  );

  const resetPassword = (password: string, onSuccess?: () => void) =>
    mutate({ password }, { onSuccess });

  return {
    resetPassword,
    isPending,
    errorMessage: error ? getErrorMessage(error, RESET_PASSWORD_ERRORS) : null,
  };
};

export default useResetPassword;
