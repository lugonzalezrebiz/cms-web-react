import { isAxiosError } from "axios";

export const getErrorMessage = (
  error: unknown,
  statusMessages: Partial<Record<number, string>> = {},
): string => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status !== undefined && status in statusMessages) {
      return statusMessages[status]!;
    }
  }
  return "An unexpected error occurred.";
};
