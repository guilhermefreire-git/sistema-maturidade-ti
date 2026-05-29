import { useState, useEffect } from 'react';
import { Building2, Plus, Trash2, CreditCard as Edit3, X, Loader as Loader2 } from 'lucide-react';
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../lib/api';
import type { Company } from '../lib/types';

const EMPTY_FORM = {
  name: '',
  cnpj: '',
  sector: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

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
    } catch {
      showToast('error', 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
  }

  function openModal(company?: Company) {
    if (company) {
      setEditingCompany(company);
      setForm({
        name: company.name,
        cnpj: company.cnpj,
        sector: company.sector,
        contact_name: company.contact_name,
        contact_email: company.contact_email,
        contact_phone: company.contact_phone,
      });
    } else {
      setEditingCompany(null);
      setForm(EMPTY_FORM);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCompany(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, form);
        showToast('success', 'Empresa atualizada com sucesso');
      } else {
        await createCompany(form);
        showToast('success', 'Empresa cadastrada com sucesso');
      }
      await loadCompanies();
      closeModal();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Erro ao salvar empresa');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta empresa?')) return;
    try {
      await deleteCompany(id);
      setCompanies(prev => prev.filter(c => c.id !== id));
      showToast('success', 'Empresa excluída com sucesso');
    } catch {
      showToast('error', 'Erro ao excluir empresa');
    }
  }

  function formatCNPJ(value: string) {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2/$3')
      .replace(/\.(\d{4})(\d)/, '.$1-$2')
      .slice(0, 18);
  }

  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-600/10 rounded-lg">
          <Building2 className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
          <p className="text-sm text-slate-500">Gerenciamento de empresas cadastradas</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-slate-500">
          {companies.length} empresa{companies.length !== 1 ? 's' : ''} cadastrada{companies.length !== 1 ? 's' : ''}
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && companies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhuma empresa cadastrada</p>
          <button onClick={() => openModal()} className="mt-4 text-teal-600 hover:text-teal-700 font-medium">
            Cadastrar primeira empresa
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && companies.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">CNPJ</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Setor</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Contato</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Telefone</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {companies.map(company => (
                  <tr key={company.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{company.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{company.cnpj}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{company.sector}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{company.contact_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{company.contact_email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{company.contact_phone}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal(company)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome da Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  CNPJ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={e => setForm({ ...form, cnpj: formatCNPJ(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Setor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.sector}
                  onChange={e => setForm({ ...form, sector: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome do Contato <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={e => setForm({ ...form, contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email do Contato <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={e => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.contact_phone}
                  onChange={e => setForm({ ...form, contact_phone: formatPhone(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="(00) 00000-0000"
                  required
                />
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
                  {editingCompany ? 'Atualizar' : 'Cadastrar'}
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
