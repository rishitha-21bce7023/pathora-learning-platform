import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
import { DEFAULT_COURSE_SLUG, fetchDashboardProgressSummary } from '../services/courseService.js';
import { buildGamificationProfile } from '../utils/gamification.js';

const studentNav = [
  { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
  { label: 'Courses', path: '/courses', icon: '📚' },
  { label: 'Roadmap', path: '/roadmap', icon: '🗺️' },
  { label: 'Notes', path: '/notes', icon: '📝' },
  { label: 'Practice', path: '/practice', icon: '🎯' },
  { label: 'Challenges', path: '/challenges', icon: '⚡' },
  { label: 'Compiler', path: '/compiler', icon: '💻' },
  { label: 'Profile', path: '/profile', icon: '👤' },
];

const fallbackSummary = {
  overall: {
    currentStreak: 0,
    longestStreak: 0,
    completedTopics: 0,
    totalTopics: 0,
    progressPercent: 0,
    totalLearningMinutes: 0,
    activityDates: [],
    weeklyActiveDays: 0,
    averageQuizScore: 0,
    solvedChallenges: 0,
    xp: 0,
    rank: 'Bronze',
  },
  courses: [],
  weeklyActivity: [],
  quizTrend: [],
  leaderboard: [],
};

const chartText = { fill: '#cbd5e1', fontSize: 12 };
const chartGrid = '#1e293b';
const pieColors = ['#34d399', '#fbbf24'];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildCalendarDays = (activityDates = []) => {
  const activitySet = new Set(activityDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (34 - index));
    const key = toDateKey(date);

    return {
      key,
      dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isActive: activitySet.has(key),
    };
  });
};

const buildWeeklyActivity = (weeklyActivity = []) => {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const byDay = new Map((weeklyActivity || []).map((item) => [item.day, item]));
  return labels.map((day) => byDay.get(day) || { day, minutes: 0 });
};

