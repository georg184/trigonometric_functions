let ggbApplet = null;
let appletBuildStarted = false;
let currentLanguage = 'de';
let currentView = 'intro';
let currentContext = 'triangle';
let lastValidB = 1;

const LANGUAGE_STORAGE_KEY = 'trigonometric-functions-language';
const TWO_PI = Math.PI * 2;
const DEFAULT_VIEW = {
  xmin: -6.6,
  xmax: 6.6,
  ymin: -4,
  ymax: 4
};

const DEFAULT_PARAMETERS = {
  a: 1,
  b: 1,
  c: 0,
  d: 0,
  x: Math.PI / 4
};

const COLORS = {
  base: { r: 31, g: 35, b: 40 },
  transformed: { r: 46, g: 160, b: 67 },
  point: { r: 191, g: 135, b: 0 }
};

const FUNCTIONS = {
  sin: {
    value: 'sin',
    ggbName: 'sin',
    latexName: '\\sin',
    basePeriod: TWO_PI,
    basePeriodLatex: '2\\pi',
    hasAmplitude: true,
    de: 'Sinus',
    en: 'Sine'
  },
  cos: {
    value: 'cos',
    ggbName: 'cos',
    latexName: '\\cos',
    basePeriod: TWO_PI,
    basePeriodLatex: '2\\pi',
    hasAmplitude: true,
    de: 'Kosinus',
    en: 'Cosine'
  },
  tan: {
    value: 'tan',
    ggbName: 'tan',
    latexName: '\\tan',
    basePeriod: Math.PI,
    basePeriodLatex: '\\pi',
    hasAmplitude: false,
    de: 'Tangens',
    en: 'Tangent'
  }
};

const CONTEXTS = {
  triangle: 'triangle',
  unitCircle: 'unitCircle'
};

const controls = {
  mainHeading: document.getElementById('mainHeading'),
  introScreen: document.getElementById('introScreen'),
  appScreen: document.getElementById('appScreen'),
  startButton: document.getElementById('startButton'),
  langDeButton: document.getElementById('langDeButton'),
  langEnButton: document.getElementById('langEnButton'),
  introContextTitle: document.getElementById('introContextTitle'),
  introTriangleContext: document.getElementById('introTriangleContext'),
  introCircleContext: document.getElementById('introCircleContext'),
  introTriangleChoice: document.getElementById('introTriangleChoice'),
  introCircleChoice: document.getElementById('introCircleChoice'),
  introTriangleTitle: document.getElementById('introTriangleTitle'),
  introTriangleDescription: document.getElementById('introTriangleDescription'),
  introCircleTitle: document.getElementById('introCircleTitle'),
  introCircleDescription: document.getElementById('introCircleDescription'),
  introFunctionTitle: document.getElementById('introFunctionTitle'),
  introFunctionSelect: document.getElementById('introFunctionSelect'),
  introFormulaLabel: document.getElementById('introFormulaLabel'),
  introFormula: document.getElementById('introFormula'),
  introGraphLabel: document.getElementById('introGraphLabel'),
  introGraphText: document.getElementById('introGraphText'),
  functionSelect: document.getElementById('functionSelect'),
  appFunctionTypeLabel: document.getElementById('appFunctionTypeLabel'),
  probeLabel: document.getElementById('probeLabel'),
  formulaTitle: document.getElementById('formulaTitle'),
  formulaMain: document.getElementById('formulaMain'),
  paramTitle: document.getElementById('paramTitle'),
  aDescription: document.getElementById('aDescription'),
  bDescription: document.getElementById('bDescription'),
  cDescription: document.getElementById('cDescription'),
  dDescription: document.getElementById('dDescription'),
  aRange: document.getElementById('aRange'),
  aNumber: document.getElementById('aNumber'),
  bRange: document.getElementById('bRange'),
  bNumber: document.getElementById('bNumber'),
  cRange: document.getElementById('cRange'),
  cNumber: document.getElementById('cNumber'),
  dRange: document.getElementById('dRange'),
  dNumber: document.getElementById('dNumber'),
  xRange: document.getElementById('xRange'),
  xNumber: document.getElementById('xNumber'),
  resetButton: document.getElementById('resetButton'),
  status: document.getElementById('status'),
  visualTitle: document.getElementById('visualTitle'),
  unitCircleCanvas: document.getElementById('unitCircleCanvas'),
  factsTitle: document.getElementById('factsTitle'),
  factsGrid: document.getElementById('factsGrid'),
  probeValues: document.getElementById('probeValues')
};

