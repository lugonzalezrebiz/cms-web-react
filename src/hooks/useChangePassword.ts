import type { AxiosError } from "axios";
import { usePost } from "./useApi";

interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

const ERROR_MESSAGES: Record<number, string> = {
  400: "Incorrect old password.",
  401: "Unauthorized. Please log in again.",
  500: "Server error. Please try again later.",
};

const useChangePassword = () => {
  const mutation = usePost<void, ChangePasswordPayload>("password/change");

  const errorMessage = mutation.error
    ? (ERROR_MESSAGES[(mutation.error as AxiosError).response?.status ?? 0] ??
      "Something went wrong. Please try again.")
    : null;

  return { ...mutation, errorMessage };
};

export default useChangePassword;
