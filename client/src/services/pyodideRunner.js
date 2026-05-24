const pyodideIndexUrl = '/pyodide/';
const maxSourceLength = 50000;
const maxStdinLength = 10000;

let pyodidePromise;

const getPyodide = () => {
  if (!pyodidePromise) {
    pyodidePromise = import(/* @vite-ignore */ `${pyodideIndexUrl}pyodide.mjs`)
      .then(({ loadPyodide }) => loadPyodide({ indexURL: pyodideIndexUrl }));
  }

  return pyodidePromise;
};

const normalizeOutput = (value) => String(value || '').trim();

export const runPython = async ({ sourceCode, stdin = '' }) => {
  if (!sourceCode || typeof sourceCode !== 'string') {
    throw new Error('sourceCode is required');
  }

  if (sourceCode.length > maxSourceLength) {
    throw new Error(`sourceCode must be ${maxSourceLength} characters or fewer`);
  }

  if (typeof stdin !== 'string') {
    throw new Error('stdin must be a string');
  }

  if (stdin.length > maxStdinLength) {
    throw new Error(`stdin must be ${maxStdinLength} characters or fewer`);
  }

  const pyodide = await getPyodide();
  const startedAt = performance.now();

  pyodide.globals.set('PATHORA_SOURCE_CODE', sourceCode);
  pyodide.globals.set('PATHORA_STDIN', stdin);

  const rawResult = await pyodide.runPythonAsync(`
import builtins
import io
import json
import sys
import traceback

_pathora_stdout = io.StringIO()
_pathora_stderr = io.StringIO()
_pathora_inputs = iter(str(PATHORA_STDIN).splitlines())
_pathora_original_stdout = sys.stdout
_pathora_original_stderr = sys.stderr
_pathora_original_input = builtins.input

def _pathora_input(prompt=""):
    if prompt:
        print(prompt, end="")
    try:
        return next(_pathora_inputs)
    except StopIteration:
        raise EOFError("No more input available")

_pathora_status = "Accepted"
sys.stdout = _pathora_stdout
sys.stderr = _pathora_stderr
builtins.input = _pathora_input

try:
    exec(PATHORA_SOURCE_CODE, {"__name__": "__main__"})
except Exception:
    _pathora_status = "Runtime Error"
    traceback.print_exc(file=_pathora_stderr)
finally:
    sys.stdout = _pathora_original_stdout
    sys.stderr = _pathora_original_stderr
    builtins.input = _pathora_original_input

json.dumps({
    "stdout": _pathora_stdout.getvalue(),
    "stderr": _pathora_stderr.getvalue(),
    "status": _pathora_status,
})
`);

  pyodide.globals.delete('PATHORA_SOURCE_CODE');
  pyodide.globals.delete('PATHORA_STDIN');

  const result = JSON.parse(rawResult);
  const elapsedSeconds = (performance.now() - startedAt) / 1000;

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    compile_output: '',
    status: result.status || 'Unknown',
    time: elapsedSeconds.toFixed(3),
    memory: null,
  };
};

export const runPythonTestCases = async ({ sourceCode, testCases = [] }) => {
  const results = [];

  for (const [index, testCase] of testCases.entries()) {
    const execution = await runPython({
      sourceCode,
      stdin: testCase.input || '',
    });
    const actualOutput = normalizeOutput(execution.stdout);
    const expectedOutput = normalizeOutput(testCase.expectedOutput);
    const passed = actualOutput === expectedOutput && !execution.stderr && !execution.compile_output;

    results.push({
      index,
      passed,
      isHidden: Boolean(testCase.isHidden),
      input: testCase.isHidden ? undefined : testCase.input,
      expectedOutput: testCase.isHidden ? undefined : testCase.expectedOutput,
      actualOutput,
      stdout: execution.stdout,
      stderr: execution.stderr,
      compile_output: execution.compile_output,
      status: execution.status,
      time: execution.time,
      memory: execution.memory,
    });
  }

  const passedCount = results.filter((result) => result.passed).length;
  const failedCount = results.length - passedCount;

  return {
    passedCount,
    failedCount,
    totalCount: results.length,
    score: results.length ? Math.round((passedCount / results.length) * 100) : 0,
    results,
  };
};
