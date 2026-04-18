import { useState } from "react";
import useNavigateWithQuery from "../../../../hooks/useNavigate";
import { jwtDecode } from "jwt-decode";
import useAuth from "../../../../hooks/useAuth";
import { usePost } from "../../../../hooks/useApi";
import type { DecodedToken } from "../../../../contexts/Auth";
import { REVIEWER_ROLE, ADMIN_ROLE } from "../../../../config";

export const REVIEWER_REDIRECT = "/dashboard?company=9001&location=222&date=20260407";
export const REVIEWER_LOGIN_REDIRECT = "/monitor";
const ADMIN_REDIRECT = "/admin-form";

type LoginResponse = { success: boolean; token: string };
type LoginPayload = { username: string; password: string };

const getRedirectByRole = (token: string): string | null => {
  try {
    const { roleID } = jwtDecode<DecodedToken>(token);
    if (roleID === REVIEWER_ROLE) return REVIEWER_LOGIN_REDIRECT;
    if (roleID === ADMIN_ROLE) return ADMIN_REDIRECT;
    return null;
  } catch {
    return null;
  }
};

const useLogin = () => {
  const navigate = useNavigateWithQuery();
  const { setToken } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { mutateAsync, isPending: loading } = usePost<LoginResponse, LoginPayload>("auth/login");

  const handleLogin = async () => {
    setError("");
    try {
      const data = await mutateAsync({ username, password });
      if (data.success && data.token) {
        const redirect = getRedirectByRole(data.token);
        if (!redirect) {
          setError("Unauthorized role.");
          return;
        }
        setToken(data.token);
        navigate(redirect, { replace: true });
      } else {
        setError("Invalid username or password.");
      }
    } catch {
      setError("Connection error. Please try again.");
    }
  };

  return { username, setUsername, password, setPassword, error, setError, loading, handleLogin };
};

export default useLogin;
