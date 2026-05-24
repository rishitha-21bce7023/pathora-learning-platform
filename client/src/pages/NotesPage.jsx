import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getAssetUrl } from '../services/api.js';
import { fetchPublishedCourses, fetchCourseRoadmapBySlug } from '../services/courseService.js';

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

const NotesPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadNotes = async () => {
      try {
        setIsLoading(true);
        setError('');
        const courses = await fetchPublishedCourses();

        const roadmaps = await Promise.all(
          courses.map(async (course) => {
            const roadmap = await fetchCourseRoadmapBySlug(course.slug);
            return { course, topics: roadmap.topics || [] };
          }),
        );

        if (!isMounted) {
          return;
        }

        const mergedNotes = roadmaps.flatMap(({ course, topics }) =>
          topics
            .filter((topic) => topic.notePdfUrl)
            .map((topic) => ({
              courseTitle: course.title,
              courseSlug: course.slug,
              dayNumber: topic.dayNumber,
              title: topic.title,
              description: topic.description,
              noteFileName: topic.noteFileName || 'Notes PDF',
              notePdfUrl: getAssetUrl(topic.notePdfUrl),
            })),
        );

        setNotes(mergedNotes);
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

  const noteCount = useMemo(() => notes.length, [notes]);

  return (
    <DashboardLayout
      user={user}
      title="Student"
      subtitle="Notes"
      navItems={studentNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Review your attached course notes' }}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-200">
            Loading notes...
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
              <p className="text-sm text-slate-300">Available notes</p>
              <p className="mt-3 text-3xl font-bold text-white">{noteCount}</p>
              <p className="mt-2 text-sm text-cyan-200">Attached PDFs across your published courses</p>
            </div>

            {notes.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {notes.map((note) => (
                  <div key={`${note.courseSlug}-${note.title}`} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm text-cyan-200">{note.courseTitle}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">Day {note.dayNumber}</p>
                    <h2 className="mt-3 text-lg font-semibold text-white">{note.title}</h2>
                    <p className="mt-3 text-sm text-slate-300">{note.description}</p>
                    <p className="mt-4 text-sm text-slate-200">{note.noteFileName}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={note.notePdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100"
                      >
                        Open
                      </a>
                      <a
                        href={note.notePdfUrl}
                        download
                        className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-5 text-sm text-slate-300">
                No notes are attached to your published courses yet. Ask your admin to upload a PDF for a topic.
              </div>
            )}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default NotesPage;
