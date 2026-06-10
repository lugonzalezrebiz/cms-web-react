import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  employeeName: z.string().min(1, "Employee name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .refine(
      (val) => z.email().safeParse(val).success,
      "Enter a valid email address",
    ),
  userName: z.string().min(1, "User name is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Must be at least 8 characters")
    .max(20, "Must be at most 20 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter"),
});

type Fields = z.infer<typeof schema>;
type Errors = Partial<Record<keyof Fields, string>>;

const initialFields: Fields = {
  employeeName: "",
  email: "",
  userName: "",
  password: "",
};

const useCreateEmployeeForm = () => {
  const [fields, setFields] = useState<Fields>(initialFields);
  const [errors, setErrors] = useState<Errors>({});

  const setField = (name: keyof Fields, value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }));
    const result = schema.shape[name].safeParse(value);
    setErrors((prev) => ({
      ...prev,
      [name]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  };

  const validate = (): boolean => {
    const result = schema.safeParse(fields);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: Errors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof Fields;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    setErrors(fieldErrors);
    return false;
  };

  const reset = () => {
    setFields(initialFields);
    setErrors({});
  };

  const isValid = schema.safeParse(fields).success;

  return { fields, errors, isValid, setField, validate, reset };
};

export default useCreateEmployeeForm;
