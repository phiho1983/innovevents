import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { clearTokens, getAccessToken } from "../api/client";
import { login as apiLogin, me as apiMe } from "../api/auth";



export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // IMPORTANT: on considère "auth" seulement si le profil user est chargé
  const isAuthenticated = !!user;
  const isStaff = !!user?.is_staff;

  async function refreshMe() {
    if (!getAccessToken()) {
      setUser(null);
      return null;
    }
    try {
      const data = await apiMe();
      setUser(data);
      return data;
    } catch  {
      clearTokens();
      setUser(null);
      return null;
    }
  }

  async function login(username, password) {
    await apiLogin(username, password);   // récupère tokens + stockage
    const u = await refreshMe();          // récupère /api/me
    if (!u) throw new Error("Impossible de charger /api/me après login");
    return u;
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      isStaff,
      refreshMe,
      login,
      logout,
    }),
    [user, loading, isAuthenticated, isStaff]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
