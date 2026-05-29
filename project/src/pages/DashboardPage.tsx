import { useState, useEffect } from 'react';
import { LayoutDashboard, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { getCompanies } from '../lib/api';
import type { Company } from '../lib/types';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCompanies();
        setCompanies(data);
      } catch {
        console.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-teal-600/10 rounded-lg">
          <LayoutDashboard className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Visao geral do sistema</p>
        </div>
      </div>

      {/* Welcome */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 mb-8 text-white">
        <h2 className="text-xl font-bold mb-1">Bem-vindo, {profile?.full_name || 'Usuario'}!</h2>
        <p className="text-teal-100">
          Utilize o menu lateral para navegar entre os modulos do sistema.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Empresas</p>
              <p className="text-2xl font-bold text-slate-900">{companies.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Seu Perfil</p>
              <p className="text-lg font-bold text-slate-900">
                {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'auditor' ? 'Auditor' : 'Cliente'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-lg">
              <Building2 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Modulos</p>
              <p className="text-2xl font-bold text-slate-900">5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Companies List */}
      {companies.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Empresas Cadastradas</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {companies.slice(0, 5).map(company => (
              <div key={company.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{company.name}</p>
                  <p className="text-sm text-slate-500">{company.sector}</p>
                </div>
                <span className="text-xs text-slate-400">{company.cnpj}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