const TEXT = {
  de: {
    pageTitle: 'Trigonometrische Funktionen',
    heading: 'Trigonometrische Funktionen',
    intro: {
      chooseContext: 'Wähle den Zugang',
      contexts: {
        triangle: {
          title: 'am rechtwinkligen Dreieck',
          description: 'Seitenverhältnisse im rechtwinkligen Dreieck',
          representationText: 'Graph, rechtwinkliges Dreieck und Kennwerte'
        },
        unitCircle: {
          title: 'am Einheitskreis',
          description: 'Koordinaten und Winkel am Einheitskreis',
          representationText: 'Graph, Einheitskreis und Kennwerte'
        }
      },
      chooseFunction: 'Wähle eine Grundfunktion',
      model: 'Modell',
      representation: 'Darstellung',
      start: 'Start'
    },
    app: {
      functionType: 'Grundfunktion:',
      probe: 'Abtastwert:',
      formula: 'Funktionsgleichung:',
      parameters: 'Parameter',
      parameterDescriptions: {
        a: 'Streckung und Spiegelung in y-Richtung mit <span class="param-name">a</span>',
        b: 'Frequenzfaktor <span class="param-name">b</span> mit <span class="param-name">b</span> != 0',
        c: 'Verschiebung in x-Richtung um <span class="param-name">c</span>',
        d: 'Verschiebung in y-Richtung um <span class="param-name">d</span>'
      },
      reset: 'Zurücksetzen',
      rightTriangle: 'Rechtwinkliges Dreieck',
      unitCircle: 'Einheitskreis',
      facts: 'Kennwerte'
    },
    facts: {
      amplitude: 'Amplitude',
      period: 'Periode',
      phaseShift: 'Phase',
      midline: 'Mittellinie',
      range: 'Wertebereich',
      domain: 'Definitionsmenge',
      asymptotes: 'Asymptoten',
      none: 'nicht definiert'
    },
    probeTable: {
      x: 'x',
      theta: 'Innenwinkel',
      base: 'Grundwert',
      transformed: 'Funktionswert'
    },
    status: {
      invalidBNumber: 'Der Parameter b muss eine Zahl sein.',
      invalidBZero: 'Der Parameter b darf nicht 0 sein.',
      transformedFunctionFailed: 'Die transformierte Funktion konnte nicht erzeugt werden.'
    },
    aria: {
      formula: 'Funktionsgleichung',
      rightTriangle: 'Rechtwinkliges Dreieck',
      unitCircle: 'Einheitskreis'
    },
    canvas: {
      sin: 'sin',
      cos: 'cos',
      tan: 'tan',
      theta: 'theta',
      alpha: 'alpha',
      opposite: 'Gegenkathete',
      adjacent: 'Ankathete',
      hypotenuse: 'Hypotenuse'
    }
  },
  en: {
    pageTitle: 'Trigonometric Functions',
    heading: 'Trigonometric Functions',
    intro: {
      chooseContext: 'Choose the approach',
      contexts: {
        triangle: {
          title: 'on a right triangle',
          description: 'Side ratios in a right triangle',
          representationText: 'Graph, right triangle, and key values'
        },
        unitCircle: {
          title: 'on the unit circle',
          description: 'Coordinates and angles on the unit circle',
          representationText: 'Graph, unit circle, and key values'
        }
      },
      chooseFunction: 'Choose a base function',
      model: 'Model',
      representation: 'Representation',
      start: 'Start'
    },
    app: {
      functionType: 'Base function:',
      probe: 'Probe value:',
      formula: 'Function equation:',
      parameters: 'Parameters',
      parameterDescriptions: {
        a: 'Vertical stretch and reflection with <span class="param-name">a</span>',
        b: 'Frequency factor <span class="param-name">b</span> with <span class="param-name">b</span> != 0',
        c: 'Horizontal shift by <span class="param-name">c</span>',
        d: 'Vertical shift by <span class="param-name">d</span>'
      },
      reset: 'Reset',
      rightTriangle: 'Right triangle',
      unitCircle: 'Unit circle',
      facts: 'Key values'
    },
    facts: {
      amplitude: 'Amplitude',
      period: 'Period',
      phaseShift: 'Phase',
      midline: 'Midline',
      range: 'Range',
      domain: 'Domain',
      asymptotes: 'Asymptotes',
      none: 'not defined'
    },
    probeTable: {
      x: 'x',
      theta: 'Inner angle',
      base: 'Base value',
      transformed: 'Function value'
    },
    status: {
      invalidBNumber: 'Parameter b must be a number.',
      invalidBZero: 'Parameter b must not be 0.',
      transformedFunctionFailed: 'The transformed function could not be created.'
    },
    aria: {
      formula: 'Function equation',
      rightTriangle: 'Right triangle',
      unitCircle: 'Unit circle'
    },
    canvas: {
      sin: 'sin',
      cos: 'cos',
      tan: 'tan',
      theta: 'theta',
      alpha: 'alpha',
      opposite: 'opposite',
      adjacent: 'adjacent',
      hypotenuse: 'hypotenuse'
    }
  }
};

function getTextBundle() {
  return TEXT[currentLanguage];
}

function getCurrentFunction() {
  return FUNCTIONS[controls.functionSelect.value] || FUNCTIONS.sin;
}

function getSelectedIntroContext() {
  return controls.introCircleContext.checked ? CONTEXTS.unitCircle : CONTEXTS.triangle;
}

function getContextTitle() {
  const texts = getTextBundle();
  return currentContext === CONTEXTS.unitCircle ? texts.app.unitCircle : texts.app.rightTriangle;
}

function getContextAriaLabel() {
  const texts = getTextBundle();
  return currentContext === CONTEXTS.unitCircle ? texts.aria.unitCircle : texts.aria.rightTriangle;
}

function updateContextCards() {
  const isTriangle = currentContext === CONTEXTS.triangle;
  controls.introTriangleContext.checked = isTriangle;
  controls.introCircleContext.checked = !isTriangle;
  controls.introTriangleChoice.classList.toggle('is-active', isTriangle);
  controls.introCircleChoice.classList.toggle('is-active', !isTriangle);
}

