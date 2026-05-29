import { useMemo } from "react";
import { z } from "zod";

const schema = z.object({
  issueType: z.string().min(1, "Please select an issue type"),
  description: z.string().min(1, "Please provide a description"),
  file: z.instanceof(File, { message: "Please attach a file" }),
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

    const errors = result.error.flatten().fieldErrors;

    return {
      issueTypeError: errors.issueType?.[0] ?? null,
      descriptionError: errors.description?.[0] ?? null,
      fileError: errors.file?.[0] ?? null,
      isValid: false,
    };
  }, [issueType, description, file]);

export default useTicketValidation;
