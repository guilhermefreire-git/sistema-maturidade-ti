import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, CreditCard as Edit3, ChevronDown, X, Loader2, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import {
  getCompanies,
  getActionPlans5W2H,
  createActionPlan5W2H,
  updateActionPlan5W2H,
  updateActionPlan5W2HStatus,
  deleteActionPlan5W2H,
} from '../lib/api';
import type { Company, ActionPlan5W2H, ActionType5W2H, KanbanStatus } from '../lib/types';

const KANBAN_COLUMNS: { status: KanbanStatus; label: string; color: string; bg: string }[] = [
  { status: 'todo', label: 'A Fazer', color: 'text-slate-700', bg: 'bg-slate-100' },
  { status: 'doing', label: 'Em Execucao', color: 'text-blue-700', bg: 'bg-blue-100' },
  { status: 'done', label: 'Concluido', color: 'text-emerald-700', bg: 'bg-emerald-100' },
];

const ACTION_TYPES: { value: ActionType5W2H; label: string }[] = [
  { value: 'projeto', label: 'Projeto' },
  { value: 'processo', label: 'Processo' },
];

const EMPTY_FORM = {
  department: '',
  action_type: 'projeto' as ActionType5W2H,
  what: '',
  why: '',
  who_responsible: '',
  when_date: '',
  where_location: '',
  how: '',
  how_much: '',
  reach: 0,
  impact: 0,
  confidence: 0,
  effort: 1,
  status: 'todo' as KanbanStatus,
};

function calculateRICE(reach: number, impact: number, confidence: number, effort: number): number {
  if (effort <= 0) return 0;
  return (reach * impact * confidence) / effort;
}

