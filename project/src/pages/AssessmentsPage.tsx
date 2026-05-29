import { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Trash2, CreditCard as Edit3, X, Loader as Loader2, ChevronRight, ChevronLeft, Check, CircleAlert as AlertCircle, Save, Building2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import {
  getCompanies,
  getAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getQuestions,
  getAssessmentResponses,
  upsertAssessmentResponse,
  createEvidence,
  updateEvidence,
  createActionPlan,
  updateActionPlan,
  initializeAssessmentResponses,
} from '../lib/api';
import type {
  Company,
  Assessment,
  Question,
  Pillar,
  Framework,
  AssessmentResponse,
  Evidence,
  ActionPlanAssessment,
  ResponseType,
} from '../lib/types';
import { calculateScore, getMaturityLevel, RESPONSE_WEIGHTS } from '../lib/types';

const RESPONSE_OPTIONS: { value: ResponseType; label: string; color: string; weight: number }[] = [
  { value: 'ok', label: 'OK', color: 'bg-emerald-500 text-white', weight: 2 },
  { value: 'parcial', label: 'Parcial', color: 'bg-amber-500 text-white', weight: 1 },
  { value: 'nao_ok', label: 'Não OK', color: 'bg-red-500 text-white', weight: 0 },
  { value: 'na', label: 'Não se Aplica', color: 'bg-slate-500 text-white', weight: 0 },
];

export default function AssessmentsPage() {
  const { profile } = useAuth();

  // List view state
  const [assessments, setAssessments] = useState<(Assessment & { company: Company })[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Wizard state
  const [wizardMode, setWizardMode] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<(Question & { pillar: Pillar; framework: Framework })[]>([]);
  const [responses, setResponses] = useState<(AssessmentResponse & {
    question: Question & { pillar: Pillar; framework: Framework };
    evidence: Evidence | null;
    action_plan: ActionPlanAssessment | null;
  })[]>([]);
  const [currentPillarIndex, setCurrentPillarIndex] = useState(0);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showActionPlanModal, setShowActionPlanModal] = useState(false);
  const [currentResponseId, setCurrentResponseId] = useState<string>('');
  const [evidenceForm, setEvidenceForm] = useState({ description: '', file_url: '', file_name: '' });
  const [actionPlanForm, setActionPlanForm] = useState({
    what: '',
    why: '',
    who: '',
    when_date: '',
    where_text: '',
    how: '',
    how_much: '',
  });

  const isAdmin = profile?.role === 'admin';
  const isAuditor = profile?.role === 'auditor';
  const canEdit = isAdmin || isAuditor;

  const pillars = [...new Set(questions.map(q => q.pillar_id))];
  const currentPillarQuestions = questions.filter(q => q.pillar_id === pillars[currentPillarIndex]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function loadData() {
    try {
      const [assessmentsData, companiesData] = await Promise.all([
        getAssessments(),
        getCompanies(),
      ]);
      setAssessments(assessmentsData);
      setCompanies(companiesData);
    } catch {
      showToast('error', 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
  }

  function openNewAssessmentModal() {
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleCreateAssessment(companyId: string) {
    setSaving(true);
    try {
      const assessment = await createAssessment({
        company_id: companyId,
        auditor_id: profile?.id || '',
        status: 'draft',
        overall_score: 0,
        maturity_level: '',
      });

      await initializeAssessmentResponses(assessment.id);
      await loadData();
      closeModal();
      startWizard(assessment);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Erro ao criar avaliação');
    } finally {
      setSaving(false);
    }
  }

  async function startWizard(assessment: Assessment) {
    setWizardLoading(true);
    setWizardMode(true);
    setCurrentAssessment(assessment);
    setCurrentPillarIndex(0);

    try {
      const [questionsData, responsesData] = await Promise.all([
        getQuestions(),
        getAssessmentResponses(assessment.id),
      ]);

      setQuestions(questionsData);
      setResponses(responsesData);
    } catch {
      showToast('error', 'Erro ao carregar avaliação');
      setWizardMode(false);
    } finally {
      setWizardLoading(false);
    }
  }

  function closeWizard() {
    setWizardMode(false);
    setCurrentAssessment(null);
    setQuestions([]);
    setResponses([]);
    setCurrentPillarIndex(0);
    loadData();
  }

  function getResponseForQuestion(questionId: string) {
    return responses.find(r => r.question_id === questionId);
  }

  async function handleResponseChange(questionId: string, response: ResponseType) {
    const existingResponse = getResponseForQuestion(questionId);

    try {
      const updatedResponse = await upsertAssessmentResponse({
        assessment_id: currentAssessment!.id,
        question_id: questionId,
        response,
        notes: existingResponse?.notes || '',
      });

      setResponses(prev => {
        const filtered = prev.filter(r => r.question_id !== questionId);
        return [...filtered, {
          ...updatedResponse,
          question: questions.find(q => q.id === questionId)!,
          evidence: existingResponse?.evidence || null,
          action_plan: existingResponse?.action_plan || null,
        }];
      });
    } catch {
      showToast('error', 'Erro ao salvar resposta');
    }
  }

  function openEvidenceModal(questionId: string) {
    const response = getResponseForQuestion(questionId);
    if (response) {
      setCurrentResponseId(response.id);
      setEvidenceForm({
        description: response.evidence?.description || '',
        file_url: response.evidence?.file_url || '',
        file_name: response.evidence?.file_name || '',
      });
      setShowEvidenceModal(true);
    }
  }

  function openActionPlanModal(questionId: string) {
    const response = getResponseForQuestion(questionId);
    if (response) {
      setCurrentResponseId(response.id);
      setActionPlanForm({
        what: response.action_plan?.what || '',
        why: response.action_plan?.why || '',
        who: response.action_plan?.who || '',
        when_date: response.action_plan?.when_date || '',
        where_text: response.action_plan?.where_text || '',
        how: response.action_plan?.how || '',
        how_much: response.action_plan?.how_much || '',
      });
      setShowActionPlanModal(true);
    }
  }

  async function handleSaveEvidence() {
    setSaving(true);
    try {
      const existingResponse = responses.find(r => r.id === currentResponseId);

      if (existingResponse?.evidence) {
        await updateEvidence(existingResponse.evidence.id, evidenceForm);
      } else {
        await createEvidence({
          assessment_response_id: currentResponseId,
          ...evidenceForm,
        });
      }

      const responsesData = await getAssessmentResponses(currentAssessment!.id);
      setResponses(responsesData);
      setShowEvidenceModal(false);
      showToast('success', 'Evidência salva');
    } catch {
      showToast('error', 'Erro ao salvar evidência');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveActionPlan() {
    setSaving(true);
    try {
      const existingResponse = responses.find(r => r.id === currentResponseId);

      if (existingResponse?.action_plan) {
        await updateActionPlan(existingResponse.action_plan.id, {
          ...actionPlanForm,
          when_date: actionPlanForm.when_date || null,
        });
      } else {
        await createActionPlan({
          assessment_response_id: currentResponseId,
          ...actionPlanForm,
          when_date: actionPlanForm.when_date || null,
          status: 'pending',
        });
      }

      const responsesData = await getAssessmentResponses(currentAssessment!.id);
      setResponses(responsesData);
      setShowActionPlanModal(false);
      showToast('success', 'Plano de ação salvo');
    } catch {
      showToast('error', 'Erro ao salvar plano de ação');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    try {
      const score = calculateScore(responses);
      const maturity = getMaturityLevel(score);

      await updateAssessment(currentAssessment!.id, {
        status: 'in_progress',
        overall_score: score,
        maturity_level: maturity.label,
        started_at: currentAssessment!.started_at || new Date().toISOString(),
      });

      showToast('success', 'Rascunho salvo com sucesso');
    } catch {
      showToast('error', 'Erro ao salvar rascunho');
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteAssessment() {
    const unanswered = responses.filter(r => r.response === 'na');
    if (unanswered.length > 0) {
      showToast('error', 'Responda todas as perguntas antes de concluir');
      return;
    }

    const partialOrNotOk = responses.filter(r => r.response === 'parcial' || r.response === 'nao_ok');
    const missingActionPlans = partialOrNotOk.filter(r => !r.action_plan?.what);
    if (missingActionPlans.length > 0) {
      showToast('error', 'Todas as respostas Parcial/Não OK devem ter plano de ação');
      return;
    }

    setSaving(true);
    try {
      const score = calculateScore(responses);
      const maturity = getMaturityLevel(score);

      await updateAssessment(currentAssessment!.id, {
        status: 'completed',
        overall_score: score,
        maturity_level: maturity.label,
        completed_at: new Date().toISOString(),
      });

      showToast('success', 'Avaliação concluída com sucesso');
      closeWizard();
    } catch {
      showToast('error', 'Erro ao concluir avaliação');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAssessment(id: string) {
    if (!confirm('Deseja realmente excluir esta avaliação?')) return;
    try {
      await deleteAssessment(id);
      setAssessments(prev => prev.filter(a => a.id !== id));
      showToast('success', 'Avaliação excluída com sucesso');
    } catch {
      showToast('error', 'Erro ao excluir avaliação');
    }
  }

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };

  const statusLabels = {
    draft: 'Rascunho',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
  };

  // Wizard View
  if (wizardMode && currentAssessment) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={closeWizard} className="text-slate-600 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Avaliação de Maturidade</h1>
                <p className="text-sm text-slate-500">
                  {companies.find(c => c.id === currentAssessment.company_id)?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Salvar Rascunho
              </button>
              <button
                onClick={handleCompleteAssessment}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Concluir Avaliação
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 flex items-center gap-2">
            {pillars.map((pillarId, index) => {
              const pillar = questions.find(q => q.pillar_id === pillarId)?.pillar;
              return (
                <button
                  key={pillarId}
                  onClick={() => setCurrentPillarIndex(index)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    index === currentPillarIndex
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pillar?.name || `Pilar ${index + 1}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {wizardLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {currentPillarQuestions.map(question => {
                const response = getResponseForQuestion(question.id);
                const selectedResponse = response?.response || 'na';

                return (
                  <div
                    key={question.id}
                    className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-slate-500">
                            {question.framework?.name}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded">
                            {question.code}
                          </span>
                        </div>
                        <h3 className="text-slate-900 font-medium">{question.question_text}</h3>
                        {question.guidance && (
                          <p className="text-sm text-slate-500 mt-2">{question.guidance}</p>
                        )}
                      </div>
                    </div>

                    {/* Response Options */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      {RESPONSE_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleResponseChange(question.id, option.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedResponse === option.value
                              ? option.color
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {/* Evidence Required for OK */}
                    {selectedResponse === 'ok' && response && (
                      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">
                              Evidência obrigatória para resposta "OK"
                            </span>
                          </div>
                          <button
                            onClick={() => openEvidenceModal(question.id)}
                            className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                          >
                            {response.evidence ? 'Editar Evidência' : 'Adicionar Evidência'}
                          </button>
                        </div>
                        {response.evidence && (
                          <div className="mt-2 text-sm text-emerald-700">
                            <p><strong>Descrição:</strong> {response.evidence.description}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Plan Required for Parcial/Não OK */}
                    {(selectedResponse === 'parcial' || selectedResponse === 'nao_ok') && response && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-700">
                              Plano de ação obrigatório
                            </span>
                          </div>
                          <button
                            onClick={() => openActionPlanModal(question.id)}
                            className="text-sm text-amber-700 hover:text-amber-800 font-medium"
                          >
                            {response.action_plan?.what ? 'Editar Plano' : 'Adicionar Plano'}
                          </button>
                        </div>
                        {response.action_plan?.what && (
                          <div className="mt-2 text-sm text-amber-700">
                            <p><strong>O que:</strong> {response.action_plan.what}</p>
                            <p><strong>Quem:</strong> {response.action_plan.who}</p>
                            <p><strong>Quando:</strong> {response.action_plan.when_date || 'Não definido'}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="bg-white border-t border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPillarIndex(prev => Math.max(0, prev - 1))}
              disabled={currentPillarIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <div className="text-sm text-slate-500">
              Score Atual:{' '}
              <span className="font-bold text-teal-600">{calculateScore(responses)}%</span>
            </div>
            <button
              onClick={() => setCurrentPillarIndex(prev => Math.min(pillars.length - 1, prev + 1))}
              disabled={currentPillarIndex === pillars.length - 1}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Evidence Modal */}
        {showEvidenceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Evidência</h2>
                <button onClick={() => setShowEvidenceModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
                  <textarea
                    value={evidenceForm.description}
                    onChange={e => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Arquivo</label>
                  <input
                    type="text"
                    value={evidenceForm.file_name}
                    onChange={e => setEvidenceForm({ ...evidenceForm, file_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL do Arquivo</label>
                  <input
                    type="text"
                    value={evidenceForm.file_url}
                    onChange={e => setEvidenceForm({ ...evidenceForm, file_url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowEvidenceModal(false)}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEvidence}
                    disabled={saving || !evidenceForm.description}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Plan Modal */}
        {showActionPlanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Plano de Ação (5W2H)</h2>
                <button onClick={() => setShowActionPlanModal(false)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">What (O que) *</label>
                    <textarea
                      value={actionPlanForm.what}
                      onChange={e => setActionPlanForm({ ...actionPlanForm, what: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Why (Por que) *</label>
                    <textarea
                      value={actionPlanForm.why}
                      onChange={e => setActionPlanForm({ ...actionPlanForm, why: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Who (Quem) *</label>
                    <input
                      type="text"
                      value={actionPlanForm.who}
                      onChange={e => setActionPlanForm({ ...actionPlanForm, who: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">When (Quando)</label>
                    <input
                      type="date"
                      value={actionPlanForm.when_date}
                      onChange={e => setActionPlanForm({ ...actionPlanForm, when_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Where (Onde) *</label>
                  <input
                    type="text"
                    value={actionPlanForm.where_text}
                    onChange={e => setActionPlanForm({ ...actionPlanForm, where_text: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">How (Como) *</label>
                  <textarea
                    value={actionPlanForm.how}
                    onChange={e => setActionPlanForm({ ...actionPlanForm, how: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">How Much (Quanto) *</label>
                  <input
                    type="text"
                    value={actionPlanForm.how_much}
                    onChange={e => setActionPlanForm({ ...actionPlanForm, how_much: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowActionPlanModal(false)}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveActionPlan}
                    disabled={saving}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </div>
              </div>
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

  // List View
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-600/10 rounded-lg">
          <ClipboardCheck className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Avaliações</h1>
          <p className="text-sm text-slate-500">Gerenciamento de avaliações de maturidade</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-slate-500">
          {assessments.length} avaliaç{assessments.length !== 1 ? 'ões' : 'ão'} encontrada{assessments.length !== 1 ? 's' : ''}
        </div>
        {canEdit && (
          <button
            onClick={openNewAssessmentModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Avaliação
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
      {!loading && assessments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhuma avaliação encontrada</p>
          {canEdit && (
            <button onClick={openNewAssessmentModal} className="mt-4 text-teal-600 hover:text-teal-700 font-medium">
              Iniciar primeira avaliação
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && assessments.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Empresa</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Auditor</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Score</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Nível</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Data</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {assessments.map(assessment => (
                  <tr key={assessment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {assessment.company?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {assessment.auditor?.full_name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          statusColors[assessment.status]
                        }`}
                      >
                        {statusLabels[assessment.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-teal-600">
                        {assessment.overall_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {assessment.maturity_level || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(assessment.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && assessment.status !== 'completed' && (
                          <button
                            onClick={() => startWizard(assessment)}
                            className="px-3 py-1 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            Continuar
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteAssessment(assessment.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Assessment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Nova Avaliação</h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Selecione a Empresa <span className="text-red-500">*</span>
              </label>
              <select
                id="companySelect"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Selecione...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const select = document.getElementById('companySelect') as HTMLSelectElement;
                    if (select?.value) {
                      handleCreateAssessment(select.value);
                    }
                  }}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Iniciar
                </button>
              </div>
            </div>
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
