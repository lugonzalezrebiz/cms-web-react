import { useContext } from "react"
import type { AuthContextType } from '../contexts/Auth'
import { AuthContext } from '../contexts/Auth'

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default useAuth 