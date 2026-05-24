import Editor from '@monaco-editor/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { runPython } from '../services/pyodideRunner.js';

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

const starterCode = 'print("Hello Pathora")';

const CompilerPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [code, setCode] = useState(starterCode);
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState({
    status: 'idle',
    stdout: '',
    stderr: '',
    compile_output: '',
    time: null,
    memory: null,
  });
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    try {
      setIsRunning(true);
      setResult({
        status: 'running',
        stdout: '',
        stderr: '',
        compile_output: '',
        time: null,
        memory: null,
      });
      const response = await runPython({ sourceCode: code, stdin });
      setResult(response);
    } catch (error) {
      setResult({
        status: 'runner_error',
        stdout: '',
        stderr: error.message || 'Unable to run code.',
        compile_output: '',
        time: null,
        memory: null,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(starterCode);
    setStdin('');
    setResult({
      status: 'idle',
      stdout: '',
      stderr: '',
      compile_output: '',
      time: null,
      memory: null,
    });
  };

  return (
    <DashboardLayout
      user={user}
      title="Student"
      subtitle="Compiler"
      navItems={studentNav}
      onLogout={() => {
        logout();
        navigate('/login', { replace: true });
      }}
      actions={{ focus: 'Run Python snippets and inspect output' }}
    >
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Python</p>
              <h1 className="mt-1 text-xl font-bold text-white">Code editor</h1>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
              >
                Reset Code
              </button>
            </div>
          </div>
          <div className="h-[620px]">
            <Editor
              height="100%"
              defaultLanguage="python"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 4,
                wordWrap: 'on',
              }}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Input</p>
            <textarea
              rows={8}
              value={stdin}
              onChange={(event) => setStdin(event.target.value)}
              placeholder="Optional stdin for your Python program"
              className="mt-4 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 font-mono text-sm text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Output</p>
                <h2 className="mt-2 text-lg font-semibold text-white">Execution result</h2>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-100">
                {result.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Runtime</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {result.time ? `${result.time} s` : '-'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Runner</p>
                <p className="mt-2 text-sm font-semibold text-white">Pyodide</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm font-semibold text-emerald-100">stdout</p>
              <pre className="mt-3 min-h-24 whitespace-pre-wrap break-words font-mono text-sm text-slate-100">
                {isRunning ? 'Running Python in your browser...' : result.stdout || 'No stdout yet.'}
              </pre>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm font-semibold text-rose-100">stderr / compile errors</p>
              <pre className="mt-3 min-h-24 whitespace-pre-wrap break-words font-mono text-sm text-slate-100">
                {result.stderr || result.compile_output || 'No stderr yet.'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompilerPage;
