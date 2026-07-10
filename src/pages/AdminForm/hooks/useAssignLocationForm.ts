import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number"),
  addressLine1: z.string().min(1, "Address Line 1 is required"),
  addressLine2: z.string().min(1, "Address Line 2 is required"),
  country: z.string().min(1, "Country is required"),
  cityRegion: z.string().min(1, "City/Region is required"),
 
});

type Fields = z.infer<typeof schema>;
type Errors = Partial<Record<keyof Fields, string>>;

const initialFields: Fields = {
  phone: "",
  addressLine1: "",
  addressLine2: "",
  country: "",
  cityRegion: "",
};

const useAssignLocationForm = () => {
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

export default useAssignLocationForm;
