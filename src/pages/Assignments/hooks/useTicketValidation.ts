import { useMemo } from "react";
import { z } from "zod";

const schema = z.object({
  issueType: z.string().min(1, "Please select an issue type"),
  description: z.string().min(1, "Please provide a description"),
});

interface TicketValues {
  issueType: string;
  description: string;
}

const useTicketValidation = ({ issueType, description }: TicketValues) =>
  useMemo(() => {
    const result = schema.safeParse({ issueType, description });

    if (result.success) {
      return { issueTypeError: null, descriptionError: null, isValid: true };
    }

    const errors = result.error.flatten().fieldErrors;

    return {
      issueTypeError: errors.issueType?.[0] ?? null,
      descriptionError: errors.description?.[0] ?? null,
      isValid: false,
    };
  }, [issueType, description]);

export default useTicketValidation;
