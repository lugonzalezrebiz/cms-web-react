import { useState } from "react";
import useNavigateWithQuery from "../../../hooks/useNavigate";
import useAuth from "../../../hooks/useAuth";
import useLocationGuard from "../../../hooks/useLocationGuard";
import { usePost } from "../../../hooks/useApi";
import { STRICT_GEOLOCATION } from "../../../config";

type LoginResponse = { success: boolean; token: string };
type LoginPayload = { username: string; password: string; lat?: number; lon?: number };

const useLogin = () => {
  const navigate = useNavigateWithQuery();
  const { setToken } = useAuth();
  const { checkNow } = useLocationGuard();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resolvingLocation, setResolvingLocation] = useState(false);

  const { mutateAsync, isPending } = usePost<LoginResponse, LoginPayload>("auth/login", {
    getBody: ({ username, password }) => ({ username, password }),
    getHeaders: ({ lat, lon }) => ({
      ...(lat !== undefined && { "x-lat": String(lat) }),
      ...(lon !== undefined && { "x-lon": String(lon) }),
    }),
  });
  const loading = resolvingLocation || isPending;

  const handleLogin = async () => {
    setError("");

    setResolvingLocation(true);
    const location = await checkNow();
    setResolvingLocation(false);

    // STRICT_GEOLOCATION blocking is enforced by LocationGuardProvider, which
    // checkNow() just re-armed if the permission is still missing.
    if (!location && STRICT_GEOLOCATION) {
      return;
    }

    try {
      const data = await mutateAsync({
        username,
        password,
        ...(location && { lat: location.lat, lon: location.lon }),
      });
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

  return {
    username,
    setUsername,
    password,
    setPassword,
    error,
    setError,
    loading,
    handleLogin,
  };
};

export default useLogin;
