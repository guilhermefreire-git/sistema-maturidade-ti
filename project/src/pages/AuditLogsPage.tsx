import { useState, useEffect } from 'react';
import { ScrollText, X, Loader as Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { getAuditLogs, getCompanies } from '../lib/api';
import type { AuditLog, Company } from '../lib/types';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [filterTable, setFilterTable] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

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
      const [logsData, companiesData] = await Promise.all([
        getAuditLogs(200),
        getCompanies(),
      ]);
      setLogs(logsData);
      setCompanies(companiesData);
    } catch {
      showToast('error', 'Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
  }

  function toggleExpand(logId: string) {
    setExpandedLog(expandedLog === logId ? null : logId);
  }

  function formatJSON(json: Record<string, unknown>) {
    return JSON.stringify(json, null, 2);
  }

  const actionColors = {
    INSERT: 'bg-emerald-100 text-emerald-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
  };

  const actionLabels = {
    INSERT: 'Criação',
    UPDATE: 'Atualização',
    DELETE: 'Exclusão',
  };

  const tableLabels: Record<string, string> = {
    companies: 'Empresas',
    assessments: 'Avaliações',
    risks: 'Riscos',
    services: 'Serviços',
    action_plans_5w2h: 'Planos 5W2H',
    governance_risks: 'Riscos de TI',
  };

  const filteredLogs = logs.filter(log => {
    if (filterTable && log.table_name !== filterTable) return false;
    if (filterAction && log.action !== filterAction) return false;
    if (filterDate) {
      const logDate = new Date(log.created_at).toISOString().split('T')[0];
      if (logDate !== filterDate) return false;
    }
    return true;
  });

  // Get unique table names from logs
  const uniqueTables = [...new Set(logs.map(log => log.table_name))];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-600/10 rounded-lg">
          <ScrollText className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Logs de Auditoria</h1>
          <p className="text-sm text-slate-500">Histórico de ações do sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-900">{logs.length}</div>
          <div className="text-xs text-slate-500">Total de ações</div>
        </div>
        <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
          <div className="text-2xl font-bold text-emerald-700">
            {logs.filter(l => l.action === 'INSERT').length}
          </div>
          <div className="text-xs text-emerald-600">Criações</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="text-2xl font-bold text-blue-700">
            {logs.filter(l => l.action === 'UPDATE').length}
          </div>
          <div className="text-xs text-blue-600">Atualizações</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-700">
            {logs.filter(l => l.action === 'DELETE').length}
          </div>
          <div className="text-xs text-red-600">Exclusões</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tabela</label>
            <select
              value={filterTable}
              onChange={e => setFilterTable(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Todas as tabelas</option>
              {uniqueTables.map(table => (
                <option key={table} value={table}>
                  {tableLabels[table] || table}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Ação</label>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Todas as ações</option>
              <option value="INSERT">Criação</option>
              <option value="UPDATE">Atualização</option>
              <option value="DELETE">Exclusão</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Data</label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-slate-500">
        {filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''} encontrado{filteredLogs.length !== 1 ? 's' : ''}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLogs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <ScrollText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum log encontrado</p>
        </div>
      )}

      {/* Logs List */}
      {!loading && filteredLogs.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-200">
            {filteredLogs.map(log => (
              <div key={log.id}>
                {/* Log Header */}
                <div
                  className="px-6 py-4 hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          actionColors[log.action as keyof typeof actionColors] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {actionLabels[log.action as keyof typeof actionLabels] || log.action}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {tableLabels[log.table_name] || log.table_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                      {expandedLog === log.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedLog === log.id && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">ID do Usuário</label>
                        <p className="text-sm text-slate-900 font-mono">{log.user_id || 'Sistema'}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">ID do Registro</label>
                        <p className="text-sm text-slate-900 font-mono">{log.record_id || '-'}</p>
                      </div>
                    </div>

                    {log.action === 'INSERT' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Valores Inseridos</label>
                        <pre className="bg-white p-4 rounded-lg border border-slate-200 text-xs text-slate-700 overflow-x-auto">
                          {formatJSON(log.new_values)}
                        </pre>
                      </div>
                    )}

                    {log.action === 'UPDATE' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-2">Valores Anteriores</label>
                          <pre className="bg-white p-4 rounded-lg border border-slate-200 text-xs text-red-700 overflow-x-auto">
                            {formatJSON(log.old_values)}
                          </pre>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-2">Valores Novos</label>
                          <pre className="bg-white p-4 rounded-lg border border-slate-200 text-xs text-emerald-700 overflow-x-auto">
                            {formatJSON(log.new_values)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {log.action === 'DELETE' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Valores Excluídos</label>
                        <pre className="bg-white p-4 rounded-lg border border-slate-200 text-xs text-slate-700 overflow-x-auto">
                          {formatJSON(log.old_values)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
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
