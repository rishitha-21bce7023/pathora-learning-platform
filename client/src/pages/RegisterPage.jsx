import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const getDashboardPath = (role) => (role === 'admin' ? '/admin/dashboard' : '/dashboard');

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user, register, error } = useAuth();
  const [formData, setFormData] = useState(initialForm);
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

    if (formData.password !== formData.confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const authData = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate(getDashboardPath(authData.user.role));
    } catch (registerError) {
      setSubmitError(registerError.message || 'Unable to create an account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = submitError || error;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-cyan-950/30">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Create your account</p>
        <h1 className="mt-4 text-3xl font-bold">Register for Pathora</h1>
        <p className="mt-3 text-sm text-slate-300">
          Start your account with a secure JWT-based login flow.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">
              Full name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              placeholder="Jordan Lee"
            />
          </div>

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
              placeholder="Create a password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-200">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              placeholder="Confirm your password"
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
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default RegisterPage;
