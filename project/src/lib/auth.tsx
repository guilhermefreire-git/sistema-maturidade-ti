import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Profile, UserRole } from './types';

// Mock users for testing
const MOCK_USERS: Record<string, { email: string; password: string; profile: Profile }> = {
  'admin@teste.com': {
    email: 'admin@teste.com',
    password: '123456',
    profile: {
      id: 'mock-admin-id',
      full_name: 'Administrador Teste',
      role: 'admin',
      company_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'auditor@teste.com': {
    email: 'auditor@teste.com',
    password: '123456',
    profile: {
      id: 'mock-auditor-id',
      full_name: 'Auditor Teste',
      role: 'auditor',
      company_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'cliente@teste.com': {
    email: 'cliente@teste.com',
    password: '123456',
    profile: {
      id: 'mock-cliente-id',
      full_name: 'Cliente Teste',
      role: 'cliente',
      company_id: 'mock-company-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
};

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('mock_user');
    const storedProfile = localStorage.getItem('mock_profile');

    if (storedUser && storedProfile) {
      try {
        setUser(JSON.parse(storedUser));
        setProfile(JSON.parse(storedProfile));
      } catch {
        localStorage.removeItem('mock_user');
        localStorage.removeItem('mock_profile');
      }
    }
    setLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    const mockUser = MOCK_USERS[email.toLowerCase()];

    if (!mockUser) {
      return { error: 'Usuario nao encontrado' };
    }

    if (mockUser.password !== password) {
      return { error: 'Senha incorreta' };
    }

    setUser({ id: mockUser.profile.id, email: mockUser.email });
    setProfile(mockUser.profile);

    localStorage.setItem('mock_user', JSON.stringify({ id: mockUser.profile.id, email: mockUser.email }));
    localStorage.setItem('mock_profile', JSON.stringify(mockUser.profile));

    return { error: null };
  }

  async function signUp(_email: string, _password: string, _fullName: string, _role: UserRole) {
    // For testing purposes, signUp is disabled - use mock users
    return { error: 'Cadastro desabilitado. Use os usuarios de teste.' };
  }

  async function signOut() {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('mock_user');
    localStorage.removeItem('mock_profile');
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// Export mock users info for quick login buttons
export const TEST_USERS = [
  { email: 'admin@teste.com', password: '123456', label: 'Admin', role: 'Administrador' },
  { email: 'auditor@teste.com', password: '123456', label: 'Auditor', role: 'Auditor' },
  { email: 'cliente@teste.com', password: '123456', label: 'Cliente', role: 'Cliente' },
];
