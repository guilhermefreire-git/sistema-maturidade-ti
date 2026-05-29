import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ActionPlan5W2HPage from './pages/ActionPlan5W2HPage';
import GovernanceRisksPage from './pages/GovernanceRisksPage';
import CompaniesPage from './pages/CompaniesPage';
import QuestionsPage from './pages/QuestionsPage';
import AssessmentsPage from './pages/AssessmentsPage';
import RisksPage from './pages/RisksPage';
import ServicesPage from './pages/ServicesPage';
import AuditLogsPage from './pages/AuditLogsPage';

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
