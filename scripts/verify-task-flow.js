'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');

function getFunctionSource(functionName) {
  const match = appSource.match(
    new RegExp(`(?:async\\s+)?function ${functionName}\\([^\\n]*\\) \\{([\\s\\S]*?)\\n\\}`)
  );
  assert.ok(match, `Missing function ${functionName}().`);
  return match[0];
}

class FakeClassList {
  constructor(...initialValues) {
    this.values = new Set(initialValues);
  }

  add(...values) {
    values.forEach(value => this.values.add(value));
  }

  remove(...values) {
    values.forEach(value => this.values.delete(value));
  }

  contains(value) {
    return this.values.has(value);
  }
}

function createControl(...classes) {
  return {
    classList: new FakeClassList(...classes),
    disabled: false,
    focusCount: 0,
    textContent: '',
    title: '',
    value: '',
    focus: function() {
      this.focusCount += 1;
    }
  };
}

async function main() {
  let now = 1000;
  let buildCount = 0;
  let renderCount = 0;
  let shownScreen = null;
  let resultUpdateCount = 0;
  let activeInterval = null;

  const controls = {
    answerForm: createControl('hidden'),
    answerHelpers: createControl('hidden'),
    answerInput: createControl(),
    beginRoundButton: createControl(),
    checkButton: createControl(),
    feedback: createControl('hidden'),
    newRoundButton: createControl(),
    nextButton: createControl(),
    roundStartPanel: createControl(),
    scoreCounter: createControl(),
    solution: createControl('hidden'),
    taskQuestion: createControl()
  };

  const context = {
    buildTask: function() {
      buildCount += 1;
      return { id: buildCount };
    },
    checkAnswer: async function() {
      return { correct: true, checker: 'task-flow-test' };
    },
    clearMathContent: function() {},
    clearMathContentNow: function() {},
    controls,
    focusActiveQuizControl: function() {},
    getQuestionLatex: function(task) { return `question-${task.id}`; },
    getSolutionLatex: function(task) { return `solution-${task.id}`; },
    getTextBundle: function() {
      return {
        quiz: {
          correct: 'Correct',
          incorrect: 'Incorrect',
          nextTask: 'Next',
          nextTaskTitle: 'Next title',
          scoreCounter: (correct, answered) => `${correct}/${answered}`,
          showResult: 'Result',
          showResultTitle: 'Result title'
        }
      };
    },
    performance: { now: function() { return now; } },
    readRightAngleMarkerSetting: function() { return 'arcDot'; },
    renderAnswerHelpers: function() {},
    renderMath: function(element, latex) { element.renderedLatex = latex; },
    renderTriangle: function() { renderCount += 1; },
    setAnswerInputMode: function() {},
    showScreen: function(name) { shownScreen = name; },
    updateCheckButtonText: function() {},
    updateResultText: function() { resultUpdateCount += 1; },
    updateTaskCounter: function() {},
    updateTimeCounter: function() {},
    window: {
      clearInterval: function(id) {
        if (activeInterval === id) {
          activeInterval = null;
        }
      },
      setInterval: function(callback) {
        activeInterval = { callback };
        return activeInterval;
      },
      setTimeout: function(callback) {
        callback();
        return 1;
      }
    }
  };
  vm.createContext(context);

  const functionNames = [
    'scoreCurrentTask',
    'setSolvedState',
    'clearSolvedState',
    'updateScoreCounter',
    'startRoundTimer',
    'stopRoundTimer',
    'updateNextButtonForTask',
    'hideQuestionUntilRoundStart',
    'showCurrentQuestion',
    'newTask',
    'setCheckingState',
    'submitAnswer',
    'goToNextTask',
    'showRoundResult',
    'beginRound',
    'startNewRound',
    'startTriangleQuiz'
  ];

  vm.runInContext(`
    const QUESTIONS_PER_ROUND = 10;
    const TIMER_UPDATE_INTERVAL_MS = 250;
    const RIGHT_ANGLE_MARKERS = { arcDot: 'arcDot', square: 'square' };
    let currentTask = null;
    let currentTaskScored = false;
    let taskNumber = 0;
    let correctAnswers = 0;
    let answeredQuestions = 0;
    let roundFinished = false;
    let roundStarted = false;
    let roundStartTimestamp = 0;
    let roundElapsedMs = 0;
    let timerIntervalId = null;
    let rightAngleMarker = RIGHT_ANGLE_MARKERS.arcDot;
    let answerCheckInProgress = false;

    ${functionNames.map(getFunctionSource).join('\n\n')}

    this.flow = {
      beginRound,
      goToNextTask,
      startNewRound,
      startTriangleQuiz,
      submitAnswer,
      state: function() {
        return {
          answeredQuestions,
          answerCheckInProgress,
          correctAnswers,
          currentTask,
          currentTaskScored,
          roundElapsedMs,
          roundFinished,
          roundStarted,
          taskNumber,
          timerIntervalId
        };
      }
    };
  `, context);

  const flow = context.flow;
  flow.startNewRound();
  let state = flow.state();
  assert.equal(shownScreen, 'quiz');
  assert.equal(state.taskNumber, 1);
  assert.equal(state.roundStarted, false);
  assert.equal(state.currentTaskScored, false);
  assert.equal(controls.roundStartPanel.classList.contains('hidden'), false);
  assert.equal(controls.answerForm.classList.contains('hidden'), true);
  assert.equal(controls.nextButton.disabled, true);
  assert.equal(renderCount, 1);

  const firstTask = state.currentTask;
  flow.startTriangleQuiz();
  state = flow.state();
  assert.equal(state.currentTask, firstTask, 'Reopening the quiz reset the pending round.');
  assert.equal(state.taskNumber, 1);
  assert.equal(renderCount, 2);

  flow.beginRound();
  state = flow.state();
  assert.equal(state.roundStarted, true);
  assert.ok(state.timerIntervalId, 'Round timer did not start.');
  assert.equal(controls.roundStartPanel.classList.contains('hidden'), true);
  assert.equal(controls.answerForm.classList.contains('hidden'), false);
  assert.equal(controls.nextButton.disabled, false);

  controls.answerInput.value = 'correct answer';
  let prevented = false;
  await flow.submitAnswer({ preventDefault: function() { prevented = true; } });
  state = flow.state();
  assert.equal(prevented, true);
  assert.equal(state.answeredQuestions, 1);
  assert.equal(state.correctAnswers, 1);
  assert.equal(state.currentTaskScored, true);
  assert.equal(state.answerCheckInProgress, false);
  assert.equal(controls.answerInput.disabled, true);
  assert.equal(controls.checkButton.disabled, true);
  assert.equal(controls.feedback.classList.contains('correct'), true);
  assert.equal(controls.solution.classList.contains('hidden'), false);
  assert.equal(controls.nextButton.disabled, false);
  assert.equal(controls.scoreCounter.textContent, '1/1');

  await flow.submitAnswer({ preventDefault: function() {} });
  state = flow.state();
  assert.equal(state.answeredQuestions, 1, 'A solved task was scored twice.');

  flow.goToNextTask();
  state = flow.state();
  assert.equal(state.taskNumber, 2);
  assert.equal(state.answeredQuestions, 1);
  assert.equal(state.currentTaskScored, false);
  assert.equal(controls.answerInput.disabled, false);

  flow.goToNextTask();
  state = flow.state();
  assert.equal(state.taskNumber, 3);
  assert.equal(state.answeredQuestions, 2, 'Skipped task was not scored as incorrect.');
  assert.equal(state.correctAnswers, 1);

  while (flow.state().taskNumber < 10) {
    flow.goToNextTask();
  }
  state = flow.state();
  assert.equal(state.taskNumber, 10);
  assert.equal(state.answeredQuestions, 9);
  assert.equal(controls.nextButton.textContent, 'Result');

  now = 4567;
  flow.goToNextTask();
  state = flow.state();
  assert.equal(state.answeredQuestions, 10);
  assert.equal(state.correctAnswers, 1);
  assert.equal(state.currentTask, null);
  assert.equal(state.roundFinished, true);
  assert.equal(state.roundStarted, false);
  assert.equal(state.roundElapsedMs, 3567);
  assert.equal(state.timerIntervalId, null);
  assert.equal(shownScreen, 'result');
  assert.equal(resultUpdateCount, 1);

  flow.startNewRound();
  state = flow.state();
  assert.equal(state.taskNumber, 1);
  assert.equal(state.answeredQuestions, 0);
  assert.equal(state.correctAnswers, 0);
  assert.equal(state.roundFinished, false);
  assert.equal(state.roundStarted, false);
  assert.equal(controls.scoreCounter.textContent, '0/0');

  console.log('Quiz answer and ten-question task-flow tests passed');
}

main().catch(function(error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
