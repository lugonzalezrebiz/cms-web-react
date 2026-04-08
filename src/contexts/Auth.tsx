import { createContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export interface DecodedToken {
  sub: string;
  id: number;
  username: string;
  name: string;
  email: string;
  roleID: number;
  iat: number;
  exp: number;
  iss: string;
}

export interface AuthContextType {
  token: string | null;
  authenticated: boolean;
  user: DecodedToken | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );

  const [user, setUser] = useState<DecodedToken | null>(null);

  const authenticated = !!token;

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUser(decoded);
      } catch (error) {
        console.error("Invalid token:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const setToken = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setTokenState(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, authenticated, user, setToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
