import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getNoteFileName, getNotePdfUrl } from '../services/api.js';
import { createCourse, createTopic, deleteCourse, deleteTopicNotes, fetchAdminCourseBySlug, fetchAdminCourses, updateCourse, updateTopic, uploadTopicNotes } from '../services/adminService.js';

const adminNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '🏠' },
  { label: 'Admin Courses', path: '/admin/courses', icon: '📚' },
  { label: 'Admin Notes', path: '/admin/notes', icon: '📝' },
  { label: 'Admin Quizzes', path: '/admin/challenges', icon: '⚡' },
];

const emptyNewTopic = {
  dayNumber: 1,
  title: '',
  description: '',
  content: '',
  estimatedMinutes: 30,
  order: 1,
  practiceLinks: [],
  isActive: true,
};

const emptyCourseForm = {
  title: '',
  slug: '',
  description: '',
  category: 'Programming',
  level: 'beginner',
  thumbnail: '',
  isPublished: false,
};

const emptyPracticeLink = {
  title: '',
  url: '',
  platform: '',
  difficulty: 'beginner',
};

const maxNoteFileSize = 10 * 1024 * 1024;

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
    platform: link?.platform || '',
    difficulty: link?.difficulty || 'beginner',
  };
};

const normalizePracticeLinks = (links) => {
  return Array.isArray(links) ? links.map(normalizePracticeLink) : [];
};

const topicToDraft = (topic) => ({
  dayNumber: topic.dayNumber,
  title: topic.title,
  description: topic.description,
  content: topic.content,
  estimatedMinutes: topic.estimatedMinutes,
  order: topic.order,
  practiceLinks: normalizePracticeLinks(topic.practiceLinks),
  isActive: topic.isActive,
});

const cleanPracticeLinks = (links) => {
  return normalizePracticeLinks(links)
    .map((link) => ({
      title: link.title.trim(),
      url: link.url.trim(),
      platform: link.platform.trim(),
      difficulty: link.difficulty || 'beginner',
    }))
    .filter((link) => link.title && link.url && link.platform);
};

const AdminCoursesPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category: '', level: 'beginner', isPublished: false, slug: '' });
  const [newCourseForm, setNewCourseForm] = useState(emptyCourseForm);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [topicDrafts, setTopicDrafts] = useState({});
  const [newTopic, setNewTopic] = useState(emptyNewTopic);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        setIsLoading(true);
        setError('');
        const adminCoursesData = await fetchAdminCourses();

        if (!isMounted) {
          return;
        }

        setCourses(adminCoursesData);
        if (!selectedCourseId && adminCoursesData[0]?._id) {
          setSelectedCourseId(adminCoursesData[0]._id);
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
  }, [selectedCourseId]);

  useEffect(() => {
    let isMounted = true;

    const loadSelectedCourse = async () => {
      if (!selectedCourseId) {
        return;
      }

      try {
        const courseResponse = await fetchAdminCourseBySlug(courses.find((course) => course._id === selectedCourseId)?.slug || '');

        if (!isMounted) {
          return;
        }

        setSelectedCourse(courseResponse.course);
        setTopics(courseResponse.topics || []);
        setCourseForm({
          title: courseResponse.course.title,
          description: courseResponse.course.description,
          category: courseResponse.course.category,
          level: courseResponse.course.level,
          isPublished: courseResponse.course.isPublished,
          slug: courseResponse.course.slug,
        });
        setTopicDrafts(
          (courseResponse.topics || []).reduce((accumulator, topic) => {
            accumulator[topic._id] = topicToDraft(topic);
            return accumulator;
          }, {}),
        );
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load selected course.');
        }
      }
    };

    loadSelectedCourse();

    return () => {
      isMounted = false;
    };
  }, [courses, selectedCourseId]);

  const selectedCourseMeta = useMemo(() => {
    return courses.find((course) => course._id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  const refreshSelectedCourse = async () => {
    if (!selectedCourseMeta?.slug) {
      return;
    }

    const courseResponse = await fetchAdminCourseBySlug(selectedCourseMeta.slug);
    setSelectedCourse(courseResponse.course);
    setTopics(courseResponse.topics || []);
    setTopicDrafts(
      (courseResponse.topics || []).reduce((accumulator, topic) => {
        accumulator[topic._id] = topicToDraft(topic);
        return accumulator;
      }, {}),
    );
  };

  const handleCourseSave = async () => {
    if (!selectedCourse) {
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const updatedCourse = await updateCourse(selectedCourse._id, courseForm);
      setSelectedCourse(updatedCourse);
      setCourses((current) => current.map((course) => (course._id === updatedCourse._id ? updatedCourse : course)));
      showToast('Course updated successfully.');
    } catch (loadError) {
      setError(loadError.message || 'Unable to update course.');
      showToast(loadError.message || 'Unable to update course.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTopicSave = async (topicId) => {
    const draft = topicDrafts[topicId];

    if (!draft) {
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await updateTopic(topicId, {
        dayNumber: Number(draft.dayNumber),
        title: draft.title,
        description: draft.description,
        content: draft.content,
        estimatedMinutes: Number(draft.estimatedMinutes),
        order: Number(draft.order),
        practiceLinks: cleanPracticeLinks(draft.practiceLinks),
        isActive: draft.isActive,
      });
      await refreshSelectedCourse();
      showToast('Topic updated successfully.');
    } catch (loadError) {
      setError(loadError.message || 'Unable to update topic.');
      showToast(loadError.message || 'Unable to update topic.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadNotes = async (topicId, file) => {
    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed.');
      return;
    }

    if (file.size > maxNoteFileSize) {
      setError('PDF notes must be 10MB or smaller.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await uploadTopicNotes(topicId, file);
      await refreshSelectedCourse();
      showToast('Notes uploaded successfully.');
    } catch (loadError) {
      setError(loadError.message || 'Unable to upload notes.');
      showToast(loadError.message || 'Unable to upload notes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNotes = async (topic) => {
    const noteName = getNoteFileName(topic);
    const confirmed = window.confirm(`Delete "${noteName}" from this topic?`);

    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await deleteTopicNotes(topic._id);
      await refreshSelectedCourse();
      showToast('Notes deleted successfully.');
    } catch (loadError) {
      setError(loadError.message || 'Unable to delete notes.');
      showToast(loadError.message || 'Unable to delete notes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!selectedCourse) {
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await createTopic(selectedCourse._id, {
        dayNumber: Number(newTopic.dayNumber),
        title: newTopic.title,
        description: newTopic.description,
        content: newTopic.content,
        estimatedMinutes: Number(newTopic.estimatedMinutes),
        order: Number(newTopic.order),
        practiceLinks: cleanPracticeLinks(newTopic.practiceLinks),
        isActive: newTopic.isActive,
      });
      await refreshSelectedCourse();
      setNewTopic(emptyNewTopic);
      showToast('Topic created successfully.');
    } catch (loadError) {
      setError(loadError.message || 'Unable to create topic.');
      showToast(loadError.message || 'Unable to create topic.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      setIsSaving(true);
      setError('');
      const createdCourse = await createCourse(newCourseForm);
      setCourses((current) => [createdCourse, ...current]);
      setSelectedCourseId(createdCourse._id);
      setNewCourseForm(emptyCourseForm);
      setShowCourseModal(false);
      showToast('Course created successfully.');
    } catch (loadError) {
      setError(loadError.message || 'Unable to create course.');
      showToast(loadError.message || 'Unable to create course.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) {
      return;
    }

    const confirmed = window.confirm(`Delete "${selectedCourse.title}" and all its topics, notes, quizzes, and challenges?`);

    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await deleteCourse(selectedCourse._id);
      const nextCourses = courses.filter((course) => course._id !== selectedCourse._id);
      setCourses(nextCourses);
      setSelectedCourseId(nextCourses[0]?._id || '');
      setSelectedCourse(null);
      setTopics([]);
      showToast('Course deleted successfully.');
    } catch (loadError) {
      setError(loadError.message || 'Unable to delete course.');
      showToast(loadError.message || 'Unable to delete course.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateTopicPracticeLink = (topicId, linkIndex, field, value) => {
    setTopicDrafts((current) => {
      const draft = current[topicId] || {};
      const links = normalizePracticeLinks(draft.practiceLinks);
      links[linkIndex] = {
        ...(links[linkIndex] || emptyPracticeLink),
        [field]: value,
      };

      return {
        ...current,
        [topicId]: {
          ...draft,
          practiceLinks: links,
        },
      };
    });
  };

  const addTopicPracticeLink = (topicId) => {
    setTopicDrafts((current) => {
      const draft = current[topicId] || {};

      return {
        ...current,
        [topicId]: {
          ...draft,
          practiceLinks: [...normalizePracticeLinks(draft.practiceLinks), { ...emptyPracticeLink }],
        },
      };
    });
  };

  const removeTopicPracticeLink = (topicId, linkIndex) => {
    setTopicDrafts((current) => {
      const draft = current[topicId] || {};

      return {
        ...current,
        [topicId]: {
          ...draft,
          practiceLinks: normalizePracticeLinks(draft.practiceLinks).filter((_link, index) => index !== linkIndex),
        },
      };
    });
  };

  const updateNewTopicPracticeLink = (linkIndex, field, value) => {
    setNewTopic((current) => {
      const links = normalizePracticeLinks(current.practiceLinks);
      links[linkIndex] = {
        ...(links[linkIndex] || emptyPracticeLink),
        [field]: value,
      };

      return {
        ...current,
        practiceLinks: links,
      };
    });
  };

  const addNewTopicPracticeLink = () => {
    setNewTopic((current) => ({
      ...current,
      practiceLinks: [...normalizePracticeLinks(current.practiceLinks), { ...emptyPracticeLink }],
    }));
  };

  const removeNewTopicPracticeLink = (linkIndex) => {
    setNewTopic((current) => ({
      ...current,
      practiceLinks: normalizePracticeLinks(current.practiceLinks).filter((_link, index) => index !== linkIndex),
    }));
  };

  return (
    <DashboardLayout
      user={user}
      title="Admin"
      subtitle="Admin Courses"
      navItems={adminNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Manage content and learner access' }}
    >
      <div className="space-y-6">
        {isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {!isLoading && !error ? (
          <>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-300">Course management</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Edit published curriculum</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(true)}
                    className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
                  >
                    Create course
                  </button>
                  {courses.map((course) => (
                    <button
                      key={course._id}
                      type="button"
                      onClick={() => setSelectedCourseId(course._id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        selectedCourseId === course._id ? 'bg-cyan-400 text-slate-950' : 'border border-slate-700 text-slate-100'
                      }`}
                    >
                      {course.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!courses.length ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-6 text-sm text-slate-300">
                No courses yet. Create your first course to start building roadmaps, notes, quizzes, and challenges.
              </div>
            ) : null}

            {selectedCourse ? (
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-300">Course details</p>
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm text-slate-200">
                      Title
                      <input
                        value={courseForm.title}
                        onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="block text-sm text-slate-200">
                      Slug
                      <input
                        value={courseForm.slug}
                        onChange={(event) => setCourseForm((current) => ({ ...current, slug: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="block text-sm text-slate-200">
                      Category
                      <input
                        value={courseForm.category}
                        onChange={(event) => setCourseForm((current) => ({ ...current, category: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="block text-sm text-slate-200">
                      Level
                      <select
                        value={courseForm.level}
                        onChange={(event) => setCourseForm((current) => ({ ...current, level: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </label>
                    <label className="block text-sm text-slate-200">
                      Description
                      <textarea
                        rows={4}
                        value={courseForm.description}
                        onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={courseForm.isPublished}
                        onChange={(event) => setCourseForm((current) => ({ ...current, isPublished: event.target.checked }))}
                      />
                      Published
                    </label>
                    <button
                      type="button"
                      onClick={handleCourseSave}
                      disabled={isSaving}
                      className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                    >
                      {isSaving ? 'Saving...' : 'Save course'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteCourse}
                      disabled={isSaving}
                      className="w-full rounded-lg border border-rose-400/50 px-4 py-3 font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete course
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm text-slate-300">Topics</p>
                    <div className="mt-4 space-y-4">
                      {topics.map((topic) => {
                        const draft = topicDrafts[topic._id] || {};
                        const notePdfUrl = getNotePdfUrl(topic);
                        const noteFileName = getNoteFileName(topic);

                        return (
                          <div key={topic._id} className="rounded-xl border border-slate-800 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm text-cyan-200">Day {topic.dayNumber}</p>
                                <h3 className="mt-1 text-lg font-semibold text-white">{topic.title}</h3>
                              </div>
                              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-200">
                                {topic.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                              <label className="text-sm text-slate-200">
                                Title
                                <input
                                  value={draft.title || ''}
                                  onChange={(event) => setTopicDrafts((current) => ({ ...current, [topic._id]: { ...draft, title: event.target.value } }))}
                                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                                />
                              </label>
                              <label className="text-sm text-slate-200">
                                Day number
                                <input
                                  type="number"
                                  min="1"
                                  value={draft.dayNumber || 1}
                                  onChange={(event) => setTopicDrafts((current) => ({ ...current, [topic._id]: { ...draft, dayNumber: Number(event.target.value) } }))}
                                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                                />
                              </label>
                              <label className="text-sm text-slate-200 lg:col-span-2">
                                Description
                                <textarea
                                  rows={3}
                                  value={draft.description || ''}
                                  onChange={(event) => setTopicDrafts((current) => ({ ...current, [topic._id]: { ...draft, description: event.target.value } }))}
                                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                                />
                              </label>
                              <label className="text-sm text-slate-200 lg:col-span-2">
                                Content
                                <textarea
                                  rows={4}
                                  value={draft.content || ''}
                                  onChange={(event) => setTopicDrafts((current) => ({ ...current, [topic._id]: { ...draft, content: event.target.value } }))}
                                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                                />
                              </label>
                              <label className="text-sm text-slate-200">
                                Estimated minutes
                                <input
                                  type="number"
                                  min="1"
                                  value={draft.estimatedMinutes || 30}
                                  onChange={(event) => setTopicDrafts((current) => ({ ...current, [topic._id]: { ...draft, estimatedMinutes: Number(event.target.value) } }))}
                                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                                />
                              </label>
                              <label className="text-sm text-slate-200">
                                Order
                                <input
                                  type="number"
                                  min="1"
                                  value={draft.order || 1}
                                  onChange={(event) => setTopicDrafts((current) => ({ ...current, [topic._id]: { ...draft, order: Number(event.target.value) } }))}
                                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                                />
                              </label>
                              <div className="lg:col-span-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm text-slate-200">Practice links</p>
                                  <button
                                    type="button"
                                    onClick={() => addTopicPracticeLink(topic._id)}
                                    className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100"
                                  >
                                    Add link
                                  </button>
                                </div>
                                <div className="mt-3 space-y-3">
                                  {normalizePracticeLinks(draft.practiceLinks).map((link, linkIndex) => (
                                    <div key={`${topic._id}-practice-${linkIndex}`} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 md:grid-cols-2">
                                      <label className="text-sm text-slate-200">
                                        Title
                                        <input
                                          value={link.title}
                                          onChange={(event) => updateTopicPracticeLink(topic._id, linkIndex, 'title', event.target.value)}
                                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                                        />
                                      </label>
                                      <label className="text-sm text-slate-200">
                                        Platform
                                        <input
                                          value={link.platform}
                                          onChange={(event) => updateTopicPracticeLink(topic._id, linkIndex, 'platform', event.target.value)}
                                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                                        />
                                      </label>
                                      <label className="text-sm text-slate-200 md:col-span-2">
                                        URL
                                        <input
                                          type="url"
                                          value={link.url}
                                          onChange={(event) => updateTopicPracticeLink(topic._id, linkIndex, 'url', event.target.value)}
                                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                                        />
                                      </label>
                                      <label className="text-sm text-slate-200">
                                        Difficulty
                                        <select
                                          value={link.difficulty}
                                          onChange={(event) => updateTopicPracticeLink(topic._id, linkIndex, 'difficulty', event.target.value)}
                                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                                        >
                                          <option value="beginner">Beginner</option>
                                          <option value="intermediate">Intermediate</option>
                                          <option value="advanced">Advanced</option>
                                          <option value="mixed">Mixed</option>
                                        </select>
                                      </label>
                                      <div className="flex items-end">
                                        <button
                                          type="button"
                                          onClick={() => removeTopicPracticeLink(topic._id, linkIndex)}
                                          className="rounded-lg border border-rose-400/50 px-3 py-2 text-sm font-semibold text-rose-100"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {!normalizePracticeLinks(draft.practiceLinks).length ? (
                                    <div className="rounded-xl border border-dashed border-slate-700 p-3 text-sm text-slate-400">
                                      No practice links added yet.
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <label className="flex items-center gap-2 text-sm text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={draft.isActive ?? true}
                                  onChange={(event) => setTopicDrafts((current) => ({ ...current, [topic._id]: { ...draft, isActive: event.target.checked } }))}
                                />
                                Active
                              </label>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm text-slate-300">Current notes</p>
                                <p className="mt-2 text-sm text-slate-200">{notePdfUrl ? noteFileName : 'No PDF uploaded'}</p>
                                {notePdfUrl ? (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <a
                                      href={notePdfUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100"
                                    >
                                      Open PDF
                                    </a>
                                    <a
                                      href={notePdfUrl}
                                      download={noteFileName || true}
                                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100"
                                    >
                                      Download
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteNotes(topic)}
                                      disabled={isSaving}
                                      className="rounded-lg border border-rose-400/50 px-3 py-2 text-sm font-semibold text-rose-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                                    >
                                      Delete PDF
                                    </button>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-xs text-amber-200">Upload a PDF to create a valid Cloudinary notes link.</p>
                                )}
                              </div>
                              <label className="text-sm text-slate-200">
                                {notePdfUrl ? 'Replace PDF' : 'Upload PDF'}
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={async (event) => {
                                    await handleUploadNotes(topic._id, event.target.files?.[0]);
                                    event.target.value = '';
                                  }}
                                  className="mt-2 block text-sm text-white"
                                />
                                <span className="mt-2 block text-xs text-slate-400">PDF only, max 10MB.</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleTopicSave(topic._id)}
                                disabled={isSaving}
                                className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                              >
                                {isSaving ? 'Saving...' : 'Save topic'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm text-slate-300">Create new topic</p>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <label className="text-sm text-slate-200">
                        Day number
                        <input
                          type="number"
                          min="1"
                          value={newTopic.dayNumber}
                          onChange={(event) => setNewTopic((current) => ({ ...current, dayNumber: Number(event.target.value) }))}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                        />
                      </label>
                      <label className="text-sm text-slate-200">
                        Estimated minutes
                        <input
                          type="number"
                          min="1"
                          value={newTopic.estimatedMinutes}
                          onChange={(event) => setNewTopic((current) => ({ ...current, estimatedMinutes: Number(event.target.value) }))}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                        />
                      </label>
                      <label className="text-sm text-slate-200 lg:col-span-2">
                        Title
                        <input
                          value={newTopic.title}
                          onChange={(event) => setNewTopic((current) => ({ ...current, title: event.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                        />
                      </label>
                      <label className="text-sm text-slate-200 lg:col-span-2">
                        Description
                        <textarea
                          rows={3}
                          value={newTopic.description}
                          onChange={(event) => setNewTopic((current) => ({ ...current, description: event.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                        />
                      </label>
                      <label className="text-sm text-slate-200 lg:col-span-2">
                        Content
                        <textarea
                          rows={4}
                          value={newTopic.content}
                          onChange={(event) => setNewTopic((current) => ({ ...current, content: event.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                        />
                      </label>
                      <div className="lg:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm text-slate-200">Practice links</p>
                          <button
                            type="button"
                            onClick={addNewTopicPracticeLink}
                            className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100"
                          >
                            Add link
                          </button>
                        </div>
                        <div className="mt-3 space-y-3">
                          {normalizePracticeLinks(newTopic.practiceLinks).map((link, linkIndex) => (
                            <div key={`new-practice-${linkIndex}`} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 md:grid-cols-2">
                              <label className="text-sm text-slate-200">
                                Title
                                <input
                                  value={link.title}
                                  onChange={(event) => updateNewTopicPracticeLink(linkIndex, 'title', event.target.value)}
                                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                                />
                              </label>
                              <label className="text-sm text-slate-200">
                                Platform
                                <input
                                  value={link.platform}
                                  onChange={(event) => updateNewTopicPracticeLink(linkIndex, 'platform', event.target.value)}
                                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                                />
                              </label>
                              <label className="text-sm text-slate-200 md:col-span-2">
                                URL
                                <input
                                  type="url"
                                  value={link.url}
                                  onChange={(event) => updateNewTopicPracticeLink(linkIndex, 'url', event.target.value)}
                                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                                />
                              </label>
                              <label className="text-sm text-slate-200">
                                Difficulty
                                <select
                                  value={link.difficulty}
                                  onChange={(event) => updateNewTopicPracticeLink(linkIndex, 'difficulty', event.target.value)}
                                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                                >
                                  <option value="beginner">Beginner</option>
                                  <option value="intermediate">Intermediate</option>
                                  <option value="advanced">Advanced</option>
                                  <option value="mixed">Mixed</option>
                                </select>
                              </label>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => removeNewTopicPracticeLink(linkIndex)}
                                  className="rounded-lg border border-rose-400/50 px-3 py-2 text-sm font-semibold text-rose-100"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                          {!normalizePracticeLinks(newTopic.practiceLinks).length ? (
                            <div className="rounded-xl border border-dashed border-slate-700 p-3 text-sm text-slate-400">
                              No practice links added yet.
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-200">
                        <input
                          type="checkbox"
                          checked={newTopic.isActive}
                          onChange={(event) => setNewTopic((current) => ({ ...current, isActive: event.target.checked }))}
                        />
                        Active
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateTopic}
                      disabled={isSaving}
                      className="mt-4 w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                    >
                      {isSaving ? 'Saving...' : 'Create topic'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {showCourseModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">New course</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Create course</h2>
                </div>
                <button type="button" onClick={() => setShowCourseModal(false)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100">
                  Close
                </button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-200">
                  Title
                  <input value={newCourseForm.title} onChange={(event) => setNewCourseForm((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                </label>
                <label className="text-sm text-slate-200">
                  Slug
                  <input value={newCourseForm.slug} onChange={(event) => setNewCourseForm((current) => ({ ...current, slug: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                </label>
                <label className="text-sm text-slate-200">
                  Category
                  <input value={newCourseForm.category} onChange={(event) => setNewCourseForm((current) => ({ ...current, category: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                </label>
                <label className="text-sm text-slate-200">
                  Level
                  <select value={newCourseForm.level} onChange={(event) => setNewCourseForm((current) => ({ ...current, level: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
                <label className="text-sm text-slate-200 md:col-span-2">
                  Description
                  <textarea rows={4} value={newCourseForm.description} onChange={(event) => setNewCourseForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input type="checkbox" checked={newCourseForm.isPublished} onChange={(event) => setNewCourseForm((current) => ({ ...current, isPublished: event.target.checked }))} />
                  Publish immediately
                </label>
              </div>
              <button type="button" onClick={handleCreateCourse} disabled={isSaving} className="mt-5 w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300">
                {isSaving ? 'Creating...' : 'Create course'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default AdminCoursesPage;
