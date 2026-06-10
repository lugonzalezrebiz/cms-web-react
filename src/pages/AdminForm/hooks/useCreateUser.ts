import { isAxiosError } from "axios";
import { AGENT_ROLE, REVIEWER_ROLE } from "../../../config";
import { usePost } from "../../../hooks/useApi";

interface CreateUserPayload {
  username: string;
  password: string;
  name: string;
  email: string;
  roleID: number;
  active: true;
}

export interface CreateUserInput {
  username: string;
  password: string;
  name: string;
  email: string;
  employeeType: "monitoring_agent" | "reviewer";
}

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 400: return "Invalid request.";
      case 401: return "Unauthorized.";
      case 409: return "Username or email already exists.";
    }
  }
  return "An unexpected error occurred.";
};

const useCreateUser = (options?: { onSuccess?: () => void }) => {
  const mutation = usePost<unknown, CreateUserPayload>("user", {
    invalidateKey: ["user"],
    onSuccess: options?.onSuccess,
  });

  const createUser = (input: CreateUserInput) =>
    mutation.mutate({
      username: input.username,
      password: input.password,
      name: input.name,
      email: input.email,
      roleID: input.employeeType === "reviewer" ? REVIEWER_ROLE : AGENT_ROLE,
      active: true,
    });

  return {
    createUser,
    isPending: mutation.isPending,
    errorMessage: mutation.error ? getErrorMessage(mutation.error) : null,
  };
};

export default useCreateUser;
