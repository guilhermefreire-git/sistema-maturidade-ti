import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ActionPlan5W2HPage from './pages/ActionPlan5W2HPage';
import GovernanceRisksPage from './pages/GovernanceRisksPage';

function CompaniesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
      <p className="mt-2 text-slate-500">Modulo de gestao de empresas.</p>
    </div>
  );
}

function QuestionsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Questionarios</h1>
      <p className="mt-2 text-slate-500">Modulo de gestao de perguntas.</p>
    </div>
  );
}

function AssessmentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Avaliacoes</h1>
      <p className="mt-2 text-slate-500">Modulo de avaliacoes.</p>
    </div>
  );
}

function RisksPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Riscos</h1>
      <p className="mt-2 text-slate-500">Modulo de gestao de riscos.</p>
    </div>
  );
}

function ServicesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Servicos</h1>
      <p className="mt-2 text-slate-500">Modulo de gestao de servicos.</p>
    </div>
  );
}

function AuditLogsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">Logs de Auditoria</h1>
      <p className="mt-2 text-slate-500">Historico de acoes do sistema.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Admin only routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/companies" element={<CompaniesPage />} />
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Route>

              {/* Admin and Auditor routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'auditor']} />}>
                <Route path="/assessments" element={<AssessmentsPage />} />
                <Route path="/action-plans" element={<ActionPlan5W2HPage />} />
                <Route path="/governance-risks" element={<GovernanceRisksPage />} />
                <Route path="/risks" element={<RisksPage />} />
                <Route path="/services" element={<ServicesPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
