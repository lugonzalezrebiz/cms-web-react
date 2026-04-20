import { useState } from "react";
import useNavigateWithQuery from "../../../../hooks/useNavigate";
import useAuth from "../../../../hooks/useAuth";
import { usePost } from "../../../../hooks/useApi";

type LoginResponse = { success: boolean; token: string };
type LoginPayload = { username: string; password: string };

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
        const redirect = "/assignments";
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
