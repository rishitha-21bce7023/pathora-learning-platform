import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_COURSE_SLUG, fetchPublishedCourses } from '../services/courseService.js';

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

const CoursesPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        setIsLoading(true);
        setError('');
        const publishedCourses = await fetchPublishedCourses();

        if (isMounted) {
          setCourses(publishedCourses);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load courses.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedCourses = useMemo(() => {
    return [...courses].sort((left, right) => {
      const leftPriority = left.slug === DEFAULT_COURSE_SLUG ? 0 : 1;
      const rightPriority = right.slug === DEFAULT_COURSE_SLUG ? 0 : 1;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return left.title.localeCompare(right.title);
    });
  }, [courses]);

  const handleOpenRoadmap = (slug) => {
    localStorage.setItem('pathora_selected_course', slug);
    navigate('/roadmap');
  };

  return (
    <DashboardLayout
      user={user}
      title="Student"
      subtitle="Courses"
      navItems={studentNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Pick a course and continue your path' }}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-950 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Available learning paths</p>
          <h1 className="mt-3 text-2xl font-bold text-white">Browse all published courses</h1>
          <p className="mt-2 text-sm text-slate-300">
            Python Learning Path is highlighted by default and opens the roadmap view when you select it.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-200">
            Loading published courses...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {!isLoading && !error ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedCourses.map((course) => (
              <div key={course._id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">{course.category}</p>
                    <h2 className="mt-2 text-lg font-semibold text-white">{course.title}</h2>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-100 capitalize">
                    {course.level}
                  </span>
                </div>

                <p className="mt-4 text-sm text-slate-300">{course.description}</p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-100">
                    {course.slug === DEFAULT_COURSE_SLUG ? 'Default course' : 'Published'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenRoadmap(course.slug)}
                    className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/10"
                  >
                    Open roadmap
                  </button>
                </div>
              </div>
            ))}

            {!sortedCourses.length ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-5 text-sm text-slate-300">
                No published courses are available yet.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage;
