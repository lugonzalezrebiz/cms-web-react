import { AGENT_ROLE, REVIEWER_ROLE } from "../../../config";
import { usePost } from "../../../hooks/useApi";
import { usersQueryKey } from "./useUsers";
import { getErrorMessage } from "../utils/errors";

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

const CREATE_USER_ERRORS = {
  400: "Invalid request.",
  401: "Unauthorized.",
  409: "Username or email already exists.",
};

const useCreateUser = (options?: { onSuccess?: () => void }) => {
  const mutation = usePost<unknown, CreateUserPayload>("user", {
    invalidateKey: usersQueryKey,
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
    errorMessage: mutation.error ? getErrorMessage(mutation.error, CREATE_USER_ERRORS) : null,
  };
};

export default useCreateUser;