export default function ActionPlan5W2HPage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [actionPlans, setActionPlans] = useState<ActionPlan5W2H[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ActionPlan5W2H | null>(null);
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
      loadActionPlans(selectedCompanyId);
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

  async function loadActionPlans(companyId: string) {
    setLoading(true);
    try {
      const data = await getActionPlans5W2H(companyId);
      setActionPlans(data);
    } catch {
      showToast('error', 'Erro ao carregar planos de acao');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
  }

  function openModal(plan?: ActionPlan5W2H) {
    if (plan) {
      setEditingPlan(plan);
      setForm({
        department: plan.department,
        action_type: plan.action_type,
        what: plan.what,
        why: plan.why,
        who_responsible: plan.who_responsible,
        when_date: plan.when_date || '',
        where_location: plan.where_location,
        how: plan.how,
        how_much: plan.how_much,
        reach: plan.reach,
        impact: plan.impact,
        confidence: plan.confidence,
        effort: plan.effort,
        status: plan.status,
      });
    } else {
      setEditingPlan(null);
      setForm(EMPTY_FORM);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPlan(null);
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
        when_date: form.when_date || null,
      };
      if (editingPlan) {
        await updateActionPlan5W2H(editingPlan.id, payload);
        showToast('success', 'Plano de acao atualizado');
      } else {
        await createActionPlan5W2H(payload);
        showToast('success', 'Plano de acao criado');
      }
      await loadActionPlans(selectedCompanyId);
      closeModal();
    } catch {
      showToast('error', 'Erro ao salvar plano de acao');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(planId: string, newStatus: KanbanStatus) {
    try {
      await updateActionPlan5W2HStatus(planId, newStatus);
      setActionPlans(prev =>
        prev.map(p => (p.id === planId ? { ...p, status: newStatus } : p))
      );
    } catch {
      showToast('error', 'Erro ao atualizar status');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este plano de acao?')) return;
    try {
      await deleteActionPlan5W2H(id);
      setActionPlans(prev => prev.filter(p => p.id !== id));
      showToast('success', 'Plano de acao excluido');
    } catch {
      showToast('error', 'Erro ao excluir plano de acao');
    }
  }

  const riceScore = calculateRICE(form.reach, form.impact, form.confidence, form.effort);

  const groupedPlans = KANBAN_COLUMNS.map(col => ({
    ...col,
    plans: actionPlans.filter(p => p.status === col.status),
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-600/10 rounded-lg">
          <ClipboardList className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plano de Acao 5W2H</h1>
          <p className="text-sm text-slate-500">Gestao e priorizacao de acoes com metodologia 5W2H e RICE</p>
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
          {actionPlans.length} plano{actionPlans.length !== 1 ? 's' : ''} de acao
        </div>
        {canEdit && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Acao
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
      {!loading && actionPlans.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum plano de acao cadastrado</p>
          {canEdit && (
            <button onClick={() => openModal()} className="mt-4 text-teal-600 hover:text-teal-700 font-medium">
              Criar primeiro plano
            </button>
          )}
        </div>
      )}

      {/* Kanban Board */}
      {!loading && actionPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groupedPlans.map(column => (
            <div key={column.status} className={`${column.bg} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${column.color}`}>{column.label}</h3>
                <span className="text-sm text-slate-500">{column.plans.length}</span>
              </div>
              <div className="space-y-3">
                {column.plans.map(plan => (
                  <div
                    key={plan.id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {plan.action_type === 'projeto' ? 'Projeto' : 'Processo'}
                      </span>
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openModal(plan)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-slate-900 mb-1">{plan.what || 'Sem titulo'}</h4>
                    <p className="text-xs text-slate-500 mb-2">{plan.department}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        <span className="font-medium">RICE:</span> {plan.rice_score.toFixed(1)}
                      </span>
                      {canEdit && (
                        <select
                          value={plan.status}
                          onChange={e => handleStatusChange(plan.id, e.target.value as KanbanStatus)}
                          className="text-xs px-2 py-1 border border-slate-200 rounded focus:ring-teal-500"
                        >
                          {KANBAN_COLUMNS.map(col => (
                            <option key={col.status} value={col.status}>{col.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <span title="Who" className="flex items-center gap-1">
                        <Target className="w-3 h-3" /> {plan.who_responsible || '-'}
                      </span>
                      <span title="When" className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {plan.when_date ? new Date(plan.when_date).toLocaleDateString('pt-BR') : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingPlan ? 'Editar Plano de Acao' : 'Novo Plano de Acao'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Departamento *</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Acao *</label>
                  <div className="relative">
                    <select
                      value={form.action_type}
                      onChange={e => setForm({ ...form, action_type: e.target.value as ActionType5W2H })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      {ACTION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 5W2H Section */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  Metodologia 5W2H
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">What (O Que) *</label>
                    <textarea
                      value={form.what}
                      onChange={e => setForm({ ...form, what: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Descricao da acao"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Why (Por Que) *</label>
                    <textarea
                      value={form.why}
                      onChange={e => setForm({ ...form, why: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Justificativa da acao"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Who (Quem) *</label>
                    <input
                      type="text"
                      value={form.who_responsible}
                      onChange={e => setForm({ ...form, who_responsible: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Responsavel"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">When (Quando) *</label>
                    <input
                      type="date"
                      value={form.when_date}
                      onChange={e => setForm({ ...form, when_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Where (Onde) *</label>
                    <input
                      type="text"
                      value={form.where_location}
                      onChange={e => setForm({ ...form, where_location: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Local"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">How (Como) *</label>
                    <textarea
                      value={form.how}
                      onChange={e => setForm({ ...form, how: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Metodo de execucao"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">How Much (Quanto) *</label>
                    <input
                      type="text"
                      value={form.how_much}
                      onChange={e => setForm({ ...form, how_much: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Custo estimado"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* RICE Prioritization */}
              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  Priorizacao RICE
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Reach (R) <span className="text-xs text-slate-500">Alcance</span>
                    </label>
                    <input
                      type="number"
                      value={form.reach}
                      onChange={e => setForm({ ...form, reach: Number(e.target.value) })}
                      min={0}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Impact (I) <span className="text-xs text-slate-500">Impacto</span>
                    </label>
                    <input
                      type="number"
                      value={form.impact}
                      onChange={e => setForm({ ...form, impact: Number(e.target.value) })}
                      min={0}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confidence (C) <span className="text-xs text-slate-500">Confianca</span>
                    </label>
                    <input
                      type="number"
                      value={form.confidence}
                      onChange={e => setForm({ ...form, confidence: Number(e.target.value) })}
                      min={0}
                      max={100}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Effort (E) <span className="text-xs text-slate-500">Esforco</span>
                    </label>
                    <input
                      type="number"
                      value={form.effort}
                      onChange={e => setForm({ ...form, effort: Number(e.target.value) })}
                      min={1}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Score RICE:</span>
                    <span className="text-2xl font-bold text-amber-600">{riceScore.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Formula: (R × I × C) / E</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <div className="relative">
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as KanbanStatus })}
                    className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 appearance-none"
                  >
                    {KANBAN_COLUMNS.map(col => (
                      <option key={col.status} value={col.status}>{col.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Actions */}
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
                  {editingPlan ? 'Atualizar' : 'Criar'}
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
