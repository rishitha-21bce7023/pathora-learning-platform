import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchDashboardProgressSummary } from '../services/courseService.js';
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
  leaderboard: [],
  quizTrend: [],
  weeklyActivity: [],
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(fallbackSummary);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        const response = await fetchDashboardProgressSummary();
        if (isMounted) {
          setSummary(response || fallbackSummary);
        }
      } catch (_error) {
        if (isMounted) {
          setSummary(fallbackSummary);
        }
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const gamification = useMemo(() => buildGamificationProfile(summary, user), [summary, user]);
  const unlockedBadges = gamification.badges.filter((badge) => badge.unlocked);
  const lockedBadges = gamification.badges.filter((badge) => !badge.unlocked);

  return (
    <DashboardLayout
      user={user}
      title="Student"
      subtitle="Profile"
      navItems={studentNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Review your rank, XP, and achievements' }}
    >
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-300">Account details</p>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <p><span className="text-slate-400">Name:</span> {user?.name}</p>
              <p><span className="text-slate-400">Email:</span> {user?.email}</p>
              <p><span className="text-slate-400">Role:</span> {user?.role}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-300">Gamification profile</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 p-4">
                <p className="text-sm text-cyan-100">XP</p>
                <p className="mt-2 text-3xl font-bold text-white">{gamification.xp}</p>
              </div>
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                <p className="text-sm text-emerald-100">Rank</p>
                <p className="mt-2 text-3xl font-bold text-white">{gamification.rank}</p>
              </div>
              <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-100">Badges</p>
                <p className="mt-2 text-3xl font-bold text-white">{unlockedBadges.length}/{gamification.badges.length}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>{gamification.weeklyGoal.title}</span>
                <span>{gamification.weeklyGoal.completed}/{gamification.weeklyGoal.target}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${(gamification.weeklyGoal.completed / gamification.weeklyGoal.target) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-300">Unlocked badges</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {unlockedBadges.map((badge) => (
                <div key={badge.key} className="rounded-xl border border-cyan-400/50 bg-cyan-500/10 p-4">
                  <p className="font-semibold text-white">{badge.label}</p>
                  <p className="mt-2 text-sm text-slate-300">{badge.requirement}</p>
                </div>
              ))}
              {!unlockedBadges.length ? (
                <p className="text-sm text-slate-300">No badges unlocked yet.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm text-slate-300">Next badges</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {lockedBadges.map((badge) => (
                <div key={badge.key} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="font-semibold text-white">{badge.label}</p>
                  <p className="mt-2 text-sm text-slate-300">{badge.requirement}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-sm text-slate-300">Leaderboard</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {gamification.leaderboard.length ? (
              gamification.leaderboard.map((learner, index) => (
                <div key={`${learner.name}-${index}`} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-sm text-cyan-200">#{index + 1}</p>
                  <p className="mt-2 font-semibold text-white">{learner.name}</p>
                  <p className="mt-2 text-sm text-slate-300">{learner.rank}</p>
                  <p className="mt-1 text-sm text-slate-400">{learner.completedTopics || 0} topics</p>
                  <p className="mt-2 text-sm font-semibold text-cyan-100">{learner.xp} XP</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900 p-4 text-sm text-slate-400 md:col-span-2 xl:col-span-5">
                Complete a topic to appear on the leaderboard.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
