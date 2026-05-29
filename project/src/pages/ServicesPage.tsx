import { useState, useEffect } from 'react';
import { Server, Plus, Trash2, CreditCard as Edit3, X, Loader as Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { getCompanies, getServices, createService, updateService, deleteService } from '../lib/api';
import type { Service, ServiceStatus, Company } from '../lib/types';

const STATUS_OPTIONS: { value: ServiceStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Ativo', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'inactive', label: 'Inativo', color: 'bg-slate-100 text-slate-700' },
  { value: 'review', label: 'Em Revisão', color: 'bg-amber-100 text-amber-700' },
];

const EMPTY_FORM = {
  name: '',
  description: '',
  category: '',
  service_owner: '',
  sla_target: '',
  current_performance: '',
  status: 'active' as ServiceStatus,
};

export default function ServicesPage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAdmin = profile?.role === 'admin';
  const isAuditor = profile?.role === 'auditor';
  const canEdit = isAdmin || isAuditor;

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      loadServices(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function loadCompanies() {
    try {
      const data = await getCompanies();
      setCompanies(data);
      if (profile?.company_id && !isAdmin) {
        setSelectedCompanyId(profile.company_id);
      } else if (data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id);
      }
    } catch {
      showToast('error', 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  }

  async function loadServices(companyId: string) {
    setLoading(true);
    try {
      const data = await getServices(companyId);
      setServices(data);
    } catch {
      showToast('error', 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
  }

  function openModal(service?: Service) {
    if (service) {
      setEditingService(service);
      setForm({
        name: service.name,
        description: service.description,
        category: service.category,
        service_owner: service.service_owner,
        sla_target: service.sla_target,
        current_performance: service.current_performance,
        status: service.status,
      });
    } else {
      setEditingService(null);
      setForm(EMPTY_FORM);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingService(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompanyId) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        company_id: selectedCompanyId,
        assessment_id: null,
      };
      if (editingService) {
        await updateService(editingService.id, payload);
        showToast('success', 'Serviço atualizado com sucesso');
      } else {
        await createService(payload);
        showToast('success', 'Serviço cadastrado com sucesso');
      }
      await loadServices(selectedCompanyId);
      closeModal();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Erro ao salvar serviço');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este serviço?')) return;
    try {
      await deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      showToast('success', 'Serviço excluído com sucesso');
    } catch {
      showToast('error', 'Erro ao excluir serviço');
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-600/10 rounded-lg">
          <Server className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Serviços</h1>
          <p className="text-sm text-slate-500">Catálogo de serviços de TI</p>
        </div>
      </div>

      {/* Company Selector */}
      {canEdit && companies.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
          <select
            value={selectedCompanyId}
            onChange={e => setSelectedCompanyId(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-slate-500">
          {services.length} serviço{services.length !== 1 ? 's' : ''} cadastrado{services.length !== 1 ? 's' : ''}
        </div>
        {canEdit && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Serviço
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && services.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <Server className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum serviço cadastrado</p>
          {canEdit && (
            <button onClick={() => openModal()} className="mt-4 text-teal-600 hover:text-teal-700 font-medium">
              Cadastrar primeiro serviço
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && services.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Categoria</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Responsável</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">SLA Meta</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Performance</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                  {canEdit && <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {services.map(service => (
                  <tr key={service.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{service.name}</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs truncate">{service.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{service.category}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{service.service_owner}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{service.sla_target}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{service.current_performance}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        STATUS_OPTIONS.find(s => s.value === service.status)?.color
                      }`}>
                        {STATUS_OPTIONS.find(s => s.value === service.status)?.label}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(service)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome do Serviço <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Responsável <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.service_owner}
                    onChange={e => setForm({ ...form, service_owner: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    SLA Meta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.sla_target}
                    onChange={e => setForm({ ...form, sla_target: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                    placeholder="Ex: 99.5%"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Performance Atual <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.current_performance}
                    onChange={e => setForm({ ...form, current_performance: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <div className="relative">
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as ServiceStatus })}
                    className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 appearance-none"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingService ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-4 hover:opacity-80">
            <X className="w-4 h-4 inline" />
          </button>
        </div>
      )}
    </div>
  );
}
