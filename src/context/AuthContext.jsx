import { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, register as apiRegister, getMe } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("neolend_token");
    if (token) {
      getMe(token)
        .then(setUser)
        .catch(() => localStorage.removeItem("neolend_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const { user: u, token } = await apiLogin(email, password);
    localStorage.setItem("neolend_token", token);
    setUser(u);
    return u;
  }

  async function register(fullName, email, password) {
    return apiRegister(fullName, email, password);
  }

  function logout() {
    localStorage.removeItem("neolend_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