function updateContextText() {
  const texts = getTextBundle();
  controls.introGraphText.textContent = texts.intro.contexts[currentContext].representationText;
  controls.visualTitle.textContent = getContextTitle();
  controls.unitCircleCanvas.setAttribute('aria-label', getContextAriaLabel());
}

function setIntroContext(context) {
  currentContext = context === CONTEXTS.unitCircle ? CONTEXTS.unitCircle : CONTEXTS.triangle;
  updateContextCards();
  updateContextText();
  if (currentView === 'app') {
    configureProbeRangeForContext();
    updateAllDisplays();
  }
}

function readStoredLanguage() {
  try {
    const storedLanguage = window.sessionStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage === 'de' || storedLanguage === 'en') {
      return storedLanguage;
    }
  } catch (error) {
    console.warn('Could not read stored language:', error);
  }
  return null;
}

function persistLanguage() {
  try {
    window.sessionStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  } catch (error) {
    console.warn('Could not persist language:', error);
  }
}

function buildFunctionOptionsHtml() {
  return Object.values(FUNCTIONS)
    .map(function(fn) {
      return `<option value="${fn.value}">${fn[currentLanguage]}</option>`;
    })
    .join('');
}

function refreshFunctionOptions(selectEl) {
  const currentValue = selectEl.value || 'sin';
  selectEl.innerHTML = buildFunctionOptionsHtml();
  selectEl.value = FUNCTIONS[currentValue] ? currentValue : 'sin';
}

function updateLanguageButtons() {
  const isGerman = currentLanguage === 'de';
  controls.langDeButton.classList.toggle('is-active', isGerman);
  controls.langEnButton.classList.toggle('is-active', !isGerman);
  controls.langDeButton.setAttribute('aria-pressed', isGerman ? 'true' : 'false');
  controls.langEnButton.setAttribute('aria-pressed', isGerman ? 'false' : 'true');
}

function applyLanguage() {
  const texts = getTextBundle();

  document.documentElement.lang = currentLanguage;
  document.title = texts.pageTitle;

  controls.mainHeading.textContent = texts.heading;
  controls.introContextTitle.textContent = texts.intro.chooseContext;
  controls.introTriangleTitle.textContent = texts.intro.contexts.triangle.title;
  controls.introTriangleDescription.textContent = texts.intro.contexts.triangle.description;
  controls.introCircleTitle.textContent = texts.intro.contexts.unitCircle.title;
  controls.introCircleDescription.textContent = texts.intro.contexts.unitCircle.description;
  controls.introFunctionTitle.textContent = texts.intro.chooseFunction;
  controls.introFormulaLabel.textContent = texts.intro.model;
  controls.introGraphLabel.textContent = texts.intro.representation;
  controls.startButton.textContent = texts.intro.start;

  controls.appFunctionTypeLabel.textContent = texts.app.functionType;
  controls.probeLabel.textContent = texts.app.probe;
  controls.formulaTitle.textContent = texts.app.formula;
  controls.paramTitle.textContent = texts.app.parameters;
  controls.aDescription.innerHTML = texts.app.parameterDescriptions.a;
  controls.bDescription.innerHTML = texts.app.parameterDescriptions.b;
  controls.cDescription.innerHTML = texts.app.parameterDescriptions.c;
  controls.dDescription.innerHTML = texts.app.parameterDescriptions.d;
  controls.resetButton.textContent = texts.app.reset;
  controls.factsTitle.textContent = texts.app.facts;
  controls.formulaMain.setAttribute('aria-label', texts.aria.formula);

  refreshFunctionOptions(controls.introFunctionSelect);
  refreshFunctionOptions(controls.functionSelect);
  updateContextCards();
  updateContextText();
  updateLanguageButtons();
  updateAllDisplays();
}

function setLanguage(language) {
  currentLanguage = language === 'en' ? 'en' : 'de';
  persistLanguage();
  applyLanguage();
  syncHistoryState();
}

function syncHistoryState() {
  if (!window.history || typeof window.history.replaceState !== 'function') {
    return;
  }
  window.history.replaceState({ view: currentView }, '', window.location.href);
}

function pushHistoryState(view) {
  if (!window.history || typeof window.history.pushState !== 'function') {
    return;
  }
  window.history.pushState({ view }, '', window.location.href);
}

function setStatus(message, isError = false) {
  controls.status.textContent = message;
  controls.status.className = isError ? 'status error' : 'status';
}

function clearStatus() {
  setStatus('');
}

function syncPair(rangeEl, numberEl, value) {
  const rounded = roundForInput(value);
  rangeEl.value = String(rounded);
  numberEl.value = String(rounded);
}

function configureProbeRangeForContext() {
  if (currentContext === CONTEXTS.triangle) {
    controls.xRange.min = '0';
    controls.xRange.max = String(Math.PI / 2);
    controls.xNumber.min = '0';
    controls.xNumber.max = String(Math.PI / 2);

    const currentX = getNumberValue(controls.xNumber, DEFAULT_PARAMETERS.x);
    if (currentX < 0 || currentX > Math.PI / 2) {
      syncPair(controls.xRange, controls.xNumber, DEFAULT_PARAMETERS.x);
    }
    return;
  }

  controls.xRange.min = String(-TWO_PI);
  controls.xRange.max = String(TWO_PI);
  controls.xNumber.min = String(-TWO_PI);
  controls.xNumber.max = String(TWO_PI);
}

