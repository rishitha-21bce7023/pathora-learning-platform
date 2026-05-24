import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_COURSE_SLUG, fetchCourseRoadmapBySlug } from '../services/courseService.js';
import { fetchQuizForTopic, submitQuizAnswers } from '../services/quizService.js';

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

const PracticePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [quiz, setQuiz] = useState({ title: 'Topic Quiz', questions: [] });
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadTopics = async () => {
      try {
        setIsLoading(true);
        setError('');
        const roadmap = await fetchCourseRoadmapBySlug(DEFAULT_COURSE_SLUG);
        const activeTopics = roadmap.topics || [];

        if (isMounted) {
          setTopics(activeTopics);
          setSelectedTopicId(activeTopics[0]?._id || '');
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load topics.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTopics();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadQuiz = async () => {
      if (!selectedTopicId) {
        return;
      }

      try {
        setError('');
        const response = await fetchQuizForTopic(selectedTopicId);

        if (isMounted) {
          setQuiz({
            topicId: selectedTopicId,
            title: response.topic?.title ? `${response.topic.title} Quiz` : 'Topic Quiz',
            questions: response.questions || [],
          });
          setAnswers({});
          setResult(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load quiz.');
        }
      }
    };

    loadQuiz();

    return () => {
      isMounted = false;
    };
  }, [selectedTopicId]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const reviewedQuestions = result?.questions || [];

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      const response = await submitQuizAnswers(quiz.topicId, answers);
      setResult(response);
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setResult(null);
    setError('');
  };

  return (
    <DashboardLayout
      user={user}
      title="Student"
      subtitle="Practice"
      navItems={studentNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Take topic quizzes and review explanations' }}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-200">
            Loading quiz...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {!isLoading ? (
          <>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Topic quiz</p>
                  <h1 className="mt-3 text-2xl font-bold text-white">{quiz.title}</h1>
                  <p className="mt-2 text-sm text-slate-300">
                    {answeredCount} of {quiz.questions.length} questions answered
                  </p>
                </div>
                {result ? (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-100">
                    <p className="text-sm">Score</p>
                    <p className="mt-2 text-2xl font-bold">
                      {result.score}/{result.total} ({result.percentage}%)
                    </p>
                  </div>
                ) : null}
              </div>
              <label className="mt-4 block text-sm text-slate-200">
                Topic
                <select
                  value={selectedTopicId}
                  onChange={(event) => setSelectedTopicId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>Day {topic.dayNumber}: {topic.title}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-4">
              {quiz.questions.map((question, questionIndex) => {
                const questionId = question._id || question.id;
                const reviewedQuestion = reviewedQuestions.find((item) => (item._id || item.id) === questionId);

                return (
                  <div key={questionId} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-cyan-200">Question {questionIndex + 1}</p>
                        <h2 className="mt-2 text-lg font-semibold text-white">{question.question}</h2>
                      </div>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold capitalize text-slate-100">
                        {question.difficulty}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {question.options.map((option) => {
                        const isSelected = answers[questionId] === option;
                        const isCorrect = reviewedQuestion?.correctAnswer === option;
                        const isWrongSelection = reviewedQuestion && reviewedQuestion.selectedAnswer === option && !reviewedQuestion.isCorrect;

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={Boolean(result)}
                            onClick={() => setAnswers((current) => ({ ...current, [questionId]: option }))}
                            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                              isCorrect
                                ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-100'
                                : isWrongSelection
                                  ? 'border-rose-400/60 bg-rose-500/10 text-rose-100'
                                  : isSelected
                                    ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-100'
                                    : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-cyan-400/50'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>

                    {reviewedQuestion ? (
                      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-sm font-semibold text-white">
                          Correct answer: {reviewedQuestion.correctAnswer}
                        </p>
                        <p className="mt-2 text-sm text-slate-300">{reviewedQuestion.explanation}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {!quiz.questions.length ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-5 text-sm text-slate-300">
                  No quiz questions are available for this topic yet.
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || Boolean(result) || !quiz.questions.length || answeredCount !== quiz.questions.length}
                className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {isSubmitting ? 'Submitting...' : 'Submit quiz'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-slate-700 px-4 py-3 font-semibold text-slate-100"
              >
                Reset quiz
              </button>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default PracticePage;
