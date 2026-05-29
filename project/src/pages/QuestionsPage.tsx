import { useState, useEffect } from 'react';
import { FileQuestionMark as FileQuestion, Plus, Trash2, CreditCard as Edit3, X, Loader as Loader2, ChevronDown, ListFilter as Filter } from 'lucide-react';
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getPillars,
  getFrameworks,
} from '../lib/api';
import type { Question, Pillar, Framework } from '../lib/types';

const EMPTY_FORM = {
  pillar_id: '',
  framework_id: '',
  code: '',
  question_text: '',
  guidance: '',
  sort_order: 0,
  is_active: true,
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<(Question & { pillar: Pillar; framework: Framework })[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [filterPillarId, setFilterPillarId] = useState<string>('');
  const [filterFrameworkId, setFilterFrameworkId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [filterPillarId, filterFrameworkId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function loadData() {
    try {
      const [pillarsData, frameworksData] = await Promise.all([
        getPillars(),
        getFrameworks(),
      ]);
      setPillars(pillarsData);
      setFrameworks(frameworksData);
    } catch {
      showToast('error', 'Erro ao carregar dados');
    }
  }

  async function loadQuestions() {
    setLoading(true);
    try {
      const data = await getQuestions({
        pillar_id: filterPillarId || undefined,
        framework_id: filterFrameworkId || undefined,
      });
      setQuestions(data);
    } catch {
      showToast('error', 'Erro ao carregar perguntas');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
  }

  function openModal(question?: Question) {
    if (question) {
      setEditingQuestion(question);
      setForm({
        pillar_id: question.pillar_id,
        framework_id: question.framework_id,
        code: question.code,
        question_text: question.question_text,
        guidance: question.guidance,
        sort_order: question.sort_order,
        is_active: question.is_active,
      });
    } else {
      setEditingQuestion(null);
      setForm(EMPTY_FORM);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingQuestion(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, form);
        showToast('success', 'Pergunta atualizada com sucesso');
      } else {
        await createQuestion(form);
        showToast('success', 'Pergunta cadastrada com sucesso');
      }
      await loadQuestions();
      closeModal();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Erro ao salvar pergunta');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta pergunta?')) return;
    try {
      await deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      showToast('success', 'Pergunta excluída com sucesso');
    } catch {
      showToast('error', 'Erro ao excluir pergunta');
    }
  }

  function clearFilters() {
    setFilterPillarId('');
    setFilterFrameworkId('');
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-600/10 rounded-lg">
          <FileQuestion className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Questionários</h1>
          <p className="text-sm text-slate-500">Gerenciamento de perguntas de avaliação</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filtros</span>
          {(filterPillarId || filterFrameworkId) && (
            <button
              onClick={clearFilters}
              className="text-xs text-teal-600 hover:text-teal-700 ml-auto"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Pilar</label>
            <div className="relative">
              <select
                value={filterPillarId}
                onChange={e => setFilterPillarId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none"
              >
                <option value="">Todos os pilares</option>
                {pillars.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Framework</label>
            <div className="relative">
              <select
                value={filterFrameworkId}
                onChange={e => setFilterFrameworkId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none"
              >
                <option value="">Todos os frameworks</option>
                {frameworks.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-slate-500">
          {questions.length} pergunta{questions.length !== 1 ? 's' : ''} encontrada{questions.length !== 1 ? 's' : ''}
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Pergunta
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && questions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhuma pergunta encontrada</p>
          <button onClick={() => openModal()} className="mt-4 text-teal-600 hover:text-teal-700 font-medium">
            Cadastrar primeira pergunta
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && questions.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Código</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Pergunta</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Pilar</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Framework</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {questions.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-slate-900">{q.code}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 max-w-md">{q.question_text}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {q.pillar?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        {q.framework?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          q.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {q.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal(q)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pilar <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.pillar_id}
                      onChange={e => setForm({ ...form, pillar_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none"
                      required
                    >
                      <option value="">Selecione...</option>
                      {pillars.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Framework <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.framework_id}
                      onChange={e => setForm({ ...form, framework_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none"
                      required
                    >
                      <option value="">Selecione...</option>
                      {frameworks.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                  placeholder="Ex: GOV-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pergunta <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.question_text}
                  onChange={e => setForm({ ...form, question_text: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Texto da pergunta"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Orientação</label>
                <textarea
                  value={form.guidance}
                  onChange={e => setForm({ ...form, guidance: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Orientação para responder a pergunta"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ordem</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.is_active}
                        onChange={() => setForm({ ...form, is_active: true })}
                        className="w-4 h-4 text-teal-600"
                      />
                      <span className="text-sm text-slate-700">Ativa</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!form.is_active}
                        onChange={() => setForm({ ...form, is_active: false })}
                        className="w-4 h-4 text-teal-600"
                      />
                      <span className="text-sm text-slate-700">Inativa</span>
                    </label>
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
                  {editingQuestion ? 'Atualizar' : 'Cadastrar'}
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
