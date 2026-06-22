const APP_VERSION = '20260622.5';
if (window.GG_APP_VERSION !== APP_VERSION) {
  document.body.innerHTML = [
    '<main style="max-width:720px;margin:40px auto;padding:20px;font-family:system-ui,sans-serif;line-height:1.45">',
    '<h1>Neue Version verfuegbar</h1>',
    '<p>Diese Seite hat HTML und JavaScript aus unterschiedlichen Versionen geladen. Bitte die Seite neu laden.</p>',
    '</main>'
  ].join('');
  throw new Error(`Version mismatch: index ${window.GG_APP_VERSION || 'missing'}, app ${APP_VERSION}`);
}

const screens = {
  intro: document.getElementById('introScreen'),
  quiz: document.getElementById('quizScreen'),
  placeholder: document.getElementById('placeholderScreen')
};

const controls = {
  startTriangleButton: document.getElementById('startTriangleButton'),
  startUnitCircleButton: document.getElementById('startUnitCircleButton'),
  placeholderBackButton: document.getElementById('placeholderBackButton'),
  backButton: document.getElementById('backButton'),
  nextButton: document.getElementById('nextButton'),
  rightAngleArcDot: document.getElementById('rightAngleArcDot'),
  rightAngleSquare: document.getElementById('rightAngleSquare'),
  triangleRenderer: document.getElementById('triangleRenderer'),
  taskCounter: document.getElementById('taskCounter'),
  scoreCounter: document.getElementById('scoreCounter'),
  taskQuestion: document.getElementById('taskQuestion'),
  answerForm: document.getElementById('answerForm'),
  answerInput: document.getElementById('answerInput'),
  checkButton: document.getElementById('checkButton'),
  feedback: document.getElementById('feedback'),
  solution: document.getElementById('solution')
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const angleLayout = window.GGGeometryAngleLayout;
if (!angleLayout) {
  throw new Error('GGGeometryAngleLayout must be loaded before js/app.js.');
}
const DEGREE = Math.PI / 180;
const TASK_TYPES = ['sin', 'cos', 'tan'];
const SIDE_COLORS = ['#bf8700', '#2ea043', '#0969da'];
const TRIANGLE_SIDE_STROKE_WIDTH = 3.5;
const TRIANGLE_ANGLE_ARC_STROKE_WIDTH = 2;
const ANSWER_CHECK_TIMEOUT_MS = 45000;
const RIGHT_ANGLE_MARKERS = {
  arcDot: 'arcDot',
  square: 'square'
};
const ANGLE_LABEL_FONT_SIZE = 16;
const VERTEX_SETS = [
  ['A', 'B', 'C'],
  ['D', 'E', 'F'],
  ['K', 'L', 'M'],
  ['P', 'Q', 'R'],
  ['U', 'V', 'W']
];
const ANGLE_SETS = [
  [
    { text: 'α', latex: '\\alpha' },
    { text: 'β', latex: '\\beta' },
    { text: 'γ', latex: '\\gamma' }
  ],
  [
    { text: 'φ', latex: '\\varphi' },
    { text: 'ψ', latex: '\\psi' },
    { text: 'ω', latex: '\\omega' }
  ],
  [
    { text: 'δ', latex: '\\delta' },
    { text: 'ε', latex: '\\varepsilon' },
    { text: 'η', latex: '\\eta' }
  ]
];

let currentTask = null;
let taskNumber = 0;
let correctAnswers = 0;
let answeredQuestions = 0;
let rightAngleMarker = RIGHT_ANGLE_MARKERS.arcDot;
let mathRenderQueue = Promise.resolve();
const mathRenderTokens = new WeakMap();
let answerCheckerWorker = null;
let answerCheckerRequestId = 0;
let answerCheckerFailed = false;
const pendingAnswerChecks = new Map();

function showScreen(name) {
  for (const [screenName, element] of Object.entries(screens)) {
    element.classList.toggle('hidden', screenName !== name);
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
  return items[randomInt(0, items.length - 1)];
}

function shuffle(items) {
  const result = items.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function clearMath(elements) {
  const targets = Array.isArray(elements) ? elements : [elements];
  if (window.MathJax && typeof MathJax.typesetClear === 'function') {
    MathJax.typesetClear(targets);
  }
}

function typesetMath(elements) {
  if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
    return MathJax.typesetPromise(elements);
  }
  return Promise.resolve();
}

function bumpMathRenderToken(element) {
  const nextToken = (mathRenderTokens.get(element) || 0) + 1;
  mathRenderTokens.set(element, nextToken);
  return nextToken;
}

function isCurrentMathRender(element, token) {
  return mathRenderTokens.get(element) === token;
}

function enqueueMathRender(renderJob) {
  mathRenderQueue = mathRenderQueue
    .catch(function() {
      return null;
    })
    .then(renderJob)
    .catch(function(error) {
      console.error('MathJax rendering failed:', error);
    });
  return mathRenderQueue;
}

function replaceMathContent(element, updateContent) {
  const token = bumpMathRenderToken(element);
  return enqueueMathRender(function() {
    if (!isCurrentMathRender(element, token)) {
      return null;
    }
    clearMath(element);
    updateContent();
    return typesetMath([element]);
  });
}

function clearMathContent(element) {
  const token = bumpMathRenderToken(element);
  return enqueueMathRender(function() {
    if (!isCurrentMathRender(element, token)) {
      return null;
    }
    clearMath(element);
    element.innerHTML = '';
    return null;
  });
}

function renderMath(element, latex) {
  replaceMathContent(element, function() {
    element.innerHTML = latex;
  });
}

function getExpectedAnswer(task) {
  return `${task.answer.numerator}/${task.answer.denominator}`;
}

function getAllowedSideSymbols(task) {
  return task.vertexLabels.map(sideLabelForVertex);
}

function exactAnswerCheck(rawValue, task) {
  return normalizeAnswer(rawValue) === getExpectedAnswer(task);
}

function fallbackAnswerCheck(rawValue, task, error) {
  if (error) {
    console.warn('Falling back to exact answer check:', error);
  }
  return {
    correct: exactAnswerCheck(rawValue, task),
    checker: 'exact-fallback'
  };
}

function resolvePendingAnswerChecksWithFallback(error) {
  for (const [id, pending] of pendingAnswerChecks.entries()) {
    window.clearTimeout(pending.timeoutId);
    pendingAnswerChecks.delete(id);
    pending.resolve(fallbackAnswerCheck(pending.rawValue, pending.task, error));
  }
}

function handleAnswerCheckerMessage(event) {
  const message = event.data || {};
  if (message.type === 'ready') {
    answerCheckerFailed = false;
    return;
  }
  if (message.type === 'ready-error') {
    answerCheckerFailed = true;
    resolvePendingAnswerChecksWithFallback(message.error || 'answer checker failed to load');
    return;
  }
  if (message.type !== 'check-result') {
    return;
  }

  const pending = pendingAnswerChecks.get(message.id);
  if (!pending) {
    return;
  }
  window.clearTimeout(pending.timeoutId);
  pendingAnswerChecks.delete(message.id);
  if (message.error) {
    pending.resolve(fallbackAnswerCheck(pending.rawValue, pending.task, message.error));
    return;
  }
  pending.resolve(message.result);
}

function initializeAnswerChecker() {
  if (!window.Worker) {
    answerCheckerFailed = true;
    return;
  }

  try {
    answerCheckerWorker = new Worker(`js/sympy-worker.js?v=${APP_VERSION}`, { type: 'module' });
  } catch (error) {
    answerCheckerFailed = true;
    console.warn('Could not start answer checker worker:', error);
    return;
  }

  answerCheckerWorker.addEventListener('message', handleAnswerCheckerMessage);
  answerCheckerWorker.addEventListener('error', function(event) {
    answerCheckerFailed = true;
    resolvePendingAnswerChecksWithFallback(event.message || 'answer checker worker error');
  });
}

function checkAnswer(rawValue, task) {
  if (!answerCheckerWorker || answerCheckerFailed) {
    return Promise.resolve(fallbackAnswerCheck(rawValue, task));
  }

  const id = answerCheckerRequestId + 1;
  answerCheckerRequestId = id;
  const payload = {
    userAnswer: rawValue,
    expectedAnswer: getExpectedAnswer(task),
    allowedSymbols: getAllowedSideSymbols(task)
  };

  return new Promise(function(resolve) {
    const timeoutId = window.setTimeout(function() {
      pendingAnswerChecks.delete(id);
      resolve(fallbackAnswerCheck(rawValue, task, 'answer checker timed out'));
    }, ANSWER_CHECK_TIMEOUT_MS);

    pendingAnswerChecks.set(id, {
      rawValue,
      task,
      resolve,
      timeoutId
    });
    answerCheckerWorker.postMessage({
      type: 'check-answer',
      id,
      payload
    });
  });
}

function sideLabelForVertex(vertexLabel) {
  return vertexLabel.toLowerCase();
}

function hasSideW(vertexLabels) {
  return vertexLabels.some(function(vertexLabel) {
    return sideLabelForVertex(vertexLabel) === 'w';
  });
}

function hasOmegaAngle(angleSet) {
  return angleSet.some(function(angleLabel) {
    return angleLabel.text === 'ω' || angleLabel.latex === '\\omega';
  });
}

function getCompatibleAngleSets(vertexLabels) {
  if (!hasSideW(vertexLabels)) {
    return ANGLE_SETS;
  }
  return ANGLE_SETS.filter(function(angleSet) {
    return !hasOmegaAngle(angleSet);
  });
}

function readRightAngleMarkerSetting() {
  return controls.rightAngleSquare.checked ? RIGHT_ANGLE_MARKERS.square : RIGHT_ANGLE_MARKERS.arcDot;
}

function buildTask() {
  const vertexLabels = randomChoice(VERTEX_SETS);
  const angleLabels = shuffle(randomChoice(getCompatibleAngleSets(vertexLabels)));
  const rightIndex = randomInt(0, 2);
  const acuteIndices = [0, 1, 2].filter(function(index) {
    return index !== rightIndex;
  });
  const firstAcuteAngle = randomInt(24, 66);
  const secondAcuteAngle = 90 - firstAcuteAngle;
  const angleDegrees = [0, 0, 0];
  angleDegrees[rightIndex] = 90;
  angleDegrees[acuteIndices[0]] = firstAcuteAngle;
  angleDegrees[acuteIndices[1]] = secondAcuteAngle;

  const targetIndex = randomChoice(acuteIndices);
  const otherAcuteIndex = acuteIndices.find(function(index) {
    return index !== targetIndex;
  });
  const taskType = randomChoice(TASK_TYPES);
  const hypotenuseIndex = rightIndex;
  const oppositeIndex = targetIndex;
  const adjacentIndex = otherAcuteIndex;
  const numeratorIndex = taskType === 'cos' ? adjacentIndex : oppositeIndex;
  const denominatorIndex = taskType === 'tan' ? adjacentIndex : hypotenuseIndex;

  return {
    vertexLabels,
    angleLabels,
    rightIndex,
    acuteIndices,
    targetIndex,
    taskType,
    answer: {
      numerator: sideLabelForVertex(vertexLabels[numeratorIndex]),
      denominator: sideLabelForVertex(vertexLabels[denominatorIndex])
    },
    angleDegrees,
    localLegs: makeLocalTriangle(angleDegrees, acuteIndices, rightIndex),
    rotation: Math.random() * Math.PI * 2,
    flip: Math.random() < 0.5 ? -1 : 1,
    layoutScale: 0.84 + Math.random() * 0.20,
    centerOffsetX: (Math.random() - 0.5) * 0.08,
    centerOffsetY: (Math.random() - 0.5) * 0.08
  };
}

function makeLocalTriangle(angleDegrees, acuteIndices, rightIndex) {
  const targetLocal = randomInt(0, 1);
  const points = [null, null, null];
  const rightPoint = { x: 0, y: 0 };
  const legPointX = { x: 1, y: 0 };
  const angleAtX = angleDegrees[acuteIndices[targetLocal]];
  const legHeight = Math.tan(angleAtX * DEGREE);
  const legPointY = { x: 0, y: legHeight };

  points[rightIndex] = rightPoint;
  points[acuteIndices[targetLocal]] = legPointX;
  points[acuteIndices[1 - targetLocal]] = legPointY;
  return points;
}

function getSideName(task, vertexIndex) {
  return sideLabelForVertex(task.vertexLabels[vertexIndex]);
}

function trigFunctionLatex(taskType) {
  return `\\${taskType}`;
}

function getQuestionLatex(task) {
  const angle = task.angleLabels[task.targetIndex].latex;
  const functionName = trigFunctionLatex(task.taskType);
  return `\\(${functionName}\\!\\left(${angle}\\right)=\\)`;
}

function getSolutionLatex(task) {
  const angle = task.angleLabels[task.targetIndex].latex;
  const functionName = trigFunctionLatex(task.taskType);
  const numerator = task.answer.numerator;
  const denominator = task.answer.denominator;
  const ratioText = {
    sin: '\\frac{\\text{Gegenkathete}}{\\text{Hypotenuse}}',
    cos: '\\frac{\\text{Ankathete}}{\\text{Hypotenuse}}',
    tan: '\\frac{\\text{Gegenkathete}}{\\text{Ankathete}}'
  }[task.taskType];

  return `\\[
    \\begin{aligned}
      ${functionName}\\!\\left(${angle}\\right)
        &= ${ratioText} \\\\
        &= \\frac{${numerator}}{${denominator}}
    \\end{aligned}
  \\]`;
}

function normalizeAnswer(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/÷|:/g, '/')
    .replace(/\\frac\{?([a-z])\}?\{?([a-z])\}?/g, '$1/$2')
    .replace(/[{}()]/g, '');
}

function setSolvedState(isCorrect) {
  answeredQuestions += 1;
  if (isCorrect) {
    correctAnswers += 1;
  }
  updateScoreCounter();
  controls.feedback.classList.remove('hidden', 'correct', 'incorrect');
  controls.feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
  controls.feedback.textContent = isCorrect ? 'Richtig.' : 'Falsch.';
  controls.solution.classList.remove('hidden');
  controls.answerInput.disabled = true;
  controls.checkButton.disabled = true;
  controls.checkButton.textContent = 'Prüfen';
  controls.nextButton.disabled = false;
  controls.nextButton.focus();
}

function clearSolvedState() {
  controls.feedback.classList.add('hidden');
  controls.feedback.classList.remove('correct', 'incorrect');
  controls.feedback.textContent = '';
  controls.solution.classList.add('hidden');
  clearMathContent(controls.solution);
  controls.answerInput.disabled = false;
  controls.checkButton.disabled = false;
  controls.checkButton.textContent = 'Prüfen';
  controls.answerInput.value = '';
}

function updateScoreCounter() {
  controls.scoreCounter.textContent = `Punkte: ${correctAnswers}/${answeredQuestions}`;
}

function newTask() {
  taskNumber += 1;
  currentTask = buildTask();
  clearSolvedState();
  controls.nextButton.disabled = true;
  controls.taskCounter.textContent = `Aufgabe ${taskNumber}`;
  renderMath(controls.taskQuestion, getQuestionLatex(currentTask));
  renderTriangle(currentTask);
  window.setTimeout(function() {
    controls.answerInput.focus();
  }, 0);
}

function setCheckingState() {
  controls.answerInput.disabled = true;
  controls.checkButton.disabled = true;
  controls.checkButton.textContent = 'Prüfe...';
}

async function submitAnswer(event) {
  event.preventDefault();
  if (!currentTask || controls.answerInput.disabled || controls.checkButton.disabled) {
    return;
  }
  const task = currentTask;
  const rawValue = controls.answerInput.value;
  setCheckingState();
  const result = await checkAnswer(rawValue, task);
  if (currentTask !== task) {
    controls.checkButton.textContent = 'Prüfen';
    return;
  }
  renderMath(controls.solution, getSolutionLatex(task));
  setSolvedState(Boolean(result.correct));
}

function getSurfaceSize(surface) {
  const rect = surface.getBoundingClientRect();
  return {
    width: Math.max(320, Math.round(rect.width || surface.clientWidth || 420)),
    height: Math.max(260, Math.round(rect.height || surface.clientHeight || 310))
  };
}

function transformPoints(task, width, height) {
  const { localLegs, rotation, flip } = task;
  const rotated = localLegs.map(function(point) {
    const source = { x: point.x, y: point.y * flip };
    return {
      x: source.x * Math.cos(rotation) - source.y * Math.sin(rotation),
      y: source.x * Math.sin(rotation) + source.y * Math.cos(rotation)
    };
  });

  const minX = Math.min(...rotated.map(function(point) { return point.x; }));
  const maxX = Math.max(...rotated.map(function(point) { return point.x; }));
  const minY = Math.min(...rotated.map(function(point) { return point.y; }));
  const maxY = Math.max(...rotated.map(function(point) { return point.y; }));
  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;
  const scale = Math.min(width * 0.62 / rawWidth, height * 0.58 / rawHeight) * task.layoutScale;
  const centerX = width * (0.48 + task.centerOffsetX);
  const centerY = height * (0.51 + task.centerOffsetY);
  const rawCenterX = (minX + maxX) / 2;
  const rawCenterY = (minY + maxY) / 2;

  return rotated.map(function(point) {
    return {
      x: centerX + (point.x - rawCenterX) * scale,
      y: centerY + (point.y - rawCenterY) * scale
    };
  });
}

function centroidOf(points) {
  return {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3
  };
}

function getAcuteAngleMarker(task, points, index) {
  const neighborIndices = [0, 1, 2].filter(function(otherIndex) {
    return otherIndex !== index;
  });
  const marker = angleLayout.calibratedAngleMarker(
    points[index],
    points[neighborIndices[0]],
    points[neighborIndices[1]],
    task.angleLabels[index],
    {
      fontSizePx: ANGLE_LABEL_FONT_SIZE,
      rayStrokeWidthPx: TRIANGLE_SIDE_STROKE_WIDTH,
      arcStrokeWidthPx: TRIANGLE_ANGLE_ARC_STROKE_WIDTH
    }
  );
  return Object.assign({ neighborIndices }, marker);
}

function sideLabelPosition(points, sidePoints, centroid) {
  const first = points[sidePoints[0]];
  const second = points[sidePoints[1]];
  const midpoint = {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2
  };
  const sideVector = angleLayout.unitVector(first, second);
  const normals = [
    { x: -sideVector.y, y: sideVector.x },
    { x: sideVector.y, y: -sideVector.x }
  ];
  const inward = angleLayout.unitVector(midpoint, centroid);
  const outwardNormal = normals[0].x * inward.x + normals[0].y * inward.y < 0 ? normals[0] : normals[1];

  return {
    x: midpoint.x + outwardNormal.x * 26,
    y: midpoint.y + outwardNormal.y * 26
  };
}

function getTriangleLabels(task, points) {
  const centroid = centroidOf(points);
  const labels = [];

  for (let vertexIndex = 0; vertexIndex < 3; vertexIndex += 1) {
    const sidePoints = [0, 1, 2].filter(function(index) {
      return index !== vertexIndex;
    });
    const position = sideLabelPosition(points, sidePoints, centroid);
    labels.push({
      type: 'side',
      text: getSideName(task, vertexIndex),
      latex: getSideName(task, vertexIndex),
      x: position.x,
      y: position.y,
      color: '#0969da'
    });
  }

  for (const index of task.acuteIndices) {
    const marker = getAcuteAngleMarker(task, points, index);
    labels.push({
      type: 'angle',
      text: task.angleLabels[index].text,
      latex: task.angleLabels[index].latex,
      x: marker.label.x,
      y: marker.label.y,
      color: '#57606a'
    });
  }

  return labels;
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

function addHtmlMathLabel(surface, label) {
  const element = document.createElement('span');
  element.className = `render-label render-label-${label.type}`;
  element.style.left = `${label.x}px`;
  element.style.top = `${label.y}px`;
  element.style.color = label.color;
  element.innerHTML = `\\(${label.latex}\\)`;
  surface.appendChild(element);
}

function addSvgTrianglePrimitives(svg, task, points) {
  const sidePairs = [[1, 2], [0, 2], [0, 1]];
  sidePairs.forEach(function(pair, index) {
    svg.appendChild(createSvgElement('line', {
      x1: points[pair[0]].x,
      y1: points[pair[0]].y,
      x2: points[pair[1]].x,
      y2: points[pair[1]].y,
      stroke: SIDE_COLORS[index],
      'stroke-width': TRIANGLE_SIDE_STROKE_WIDTH,
      'stroke-linecap': 'round'
    }));
  });

  drawSvgRightAngleMarker(svg, task, points);
  for (const index of task.acuteIndices) {
    const marker = getAcuteAngleMarker(task, points, index);
    svg.appendChild(createSvgElement('path', {
      d: angleLayout.arcSvgPath(points[index], points[marker.neighborIndices[0]], points[marker.neighborIndices[1]], marker.arcRadius),
      fill: 'none',
      stroke: '#57606a',
      'stroke-width': TRIANGLE_ANGLE_ARC_STROKE_WIDTH,
      'stroke-linecap': 'round'
    }));
  }
}

function drawSvgRightAngleMarker(svg, task, points) {
  const vertex = points[task.rightIndex];
  const first = points[task.acuteIndices[0]];
  const second = points[task.acuteIndices[1]];

  if (rightAngleMarker === RIGHT_ANGLE_MARKERS.square) {
    const marker = angleLayout.rightAngleSquareMarker(vertex, first, second);
    const [p1, p2, p3] = marker.points;
    svg.appendChild(createSvgElement('polyline', {
      points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`,
      fill: 'none',
      stroke: '#b42318',
      'stroke-width': 2,
      'stroke-linejoin': 'round'
    }));
    return;
  }

  const marker = angleLayout.rightAngleArcDotMarker(vertex, first, second);
  svg.appendChild(createSvgElement('path', {
    d: marker.arc.path,
    fill: 'none',
    stroke: '#b42318',
    'stroke-width': 2,
    'stroke-linecap': 'round'
  }));
  svg.appendChild(createSvgElement('circle', {
    cx: marker.dot.x,
    cy: marker.dot.y,
    r: marker.dot.radius,
    fill: '#b42318'
  }));
}

function renderSvgWithHtmlLabels(surface, task) {
  replaceMathContent(surface, function() {
    surface.innerHTML = '';
    const size = getSurfaceSize(surface);
    const points = transformPoints(task, size.width, size.height);
    const labels = getTriangleLabels(task, points);
    const svg = createSvgElement('svg', {
      class: 'geometry-svg',
      viewBox: `0 0 ${size.width} ${size.height}`,
      role: 'img',
      'aria-label': 'Dreieck als SVG mit HTML Labels'
    });

    addSvgTrianglePrimitives(svg, task, points);
    surface.appendChild(svg);
    labels.forEach(function(label) {
      addHtmlMathLabel(surface, label);
    });
  });
}

function renderTriangle(task) {
  renderSvgWithHtmlLabels(controls.triangleRenderer, task);
}

function startTriangleQuiz() {
  taskNumber = 0;
  correctAnswers = 0;
  answeredQuestions = 0;
  rightAngleMarker = readRightAngleMarkerSetting();
  showScreen('quiz');
  updateScoreCounter();
  newTask();
}

controls.startTriangleButton.addEventListener('click', startTriangleQuiz);

controls.startUnitCircleButton.addEventListener('click', function() {
  showScreen('placeholder');
});

controls.placeholderBackButton.addEventListener('click', function() {
  showScreen('intro');
});

controls.backButton.addEventListener('click', function() {
  showScreen('intro');
});

controls.nextButton.addEventListener('click', newTask);
controls.answerForm.addEventListener('submit', submitAnswer);

controls.rightAngleArcDot.addEventListener('change', function() {
  rightAngleMarker = readRightAngleMarkerSetting();
});

controls.rightAngleSquare.addEventListener('change', function() {
  rightAngleMarker = readRightAngleMarkerSetting();
});

window.addEventListener('resize', function() {
  if (currentTask && !screens.quiz.classList.contains('hidden')) {
    renderTriangle(currentTask);
  }
});

initializeAnswerChecker();
showScreen('intro');
