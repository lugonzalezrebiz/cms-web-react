import { isAxiosError } from "axios";
import { usePost } from "../../../hooks/useApi";

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 400: return "Invalid request.";
      case 401: return "Unauthorized.";
      case 403: return "Forbidden.";
      case 404: return "User not found.";
    }
  }
  return "An unexpected error occurred.";
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
    errorMessage: error ? getErrorMessage(error) : null,
  };
};

export default useResetPassword;
