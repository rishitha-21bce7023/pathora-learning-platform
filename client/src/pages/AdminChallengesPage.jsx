import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { createChallenge, deleteChallenge, fetchAdminChallenges, updateChallenge } from '../services/challengeService.js';
import { DEFAULT_COURSE_SLUG, fetchCourseRoadmapBySlug } from '../services/courseService.js';
import {
  createQuizQuestion,
  deleteQuizQuestion,
  fetchAdminQuizQuestions,
  updateQuizQuestion,
} from '../services/quizService.js';

const adminNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '🏠' },
  { label: 'Admin Courses', path: '/admin/courses', icon: '📚' },
  { label: 'Admin Notes', path: '/admin/notes', icon: '📝' },
  { label: 'Admin Quizzes', path: '/admin/challenges', icon: '⚡' },
];

const emptyQuestion = {
  topicId: '',
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  explanation: '',
  difficulty: 'beginner',
};

const emptyChallenge = {
  courseId: '',
  topicId: '',
  title: '',
  description: '',
  difficulty: 'beginner',
  starterCode: 'print("Hello Pathora")',
  constraints: '',
  examples: [{ input: '', output: '', explanation: '' }],
  testCases: [{ input: '', expectedOutput: '', isHidden: false }],
};

const AdminChallengesPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [topics, setTopics] = useState([]);
  const [draft, setDraft] = useState(emptyQuestion);
  const [challengeDraft, setChallengeDraft] = useState(emptyChallenge);
  const [editingId, setEditingId] = useState('');
  const [editingChallengeId, setEditingChallengeId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadQuestions = async () => {
    const response = await fetchAdminQuizQuestions();
    setQuestions(response);
  };

  const loadChallenges = async () => {
    const response = await fetchAdminChallenges();
    setChallenges(response);
  };

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [response, roadmap, challengeResponse] = await Promise.all([
          fetchAdminQuizQuestions(),
          fetchCourseRoadmapBySlug(DEFAULT_COURSE_SLUG),
          fetchAdminChallenges(),
        ]);

        if (isMounted) {
          setQuestions(response);
          setChallenges(challengeResponse);
          setTopics(roadmap.topics || []);
          const firstTopic = roadmap.topics?.[0];
          setDraft((current) => ({
            ...current,
            topicId: current.topicId || firstTopic?._id || '',
          }));
          setChallengeDraft((current) => ({
            ...current,
            topicId: current.topicId || firstTopic?._id || '',
            courseId: current.courseId || firstTopic?.courseId || '',
          }));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load quiz questions.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateOption = (index, value) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (optionIndex === index ? value : option)),
    }));
  };

  const resetForm = () => {
    setDraft({
      ...emptyQuestion,
      topicId: topics[0]?._id || '',
    });
    setEditingId('');
    setError('');
  };

  const handleEdit = (question) => {
    setEditingId(question._id);
    setDraft({
      topicId: question.topicId?._id || question.topicId,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty,
    });
  };

  const validateDraft = () => {
    const options = draft.options.map((option) => option.trim()).filter(Boolean);

    if (!draft.question.trim() || options.length < 2 || !draft.correctAnswer.trim() || !draft.explanation.trim()) {
      return 'Question, at least two options, correct answer, and explanation are required.';
    }

    if (!options.includes(draft.correctAnswer.trim())) {
      return 'Correct answer must exactly match one of the options.';
    }

    return '';
  };

  const handleSave = async () => {
    const validationError = validateDraft();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      ...draft,
      question: draft.question.trim(),
      options: draft.options.map((option) => option.trim()).filter(Boolean),
      correctAnswer: draft.correctAnswer.trim(),
      explanation: draft.explanation.trim(),
    };

    try {
      setIsSaving(true);
      setError('');

      if (editingId) {
        await updateQuizQuestion(editingId, payload);
      } else {
        await createQuizQuestion(payload);
      }

      await loadQuestions();
      resetForm();
      showToast(editingId ? 'Quiz question updated.' : 'Quiz question created.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save quiz question.');
      showToast(saveError.message || 'Unable to save quiz question.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Delete this quiz question?')) {
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await deleteQuizQuestion(questionId);
      await loadQuestions();

      if (editingId === questionId) {
        resetForm();
      }
      showToast('Quiz question deleted.');
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete quiz question.');
      showToast(deleteError.message || 'Unable to delete quiz question.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetChallengeForm = () => {
    const firstTopic = topics[0];
    setChallengeDraft({
      ...emptyChallenge,
      topicId: firstTopic?._id || '',
      courseId: firstTopic?.courseId || '',
    });
    setEditingChallengeId('');
  };

  const updateChallengeTestCase = (index, field, value) => {
    setChallengeDraft((current) => ({
      ...current,
      testCases: current.testCases.map((testCase, testIndex) => (
        testIndex === index ? { ...testCase, [field]: value } : testCase
      )),
    }));
  };

  const addChallengeTestCase = () => {
    setChallengeDraft((current) => ({
      ...current,
      testCases: [...current.testCases, { input: '', expectedOutput: '', isHidden: false }],
    }));
  };

  const removeChallengeTestCase = (index) => {
    setChallengeDraft((current) => ({
      ...current,
      testCases: current.testCases.filter((_item, itemIndex) => itemIndex !== index),
    }));
  };

  const handleChallengeTopicChange = (topicId) => {
    const topic = topics.find((item) => item._id === topicId);
    setChallengeDraft((current) => ({
      ...current,
      topicId,
      courseId: topic?.courseId || current.courseId,
    }));
  };

  const handleEditChallenge = (challenge) => {
    setEditingChallengeId(challenge._id);
    setChallengeDraft({
      courseId: challenge.courseId?._id || challenge.courseId,
      topicId: challenge.topicId?._id || challenge.topicId,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      starterCode: challenge.starterCode,
      constraints: challenge.constraints || '',
      examples: challenge.examples?.length ? challenge.examples : [{ input: '', output: '', explanation: '' }],
      testCases: challenge.testCases?.length ? challenge.testCases : [{ input: '', expectedOutput: '', isHidden: false }],
    });
  };

  const handleSaveChallenge = async () => {
    try {
      setIsSaving(true);
      setError('');

      if (editingChallengeId) {
        await updateChallenge(editingChallengeId, challengeDraft);
      } else {
        await createChallenge(challengeDraft);
      }

      await loadChallenges();
      resetChallengeForm();
      showToast(editingChallengeId ? 'Challenge updated.' : 'Challenge created.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save challenge.');
      showToast(saveError.message || 'Unable to save challenge.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!window.confirm('Delete this coding challenge?')) {
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await deleteChallenge(challengeId);
      await loadChallenges();
      if (editingChallengeId === challengeId) {
        resetChallengeForm();
      }
      showToast('Challenge deleted.');
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete challenge.');
      showToast(deleteError.message || 'Unable to delete challenge.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      user={user}
      title="Admin"
      subtitle="Admin Quizzes"
      navItems={adminNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Create and maintain topic quizzes' }}
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

        {!isLoading ? (
          <>
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-300">{editingId ? 'Edit question' : 'Create question'}</p>
              <div className="mt-4 space-y-3">
                <label className="block text-sm text-slate-200">
                  Topic
                  <select
                    value={draft.topicId}
                    onChange={(event) => setDraft((current) => ({ ...current, topicId: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  >
                    {topics.map((topic) => (
                      <option key={topic._id} value={topic._id}>Day {topic.dayNumber}: {topic.title}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-200">
                  Question
                  <textarea
                    rows={3}
                    value={draft.question}
                    onChange={(event) => setDraft((current) => ({ ...current, question: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  {draft.options.map((option, index) => (
                    <label key={`option-${index}`} className="text-sm text-slate-200">
                      Option {index + 1}
                      <input
                        value={option}
                        onChange={(event) => updateOption(index, event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                      />
                    </label>
                  ))}
                </div>

                <label className="block text-sm text-slate-200">
                  Correct answer
                  <select
                    value={draft.correctAnswer}
                    onChange={(event) => setDraft((current) => ({ ...current, correctAnswer: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  >
                    <option value="">Select an answer</option>
                    {draft.options.filter(Boolean).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-slate-200">
                  Difficulty
                  <select
                    value={draft.difficulty}
                    onChange={(event) => setDraft((current) => ({ ...current, difficulty: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>

                <label className="block text-sm text-slate-200">
                  Explanation
                  <textarea
                    rows={4}
                    value={draft.explanation}
                    onChange={(event) => setDraft((current) => ({ ...current, explanation: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                  >
                    {isSaving ? 'Saving...' : editingId ? 'Update question' : 'Create question'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-700 px-4 py-3 font-semibold text-slate-100"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question._id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-cyan-200">
                        {question.topicId?.title || question.topicId}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-white">{question.question}</h2>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold capitalize text-slate-100">
                      {question.difficulty}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {question.options.map((option) => (
                      <div
                        key={option}
                        className={`rounded-xl border px-3 py-2 text-sm ${
                          option === question.correctAnswer
                            ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
                            : 'border-slate-800 bg-slate-900 text-slate-300'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-slate-300">{question.explanation}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleEdit(question)}
                      className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(question._id)}
                      disabled={isSaving}
                      className="rounded-lg border border-rose-400/50 px-3 py-2 text-sm font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {!questions.length ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-5 text-sm text-slate-300">
                  No quiz questions yet. Create one for a topic.
                </div>
              ) : null}
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm text-slate-300">{editingChallengeId ? 'Edit coding challenge' : 'Create coding challenge'}</p>
              <div className="mt-4 space-y-3">
                <label className="block text-sm text-slate-200">
                  Topic
                  <select value={challengeDraft.topicId} onChange={(event) => handleChallengeTopicChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                    {topics.map((topic) => (
                      <option key={topic._id} value={topic._id}>Day {topic.dayNumber}: {topic.title}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-200">
                  Title
                  <input value={challengeDraft.title} onChange={(event) => setChallengeDraft((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                </label>
                <label className="block text-sm text-slate-200">
                  Description
                  <textarea rows={4} value={challengeDraft.description} onChange={(event) => setChallengeDraft((current) => ({ ...current, description: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                </label>
                <label className="block text-sm text-slate-200">
                  Difficulty
                  <select value={challengeDraft.difficulty} onChange={(event) => setChallengeDraft((current) => ({ ...current, difficulty: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
                <label className="block text-sm text-slate-200">
                  Starter code
                  <textarea rows={5} value={challengeDraft.starterCode} onChange={(event) => setChallengeDraft((current) => ({ ...current, starterCode: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white" />
                </label>
                <label className="block text-sm text-slate-200">
                  Constraints
                  <textarea rows={3} value={challengeDraft.constraints} onChange={(event) => setChallengeDraft((current) => ({ ...current, constraints: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                </label>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-200">Test cases</p>
                    <button type="button" onClick={addChallengeTestCase} className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100">Add test case</button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {challengeDraft.testCases.map((testCase, index) => (
                      <div key={`test-${index}`} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="text-sm text-slate-200">
                            Input
                            <textarea rows={3} value={testCase.input} onChange={(event) => updateChallengeTestCase(index, 'input', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white" />
                          </label>
                          <label className="text-sm text-slate-200">
                            Expected output
                            <textarea rows={3} value={testCase.expectedOutput} onChange={(event) => updateChallengeTestCase(index, 'expectedOutput', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white" />
                          </label>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <label className="flex items-center gap-2 text-sm text-slate-200">
                            <input type="checkbox" checked={testCase.isHidden} onChange={(event) => updateChallengeTestCase(index, 'isHidden', event.target.checked)} />
                            Hidden test case
                          </label>
                          <button type="button" onClick={() => removeChallengeTestCase(index)} className="rounded-lg border border-rose-400/50 px-3 py-2 text-sm font-semibold text-rose-100">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleSaveChallenge} disabled={isSaving} className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300">
                    {isSaving ? 'Saving...' : editingChallengeId ? 'Update challenge' : 'Create challenge'}
                  </button>
                  <button type="button" onClick={resetChallengeForm} className="rounded-lg border border-slate-700 px-4 py-3 font-semibold text-slate-100">Clear</button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div key={challenge._id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-cyan-200">{challenge.topicId?.title || 'Topic challenge'}</p>
                      <h2 className="mt-2 text-lg font-semibold text-white">{challenge.title}</h2>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold capitalize text-slate-100">{challenge.difficulty}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{challenge.description}</p>
                  <p className="mt-3 text-sm text-slate-400">{challenge.testCases?.length || 0} test cases</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={() => handleEditChallenge(challenge)} className="rounded-lg border border-cyan-400/50 px-3 py-2 text-sm font-semibold text-cyan-100">Edit</button>
                    <button type="button" onClick={() => handleDeleteChallenge(challenge._id)} disabled={isSaving} className="rounded-lg border border-rose-400/50 px-3 py-2 text-sm font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60">Delete</button>
                  </div>
                </div>
              ))}
              {!challenges.length ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-5 text-sm text-slate-300">
                  No coding challenges yet. Create one and add visible or hidden test cases.
                </div>
              ) : null}
            </div>
          </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default AdminChallengesPage;
