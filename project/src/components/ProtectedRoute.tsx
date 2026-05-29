import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { UserRole } from '../lib/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acesso Negado</h2>
          <p className="text-slate-500">Voce nao tem permissao para acessar esta pagina.</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
