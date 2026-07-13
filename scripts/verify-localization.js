'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function getFunctionSource(functionName) {
  const match = appSource.match(
    new RegExp(`function ${functionName}\\([^\\n]*\\) \\{([\\s\\S]*?)\\n\\}`)
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

assert.match(appSource, /title: 'Neue Version verfügbar'/);
assert.match(
  appSource,
  /body: 'Cette page a chargé le HTML et le JavaScript de versions différentes\. Veuillez recharger la page\.'/
);
assert.doesNotMatch(appSource, /verfuegbar|a charge|versions differentes/);
assert.match(indexSource, /<html lang="de">/);
assert.match(
  indexSource,
  /<div class="language-switcher" role="group" aria-label="Sprachauswahl">/
);
assert.match(indexSource, /<legend id="labelFontSizeLegend">Beschriftungsgröße<\/legend>/);
assert.match(
  indexSource,
  /id="labelFontSize22" type="radio" name="labelFontSize" value="22" checked/
);
assert.match(appSource, /labelFontSizeLegend: 'Beschriftungsgröße'/);
assert.match(appSource, /labelFontSizeLegend: 'Label size'/);
assert.match(appSource, /labelFontSizeLegend: 'Taille des étiquettes'/);
assert.match(
  getFunctionSource('applyLanguage'),
  /controls\.labelFontSizeLegend\.textContent = texts\.intro\.labelFontSizeLegend/
);

let inputModeUpdateCount = 0;
let helperClearCount = 0;
let helperRenderCount = 0;
const renderedMath = [];
const answerInputAttributes = {};

const controls = {
  answerHelpers: {
    classList: new FakeClassList('hidden'),
    innerHTML: 'stale helpers'
  },
  answerInput: {
    placeholder: '',
    setAttribute: function(name, value) {
      answerInputAttributes[name] = value;
      if (name === 'aria-label') {
        inputModeUpdateCount += 1;
      }
    }
  },
  solution: {
    classList: new FakeClassList('hidden')
  },
  taskQuestion: {
    innerHTML: ''
  }
};

const context = {
  clearMathContent: function(element) {
    helperClearCount += 1;
    element.innerHTML = '';
  },
  controls,
  getQuestionLatex: function() { return 'question-fr'; },
  getSolutionLatex: function() { return 'solution-fr'; },
  getTextBundle: function() {
    return {
      quiz: {
        answerRatioAria: 'Réponse sous forme de rapport de côtés',
        answerRatioPlaceholder: 'p. ex. a/c',
        answerTrigAria: 'Réponse sous forme d’expression trigonométrique',
        answerTrigPlaceholder: 'p. ex. sin(alpha)'
      }
    };
  },
  renderAnswerHelpers: function() {
    helperRenderCount += 1;
  },
  renderMath: function(element, latex) {
    renderedMath.push({ element, latex });
  }
};
vm.createContext(context);

vm.runInContext(`
  const QUESTION_KINDS = {
    functionToRatio: 'function-to-ratio',
    ratioToFunction: 'ratio-to-function'
  };
  let currentTask = { questionKind: QUESTION_KINDS.ratioToFunction };
  let roundStarted = false;

  ${getFunctionSource('setAnswerInputMode')}
  ${getFunctionSource('refreshCurrentMathAfterLanguageChange')}

  this.localization = {
    refreshCurrentMathAfterLanguageChange,
    setCurrentTask: function(task) { currentTask = task; },
    setRoundStarted: function(started) { roundStarted = started; }
  };
`, context);

context.localization.refreshCurrentMathAfterLanguageChange();
assert.equal(inputModeUpdateCount, 1);
assert.equal(controls.answerInput.placeholder, 'p. ex. sin(alpha)');
assert.equal(
  answerInputAttributes['aria-label'],
  'Réponse sous forme d’expression trigonométrique'
);
assert.equal(controls.answerHelpers.classList.contains('hidden'), true);
assert.equal(controls.answerHelpers.innerHTML, '');
assert.equal(helperClearCount, 1);
assert.equal(helperRenderCount, 0);
assert.equal(renderedMath.length, 0, 'Pre-start language refresh rendered a hidden question.');

context.localization.setRoundStarted(true);
context.localization.refreshCurrentMathAfterLanguageChange();
assert.equal(inputModeUpdateCount, 2);
assert.equal(helperClearCount, 1);
assert.equal(helperRenderCount, 1);
assert.equal(renderedMath.length, 1);
assert.equal(renderedMath[0].element, controls.taskQuestion);
assert.equal(renderedMath[0].latex, 'question-fr');

controls.solution.classList.remove('hidden');
context.localization.refreshCurrentMathAfterLanguageChange();
assert.equal(inputModeUpdateCount, 3);
assert.equal(helperRenderCount, 2);
assert.equal(renderedMath.length, 3);
assert.equal(renderedMath[2].element, controls.solution);
assert.equal(renderedMath[2].latex, 'solution-fr');

context.localization.setCurrentTask(null);
context.localization.refreshCurrentMathAfterLanguageChange();
assert.equal(inputModeUpdateCount, 3);
assert.equal(helperRenderCount, 2);
assert.equal(renderedMath.length, 3);

console.log('Localization and pre-start language-state tests passed');
