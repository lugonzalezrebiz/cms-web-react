import { createContext } from "react";

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
