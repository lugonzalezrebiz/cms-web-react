import { useMemo } from "react";
import { z } from "zod";

const schema = z.object({
  issueType: z.string().min(1, "Please select an issue type"),
  description: z.string().min(1, "Please provide a description"),
  file: z.instanceof(File).nullable().optional(),
});

interface TicketValues {
  issueType: string;
  description: string;
  file: File | null;
}

const useTicketValidation = ({ issueType, description, file }: TicketValues) =>
  useMemo(() => {
    const result = schema.safeParse({ issueType, description, file });

    if (result.success) {
      return { issueTypeError: null, descriptionError: null, fileError: null, isValid: true };
    }

    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }

    return {
      issueTypeError: fieldErrors.issueType ?? null,
      descriptionError: fieldErrors.description ?? null,
      fileError: fieldErrors.file ?? null,
      isValid: false,
    };
  }, [issueType, description, file]);

export default useTicketValidation;
