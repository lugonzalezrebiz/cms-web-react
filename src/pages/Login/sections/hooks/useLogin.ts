import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../../hooks/useAuth";
import { usePost } from "../../../../hooks/useApi";

const DEFAULT_REDIRECT = "/dashboard?company=222&location=9001&date=20260407";

type LoginResponse = { success: boolean; token: string };
type LoginPayload = { username: string; password: string };

const useLogin = () => {
  const navigate = useNavigate();
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
        setToken(data.token);
        navigate(DEFAULT_REDIRECT, { replace: true });
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
