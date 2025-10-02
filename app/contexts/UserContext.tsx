// app/contexts/UserContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth, User } from './AuthContext';

export type UserRole = 'ОСК' | 'Подрядчик' | 'ИКО';

interface UserContextType {
  user: User | null;
  userRole: UserRole;
  updateUserRole: (role: UserRole) => void;
  getThemeColor: () => string;
  getFullName: () => string;
  getRoleName: () => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Функция для преобразования роли из числа в строку
const getRoleFromNumber = (roleNumber: number): UserRole => {
  switch (roleNumber) {
    case 0:
      return 'ОСК';
    case 1:
      return 'Подрядчик';
    case 2:
      return 'ИКО';
    default:
      return 'ОСК';
  }
};

// Функция для получения читаемого названия роли
const getRoleDisplayName = (roleNumber: number): string => {
  switch (roleNumber) {
    case 0:
      return 'ОСК';
    case 1:
      return 'Подрядчик';
    case 2:
      return 'ИКО';
    default:
      return 'ОСК';
  }
};

export const UserProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('ОСК');

  // При изменении пользователя из аутентификации, обновляем роль
  useEffect(() => {
    if (authUser) {
      const role = getRoleFromNumber(authUser.role);
      setUserRole(role);
    }
  }, [authUser]);

  const updateUserRole = (role: UserRole) => {
    setUserRole(role);
  };

  const getThemeColor = (): string => {
    switch (userRole) {
      case 'Подрядчик':
        return '#FF8533';
      case 'ИКО':
        return '#9B5EFD';
      case 'ОСК':
      default:
        return '#6B79ED';
    }
  };

  const getFullName = (): string => {
    if (authUser) {
      return `${authUser.surname} ${authUser.name}`.trim();
      //return `${authUser.surname} ${authUser.name} ${authUser.patronym}`.trim();
    }
    return 'Пользователь';
  };

  const getRoleName = (): string => {
    if (authUser) {
      return getRoleDisplayName(authUser.role);
    }
    return userRole;
  };

  return (
    <UserContext.Provider value={{
      user: authUser,
      userRole,
      updateUserRole,
      getThemeColor,
      getFullName,
      getRoleName,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};