function getNumberValue(numberEl, fallback = 0) {
  const value = Number(numberEl.value);
  return Number.isFinite(value) ? value : fallback;
}

function roundForInput(value) {
  if (!Number.isFinite(value) || Math.abs(value) < 1e-12) {
    return 0;
  }
  return Math.round(value * 1000000) / 1000000;
}

function formatNumber(value, digits = 3) {
  if (!Number.isFinite(value)) {
    return '\\text{undef.}';
  }
  if (Math.abs(value) < 1e-12) {
    return '0';
  }
  const rounded = Math.round(value * Math.pow(10, digits)) / Math.pow(10, digits);
  return String(rounded);
}

function valuesEqual(left, right) {
  return Math.abs(left - right) < 1e-9;
}

function paramToken(content) {
  return `\\param{${content}}`;
}

function renderMath(element, latex) {
  if (window.MathJax && typeof MathJax.typesetClear === 'function') {
    MathJax.typesetClear([element]);
  }
  element.innerHTML = latex;
  if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
    MathJax.typesetPromise([element]).catch(function(error) {
      console.error('MathJax rendering failed:', error);
    });
  }
}

function typesetElements(elements) {
  if (window.MathJax && typeof MathJax.typesetClear === 'function') {
    MathJax.typesetClear(elements);
  }
  if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
    MathJax.typesetPromise(elements).catch(function(error) {
      console.error('MathJax rendering failed:', error);
    });
  }
}

function getState() {
  return {
    functionName: controls.functionSelect.value || 'sin',
    a: getNumberValue(controls.aNumber, DEFAULT_PARAMETERS.a),
    b: getNumberValue(controls.bNumber, lastValidB),
    c: getNumberValue(controls.cNumber, DEFAULT_PARAMETERS.c),
    d: getNumberValue(controls.dNumber, DEFAULT_PARAMETERS.d),
    x: getNumberValue(controls.xNumber, DEFAULT_PARAMETERS.x)
  };
}

function validateB() {
  const texts = getTextBundle();
  const b = Number(controls.bNumber.value);
  if (!Number.isFinite(b)) {
    syncPair(controls.bRange, controls.bNumber, lastValidB);
    setStatus(texts.status.invalidBNumber, true);
    return false;
  }

  if (Math.abs(b) < 1e-12) {
    setStatus(texts.status.invalidBZero, true);
    return false;
  }

  lastValidB = b;
  clearStatus();
  return true;
}

function hasResettableChanges() {
  const state = getState();
  return !(
    state.functionName === 'sin' &&
    valuesEqual(state.a, DEFAULT_PARAMETERS.a) &&
    valuesEqual(state.b, DEFAULT_PARAMETERS.b) &&
    valuesEqual(state.c, DEFAULT_PARAMETERS.c) &&
    valuesEqual(state.d, DEFAULT_PARAMETERS.d) &&
    valuesEqual(state.x, DEFAULT_PARAMETERS.x)
  );
}

function updateResetButtonState() {
  controls.resetButton.disabled = !hasResettableChanges();
}

function findPiFraction(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const ratio = value / Math.PI;
  const denominators = [1, 2, 3, 4, 6, 8, 12];
  let best = null;

  for (const denominator of denominators) {
    const numerator = Math.round(ratio * denominator);
    const error = Math.abs(ratio - numerator / denominator);
    if (!best || error < best.error) {
      best = { numerator, denominator, error };
    }
  }

  if (!best || best.error > 0.003) {
    return null;
  }

  if (best.numerator === 0) {
    return { numerator: 0, denominator: 1 };
  }

  const divisor = gcd(Math.abs(best.numerator), best.denominator);
  return {
    numerator: best.numerator / divisor,
    denominator: best.denominator / divisor
  };
}

function gcd(left, right) {
  let a = left;
  let b = right;
  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a || 1;
}

function formatPiLatex(value) {
  if (!Number.isFinite(value)) {
    return '\\text{undef.}';
  }
  if (Math.abs(value) < 1e-12) {
    return '0';
  }

  const fraction = findPiFraction(value);
  if (!fraction) {
    return formatNumber(value);
  }

  const sign = fraction.numerator < 0 ? '-' : '';
  const numerator = Math.abs(fraction.numerator);
  const denominator = fraction.denominator;

  if (denominator === 1) {
    return numerator === 1 ? `${sign}\\pi` : `${sign}${numerator}\\pi`;
  }

  const top = numerator === 1 ? '\\pi' : `${numerator}\\pi`;
  return `${sign}\\frac{${top}}{${denominator}}`;
}

function formatSignedLatex(value, formatter) {
  const formatted = formatter(Math.abs(value));
  return value >= 0 ? `+ ${formatted}` : `- ${formatted}`;
}

function formatGeoGebraNumber(value) {
  if (!Number.isFinite(value) || Math.abs(value) < 1e-12) {
    return '0';
  }
  return String(Math.round(value * 1000000000) / 1000000000);
}

