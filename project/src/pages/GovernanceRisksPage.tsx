import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Trash2, CreditCard as Edit3, ChevronDown, X, Loader2, AlertTriangle, TrendingUp, CheckCircle, AlertCircle, Target } from 'lucide-react';
import { useAuth } from '../lib/auth';
import {
  getCompanies,
  getGovernanceRisks,
  createGovernanceRisk,
  updateGovernanceRisk,
  deleteGovernanceRisk,
  getRiskStatistics,
} from '../lib/api';
import type { Company, GovernanceRisk, GovernanceRiskType, ThreatTreatment, OpportunityTreatment } from '../lib/types';
import { THREAT_TREATMENTS, OPPORTUNITY_TREATMENTS, getRiskLevelColor, getRiskLevelLabel } from '../lib/types';

const RISK_TYPES: { value: GovernanceRiskType; label: string; color: string }[] = [
  { value: 'ameaca', label: 'Ameaca', color: 'text-red-700 bg-red-50' },
  { value: 'oportunidade', label: 'Oportunidade', color: 'text-emerald-700 bg-emerald-50' },
];

const PROBABILITY_SCALE = [1, 2, 3, 4, 5] as const;
const IMPACT_SCALE = [1, 2, 3, 4, 5] as const;

const EMPTY_FORM = {
  description: '',
  risk_type: 'ameaca' as GovernanceRiskType,
  cause: '',
  consequence: '',
  responsible: '',
  probability: 1,
  impact_level: 1,
  treatment: '' as ThreatTreatment | OpportunityTreatment | '',
};

interface RiskStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  threats: number;
  opportunities: number;
}

