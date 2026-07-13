'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const workerSource = fs.readFileSync(path.join(ROOT, 'js/sympy-worker.js'), 'utf8');

function getFunctionSource(source, functionName) {
  const match = source.match(
    new RegExp(`function ${functionName}\\([^\\n]*\\) \\{([\\s\\S]*?)\\n\\}`)
  );
  assert.ok(match, `Missing function ${functionName}().`);
  return match[0];
}

const appLengthMatch = appSource.match(/const ANSWER_MAX_LENGTH = (\d+);/);
const workerLengthMatch = workerSource.match(/MAX_EXPRESSION_INPUT_LENGTH = (\d+)/);
const inputLengthMatch = indexSource.match(/id="answerInput"[^>]*maxlength="(\d+)"/);
assert.ok(appLengthMatch && workerLengthMatch && inputLengthMatch, 'Answer length limits are missing.');
assert.equal(appLengthMatch[1], workerLengthMatch[1], 'App and worker length limits differ.');
assert.equal(appLengthMatch[1], inputLengthMatch[1], 'App and HTML length limits differ.');

const fallbackContext = {
  QUESTION_KINDS: {
    functionToRatio: 'function-to-ratio',
    ratioToFunction: 'ratio-to-function'
  },
  getAllowedSideSymbols: function(task) {
    return task.allowedSymbols;
  }
};
vm.createContext(fallbackContext);
vm.runInContext([
  getFunctionSource(appSource, 'normalizeAnswer'),
  getFunctionSource(appSource, 'normalizeExactFallbackAnswer'),
  getFunctionSource(appSource, 'exactAnswerCheck')
].join('\n'), fallbackContext);

const sideTask = {
  questionKind: fallbackContext.QUESTION_KINDS.functionToRatio,
  allowedSymbols: ['a', 'b', 'c'],
  acceptedAnswers: ['a/c']
};
const trigTask = {
  questionKind: fallbackContext.QUESTION_KINDS.ratioToFunction,
  acceptedAnswers: ['sin(alpha)', 'cos(beta)', '1/tan(alpha)']
};

for (const answer of ['a/c', ' A : C ', String.raw`\frac{a}{c}`, '(a)/(c)']) {
  assert.equal(fallbackContext.exactAnswerCheck(answer, sideTask), true, answer);
}
for (const answer of ['a/c()', 'a/(c', '(a/c', 'a//c', 'a*c']) {
  assert.equal(fallbackContext.exactAnswerCheck(answer, sideTask), false, answer);
}
for (const answer of [
  'sin(alpha)',
  String.raw`\sin\left(\alpha\right)`,
  'cos(beta)',
  '1/tan(alpha)'
]) {
  assert.equal(fallbackContext.exactAnswerCheck(answer, trigTask), true, answer);
}
for (const answer of [
  'sin()alpha',
  'sin()alpha)',
  'sin((alpha))',
  'sin(alpha)()',
  'cos(gamma)'
]) {
  assert.equal(fallbackContext.exactAnswerCheck(answer, trigTask), false, answer);
}

async function verifyWorkerLifecycle() {
  const workers = [];
  const timers = new Map();
  let nextTimerId = 0;

  class FakeWorker {
    constructor(url, options) {
      this.url = url;
      this.options = options;
      this.listeners = new Map();
      this.messages = [];
      this.terminated = false;
      workers.push(this);
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    postMessage(message) {
      this.messages.push(message);
    }

    terminate() {
      this.terminated = true;
    }

    emit(type, data) {
      const listener = this.listeners.get(type);
      if (listener) {
        listener(type === 'message' ? { data } : data);
      }
    }
  }

  const lifecycleContext = {
    ANSWER_CHECK_TIMEOUT_MS: 5,
    ANSWER_MAX_LENGTH: Number(appLengthMatch[1]),
    APP_VERSION: 'test-version',
    Worker: FakeWorker,
    answerCheckerFailed: false,
    answerCheckerRequestId: 0,
    answerCheckerWorker: null,
    console: { warn: function() {} },
    fallbackAnswerCheck: function(rawValue, task, error) {
      return { correct: false, checker: 'exact-fallback', error: error || null };
    },
    getAllowedSideSymbols: function() { return ['a', 'b', 'c']; },
    getAngleDefinitions: function() { return []; },
    getCheckerMode: function() { return 'side-ratio'; },
    getExpectedAnswer: function() { return 'a/c'; },
    pendingAnswerChecks: new Map(),
    ratioToInput: function() { return 'a/c'; },
    window: {
      Worker: FakeWorker,
      clearTimeout: function(id) { timers.delete(id); },
      setTimeout: function(callback) {
        const id = ++nextTimerId;
        timers.set(id, callback);
        return id;
      }
    }
  };
  vm.createContext(lifecycleContext);
  vm.runInContext([
    getFunctionSource(appSource, 'invalidInputResult'),
    getFunctionSource(appSource, 'resolvePendingAnswerChecksWithFallback'),
    getFunctionSource(appSource, 'handleAnswerCheckerMessage'),
    getFunctionSource(appSource, 'terminateAnswerCheckerWorker'),
    getFunctionSource(appSource, 'restartAnswerCheckerAfterTimeout'),
    getFunctionSource(appSource, 'initializeAnswerChecker'),
    getFunctionSource(appSource, 'checkAnswer')
  ].join('\n'), lifecycleContext);

  lifecycleContext.initializeAnswerChecker();
  assert.equal(workers.length, 1);
  const firstWorker = workers[0];

  const oversizedResult = await lifecycleContext.checkAnswer(
    'a'.repeat(Number(appLengthMatch[1]) + 1),
    {}
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(oversizedResult)),
    { correct: false, checker: 'client-input-limit', invalidInput: true }
  );
  assert.equal(firstWorker.messages.length, 0, 'Oversized input reached the worker.');

  const timedOutPromise = lifecycleContext.checkAnswer('a/c', {});
  assert.equal(firstWorker.messages.length, 1);
  const firstTimeoutId = [...timers.keys()][0];
  const firstTimeout = timers.get(firstTimeoutId);
  timers.delete(firstTimeoutId);
  firstTimeout();
  const timedOutResult = await timedOutPromise;
  assert.equal(timedOutResult.correct, false);
  assert.equal(timedOutResult.checker, 'exact-fallback');
  assert.equal(firstWorker.terminated, true, 'Timed-out worker was not terminated.');
  assert.equal(workers.length, 2, 'Timed-out worker was not replaced.');
  assert.equal(lifecycleContext.pendingAnswerChecks.size, 0);

  const replacementWorker = workers[1];
  firstWorker.emit('message', { type: 'ready-error', error: 'stale worker event' });
  assert.equal(lifecycleContext.answerCheckerWorker, replacementWorker);
  assert.equal(lifecycleContext.answerCheckerFailed, false);

  const recoveredPromise = lifecycleContext.checkAnswer('a/c', {});
  const recoveredRequest = replacementWorker.messages[0];
  replacementWorker.emit('message', {
    type: 'check-result',
    id: recoveredRequest.id,
    result: { correct: true, checker: 'fake-recovered-worker' }
  });
  const recoveredResult = await recoveredPromise;
  assert.equal(recoveredResult.correct, true);
  assert.equal(recoveredResult.checker, 'fake-recovered-worker');
  assert.equal(lifecycleContext.pendingAnswerChecks.size, 0);
  assert.equal(timers.size, 0);
  lifecycleContext.terminateAnswerCheckerWorker(replacementWorker);
}