function buildInnerLatex(state, useValues) {
  const b = useValues ? paramToken(formatNumber(state.b)) : paramToken('b');
  const c = useValues ? paramToken(formatPiLatex(Math.abs(state.c))) : paramToken('c');
  const sign = useValues ? (state.c >= 0 ? '-' : '+') : '-';
  return `${b}\\left(x ${sign} ${c}\\right)`;
}

function buildFunctionLatex(state, useValues) {
  const fn = FUNCTIONS[state.functionName] || FUNCTIONS.sin;
  const a = useValues ? paramToken(formatNumber(state.a)) : paramToken('a');
  const d = useValues ? formatSignedLatex(state.d, function(value) {
    return paramToken(formatNumber(value));
  }) : `+ ${paramToken('d')}`;

  return `${a}\\,${fn.latexName}\\!\\left(${buildInnerLatex(state, useValues)}\\right) ${d}`;
}

function updateFormulaDisplay() {
  const state = getState();
  const symbolic = buildFunctionLatex(state, false);
  const current = buildFunctionLatex(state, true);
  const latex = String.raw`\[
    \begin{aligned}
      g(x) &= ${symbolic} \\
           &= ${current}
    \end{aligned}
  \]`;
  renderMath(controls.formulaMain, latex);
}

function evaluateBase(functionName, theta) {
  if (functionName === 'cos') {
    return Math.cos(theta);
  }
  if (functionName === 'tan') {
    const cosTheta = Math.cos(theta);
    if (Math.abs(cosTheta) < 1e-8) {
      return NaN;
    }
    return Math.tan(theta);
  }
  return Math.sin(theta);
}

function evaluateTransformed(state, xValue = state.x) {
  const theta = state.b * (xValue - state.c);
  const baseValue = evaluateBase(state.functionName, theta);
  if (!Number.isFinite(baseValue)) {
    return NaN;
  }
  return state.a * baseValue + state.d;
}

function buildFactsHtml(state) {
  const texts = getTextBundle();
  const fn = FUNCTIONS[state.functionName] || FUNCTIONS.sin;
  const rows = [];
  const absA = Math.abs(state.a);
  const absB = Math.abs(state.b);
  const period = fn.basePeriod / absB;

  function add(label, valueLatex) {
    rows.push(
      `<div class="fact-item"><div class="fact-label">${label}</div><div class="fact-value mathjax-inline">\\(${valueLatex}\\)</div></div>`
    );
  }

  if (fn.hasAmplitude) {
    add(texts.facts.amplitude, formatNumber(absA));
  } else {
    add(texts.facts.amplitude, `\\text{${texts.facts.none}}`);
  }

  add(texts.facts.period, `T=\\frac{${fn.basePeriodLatex}}{|${paramToken('b')}|}=${formatPiLatex(period)}`);
  add(texts.facts.phaseShift, `c=${formatPiLatex(state.c)}`);
  add(texts.facts.midline, `y=${formatNumber(state.d)}`);

  if (fn.hasAmplitude) {
    const lower = state.d - absA;
    const upper = state.d + absA;
    add(texts.facts.range, `\\left[${formatNumber(lower)}, ${formatNumber(upper)}\\right]`);
    add(texts.facts.domain, '\\mathbb{R}');
  } else {
    add(texts.facts.range, '\\mathbb{R}');
    add(texts.facts.domain, '\\mathbb{R}\\setminus\\left\\{c+\\frac{\\frac{\\pi}{2}+k\\pi}{b}\\mid k\\in\\mathbb{Z}\\right\\}');
    add(texts.facts.asymptotes, `x=${formatPiLatex(state.c)}+\\frac{\\frac{\\pi}{2}+k\\pi}{${formatNumber(state.b)}}`);
  }

  return rows.join('');
}

function updateFacts() {
  const state = getState();
  if (!validateB()) {
    return;
  }
  controls.factsGrid.innerHTML = buildFactsHtml(state);
  typesetElements([controls.factsGrid]);
}

function updateProbeValues() {
  const texts = getTextBundle();
  const state = getState();
  const theta = state.b * (state.x - state.c);
  const baseValue = evaluateBase(state.functionName, theta);
  const transformedValue = evaluateTransformed(state, state.x);
  const fn = FUNCTIONS[state.functionName] || FUNCTIONS.sin;
  const baseLatex = Number.isFinite(baseValue) ? formatNumber(baseValue) : '\\text{undef.}';
  const transformedLatex = Number.isFinite(transformedValue) ? formatNumber(transformedValue) : '\\text{undef.}';

  controls.probeValues.innerHTML = `
    <table class="probe-table">
      <tbody>
        <tr><th>${texts.probeTable.x}</th><td class="mathjax-inline">\\(x=${formatPiLatex(state.x)}\\)</td></tr>
        <tr><th>${texts.probeTable.theta}</th><td class="mathjax-inline">\\(\\theta=b(x-c)=${formatPiLatex(theta)}\\)</td></tr>
        <tr><th>${texts.probeTable.base}</th><td class="mathjax-inline">\\(${fn.latexName}(\\theta)=${baseLatex}\\)</td></tr>
        <tr><th>${texts.probeTable.transformed}</th><td class="mathjax-inline">\\(g(x)=${transformedLatex}\\)</td></tr>
      </tbody>
    </table>
  `;
  typesetElements([controls.probeValues]);
}

