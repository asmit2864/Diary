import { useState, useEffect, useCallback } from 'react';
import { fetchMe, loginUser, registerUser, logoutUser } from '../utils/api';

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await loginUser(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email, password) => {
    const u = await registerUser(email, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
