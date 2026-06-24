import { useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "../../../hooks/useApi";

interface TicketPayload {
  companyID: number;
  locationID: number;
  monitoringID: string;
  statusID: number;
  issueTypeID: number;
  description: string;
  file?: File | null;
}

interface TicketResponse {
  success: boolean;
}

const SUBMIT_ERRORS: Record<number, string> = {
  400: "Invalid request.",
  401: "Unauthorized.",
  500: "Failed to create ticket.",
};

const useOpenTicket = () => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = usePost<TicketResponse, FormData>("ticket");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = async (payload: TicketPayload): Promise<boolean> => {
    setSubmitError(null);
    try {
      const form = new FormData();
      form.append("companyID", String(payload.companyID));
      form.append("locationID", String(payload.locationID));
      form.append("monitoringID", String(payload.monitoringID));
      form.append("monitoringStatus", String(payload.statusID));
      form.append("issueTypeID", String(payload.issueTypeID));
      form.append("description", payload.description);
      form.append("priority", "normal");
      if (payload.file) {
        form.append("attachments", payload.file);
      }
      await mutateAsync(form);
      queryClient.invalidateQueries({ queryKey: ["location/assignment/count"] });
      return true;
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      setSubmitError(SUBMIT_ERRORS[status ?? 500] ?? "Failed to create ticket.");
      return false;
    }
  };

  const clearError = () => setSubmitError(null);

  return { submit, isPending, submitError, clearError };
};

export default useOpenTicket;
