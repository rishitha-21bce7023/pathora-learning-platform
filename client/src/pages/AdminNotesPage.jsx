import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getAssetUrl } from '../services/api.js';
import { fetchAdminCourseBySlug, fetchAdminCourses } from '../services/adminService.js';

const adminNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '🏠' },
  { label: 'Admin Courses', path: '/admin/courses', icon: '📚' },
  { label: 'Admin Notes', path: '/admin/notes', icon: '📝' },
  { label: 'Admin Quizzes', path: '/admin/challenges', icon: '⚡' },
];

const AdminNotesPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [courseNotes, setCourseNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      try {
        setIsLoading(true);
        setError('');
        const courses = await fetchAdminCourses();
        const details = await Promise.all(
          courses.map(async (course) => {
            const response = await fetchAdminCourseBySlug(course.slug);
            return {
              course: response.course,
              topics: response.topics || [],
            };
          }),
        );

        if (isMounted) {
          setCourseNotes(details);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load notes.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadNotes();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout
      user={user}
      title="Admin"
      subtitle="Admin Notes"
      navItems={adminNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Review topic PDFs and upload status' }}
    >
      <div className="space-y-5">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-200">
            Loading topic notes...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {!isLoading && !error ? (
          <>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-300">Notes library</p>
              <h2 className="mt-2 text-xl font-semibold text-white">PDF notes attached to topics</h2>
              <p className="mt-2 text-sm text-slate-300">
                Uploads and replacements are managed from Admin Courses on each topic.
              </p>
            </div>

            {courseNotes.map(({ course, topics }) => (
              <div key={course._id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">{course.category}</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{course.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/courses')}
                    className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100"
                  >
                    Manage uploads
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {topics.map((topic) => {
                    const notePdfUrl = getAssetUrl(topic.notePdfUrl);

                    return (
                      <div
                        key={topic._id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4"
                      >
                        <div>
                          <p className="text-sm text-cyan-200">Day {topic.dayNumber}</p>
                          <p className="mt-1 font-semibold text-white">{topic.title}</p>
                          <p className="mt-2 text-sm text-slate-300">{topic.noteFileName || 'No PDF uploaded'}</p>
                        </div>
                        {notePdfUrl ? (
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={notePdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100"
                            >
                              Open
                            </a>
                            <a
                              href={notePdfUrl}
                              download={topic.noteFileName || true}
                              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100"
                            >
                              Download
                            </a>
                          </div>
                        ) : (
                          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-200">
                            Notes unavailable
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {!topics.length ? (
                    <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-300">
                      No topics are available for this course yet.
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {!courseNotes.length ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-5 text-sm text-slate-300">
                No courses are available yet.
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default AdminNotesPage;
