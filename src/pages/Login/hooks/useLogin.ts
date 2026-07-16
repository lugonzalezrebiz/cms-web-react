import { useState } from "react";
import useNavigateWithQuery from "../../../hooks/useNavigate";
import useAuth from "../../../hooks/useAuth";
import { usePost } from "../../../hooks/useApi";
import { STRICT_GEOLOCATION } from "../../../config";

type LoginResponse = { success: boolean; token: string };
type LoginPayload = { username: string; password: string; lat?: number; lon?: number };

const GEOLOCATION_TIMEOUT_MS = 5000;

// Resolves to null (rather than rejecting) on denial, timeout, or an environment
// without geolocation support, so callers can decide how to react.
function getGeolocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => resolve(null),
      { timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 0 },
    );
  });
}

const useLogin = () => {
  const navigate = useNavigateWithQuery();
  const { setToken } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [locationBlocked, setLocationBlocked] = useState(false);

  const { mutateAsync, isPending } = usePost<LoginResponse, LoginPayload>("auth/login");
  const loading = resolvingLocation || isPending;

  const handleLogin = async () => {
    setError("");
    setLocationBlocked(false);

    setResolvingLocation(true);
    const location = await getGeolocation();
    setResolvingLocation(false);

    if (!location && STRICT_GEOLOCATION) {
      setLocationBlocked(true);
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
    locationBlocked,
    dismissLocationBlocked: () => setLocationBlocked(false),
  };
};

export default useLogin;
