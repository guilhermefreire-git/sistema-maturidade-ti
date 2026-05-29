import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Loader2, Zap } from 'lucide-react';
import { useAuth, TEST_USERS } from '../lib/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  }

  function handleQuickLogin(testUser: typeof TEST_USERS[0]) {
    setEmail(testUser.email);
    setPassword(testUser.password);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Branding Panel */}
      <div className="w-full lg:w-1/2 bg-slate-900 p-8 lg:p-12 flex flex-col justify-center items-center text-white">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-teal-600/20 rounded-2xl">
              <Shield className="w-16 h-16 text-teal-400" />
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">Diagnostico de Maturidade de TI</h1>
          <p className="text-slate-400 text-lg">
            Plataforma para avaliacao e diagnostico de maturidade de TI baseada em frameworks COBIT, ITIL e ISO 27000.
          </p>
        </div>
      </div>

      {/* Login Form */}
      <div className="w-full lg:w-1/2 p-8 lg:p-12 flex items-center justify-center bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Entrar</h2>
          <p className="text-slate-500 mb-6">Acesse sua conta para continuar</p>

          {/* Quick Login Buttons */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Login Rapido (Teste)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TEST_USERS.map(user => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleQuickLogin(user)}
                  className="px-3 py-2 text-xs font-medium bg-white border border-amber-200 rounded-lg hover:bg-amber-100 hover:border-amber-300 transition-colors text-amber-700"
                >
                  Entrar como {user.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-amber-600">
              Senha padrao: 123456
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Sua senha"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Entrar
            </button>
          </form>

          <p className="mt-6 text-center text-slate-500">
            Nao tem uma conta?{' '}
            <Link to="/register" className="text-teal-600 hover:text-teal-700 font-medium">
              Registre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
