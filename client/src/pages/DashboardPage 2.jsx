import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_COURSE_SLUG, fetchDashboardProgressSummary } from '../services/courseService.js';

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

const buildCalendarDays = (activityDates = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (34 - index));
    const key = date.toISOString().slice(0, 10);

    return {
      key,
      dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isActive: activityDates.includes(key),
    };
  });
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState({ overall: { currentStreak: 0, longestStreak: 0, completedTopics: 0, totalTopics: 0, progressPercent: 0, totalLearningMinutes: 0, activityDates: [] }, courses: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await fetchDashboardProgressSummary();

        if (!isMounted) {
          return;
        }

        setSummary(response);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load progress summary.');
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

  const activeCourse = summary.courses[0] || null;
  const calendarDays = useMemo(() => buildCalendarDays(summary.overall.activityDates), [summary.overall.activityDates]);

  const handleResumeLatestCourse = () => {
    if (activeCourse?.slug) {
      localStorage.setItem('pathora_selected_course', activeCourse.slug);
    } else {
      localStorage.setItem('pathora_selected_course', DEFAULT_COURSE_SLUG);
    }

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
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-200">
            Loading your learning insights...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {!isLoading && !error ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Active courses</p>
                <p className="mt-3 text-3xl font-bold text-white">{summary.courses.length}</p>
                <p className="mt-2 text-sm text-cyan-200">Across your learning paths</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Completed topics</p>
                <p className="mt-3 text-3xl font-bold text-white">{summary.overall.completedTopics}</p>
                <p className="mt-2 text-sm text-cyan-200">Keep the momentum going</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Current streak</p>
                <p className="mt-3 text-3xl font-bold text-white">{summary.overall.currentStreak} days</p>
                <p className="mt-2 text-sm text-cyan-200">{summary.overall.longestStreak} longest streak</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Course progress</p>
                <p className="mt-3 text-3xl font-bold text-white">{summary.overall.progressPercent}%</p>
                <p className="mt-2 text-sm text-cyan-200">{summary.overall.totalLearningMinutes} minutes learned</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-300">Today’s highlight</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Keep your streak alive</h2>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">Live</span>
                </div>
                <p className="mt-4 text-sm text-slate-300">
                  Finish one topic today to keep your streak growing and add to your daily learning minutes.
                </p>
                <div className="mt-5 h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${summary.overall.progressPercent}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-200">
                  {summary.overall.completedTopics} of {summary.overall.totalTopics || 0} tracked topics completed.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Quick actions</p>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={handleResumeLatestCourse}
                    className="w-full rounded-xl border border-cyan-400/50 bg-cyan-400/10 px-4 py-3 text-left text-sm font-semibold text-cyan-100"
                  >
                    Resume latest course
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/practice')}
                    className="w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-semibold text-slate-100"
                  >
                    Open practice set
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/roadmap')}
                    className="w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-semibold text-slate-100"
                  >
                    Review roadmap
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Course focus</p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {activeCourse ? activeCourse.title : 'No course activity yet'}
                </h2>
                <p className="mt-3 text-sm text-slate-300">
                  {activeCourse
                    ? `${activeCourse.completedTopics} of ${activeCourse.totalTopics} topics completed • ${activeCourse.progressPercent}% progress`
                    : 'Start a course to begin tracking your streak and weekly momentum.'}
                </p>
                <div className="mt-5 h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${activeCourse?.progressPercent || 0}%` }} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-300">Learning calendar</p>
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
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