function drawUnitCircle() {
  const canvas = controls.unitCircleCanvas;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, rect.width || canvas.width);
  const height = Math.max(280, rect.height || canvas.height);
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const state = getState();
  const texts = getTextBundle();
  const theta = state.b * (state.x - state.c);
  const sinValue = Math.sin(theta);
  const cosValue = Math.cos(theta);
  const tanValue = Math.abs(cosValue) < 1e-8 ? NaN : Math.tan(theta);
  const centerX = width * 0.42;
  const centerY = height * 0.52;
  const radius = Math.min(width, height) * 0.28;

  function px(x) {
    return centerX + x * radius;
  }

  function py(y) {
    return centerY - y * radius;
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#d0d7de';
  ctx.beginPath();
  ctx.moveTo(px(-1.35), py(0));
  ctx.lineTo(px(1.55), py(0));
  ctx.moveTo(px(0), py(-1.25));
  ctx.lineTo(px(0), py(1.25));
  ctx.stroke();

  ctx.strokeStyle = '#1f2328';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, TWO_PI);
  ctx.stroke();

  const pointX = px(cosValue);
  const pointY = py(sinValue);

  ctx.strokeStyle = '#0969da';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(pointX, centerY);
  ctx.stroke();

  ctx.strokeStyle = '#2ea043';
  ctx.beginPath();
  ctx.moveTo(pointX, centerY);
  ctx.lineTo(pointX, pointY);
  ctx.stroke();

  ctx.strokeStyle = '#bf8700';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px(1), py(-1.18));
  ctx.lineTo(px(1), py(1.18));
  ctx.stroke();

  if (Number.isFinite(tanValue)) {
    const clampedTan = Math.max(-1.18, Math.min(1.18, tanValue));
    ctx.strokeStyle = '#bf8700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px(1), py(0));
    ctx.lineTo(px(1), py(clampedTan));
    ctx.stroke();
  }

  ctx.strokeStyle = '#57606a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(pointX, pointY);
  ctx.stroke();

  ctx.fillStyle = '#2ea043';
  ctx.beginPath();
  ctx.arc(pointX, pointY, 5, 0, TWO_PI);
  ctx.fill();

  ctx.fillStyle = '#1f2328';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('1', px(1) + 7, py(0) + 12);
  ctx.fillText('-1', px(-1) - 22, py(0) + 12);
  ctx.fillText(texts.canvas.theta, centerX + 26, centerY - 16);

  ctx.fillStyle = '#0969da';
  ctx.fillText(`${texts.canvas.cos}=${formatNumber(cosValue)}`, width * 0.68, height * 0.30);

  ctx.fillStyle = '#2ea043';
  ctx.fillText(`${texts.canvas.sin}=${formatNumber(sinValue)}`, width * 0.68, height * 0.41);

  ctx.fillStyle = '#bf8700';
  const tanLabel = Number.isFinite(tanValue) ? formatNumber(tanValue) : 'undef.';
  ctx.fillText(`${texts.canvas.tan}=${tanLabel}`, width * 0.68, height * 0.52);

  ctx.fillStyle = '#57606a';
  ctx.fillText(`x=${formatNumber(state.x)}`, width * 0.68, height * 0.66);
  ctx.fillText(`theta=${formatNumber(theta)}`, width * 0.68, height * 0.76);
}

function normalizeTriangleAngle(theta) {
  if (!Number.isFinite(theta)) {
    return DEFAULT_PARAMETERS.x;
  }

  const wrapped = ((theta % Math.PI) + Math.PI) % Math.PI;
  const reference = wrapped > Math.PI / 2 ? Math.PI - wrapped : wrapped;
  const minAngle = Math.PI / 36;
  const maxAngle = Math.PI / 2 - minAngle;
  return Math.min(Math.max(reference, minAngle), maxAngle);
}

