import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;

  login: (token: string, user: User) => void;

  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);

      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (
    newToken: string,
    newUser: User
  ) => {
    localStorage.setItem("token", newToken);

    localStorage.setItem(
      "user",
      JSON.stringify(newUser)
    );

    setToken(newToken);

    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setUser(null);

    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};
