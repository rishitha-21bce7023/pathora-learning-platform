import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const getDashboardPath = (role) => (role === 'admin' ? '/admin/dashboard' : '/dashboard');

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, login, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [navigate, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    try {
      setIsSubmitting(true);
      const authData = await login(formData);
      navigate(getDashboardPath(authData.user.role));
    } catch (loginError) {
      setSubmitError(loginError.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = submitError || error;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-cyan-950/30">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Welcome back</p>
        <h1 className="mt-4 text-3xl font-bold">Login to Pathora</h1>
        <p className="mt-3 text-sm text-slate-300">
          Access your dashboard and continue your learning journey.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              placeholder="Enter your password"
            />
          </div>

          {displayError ? (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {displayError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          New here?{' '}
          <Link to="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