function drawRightTriangle() {
  const canvas = controls.unitCircleCanvas;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, rect.width || canvas.width);
  const height = Math.max(280, rect.height || canvas.height);
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const state = getState();
  const texts = getTextBundle();
  const theta = state.b * (state.x - state.c);
  const alpha = normalizeTriangleAngle(theta);
  const adjacent = Math.cos(alpha);
  const opposite = Math.sin(alpha);
  const tangent = Math.tan(alpha);
  const baseLength = Math.min(width * 0.46, height * 0.58);
  const leftX = width * 0.12;
  const baseY = height * 0.72;
  const topY = baseY - baseLength * tangent;
  const scaleCorrection = topY < height * 0.12 ? (baseY - height * 0.12) / (baseLength * tangent) : 1;
  const drawnBase = baseLength * scaleCorrection;
  const drawnHeight = drawnBase * tangent;
  const bx = leftX + drawnBase;
  const by = baseY;
  const cx = bx;
  const cy = baseY - drawnHeight;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.strokeStyle = '#0969da';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(leftX, baseY);
  ctx.lineTo(bx, by);
  ctx.stroke();

  ctx.strokeStyle = '#2ea043';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  ctx.strokeStyle = '#57606a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(leftX, baseY);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  ctx.strokeStyle = '#1f2328';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx - 24, by - 24, 24, 24);

  ctx.strokeStyle = '#bf8700';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(leftX, baseY, 44, -alpha, 0);
  ctx.stroke();

  ctx.fillStyle = '#1f2328';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(texts.canvas.alpha, leftX + 52, baseY - 16);

  ctx.fillStyle = '#0969da';
  ctx.fillText(texts.canvas.adjacent, leftX + drawnBase * 0.34, baseY + 24);

  ctx.fillStyle = '#2ea043';
  ctx.fillText(texts.canvas.opposite, bx + 12, baseY - drawnHeight * 0.5);

  ctx.fillStyle = '#57606a';
  ctx.fillText(texts.canvas.hypotenuse, leftX + drawnBase * 0.44, baseY - drawnHeight * 0.5 - 14);

  ctx.fillStyle = '#1f2328';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`${texts.canvas.alpha}=${formatNumber(alpha)} rad`, width * 0.66, height * 0.24);

  ctx.fillStyle = '#2ea043';
  ctx.fillText(`${texts.canvas.sin}=${formatNumber(opposite)}`, width * 0.66, height * 0.38);

  ctx.fillStyle = '#0969da';
  ctx.fillText(`${texts.canvas.cos}=${formatNumber(adjacent)}`, width * 0.66, height * 0.50);

  ctx.fillStyle = '#bf8700';
  ctx.fillText(`${texts.canvas.tan}=${formatNumber(tangent)}`, width * 0.66, height * 0.62);

  ctx.fillStyle = '#57606a';
  ctx.fillText(`theta=${formatNumber(theta)}`, width * 0.66, height * 0.76);
}

function drawVisualization() {
  updateContextText();
  if (currentContext === CONTEXTS.triangle) {
    drawRightTriangle();
    return;
  }
  drawUnitCircle();
}

function updateAllDisplays() {
  updateResetButtonState();
  updateFormulaDisplay();
  updateFacts();
  updateProbeValues();
  drawVisualization();
}

function buildGeoGebraExpression(state) {
  const fn = FUNCTIONS[state.functionName] || FUNCTIONS.sin;
  return `(${formatGeoGebraNumber(state.a)}) * ${fn.ggbName}((${formatGeoGebraNumber(state.b)}) * (x - (${formatGeoGebraNumber(state.c)}))) + (${formatGeoGebraNumber(state.d)})`;
}

function restoreDefaultView() {
  if (!ggbApplet) {
    return;
  }
  ggbApplet.setAxesVisible(true, true);
  ggbApplet.setGridVisible(true);
  ggbApplet.setCoordSystem(
    DEFAULT_VIEW.xmin,
    DEFAULT_VIEW.xmax,
    DEFAULT_VIEW.ymin,
    DEFAULT_VIEW.ymax
  );
  ggbApplet.refreshViews();
}

function buildApplet() {
  if (appletBuildStarted) {
    return;
  }
  appletBuildStarted = true;

  const params = {
    appName: 'graphing',
    width: 1000,
    height: 650,
    showToolBar: false,
    showMenuBar: false,
    showAlgebraInput: false,
    showResetIcon: false,
    enableShiftDragZoom: true,
    showZoomButtons: true,
    borderRadius: 12,
    errorDialogsActive: false,
    useBrowserForJS: true,
    language: currentLanguage,
    appletOnLoad: onAppletLoad
  };

  const applet = new GGBApplet(params, true);
  applet.inject('ggb-element');
}

function initConstruction() {
  if (!ggbApplet) {
    return;
  }

  ggbApplet.setErrorDialogsActive(false);
  ggbApplet.setRepaintingActive(false);
  ggbApplet.evalCommand('f(x) = sin(x)');
  ggbApplet.evalCommand('g(x) = sin(x)');
  ggbApplet.evalCommand('P = (0, 0)');
  ggbApplet.setCaption('f', 'f');
  ggbApplet.setCaption('g', 'g');
  ggbApplet.setCaption('P', 'P');
  ggbApplet.setLabelVisible('f', true);
  ggbApplet.setLabelVisible('g', true);
  ggbApplet.setLabelVisible('P', true);
  ggbApplet.setColor('f', COLORS.base.r, COLORS.base.g, COLORS.base.b);
  ggbApplet.setColor('g', COLORS.transformed.r, COLORS.transformed.g, COLORS.transformed.b);
  ggbApplet.setColor('P', COLORS.point.r, COLORS.point.g, COLORS.point.b);
  ggbApplet.setLineThickness('f', 5);
  ggbApplet.setLineThickness('g', 7);
  ggbApplet.setPointSize('P', 6);
  restoreDefaultView();
  ggbApplet.setRepaintingActive(true);
  clearStatus();
}

function onAppletLoad(api) {
  ggbApplet = api;
  initConstruction();
  applyGraph();
}