const checkerMatch = workerSource.match(
  /const CHECKER_PYTHON = String\.raw`([\s\S]*?)`;\n/
);
assert.ok(checkerMatch, 'Could not extract CHECKER_PYTHON.');

const pythonRegressionTests = String.raw`
def regression_payload(mode, user_answer):
    return {
        "mode": mode,
        "userAnswer": user_answer,
        "expectedAnswer": "a/c",
        "targetRatio": "a/c",
        "allowedSymbols": ["a", "b", "c"],
        "angleDefinitions": [
            {
                "name": "alpha",
                "aliases": [],
                "ratios": {"sin": "a/c", "cos": "b/c", "tan": "a/b"},
            },
            {
                "name": "beta",
                "aliases": [],
                "ratios": {"sin": "b/c", "cos": "a/c", "tan": "b/a"},
            },
        ],
    }


def run_regression_case(mode, user_answer):
    payload = regression_payload(mode, user_answer)
    return json.loads(check_ratio_json(json.dumps(payload)))


for invalid_side_answer in ["a/c()", "a/(c", ""]:
    invalid_result = run_regression_case("side-ratio", invalid_side_answer)
    assert invalid_result["correct"] is False, invalid_result
    assert invalid_result["invalidInput"] is True, invalid_result

unsupported_side_result = run_regression_case("side-ratio", "a//c")
assert unsupported_side_result["correct"] is False, unsupported_side_result

for invalid_trig_answer in ["sin()alpha", "sin()alpha)", "sin(2*alpha)", "sin(gamma)"]:
    invalid_result = run_regression_case("trig-expression", invalid_trig_answer)
    assert invalid_result["correct"] is False, invalid_result
    assert invalid_result["invalidInput"] is True, invalid_result

for guarded_side_answer in [
    "9^99999999",
    "9^9^9",
    "a^13/c",
    "a^b/c",
    "(" * 9 + "a/c" + ")" * 9,
    "+".join(["a"] * 70),
    "a" * (MAX_EXPRESSION_INPUT_LENGTH + 1),
]:
    guarded_result = run_regression_case("side-ratio", guarded_side_answer)
    assert guarded_result["correct"] is False, guarded_result
    assert guarded_result["invalidInput"] is True, guarded_result

for valid_side_answer in [
    "a/c",
    "2*a/(2*c)",
    "a*c/c^2",
    "a^12/(a^11*c)",
    r"\frac{a}{c}",
]:
    valid_result = run_regression_case("side-ratio", valid_side_answer)
    assert valid_result["correct"] is True, valid_result
    assert not valid_result.get("invalidInput", False), valid_result

for valid_trig_answer in ["sin(alpha)", "cos(beta)"]:
    valid_result = run_regression_case("trig-expression", valid_trig_answer)
    assert valid_result["correct"] is True, valid_result
    assert not valid_result.get("invalidInput", False), valid_result

wrong_result = run_regression_case("trig-expression", "cos(alpha)")
assert wrong_result["correct"] is False, wrong_result
assert not wrong_result.get("invalidInput", False), wrong_result
`;

const pythonExecutable = process.env.PYTHON || 'python3';

async function main() {
  await verifyWorkerLifecycle();
  const pythonResult = childProcess.spawnSync(
    pythonExecutable,
    ['-c', `${checkerMatch[1]}\n${pythonRegressionTests}`],
    {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    }
  );
  if (pythonResult.error) {
    throw pythonResult.error;
  }
  assert.equal(
    pythonResult.status,
    0,
    `${pythonResult.stdout || ''}${pythonResult.stderr || ''}`.trim()
  );
  console.log('Answer checker regression tests passed');
}

main().catch(function(error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