export default function GovernanceRisksPage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [risks, setRisks] = useState<GovernanceRisk[]>([]);
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState<GovernanceRisk | null>(null);
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
      const [riskData, statsData] = await Promise.all([
        getGovernanceRisks(companyId),
        getRiskStatistics(companyId),
      ]);
      setRisks(riskData);
      setStats(statsData);
    } catch {
      showToast('error', 'Erro ao carregar riscos');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
  }

  function openModal(risk?: GovernanceRisk) {
    if (risk) {
      setEditingRisk(risk);
      setForm({
        description: risk.description,
        risk_type: risk.risk_type,
        cause: risk.cause,
        consequence: risk.consequence,
        responsible: risk.responsible,
        probability: risk.probability,
        impact_level: risk.impact_level,
        treatment: risk.treatment,
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

  function handleTypeChange(type: GovernanceRiskType) {
    setForm({
      ...form,
      risk_type: type,
      treatment: '',
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompanyId) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        company_id: selectedCompanyId,
      };
      if (editingRisk) {
        await updateGovernanceRisk(editingRisk.id, payload);
        showToast('success', 'Risco atualizado');
      } else {
        await createGovernanceRisk(payload);
        showToast('success', 'Risco cadastrado');
      }
      await loadRisks(selectedCompanyId);
      closeModal();
    } catch {
      showToast('error', 'Erro ao salvar risco');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este risco?')) return;
    try {
      await deleteGovernanceRisk(id);
      setRisks(prev => prev.filter(r => r.id !== id));
      showToast('success', 'Risco excluido');
      if (selectedCompanyId) {
        const statsData = await getRiskStatistics(selectedCompanyId);
        setStats(statsData);
      }
    } catch {
      showToast('error', 'Erro ao excluir risco');
    }
  }

  const riskLevel = form.probability * form.impact_level;
  const riskColor = getRiskLevelColor(riskLevel);
  const riskLabel = getRiskLevelLabel(riskLevel);

  const treatmentOptions = form.risk_type === 'ameaca' ? THREAT_TREATMENTS : OPPORTUNITY_TREATMENTS;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-600/10 rounded-lg">
          <ShieldAlert className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestao de Riscos de TI</h1>
          <p className="text-sm text-slate-500">Identificacao, analise e tratamento de riscos</p>
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

      {/* Risk Appetite Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs text-slate-500">Total</div>
          </div>
          <div className="bg-red-50 rounded-lg border border-red-200 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
            </div>
            <div className="text-xs text-red-600">Criticos</div>
          </div>
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <div className="text-2xl font-bold text-orange-700">{stats.high}</div>
            </div>
            <div className="text-xs text-orange-600">Altos</div>
          </div>
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-700">{stats.medium}</div>
            </div>
            <div className="text-xs text-yellow-600">Medios</div>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div className="text-2xl font-bold text-green-700">{stats.low}</div>
            </div>
            <div className="text-xs text-green-600">Baixos</div>
          </div>
          <div className="bg-red-50 rounded-lg border border-red-200 p-4">
            <div className="text-2xl font-bold text-red-700">{stats.threats}</div>
            <div className="text-xs text-red-600">Ameacas</div>
          </div>
          <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
            <div className="text-2xl font-bold text-emerald-700">{stats.opportunities}</div>
            <div className="text-xs text-emerald-600">Oportunidades</div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-slate-500">
          {risks.length} risco{risks.length !== 1 ? 's' : ''} mapeado{risks.length !== 1 ? 's' : ''}
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
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum risco mapeado</p>
          {canEdit && (
            <button onClick={() => openModal()} className="mt-4 text-teal-600 hover:text-teal-700 font-medium">
              Mapear primeiro risco
            </button>
          )}
        </div>
      )}

      {/* Monitoring Table */}
      {!loading && risks.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Descricao</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Causa</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">P x I</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Tratamento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Responsavel</th>
                  {canEdit && <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Acoes</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {risks.map(risk => (
                  <tr key={risk.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate">
                      {risk.description}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        risk.risk_type === 'ameaca' ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'
                      }`}>
                        {risk.risk_type === 'ameaca' ? 'Ameaca' : 'Oportunidade'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">
                      {risk.cause || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-bold text-white"
                          style={{ backgroundColor: getRiskLevelColor(risk.risk_level) }}
                        >
                          {risk.risk_level}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({risk.probability} x {risk.impact_level})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {risk.treatment ? risk.treatment.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {risk.responsible || '-'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openModal(risk)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(risk.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
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

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Risk Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Risco</label>
                <div className="flex gap-2">
                  {RISK_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleTypeChange(type.value)}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        form.risk_type === type.value
                          ? `${type.color} border-current`
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descricao do Risco *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Descricao detalhada do risco"
                  required
                />
              </div>

              {/* Cause and Consequence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Causa</label>
                  <textarea
                    value={form.cause}
                    onChange={e => setForm({ ...form, cause: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="O que causa este risco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Consequencia</label>
                  <textarea
                    value={form.consequence}
                    onChange={e => setForm({ ...form, consequence: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Impacto se o risco se materializar"
                  />
                </div>
              </div>

              {/* Analysis: PxI Matrix */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-600" />
                  Analise (Matriz P x I)
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Probabilidade (P) <span className="text-xs text-slate-500">1 a 5</span>
                    </label>
                    <select
                      value={form.probability}
                      onChange={e => setForm({ ...form, probability: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      {PROBABILITY_SCALE.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Impacto (I) <span className="text-xs text-slate-500">1 a 5</span>
                    </label>
                    <select
                      value={form.impact_level}
                      onChange={e => setForm({ ...form, impact_level: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      {IMPACT_SCALE.map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">Nivel de Risco:</span>
                  <span
                    className="px-3 py-1 rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: riskColor }}
                  >
                    {riskLevel} - {riskLabel}
                  </span>
                </div>
              </div>

              {/* Treatment */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tratamento (Acao)</label>
                <div className="relative">
                  <select
                    value={form.treatment}
                    onChange={e => setForm({ ...form, treatment: e.target.value as ThreatTreatment | OpportunityTreatment })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 appearance-none"
                  >
                    <option value="">Selecione...</option>
                    {treatmentOptions.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Responsible */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsavel</label>
                <input
                  type="text"
                  value={form.responsible}
                  onChange={e => setForm({ ...form, responsible: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="Nome do responsavel pelo risco"
                />
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
