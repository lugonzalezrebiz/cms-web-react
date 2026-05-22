import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext, type DecodedToken } from "./AuthContextDef";
import { crashLogger } from "../services/CrashLogger";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );

  const user = useMemo<DecodedToken | null>(() => {
    if (!token) return null;
    try {
      return jwtDecode<DecodedToken>(token);
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    crashLogger.setUser({
      userID: user?.id ?? null,
      roleID: user?.roleID ?? null,
      username: user?.username ?? null,
      email: user?.email ?? null,
    });
  }, [user]);

  const setToken = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setTokenState(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setTokenState(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, authenticated: !!token, user, setToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
