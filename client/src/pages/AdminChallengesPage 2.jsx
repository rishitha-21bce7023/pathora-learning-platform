import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const adminNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '🏠' },
  { label: 'Admin Courses', path: '/admin/courses', icon: '📚' },
  { label: 'Admin Notes', path: '/admin/notes', icon: '📝' },
  { label: 'Admin Challenges', path: '/admin/challenges', icon: '⚡' },
];

const challenges = [
  { title: 'React state builder', status: 'Published' },
  { title: 'API error handling sprint', status: 'Draft' },
  { title: 'JavaScript debugging lab', status: 'Review' },
];

const AdminChallengesPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <DashboardLayout
      user={user}
      title="Admin"
      subtitle="Admin Challenges"
      navItems={adminNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Launch and manage challenge content' }}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {challenges.map((challenge) => (
          <div key={challenge.title} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-lg font-semibold text-white">{challenge.title}</p>
            <p className="mt-3 text-sm text-slate-300">Status: {challenge.status}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminChallengesPage;
