// app/contexts/AuthContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { BACK_URL } from './GlobalContext';

export interface User {
  id: number;
  username: string;
  name: string;
  surname: string;
  patronym: string;
  role: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Прямой URL бэкенда
console.log(process.env.BACK_URL)
const API_BASE_URL = BACK_URL;

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // 1. Получаем токен напрямую с бэкенда
    // 1. Получаем токен напрямую с бэкенда в формате x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append('grant_type', 'password');
      formData.append('username', username);
      formData.append('password', password);
      formData.append('scope', '');
      formData.append('client_id', 'string');
      formData.append('client_secret', '********');

      const tokenResponse = await fetch(`${API_BASE_URL}/users/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      console.log('Token response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token request failed:', tokenResponse.status, errorText);
        //setError(`Ошибка авторизации: ${tokenResponse.status}`);
        return false;
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      console.log('Token received, fetching user info...');

      // 2. Получаем информацию о пользователе напрямую с бэкенда
      const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      console.log('User info response status:', userResponse.status);

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('User info request failed:', userResponse.status, errorText);
        //setError(`Ошибка получения данных пользователя: ${userResponse.status}`);
        return false;
      }


      const userData = await userResponse.json();

      setToken(accessToken);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};