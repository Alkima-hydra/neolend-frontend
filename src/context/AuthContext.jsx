import { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, register as apiRegister, getMe, logout as apiLogout } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("neolend_token");
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => localStorage.removeItem("neolend_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const data = await apiLogin(email, password);
    localStorage.setItem("neolend_token", data.token);
    setUser(data.usuario);
    return data.usuario;
  }

  async function register(fullName, email, password) {
    return apiRegister(fullName, email, password);
  }

  async function logout() {
    try {
      await apiLogout();
    } catch (_) {}
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