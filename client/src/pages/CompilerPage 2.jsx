import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const studentNav = [
  { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
  { label: 'Courses', path: '/courses', icon: '📚' },
  { label: 'Roadmap', path: '/roadmap', icon: '🗺️' },
  { label: 'Notes', path: '/notes', icon: '📝' },
  { label: 'Practice', path: '/practice', icon: '🎯' },
  { label: 'Compiler', path: '/compiler', icon: '💻' },
  { label: 'Profile', path: '/profile', icon: '👤' },
];

const CompilerPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <DashboardLayout
      user={user}
      title="Student"
      subtitle="Compiler"
      navItems={studentNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Run code and test ideas instantly' }}
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Live playground</p>
            <button className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Run</button>
          </div>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
            <p>// Write your code here</p>
            <p className="mt-2">const message = 'Pathora compiler';</p>
            <p>console.log(message);</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-sm text-slate-300">Result</p>
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Pathora compiler is ready for inline practice and quick experimentation.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompilerPage;
