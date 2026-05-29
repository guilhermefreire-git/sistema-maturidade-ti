import { useState, useEffect } from 'react';
import { TriangleAlert as AlertTriangle, Plus, Trash2, CreditCard as Edit3, X, Loader as Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { getCompanies, getRisks, createRisk, updateRisk, deleteRisk } from '../lib/api';
import type { Risk, RiskLikelihood, RiskImpact, RiskLevel, RiskStatus, Company } from '../lib/types';

const LIKELIHOOD_OPTIONS: { value: RiskLikelihood; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
];

const IMPACT_OPTIONS: { value: RiskImpact; label: string }[] = [
  { value: 'low', label: 'Baixo' },
  { value: 'medium', label: 'Médio' },
  { value: 'high', label: 'Alto' },
];

const RISK_LEVEL_OPTIONS: { value: RiskLevel; label: string; color: string }[] = [
  { value: 'low', label: 'Baixo', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Médio', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'Alto', color: 'bg-orange-100 text-orange-700' },
  { value: 'critical', label: 'Crítico', color: 'bg-red-100 text-red-700' },
];

const STATUS_OPTIONS: { value: RiskStatus; label: string }[] = [
  { value: 'open', label: 'Aberto' },
  { value: 'mitigating', label: 'Mitigando' },
  { value: 'mitigated', label: 'Mitigado' },
  { value: 'accepted', label: 'Aceito' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '',
  likelihood: 'medium' as RiskLikelihood,
  impact: 'medium' as RiskImpact,
  risk_level: 'medium' as RiskLevel,
  mitigation_plan: '',
  owner: '',
  status: 'open' as RiskStatus,
};

export default function RisksPage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
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
      loadRisks(selectedCompanyId);
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

  async function loadRisks(companyId: string) {
    setLoading(true);
    try {
      const data = await getRisks(companyId);
      setRisks(data);
    } catch {
      showToast('error', 'Erro ao carregar riscos');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
  }

  function openModal(risk?: Risk) {
    if (risk) {
      setEditingRisk(risk);
      setForm({
        title: risk.title,
        description: risk.description,
        category: risk.category,
        likelihood: risk.likelihood,
        impact: risk.impact,
        risk_level: risk.risk_level,
        mitigation_plan: risk.mitigation_plan,
        owner: risk.owner,
        status: risk.status,
      });
    } else {
      setEditingRisk(null);
      setForm(EMPTY_FORM);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingRisk(null);
    setForm(EMPTY_FORM);
  }

  function calculateRiskLevelFromInputs(likelihood: RiskLikelihood, impact: RiskImpact): RiskLevel {
    const likelihoodMap = { low: 1, medium: 2, high: 3 };
    const impactMap = { low: 1, medium: 2, high: 3 };
    const score = likelihoodMap[likelihood] * impactMap[impact];

    if (score >= 9) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  function handleLikelihoodOrImpactChange(field: 'likelihood' | 'impact', value: RiskLikelihood | RiskImpact) {
    const newForm = { ...form, [field]: value };
    const riskLevel = calculateRiskLevelFromInputs(
      newForm.likelihood as RiskLikelihood,
      newForm.impact as RiskImpact
    );
    setForm({ ...newForm, risk_level: riskLevel });
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
      if (editingRisk) {
        await updateRisk(editingRisk.id, payload);
        showToast('success', 'Risco atualizado com sucesso');
      } else {
        await createRisk(payload);
        showToast('success', 'Risco cadastrado com sucesso');
      }
      await loadRisks(selectedCompanyId);
      closeModal();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Erro ao salvar risco');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este risco?')) return;
    try {
      await deleteRisk(id);
      setRisks(prev => prev.filter(r => r.id !== id));
      showToast('success', 'Risco excluído com sucesso');
    } catch {
      showToast('error', 'Erro ao excluir risco');
    }
  }

  const getStatusColor = (status: RiskStatus) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-700';
      case 'mitigating':
        return 'bg-amber-100 text-amber-700';
      case 'mitigated':
        return 'bg-emerald-100 text-emerald-700';
      case 'accepted':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-600/10 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riscos</h1>
          <p className="text-sm text-slate-500">Gerenciamento de riscos identificados</p>
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
          {risks.length} risco{risks.length !== 1 ? 's' : ''} identificado{risks.length !== 1 ? 's' : ''}
        </div>
        {canEdit && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Risco
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
      {!loading && risks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum risco identificado</p>
          {canEdit && (
            <button onClick={() => openModal()} className="mt-4 text-teal-600 hover:text-teal-700 font-medium">
              Identificar primeiro risco
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && risks.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Título</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Categoria</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Probabilidade</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Impacto</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Nível</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Responsável</th>
                  {canEdit && <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {risks.map(risk => (
                  <tr key={risk.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{risk.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{risk.category}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        risk.likelihood === 'high' ? 'bg-red-100 text-red-700' :
                        risk.likelihood === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {LIKELIHOOD_OPTIONS.find(l => l.value === risk.likelihood)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        risk.impact === 'high' ? 'bg-red-100 text-red-700' :
                        risk.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {IMPACT_OPTIONS.find(i => i.value === risk.impact)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${getRiskLevelColor(risk.risk_level)}`}>
                        {RISK_LEVEL_OPTIONS.find(r => r.value === risk.risk_level)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(risk.status)}`}>
                        {STATUS_OPTIONS.find(s => s.value === risk.status)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{risk.owner}</td>
                    {canEdit && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(risk)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(risk.id)}
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
                {editingRisk ? 'Editar Risco' : 'Novo Risco'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Probabilidade</label>
                  <div className="relative">
                    <select
                      value={form.likelihood}
                      onChange={e => handleLikelihoodOrImpactChange('likelihood', e.target.value as RiskLikelihood)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      {LIKELIHOOD_OPTIONS.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Impacto</label>
                  <div className="relative">
                    <select
                      value={form.impact}
                      onChange={e => handleLikelihoodOrImpactChange('impact', e.target.value as RiskImpact)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      {IMPACT_OPTIONS.map(i => (
                        <option key={i.value} value={i.value}>{i.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Nível de Risco Calculado: </span>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${getRiskLevelColor(form.risk_level)}`}>
                  {RISK_LEVEL_OPTIONS.find(r => r.value === form.risk_level)?.label}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plano de Mitigação</label>
                <textarea
                  value={form.mitigation_plan}
                  onChange={e => setForm({ ...form, mitigation_plan: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                  <input
                    type="text"
                    value={form.owner}
                    onChange={e => setForm({ ...form, owner: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as RiskStatus })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
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
                  {editingRisk ? 'Atualizar' : 'Cadastrar'}
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
