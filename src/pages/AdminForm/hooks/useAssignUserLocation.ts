import { useState, useCallback } from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePostCallback } from "../../../hooks/useApi";
import { getErrorMessage } from "../utils/errors";

const schema = z.object({
  company: z.string().min(1, "Select a company"),
  store: z.string().min(1, "Select a store"),
});

type FormFields = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormFields, string>>;

interface AssignVariables {
  employeeId: number;
  storeId: string;
  companyId: string;
}

const ASSIGN_ERRORS = {
  400: "Invalid request payload.",
  401: "Unauthorized. Only supervisor role or above can assign locations.",
  404: "User, company, or location not found.",
};

const useAssignUserLocation = (options?: { onSuccess?: () => void }) => {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const post = usePostCallback();
  const queryClient = useQueryClient();

  const validateField = (name: keyof FormFields, value: string) => {
    const result = schema.shape[name].safeParse(value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const isFormValid = (company: string, store: string) =>
    schema.safeParse({ company, store }).success;

  const mutation = useMutation<unknown, Error, AssignVariables>({
    mutationFn: ({ employeeId, companyId, storeId }) =>
      post(`user/${employeeId}/associate`, {
        assignments: [{ companyID: companyId, locationIDs: [storeId] }],
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["location/assignments", "user", variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: [`user/${variables.employeeId}/location`] });
      options?.onSuccess?.();
    },
  });

  const assign = (employeeId: number, companyId: string, storeId: string) => {
    const result = schema.safeParse({ company: companyId, store: storeId });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormFields;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    mutation.mutate({ employeeId, storeId, companyId });
  };

  const reset = useCallback(() => setFieldErrors({}), []);

  return {
    assign,
    validateField,
    fieldErrors,
    isFormValid,
    reset,
    isPending: mutation.isPending,
    errorMessage: mutation.error ? getErrorMessage(mutation.error, ASSIGN_ERRORS) : null,
  };
};

export default useAssignUserLocation;
