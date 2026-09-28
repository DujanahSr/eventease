import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService, LoginRequest } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  updateProfile: (data: { name?: string; phone?: string; profilePicture?: string }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (storedToken) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch {
          // If access token invalid, attempt to recover using refresh token
          if (storedRefreshToken) {
            try {
              const freshAuth = await authService.refreshToken(storedRefreshToken);
              setToken(freshAuth.accessToken);
              setUser(freshAuth.user);
              localStorage.setItem('token', freshAuth.accessToken);
              if (freshAuth.refreshToken) {
                localStorage.setItem('refreshToken', freshAuth.refreshToken);
              }
              localStorage.setItem('user', JSON.stringify(freshAuth.user));
              setIsLoading(false);
              return;
            } catch {
              logout();
            }
          } else {
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<User> => {
    const authData = await authService.login(credentials);
    setToken(authData.accessToken);
    setUser(authData.user);
    localStorage.setItem('token', authData.accessToken);
    if (authData.refreshToken) {
      localStorage.setItem('refreshToken', authData.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(authData.user));
    return authData.user;
  };

  const loginWithGoogle = async (credential: string): Promise<User> => {
    const authData = await authService.loginWithGoogle(credential);
    setToken(authData.accessToken);
    setUser(authData.user);
    localStorage.setItem('token', authData.accessToken);
    if (authData.refreshToken) {
      localStorage.setItem('refreshToken', authData.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(authData.user));
    return authData.user;
  };

  const updateProfile = async (data: { name?: string; phone?: string; profilePicture?: string }): Promise<User> => {
    const updated = await authService.updateProfile(data);
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        loginWithGoogle,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
