import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Building2,
  FileQuestion,
  ClipboardCheck,
  AlertTriangle,
  Server,
  ScrollText,
  LogOut,
  Menu,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'auditor' | 'cliente')[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'auditor', 'cliente'] },
  { path: '/companies', label: 'Empresas', icon: Building2, roles: ['admin'] },
  { path: '/questions', label: 'Questionarios', icon: FileQuestion, roles: ['admin'] },
  { path: '/assessments', label: 'Avaliacoes', icon: ClipboardCheck, roles: ['admin', 'auditor'] },
  { path: '/action-plans', label: 'Plano 5W2H', icon: ClipboardList, roles: ['admin', 'auditor'] },
  { path: '/governance-risks', label: 'Riscos TI', icon: AlertTriangle, roles: ['admin', 'auditor'] },
  { path: '/risks', label: 'Riscos', icon: AlertTriangle, roles: ['admin', 'auditor'] },
  { path: '/services', label: 'Servicos', icon: Server, roles: ['admin', 'auditor'] },
  { path: '/audit-logs', label: 'Logs', icon: ScrollText, roles: ['admin'] },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  auditor: 'Auditor',
  cliente: 'Cliente',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-teal-600 text-white',
  auditor: 'bg-amber-500 text-white',
  cliente: 'bg-slate-500 text-white',
};

export default function Layout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRole = profile?.role || 'cliente';
  const navItems = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
            <div className="p-2 bg-teal-600/20 rounded-lg">
              <Shield className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h1 className="font-bold text-white">Maturidade TI</h1>
              <p className="text-xs text-slate-400">Diagnostico</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map(item => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* User */}
          <div className="px-4 py-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || 'Usuario'}
                </p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[userRole]}`}>
                  {ROLE_LABELS[userRole]}
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            <span className="font-semibold text-slate-900">Maturidade TI</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
