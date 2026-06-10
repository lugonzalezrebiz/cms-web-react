import { useState } from "react";
import { usePost } from "../../../hooks/useApi";
import { getErrorMessage } from "../../../utils/apiError";

type ForgotPasswordPayload = {
    username: string;
    email?: string;
    baseUrl: string;
};

type PasswordResponse = {
    success: boolean;
    message?: string;
};

export default function useForgotPassword() {
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const { mutateAsync, isPending } = usePost<
        PasswordResponse,
        ForgotPasswordPayload
    >("password/forgot");

    async function submit() {
        setError("");
        setMessage("");

        const normalizedUsername = username.trim();

        if (!normalizedUsername) {
            setError("Username is required.");
            return false;
        }

        try {
            const result = await mutateAsync({
                username: normalizedUsername,
                baseUrl: window.location.origin,
            });

            if (!result.success) {
                setError(result.message || "Could not send reset email.");
                return false;
            }

            setMessage(
                result.message ||
                    "If this account exists, a reset email has been sent.",
            );
            return true;
        } catch (error) {
            setError(getErrorMessage(error, "Could not send reset email."));
            return false;
        }
    }

    return {
        username,
        setUsername,
        message,
        error,
        setError,
        loading: isPending,
        submit,
    };
}
