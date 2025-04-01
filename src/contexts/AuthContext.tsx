import { createContext, useContext, useState, ReactNode } from "react";
import api from "../utils/axiosInstance";
import cfg from "../config";

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  signin: (creds: Record<string, unknown>) => Promise<any>;
  signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    cfg.isDevMode ? true : false
  );

  const signin = async (creds: Record<string, unknown>) => {
    const res = await api.post("/auth/signin", creds);
    setIsAuthenticated(true);
    return res;
  };

  const signout = async () => {
    await api.post("/auth/signout", {});
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, signin, signout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
