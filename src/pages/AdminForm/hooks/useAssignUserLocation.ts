import { useState, useCallback } from "react";
import { z } from "zod";
import { isAxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { usePostCallback } from "../../../hooks/useApi";

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

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 401: return "Unauthorized.";
      case 500: return "Failed to assign locations.";
    }
  }
  return "An unexpected error occurred.";
};

const useAssignUserLocation = (options?: { onSuccess?: () => void }) => {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const post = usePostCallback();

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
    mutationFn: ({ employeeId, companyId, storeId}) =>
      post(`user-location/${companyId}/${employeeId}`, {locations: [storeId]}),
    onSuccess: options?.onSuccess,
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
    errorMessage: mutation.error ? getErrorMessage(mutation.error) : null,
  };
};

export default useAssignUserLocation;
