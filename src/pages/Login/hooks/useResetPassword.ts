import { useState } from "react";
import { usePost } from "../../../hooks/useApi";
import { getErrorMessage } from "../../../utils/apiError";

type ResetPasswordPayload = {
    token: string;
    newPassword: string;
};

type PasswordResponse = {
    success: boolean;
    message?: string;
};

export default function useResetPassword() {
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const { mutateAsync, isPending } = usePost<
        PasswordResponse,
        ResetPasswordPayload
    >("password/reset");

    async function submit() {
        setError("");

        if (!token.trim()) {
            setError("Reset token is required.");
            return false;
        }

        if (!newPassword.trim()) {
            setError("New password is required.");
            return false;
        }

        if (newPassword !== confirmPassword) {
            setError("New password and confirm password do not match.");
            return false;
        }

        try {
            const result = await mutateAsync({
                token: token.trim(),
                newPassword,
            });

            if (!result.success) {
                setError(result.message || "Could not update password.");
                return false;
            }

            return true;
        } catch (error) {
            setError(getErrorMessage(error, "Could not update password."));
            return false;
        }
    }

    return {
        token,
        setToken,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        error,
        setError,
        loading: isPending,
        submit,
    };
}
