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

  toggle(value, force) {
    const shouldAdd = typeof force === 'boolean' ? force : !this.values.has(value);
    if (shouldAdd) this.values.add(value);
    else this.values.delete(value);
    return shouldAdd;
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
assert.match(indexSource, /id="introDisplayTitle" class="intro-field-title">Dreiecksdarstellung<\/div>/);
assert.match(
  indexSource,
  /id="startUnitCircleDescription" class="intro-choice-description">Quiz zu Vorzeichen und Winkelbereichen von Sinus und Kosinus/
);
assert.doesNotMatch(indexSource, /placeholderScreen|placeholderText|placeholderBackButton/);
assert.match(
  indexSource,
  /id="labelFontSize22" type="radio" name="labelFontSize" value="22" checked/
);
assert.match(appSource, /labelFontSizeLegend: 'Beschriftungsgröße'/);
assert.match(appSource, /labelFontSizeLegend: 'Label size'/);
assert.match(appSource, /labelFontSizeLegend: 'Taille des étiquettes'/);
assert.match(appSource, /unitCircleDescription: 'Quiz about signs and angle regions for sine and cosine'/);
assert.match(appSource, /unitCircleDescription: 'Quiz sur les signes et les intervalles angulaires du sinus et du cosinus'/);
assert.match(appSource, /unitCircleSignsToRegionInstruction: 'Bestimme den Bereich des Winkels\.'/);
assert.match(appSource, /unitCircleAngleToSignsInstruction: 'Determine the signs of sine and cosine\.'/);
assert.match(appSource, /unitCircleAngleToSignsInstruction: 'Détermine les signes du sinus et du cosinus\.'/);
assert.match(
  getFunctionSource('applyLanguage'),
  /controls\.labelFontSizeLegend\.textContent = texts\.intro\.labelFontSizeLegend/
);
assert.match(
  indexSource,
  /id="mathJaxRegularRenderTitle" class="render-title">1\. Inline-SVG \+ MathJax — regulär/
);
assert.match(
  indexSource,
  /id="kaTeXRegularRenderTitle" class="render-title">2\. Inline-SVG \+ KaTeX — regulär/
);
assert.match(
  indexSource,
  /id="mathJaxBoldRenderTitle" class="render-title">3\. Inline-SVG \+ MathJax — fett/
);
assert.match(
  indexSource,
  /id="kaTeXBoldRenderTitle" class="render-title">4\. Inline-SVG \+ KaTeX — fett/
);
assert.match(
  indexSource,
  /id="renderComparisonNote" class="render-comparison-note hidden">Identische Geometrie und MathJax-kalibrierte Positionen; Renderer und Schriftvariante werden für jede aktive Darstellung explizit gewählt\./
);
assert.match(
  appSource,
  /renderComparisonNote: 'Identical geometry and MathJax-calibrated positions; the renderer and font variant are selected explicitly for each active diagram\.'/
);
assert.match(
  appSource,
  /renderComparisonNote: 'Géométrie et positions calibrées pour MathJax identiques ; le moteur de rendu et la variante de police sont choisis explicitement pour chaque représentation active\.'/
);
assert.match(indexSource, /id="triangleStage" class="triangle-stage" aria-label="Dreiecksdarstellung"/);
assert.match(appSource, /triangleStageSingleAria: 'Dreiecksdarstellung'/);
assert.match(appSource, /triangleStageComparisonAria: 'Vergleich der aktivierten Dreiecksdarstellungen'/);
assert.match(appSource, /triangleStageSingleAria: 'Triangle diagram'/);
assert.match(appSource, /triangleStageComparisonAria: 'Comparison of the enabled triangle diagrams'/);
assert.match(appSource, /triangleStageSingleAria: 'Représentation du triangle'/);
assert.match(appSource, /triangleStageComparisonAria: 'Comparaison des représentations du triangle activées'/);
const applyLanguageSource = getFunctionSource('applyLanguage');
assert.match(
  applyLanguageSource,
  /updateGeometryRenderVariantUi\(texts\.quiz\)/
);
assert.match(
  applyLanguageSource,
  /controls\.unitCircleRenderTitle\.textContent = texts\.quiz\.unitCircleRenderTitle/
);

const rendererUiSource = getFunctionSource('updateGeometryRenderVariantUi');
assert.match(
  rendererUiSource,
  /controls\.renderComparisonNote\.textContent = texts\.renderComparisonNote/
);
assert.match(
  rendererUiSource,
  /variant\.title\.textContent = texts\[variant\.titleTextKey\]/
);
assert.match(
  rendererUiSource,
  /showComparison \? texts\.triangleStageComparisonAria : texts\.triangleStageSingleAria/
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
  taskInstruction: {
    textContent: ''
  },
  triangleAnswerArea: {
    classList: new FakeClassList()
  },
  unitCircleAnswerArea: {
    classList: new FakeClassList('hidden'),
    querySelector: function() { return null; },
    querySelectorAll: function() { return []; }
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
  isUnitCircleTask: function() { return false; },
  readCurrentAnswer: function() { return ''; },
  renderUnitCircleAnswerControls: function() {},
  setAnswerControlsDisabled: function() {},
  getTaskInstruction: function() { return 'instruction-fr'; },
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
  let currentTaskScored = false;
  let answerCheckInProgress = false;

  ${getFunctionSource('setAnswerInputMode')}
  ${getFunctionSource('refreshCurrentMathAfterLanguageChange')}

  this.localization = {
    refreshCurrentMathAfterLanguageChange,
    setCurrentTask: function(task) { currentTask = task; },
    setRoundStarted: function(started) { roundStarted = started; }
  };
`, context);

context.localization.refreshCurrentMathAfterLanguageChange();
assert.equal(inputModeUpdateCount, 0);
assert.equal(controls.answerInput.placeholder, '');
assert.equal(answerInputAttributes['aria-label'], undefined);
assert.equal(controls.answerHelpers.classList.contains('hidden'), true);
assert.equal(controls.answerHelpers.innerHTML, '');
assert.equal(helperClearCount, 1);
assert.equal(helperRenderCount, 0);
assert.equal(renderedMath.length, 0, 'Pre-start language refresh rendered a hidden question.');

context.localization.setRoundStarted(true);
context.localization.refreshCurrentMathAfterLanguageChange();
assert.equal(inputModeUpdateCount, 1);
assert.equal(controls.answerInput.placeholder, 'p. ex. sin(alpha)');
assert.equal(
  answerInputAttributes['aria-label'],
  'Réponse sous forme d’expression trigonométrique'
);
assert.equal(helperClearCount, 2);
assert.equal(helperRenderCount, 1);
assert.equal(controls.taskInstruction.textContent, 'instruction-fr');
assert.equal(renderedMath.length, 1);
assert.equal(renderedMath[0].element, controls.taskQuestion);
assert.equal(renderedMath[0].latex, 'question-fr');

controls.solution.classList.remove('hidden');
context.localization.refreshCurrentMathAfterLanguageChange();
assert.equal(inputModeUpdateCount, 2);
assert.equal(helperClearCount, 3);
assert.equal(helperRenderCount, 2);
assert.equal(renderedMath.length, 3);
assert.equal(renderedMath[2].element, controls.solution);
assert.equal(renderedMath[2].latex, 'solution-fr');

context.localization.setCurrentTask(null);
context.localization.refreshCurrentMathAfterLanguageChange();
assert.equal(inputModeUpdateCount, 2);
assert.equal(helperRenderCount, 2);
assert.equal(renderedMath.length, 3);

console.log('Localization and pre-start language-state tests passed');
