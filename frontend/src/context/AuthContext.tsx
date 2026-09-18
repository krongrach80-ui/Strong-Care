import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
  username: string;
  displayName: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isLoggedIn: boolean;
  largeFont: boolean;
  voiceGuide: boolean;
  login: (username: string, role: UserRole, displayName?: string) => void;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  toggleLargeFont: () => void;
  toggleVoiceGuide: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('facevoice_auth');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return {
      username: 'admin',
      displayName: 'ผู้ดูแลระบบ (Admin)',
      role: 'ADMIN'
    };
  });

  const [largeFont, setLargeFont] = useState<boolean>(() => {
    return localStorage.getItem('facevoice_large_font') === 'true';
  });

  const [voiceGuide, setVoiceGuide] = useState<boolean>(() => {
    const saved = localStorage.getItem('facevoice_voice_guide');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('facevoice_auth', JSON.stringify(user));
    } else {
      localStorage.removeItem('facevoice_auth');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('facevoice_large_font', String(largeFont));
  }, [largeFont]);

  useEffect(() => {
    localStorage.setItem('facevoice_voice_guide', String(voiceGuide));
  }, [voiceGuide]);

  const login = (username: string, role: UserRole, displayName?: string) => {
    const name = displayName || (role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : username);
    setUser({ username, role, displayName: name });
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (newRole === 'ADMIN') {
      setUser({
        username: 'admin',
        displayName: 'ผู้ดูแลระบบ (Admin)',
        role: 'ADMIN'
      });
    } else {
      setUser({
        username: 'senior_user',
        displayName: 'คุณยายสมศรี (สมาชิกผู้สูงอายุ)',
        role: 'USER'
      });
      setLargeFont(true);
    }
  };

  const toggleLargeFont = () => setLargeFont((prev) => !prev);
  const toggleVoiceGuide = () => setVoiceGuide((prev) => !prev);

  const role: UserRole = user ? user.role : 'USER';
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoggedIn,
        largeFont,
        voiceGuide,
        login,
        logout,
        switchRole,
        toggleLargeFont,
        toggleVoiceGuide,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};