import Editor from '@monaco-editor/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchChallengesByTopic } from '../services/challengeService.js';
import { DEFAULT_COURSE_SLUG, fetchCourseRoadmapBySlug } from '../services/courseService.js';
import { runPythonTestCases } from '../services/pyodideRunner.js';

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

const fallbackCode = 'print("Hello Pathora")';

const ChallengePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [code, setCode] = useState(fallbackCode);
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
        const response = await fetchCourseRoadmapBySlug(DEFAULT_COURSE_SLUG);

        if (isMounted) {
          const activeTopics = response.topics || [];
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

    const loadChallenges = async () => {
      if (!selectedTopicId) {
        return;
      }

      try {
        setError('');
        const response = await fetchChallengesByTopic(selectedTopicId);

        if (isMounted) {
          setChallenges(response);
          setSelectedChallengeId(response[0]?._id || '');
          setCode(response[0]?.starterCode || fallbackCode);
          setResult(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load challenges.');
        }
      }
    };

    loadChallenges();

    return () => {
      isMounted = false;
    };
  }, [selectedTopicId]);

  const selectedChallenge = useMemo(() => {
    return challenges.find((challenge) => challenge._id === selectedChallengeId) || null;
  }, [challenges, selectedChallengeId]);

  const visibleTestCases = selectedChallenge?.testCases?.filter((testCase) => !testCase.isHidden) || [];

  const handleSelectChallenge = (challengeId) => {
    const nextChallenge = challenges.find((challenge) => challenge._id === challengeId);
    setSelectedChallengeId(challengeId);
    setCode(nextChallenge?.starterCode || fallbackCode);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!selectedChallenge) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const response = await runPythonTestCases({
        sourceCode: code,
        testCases: selectedChallenge.testCases || [],
      });
      setResult(response);
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit solution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      user={user}
      title="Student"
      subtitle="Challenges"
      navItems={studentNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Solve coding challenges with test cases' }}
    >
      <div className="space-y-5">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-200">
            Loading challenges...
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
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-200">
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
                <label className="text-sm text-slate-200">
                  Challenge
                  <select
                    value={selectedChallengeId}
                    onChange={(event) => handleSelectChallenge(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  >
                    {challenges.map((challenge) => (
                      <option key={challenge._id} value={challenge._id}>{challenge.title}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {selectedChallenge ? (
              <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">{selectedChallenge.difficulty}</p>
                    <h1 className="mt-3 text-2xl font-bold text-white">{selectedChallenge.title}</h1>
                    <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{selectedChallenge.description}</p>
                    {selectedChallenge.constraints ? (
                      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-sm font-semibold text-white">Constraints</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{selectedChallenge.constraints}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Visible test cases</p>
                    <div className="mt-4 space-y-3">
                      {visibleTestCases.map((testCase, index) => (
                        <div key={testCase._id || index} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                          <p className="text-sm text-slate-300">Input</p>
                          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-sm text-white">{testCase.input || '(empty)'}</pre>
                          <p className="mt-3 text-sm text-slate-300">Expected output</p>
                          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-sm text-white">{testCase.expectedOutput}</pre>
                        </div>
                      ))}
                      {!visibleTestCases.length ? (
                        <p className="text-sm text-slate-300">Only hidden test cases are available for this challenge.</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Solution editor</p>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                      >
                        {isSubmitting ? 'Running tests...' : 'Submit solution'}
                      </button>
                    </div>
                    <div className="h-[520px]">
                      <Editor
                        height="100%"
                        language="python"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                        }}
                      />
                    </div>
                  </div>

                  {result ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Test results</p>
                          <h2 className="mt-2 text-xl font-bold text-white">
                            {result.passedCount}/{result.totalCount} passed ({result.score}%)
                          </h2>
                        </div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-100">
                          {result.failedCount} failed
                        </span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {result.results.map((item) => (
                          <div
                            key={item.index}
                            className={`rounded-xl border p-4 ${item.passed ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-rose-500/40 bg-rose-500/10'}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-white">Test case {item.index + 1}</p>
                              <span className="text-sm font-semibold text-white">{item.passed ? 'Passed' : 'Failed'}</span>
                            </div>
                            {item.isHidden ? (
                              <p className="mt-2 text-sm text-slate-300">Hidden test case details are not shown.</p>
                            ) : (
                              <div className="mt-3 grid gap-3 md:grid-cols-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Input</p>
                                  <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-100">{item.input || '(empty)'}</pre>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Expected</p>
                                  <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-100">{item.expectedOutput}</pre>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Actual</p>
                                  <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-100">{item.actualOutput || '(empty)'}</pre>
                                </div>
                              </div>
                            )}
                            {item.stderr || item.compile_output ? (
                              <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-sm text-rose-100">
                                {item.stderr || item.compile_output}
                              </pre>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-5 text-sm text-slate-300">
                No challenges are available for this topic yet.
              </div>
            )}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default ChallengePage;
