import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getNoteFileName, getNotePdfUrl } from '../services/api.js';
import { DEFAULT_COURSE_SLUG, fetchCourseProgress, fetchCourseRoadmapBySlug, saveTopicProgress, unmarkTopicProgress } from '../services/courseService.js';

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

const STORAGE_KEY = 'pathora_selected_course';

const statusStyles = {
  completed: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100',
  pending: 'border-cyan-500/30 bg-slate-950 text-slate-100',
  locked: 'border-slate-700 bg-slate-900/70 text-slate-400',
};

const normalizePracticeLink = (link) => {
  if (typeof link === 'string') {
    return {
      title: link,
      url: link,
      platform: 'External',
      difficulty: 'mixed',
    };
  }

  return {
    title: link?.title || '',
    url: link?.url || '',
    platform: link?.platform || 'External',
    difficulty: link?.difficulty || 'mixed',
  };
};

const groupPracticeLinksByPlatform = (links) => {
  return (Array.isArray(links) ? links : [])
    .map(normalizePracticeLink)
    .filter((link) => link.title && link.url)
    .reduce((groups, link) => {
      const platform = link.platform || 'External';
      groups[platform] = [...(groups[platform] || []), link];
      return groups;
    }, {});
};

const RoadmapPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [courseSlug, setCourseSlug] = useState(DEFAULT_COURSE_SLUG);
  const [course, setCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [streakInfo, setStreakInfo] = useState({ currentStreak: 0, longestStreak: 0, totalLearningMinutes: 0 });
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const detailsRef = useRef(null);

  useEffect(() => {
    const storedSlug = localStorage.getItem(STORAGE_KEY);
    setCourseSlug(storedSlug || DEFAULT_COURSE_SLUG);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadRoadmap = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [roadmapResponse, progressResponse] = await Promise.all([
          fetchCourseRoadmapBySlug(courseSlug),
          fetchCourseProgress(courseSlug),
        ]);

        if (!isMounted) {
          return;
        }

        setCourse(roadmapResponse.course);
        setTopics(roadmapResponse.topics || []);
        setProgressMap(progressResponse.progress || {});
        setStreakInfo({
          currentStreak: progressResponse.currentStreak || 0,
          longestStreak: progressResponse.longestStreak || 0,
          totalLearningMinutes: progressResponse.totalLearningMinutes || 0,
        });
        setSelectedTopicId((current) => {
          const loadedTopics = roadmapResponse.topics || [];
          return loadedTopics.some((topic) => topic._id === current)
            ? current
            : loadedTopics[0]?._id || null;
        });
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load roadmap.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (courseSlug) {
      loadRoadmap();
    }

    return () => {
      isMounted = false;
    };
  }, [courseSlug]);

  const topicsWithStatus = useMemo(() => {
    if (!topics.length) {
      return [];
    }

    const firstIncompleteIndex = topics.findIndex((topic) => !progressMap[topic._id]);

    return topics.map((topic, index) => {
      if (progressMap[topic._id]) {
        return { ...topic, status: 'completed' };
      }

      if (firstIncompleteIndex !== -1 && index > firstIncompleteIndex) {
        return { ...topic, status: 'locked' };
      }

      return { ...topic, status: 'pending' };
    });
  }, [topics, progressMap]);

  const completedCount = topicsWithStatus.filter((topic) => topic.status === 'completed').length;
  const progressPercent = topicsWithStatus.length
    ? Math.round((completedCount / topicsWithStatus.length) * 100)
    : 0;

  const selectedTopic = topicsWithStatus.find((topic) => topic._id === selectedTopicId) || topicsWithStatus[0] || null;
  const selectedTopicNoteUrl = getNotePdfUrl(selectedTopic);
  const selectedTopicNoteFileName = getNoteFileName(selectedTopic);
  const practiceLinkGroups = selectedTopic ? groupPracticeLinksByPlatform(selectedTopic.practiceLinks) : {};
  const practicePlatforms = Object.keys(practiceLinkGroups).sort((left, right) => left.localeCompare(right));

  const handleSelectTopic = (topicId) => {
    setSelectedTopicId(topicId);
    window.setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleToggleTopic = async (topic) => {
    if (isSaving) {
      return;
    }

    if (topic.status === 'locked') {
      setError('Complete the previous topic before marking this one complete.');
      return;
    }

    try {
      setIsSaving(true);

      if (topic.status === 'completed') {
        const response = await unmarkTopicProgress(courseSlug, topic._id);
        setProgressMap((current) => ({
          ...current,
          [topic._id]: false,
        }));
        setStreakInfo({
          currentStreak: response.currentStreak || 0,
          longestStreak: response.longestStreak || 0,
          totalLearningMinutes: response.totalLearningMinutes || 0,
        });
        return;
      }

      const response = await saveTopicProgress(courseSlug, topic._id);
      setProgressMap((current) => ({
        ...current,
        [topic._id]: true,
      }));
      setStreakInfo({
        currentStreak: response.currentStreak || 0,
        longestStreak: response.longestStreak || 0,
        totalLearningMinutes: response.totalLearningMinutes || 0,
      });
    } catch (saveError) {
      setError(saveError.message || 'Unable to update progress.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      user={user}
      title="Student"
      subtitle="Roadmap"
      navItems={studentNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Stay on track and finish your next topic' }}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-200">
            Loading roadmap...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && course ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">{course.category}</p>
                <h1 className="mt-3 text-2xl font-bold text-white">{course.title}</h1>
                <p className="mt-3 max-w-3xl text-sm text-slate-300">{course.description}</p>
              </div>

              <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span>Course progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {completedCount} of {topicsWithStatus.length} topics completed
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && topicsWithStatus.length ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              {topicsWithStatus.map((topic) => {
                const isSelected = selectedTopicId === topic._id;

                return (
                  <button
                    key={topic._id}
                    type="button"
                    onClick={() => handleSelectTopic(topic._id)}
                    aria-controls="roadmap-topic-details"
                    className={`w-full rounded-2xl border p-4 text-left transition ${statusStyles[topic.status]} ${isSelected ? 'ring-2 ring-cyan-300' : ''}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-cyan-200">Day {topic.dayNumber}</p>
                        <h2 className="mt-2 text-lg font-semibold">{topic.title}</h2>
                      </div>
                      <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
                        {topic.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-200">{topic.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-200">{topic.estimatedMinutes} min</span>
                      <span className="rounded-lg border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-100">
                        View details
                      </span>
                    </div>
                    {topic.status === 'locked' ? (
                      <p className="mt-3 text-sm text-amber-200">Finish the previous topic to unlock this day.</p>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div
              id="roadmap-topic-details"
              ref={detailsRef}
              className="scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-950 p-5 lg:sticky lg:top-6 lg:self-start"
            >
              {selectedTopic ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Topic details</p>
                    <h2 className="mt-3 text-xl font-bold text-white">{selectedTopic.title}</h2>
                    <p className="mt-3 text-sm text-slate-300">{selectedTopic.description}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm text-slate-300">Estimated time</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedTopic.estimatedMinutes} minutes</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm text-slate-300">Lesson content</p>
                    {selectedTopic.content ? (
                      <div className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-100">
                        {selectedTopic.content}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-amber-200">Content is not available for this topic yet.</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm text-slate-300">Current status</p>
                    <p className="mt-2 text-sm font-semibold capitalize text-cyan-100">{selectedTopic.status}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {selectedTopic.status === 'completed'
                        ? 'You already finished this topic and it is saved to the backend.'
                        : selectedTopic.status === 'locked'
                          ? 'Unlock this topic by completing the previous day first.'
                          : 'This topic is ready for you to start and save your progress.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-300">Notes</p>
                        <p className="mt-2 text-sm text-slate-200">
                          {selectedTopicNoteUrl ? selectedTopicNoteFileName : 'No PDF notes uploaded yet'}
                        </p>
                      </div>
                      {selectedTopicNoteUrl ? (
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={selectedTopicNoteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100"
                          >
                            Open
                          </a>
                          <a
                            href={selectedTopicNoteUrl}
                            download={selectedTopicNoteFileName || true}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100"
                          >
                            Download
                          </a>
                        </div>
                      ) : null}
                    </div>
                    {!selectedTopicNoteUrl ? (
                      <p className="mt-3 text-sm text-amber-200">Notes are not available yet, or the saved PDF URL is invalid.</p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm text-slate-300">Practice links</p>
                    {practicePlatforms.length ? (
                      <div className="mt-4 space-y-4">
                        {practicePlatforms.map((platform) => (
                          <div key={platform}>
                            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-200">{platform}</p>
                            <div className="mt-2 space-y-2">
                              {practiceLinkGroups[platform].map((link, index) => (
                                <a
                                  key={`${platform}-${link.url}-${index}`}
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm transition hover:border-cyan-400/50"
                                >
                                  <span className="font-semibold text-white">{link.title}</span>
                                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold capitalize text-cyan-100">
                                    {link.difficulty}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-amber-200">Practice links are not available for this topic yet.</p>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-sm text-slate-300">Current streak</p>
                      <p className="mt-2 text-lg font-bold text-white">{streakInfo.currentStreak} days</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-sm text-slate-300">Longest streak</p>
                      <p className="mt-2 text-lg font-bold text-white">{streakInfo.longestStreak} days</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-sm text-slate-300">Learning minutes</p>
                      <p className="mt-2 text-lg font-bold text-white">{streakInfo.totalLearningMinutes} min</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleTopic(selectedTopic)}
                    disabled={isSaving || selectedTopic.status === 'locked'}
                    className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                  >
                    {isSaving
                      ? 'Saving...'
                      : selectedTopic.status === 'completed'
                        ? 'Mark as Incomplete'
                        : selectedTopic.status === 'locked'
                          ? 'Locked'
                          : 'Mark as Complete'}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-5 text-sm text-slate-300">
                  Select a topic to view its details.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default RoadmapPage;
