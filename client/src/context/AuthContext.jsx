import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginUser, registerUser } from '../services/authService.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'pathora_token';
const USER_KEY = 'pathora_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const persistSession = (authData) => {
    setToken(authData.token);
    setUser(authData.user);
    localStorage.setItem(TOKEN_KEY, authData.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    setError('');
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetchCurrentUser();
        setUser(response.user);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        setError('');
      } catch (loadError) {
        clearSession();
        setToken(null);
        setUser(null);
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapSession();
  }, [token]);

  const login = async (credentials) => {
    setIsLoading(true);

    try {
      const authData = await loginUser(credentials);
      persistSession(authData);
      return authData;
    } catch (loginError) {
      setError(loginError.message);
      throw loginError;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);

    try {
      const authData = await registerUser(userData);
      persistSession(authData);
      return authData;
    } catch (registerError) {
      setError(registerError.message);
      throw registerError;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
    setError('');
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      error,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