const ChartCard = ({ title, children, className = '', isEmpty = false, emptyText = 'No activity yet.' }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-950 p-5 ${className}`}>
    <p className="text-sm text-slate-300">{title}</p>
    <div className="mt-4 h-64">
      {isEmpty ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900 text-sm text-slate-400">
          {emptyText}
        </div>
      ) : children}
    </div>
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(fallbackSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await fetchDashboardProgressSummary();

        if (isMounted) {
          setSummary(response || fallbackSummary);
        }
      } catch (loadError) {
        if (isMounted) {
          setSummary(fallbackSummary);
          setError(loadError.message || 'Unable to load dashboard data.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCourse = summary.courses.find((course) => course.completedTopics < course.totalTopics) || summary.courses[0] || null;
  const calendarDays = useMemo(() => buildCalendarDays(summary.overall.activityDates), [summary.overall.activityDates]);
  const weeklyActivity = useMemo(() => buildWeeklyActivity(summary.weeklyActivity), [summary.weeklyActivity]);
  const gamification = useMemo(() => buildGamificationProfile(summary, user), [summary, user]);
  const courseCompletionData = summary.courses;
  const topicPieData = [
    { name: 'Completed', value: summary.overall.completedTopics || 0 },
    {
      name: 'Pending',
      value: Math.max(0, (summary.overall.totalTopics || 0) - (summary.overall.completedTopics || 0)),
    },
  ];
  const quizTrendData = summary.quizTrend || [];

  const handleResumeLatestCourse = () => {
    localStorage.setItem('pathora_selected_course', activeCourse?.slug || DEFAULT_COURSE_SLUG);
    navigate('/roadmap');
  };

  return (
    <DashboardLayout
      user={user}
      title="Student"
      subtitle="Your Pathora dashboard"
      navItems={studentNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Focus on your next milestone' }}
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="text-sm text-slate-300">XP points</p>
                <p className="mt-3 text-3xl font-bold text-white">{gamification.xp}</p>
                <p className="mt-2 text-sm text-emerald-100">✨ {gamification.rank} rank</p>
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
                <p className="text-sm text-slate-300">Completed topics</p>
                <p className="mt-3 text-3xl font-bold text-white">{summary.overall.completedTopics}</p>
                <p className="mt-2 text-sm text-amber-100">🌿 {summary.overall.progressPercent}% complete</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Current streak</p>
                <p className="mt-3 text-3xl font-bold text-white">{summary.overall.currentStreak} days</p>
                <p className="mt-2 text-sm text-emerald-200">🔥 {summary.overall.longestStreak} longest streak</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Weekly goal</p>
                <p className="mt-3 text-3xl font-bold text-white">{gamification.weeklyGoal.completed}/{gamification.weeklyGoal.target}</p>
                <p className="mt-2 text-sm text-amber-100">⭐ +{gamification.weeklyGoal.reward} XP reward</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Achievement unlocked</p>
                  <h2 className="mt-2 text-xl font-bold text-white">{gamification.achievement}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="rounded-lg border border-emerald-300/50 px-4 py-2 text-sm font-semibold text-emerald-100"
                >
                  View badges
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Course completion percentage" isEmpty={!courseCompletionData.length} emptyText="No published courses yet.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseCompletionData}>
                    <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" />
                    <XAxis dataKey="title" tick={chartText} interval={0} tickFormatter={(value) => value.split(' ')[0]} />
                    <YAxis tick={chartText} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                    <Bar dataKey="progressPercent" fill="#34d399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Completed vs pending topics" isEmpty={!summary.overall.totalTopics} emptyText="No published topics yet.">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topicPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                      {topicPieData.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Weekly learning activity" isEmpty={!weeklyActivity.some((item) => item.minutes)} emptyText="Complete a topic to start weekly activity.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={chartText} />
                    <YAxis tick={chartText} />
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                    <Bar dataKey="minutes" fill="#34d399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Quiz score trend" isEmpty={!quizTrendData.length} emptyText="Submit a quiz to see your score trend.">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={quizTrendData}>
                    <CartesianGrid stroke={chartGrid} strokeDasharray="3 3" />
                    <XAxis dataKey="quiz" tick={chartText} />
                    <YAxis tick={chartText} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                    <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b' }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Streak calendar</p>
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => (
                    <div key={day.key} className="text-center">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">{day.dayLabel}</p>
                      <div
                        className={`mt-2 rounded-xl border px-2 py-3 text-xs ${
                          day.isActive
                            ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-100'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                        title={day.dateLabel}
                      >
                        {day.dateLabel.split(' ')[1]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Daily challenge</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{gamification.dailyChallenge.title}</h2>
                <div className="mt-4 h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${gamification.dailyChallenge.progress}%` }} />
                </div>
                <p className="mt-3 text-sm text-amber-100">Reward: +{gamification.dailyChallenge.reward} XP</p>
                <div className="mt-5 space-y-3">
                  <button type="button" onClick={handleResumeLatestCourse} disabled={!activeCourse} className="w-full rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-left text-sm font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-400">
                    {activeCourse ? 'Resume latest course' : 'No course to resume yet'}
                  </button>
                  <button type="button" onClick={() => navigate('/challenges')} className="w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-semibold text-slate-100">
                    Solve coding challenge
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Badges</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {gamification.badges.map((badge) => (
                    <div key={badge.key} className={`rounded-xl border p-4 ${badge.unlocked ? 'border-amber-300/50 bg-amber-300/10' : 'border-slate-800 bg-slate-900'}`}>
                      <p className="font-semibold text-white">{badge.label}</p>
                      <p className="mt-2 text-sm text-slate-300">{badge.requirement}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Leaderboard</p>
                <div className="mt-4 space-y-3">
                  {gamification.leaderboard.length ? (
                    gamification.leaderboard.map((learner, index) => (
                      <div key={`${learner.name}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                        <div>
                          <p className="font-semibold text-white">#{index + 1} {learner.name}</p>
                          <p className="text-sm text-slate-300">{learner.rank} · {learner.completedTopics || 0} topics</p>
                        </div>
                        <p className="text-sm font-semibold text-emerald-100">{learner.xp} XP</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
                      Complete a topic to appear on the leaderboard.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
