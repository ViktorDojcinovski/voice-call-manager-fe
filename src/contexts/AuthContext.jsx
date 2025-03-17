import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";
import api from "../axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signin = async (creds) => {
    try {
      const res = await api.post("/auth/signin", creds);
      setIsAuthenticated(true);

      return res;
    } catch (error) {
      throw new Error(error);
    }
  };

  const signout = async () => {
    try {
      await api.post("/auth/signout", {});
      setIsAuthenticated(false);
    } catch (error) {
      throw new Error(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, signin, signout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
