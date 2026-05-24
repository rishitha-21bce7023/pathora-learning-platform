import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchAdminCourses, fetchAdminUsers } from '../services/adminService.js';

const adminNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '🏠' },
  { label: 'Admin Courses', path: '/admin/courses', icon: '📚' },
  { label: 'Admin Notes', path: '/admin/notes', icon: '📝' },
  { label: 'Admin Quizzes', path: '/admin/challenges', icon: '⚡' },
];

const fallbackUsers = [
  { id: 'u1', name: 'Aarav Kumar', email: 'aarav@pathora.local', totalLearningMinutes: 620, completedTopics: 18, currentStreak: 7 },
  { id: 'u2', name: 'Maya Iyer', email: 'maya@pathora.local', totalLearningMinutes: 510, completedTopics: 15, currentStreak: 5 },
  { id: 'u3', name: 'Dev Sharma', email: 'dev@pathora.local', totalLearningMinutes: 430, completedTopics: 12, currentStreak: 3 },
];

const fallbackCourses = [
  { _id: 'c1', title: 'Python Learning Path', isPublished: true },
  { _id: 'c2', title: 'Data Practice', isPublished: true },
  { _id: 'c3', title: 'Interview Prep', isPublished: false },
];

const chartText = { fill: '#cbd5e1', fontSize: 12 };
const chartGrid = '#1e293b';

const ChartCard = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
    <p className="text-sm text-slate-300">{title}</p>
    <div className="mt-4 h-64">{children}</div>
  </div>
);

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [adminUsers, adminCourses] = await Promise.all([fetchAdminUsers(), fetchAdminCourses()]);

        if (isMounted) {
          setUsers(adminUsers.length ? adminUsers : fallbackUsers);
          setCourses(adminCourses.length ? adminCourses : fallbackCourses);
        }
      } catch (loadError) {
        if (isMounted) {
          setUsers(fallbackUsers);
          setCourses(fallbackCourses);
          setError(loadError.message || 'Using fallback admin analytics.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalMinutes = users.reduce((sum, learner) => sum + (learner.totalLearningMinutes || 0), 0);
    const totalCompleted = users.reduce((sum, learner) => sum + (learner.completedTopics || 0), 0);

    return [
      { label: 'Total users', value: users.length.toString(), hint: 'Learners tracked' },
      { label: 'Total courses', value: courses.length.toString(), hint: 'Created paths' },
      { label: 'Published courses', value: courses.filter((course) => course.isPublished).length.toString(), hint: 'Visible to students' },
      { label: 'Completed topics', value: totalCompleted.toString(), hint: 'Across learners' },
      { label: 'Learning minutes', value: totalMinutes.toString(), hint: 'Total activity' },
    ];
  }, [courses, users]);

  const topLearners = useMemo(() => [...users].sort((a, b) => (b.totalLearningMinutes || 0) - (a.totalLearningMinutes || 0)).slice(0, 5), [users]);
  const courseCompletion = useMemo(() => courses.map((course, index) => ({
    title: course.title,
    completions: Math.max(4, (courses.length - index) * 7),
  })), [courses]);
  const topicAnalytics = [
    { topic: 'Basics', completed: 34, pending: 12 },
    { topic: 'Loops', completed: 24, pending: 18 },
    { topic: 'Functions', completed: 19, pending: 21 },
    { topic: 'OOP', completed: 12, pending: 27 },
  ];
  const userCourseData = [
    { name: 'Users', value: users.length },
    { name: 'Courses', value: courses.length },
  ];

  return (
    <DashboardLayout
      user={user}
      title="Admin"
      subtitle="Command center"
      navItems={adminNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Review learner progress and publish updates' }}
    >
      <div className="space-y-6">
        {isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            {error}
          </div>
        ) : null}

        {!isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-300">{item.label}</p>
                  <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-cyan-200">{item.hint}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Total users vs total courses">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userCourseData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                      <Cell fill="#22d3ee" />
                      <Cell fill="#34d399" />
                    </Pie>
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Most completed courses">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseCompletion}>
                    <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" />
                    <XAxis dataKey="title" tick={chartText} tickFormatter={(value) => value.split(' ')[0]} />
                    <YAxis tick={chartText} />
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                    <Bar dataKey="completions" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Most active students">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topLearners}>
                    <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={chartText} tickFormatter={(value) => value.split(' ')[0]} />
                    <YAxis tick={chartText} />
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                    <Bar dataKey="totalLearningMinutes" fill="#34d399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Topic completion analytics">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicAnalytics}>
                    <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" />
                    <XAxis dataKey="topic" tick={chartText} />
                    <YAxis tick={chartText} />
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                    <Bar dataKey="completed" stackId="topics" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="pending" stackId="topics" fill="#475569" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Leaderboard snapshot</p>
                <div className="mt-4 space-y-3">
                  {topLearners.map((learner, index) => (
                    <div key={learner.id || learner.email} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                      <div>
                        <p className="font-semibold text-white">#{index + 1} {learner.name}</p>
                        <p className="text-sm text-slate-300">{learner.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-cyan-100">{learner.totalLearningMinutes || 0} min</p>
                        <p className="text-xs text-slate-400">{learner.currentStreak || 0} day streak</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Quick actions</p>
                <div className="mt-4 space-y-3">
                  <button type="button" onClick={() => navigate('/admin/courses')} className="w-full rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-left text-sm font-semibold text-cyan-100">
                    Manage course content
                  </button>
                  <button type="button" onClick={() => navigate('/admin/notes')} className="w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-semibold text-slate-100">
                    Review notes queue
                  </button>
                  <button type="button" onClick={() => navigate('/admin/challenges')} className="w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-semibold text-slate-100">
                    Create quiz or challenge
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