function applyGraph() {
  if (!ggbApplet) {
    return false;
  }

  if (!validateB()) {
    return false;
  }

  const texts = getTextBundle();
  const state = getState();
  const fn = FUNCTIONS[state.functionName] || FUNCTIONS.sin;
  const successF = ggbApplet.evalCommand(`f(x) = ${fn.ggbName}(x)`);
  const successG = ggbApplet.evalCommand(`g(x) = ${buildGeoGebraExpression(state)}`);

  if (!successF || !successG) {
    setStatus(texts.status.transformedFunctionFailed, true);
    return false;
  }

  const pointY = evaluateTransformed(state, state.x);
  if (Number.isFinite(pointY) && Math.abs(pointY) < 100) {
    ggbApplet.evalCommand(`P = (${formatGeoGebraNumber(state.x)}, ${formatGeoGebraNumber(pointY)})`);
    ggbApplet.setVisible('P', true);
  } else {
    ggbApplet.setVisible('P', false);
  }

  ggbApplet.setCaption('f', 'f');
  ggbApplet.setCaption('g', 'g');
  ggbApplet.setLabelVisible('f', true);
  ggbApplet.setLabelVisible('g', true);
  ggbApplet.setColor('f', COLORS.base.r, COLORS.base.g, COLORS.base.b);
  ggbApplet.setColor('g', COLORS.transformed.r, COLORS.transformed.g, COLORS.transformed.b);
  ggbApplet.setLineThickness('f', 5);
  ggbApplet.setLineThickness('g', 7);
  clearStatus();
  return true;
}

function syncAppSettingsFromIntro() {
  currentContext = getSelectedIntroContext();
  configureProbeRangeForContext();
  updateContextCards();
  controls.functionSelect.value = controls.introFunctionSelect.value;
}

function showIntroScreen() {
  currentView = 'intro';
  controls.introScreen.classList.remove('hidden');
  controls.appScreen.classList.add('hidden');
}

function showAppScreen(options = {}) {
  const { syncFromIntro = false, pushHistory = false } = options;

  if (syncFromIntro) {
    syncAppSettingsFromIntro();
  }

  currentView = 'app';
  controls.introScreen.classList.add('hidden');
  controls.appScreen.classList.remove('hidden');
  updateAllDisplays();

  if (pushHistory) {
    pushHistoryState('app');
  } else {
    syncHistoryState();
  }

  requestAnimationFrame(function() {
    buildApplet();
    if (ggbApplet) {
      applyGraph();
    }
  });
}

function startFromIntro() {
  showAppScreen({
    syncFromIntro: true,
    pushHistory: true
  });
}

function resetAll() {
  controls.functionSelect.value = 'sin';
  controls.introFunctionSelect.value = 'sin';
  configureProbeRangeForContext();
  syncPair(controls.aRange, controls.aNumber, DEFAULT_PARAMETERS.a);
  syncPair(controls.bRange, controls.bNumber, DEFAULT_PARAMETERS.b);
  syncPair(controls.cRange, controls.cNumber, DEFAULT_PARAMETERS.c);
  syncPair(controls.dRange, controls.dNumber, DEFAULT_PARAMETERS.d);
  syncPair(controls.xRange, controls.xNumber, DEFAULT_PARAMETERS.x);
  lastValidB = DEFAULT_PARAMETERS.b;
  updateAllDisplays();
  applyGraph();
  restoreDefaultView();
}

function updateParameterFromRange(rangeEl, numberEl) {
  numberEl.value = rangeEl.value;
  updateAllDisplays();
  applyGraph();
}

function updateParameterFromNumber(numberEl, rangeEl) {
  const value = Number(numberEl.value);
  if (Number.isFinite(value)) {
    rangeEl.value = String(value);
  }
  updateAllDisplays();
  applyGraph();
}

const pairs = [
  [controls.aRange, controls.aNumber],
  [controls.bRange, controls.bNumber],
  [controls.cRange, controls.cNumber],
  [controls.dRange, controls.dNumber],
  [controls.xRange, controls.xNumber]
];

for (const [rangeEl, numberEl] of pairs) {
  rangeEl.addEventListener('input', function() {
    updateParameterFromRange(rangeEl, numberEl);
  });

  numberEl.addEventListener('input', function() {
    updateParameterFromNumber(numberEl, rangeEl);
  });
}

controls.functionSelect.addEventListener('change', function() {
  controls.introFunctionSelect.value = controls.functionSelect.value;
  updateAllDisplays();
  applyGraph();
});

controls.introFunctionSelect.addEventListener('change', function() {
  controls.functionSelect.value = controls.introFunctionSelect.value;
});

controls.introTriangleContext.addEventListener('change', function() {
  if (controls.introTriangleContext.checked) {
    setIntroContext(CONTEXTS.triangle);
  }
});

controls.introCircleContext.addEventListener('change', function() {
  if (controls.introCircleContext.checked) {
    setIntroContext(CONTEXTS.unitCircle);
  }
});

controls.resetButton.addEventListener('click', resetAll);

controls.langDeButton.addEventListener('click', function() {
  setLanguage('de');
});

controls.langEnButton.addEventListener('click', function() {
  setLanguage('en');
});

window.addEventListener('resize', function() {
  drawVisualization();
});

window.addEventListener('popstate', function(event) {
  const nextState = event.state || { view: 'intro' };

  if (nextState.view === 'app') {
    showAppScreen({
      syncFromIntro: !appletBuildStarted,
      pushHistory: false
    });
    return;
  }

  showIntroScreen();
  syncHistoryState();
});

const storedLanguage = readStoredLanguage();
if (storedLanguage) {
  currentLanguage = storedLanguage;
}

configureProbeRangeForContext();
applyLanguage();
persistLanguage();
showIntroScreen();
syncHistoryState();
controls.startButton.addEventListener('click', startFromIntro);
