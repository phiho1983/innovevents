import {
  useEffect,
  useState,
} from "react";

import { AuthContext } from "./AuthContext";

import {
  clearTokens,
  getAccessToken,
} from "../api/client";

import {
  login as apiLogin,
  me as apiMe,
  verifyLogin2FA as apiVerifyLogin2FA,
} from "../api/auth";

import {
  isAdminUser,
  isClientUser,
  isEmployeeUser,
} from "./roleAccess";


export function AuthProvider({
  children,
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated =
    Boolean(user);

  const isAdmin =
    isAdminUser(user);

  const isEmployee =
    isEmployeeUser(user);

  const isClient =
    isClientUser(user);

  const isInternal =
    isAdmin || isEmployee;

  /*
   * Alias temporaire conservé
   * pour compatibilité frontend.
   *
   * IMPORTANT :
   * il ne dépend plus de
   * Django user.is_staff.
   */
  const isStaff =
    isInternal;

  async function refreshMe() {
    if (!getAccessToken()) {
      setUser(null);
      return null;
    }

    try {
      const data =
        await apiMe();

      setUser(data);

      return data;
    } catch {
      clearTokens();
      setUser(null);

      return null;
    }
  }

  async function login(
    username,
    password
  ) {
    /*
     * Une nouvelle connexion ne doit pas
     * réutiliser d'anciens JWT présents
     * dans le navigateur.
     */
    clearTokens();
    setUser(null);

    const data =
      await apiLogin(
        username,
        password
      );

    if (!data?.requires_2fa) {
      throw new Error(
        "La vérification de connexion n'a pas été demandée."
      );
    }

    /*
     * Aucun JWT n'existe à ce stade.
     * Le compte n'est donc PAS encore authentifié.
     */
    return data;
  }

  async function verifyLogin2FA(
    username,
    code
  ) {
    /*
     * apiVerifyLogin2FA stocke access + refresh
     * uniquement si le code est accepté.
     */
    await apiVerifyLogin2FA(
      username,
      code
    );

    const authenticatedUser =
      await refreshMe();

    if (!authenticatedUser) {
      clearTokens();

      throw new Error(
        "Impossible de charger le compte après la vérification."
      );
    }

    return authenticatedUser;
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
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isEmployee,
    isClient,
    isInternal,
    isStaff,
    refreshMe,
    login,
    verifyLogin2FA,
    logout,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}