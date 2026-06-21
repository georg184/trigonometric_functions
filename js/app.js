const APP_VERSION = '20260621.7';
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
let rightAngleMarker = RIGHT_ANGLE_MARKERS.arcDot;

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

function isCorrectAnswer(rawValue, task) {
  return normalizeAnswer(rawValue) === `${task.answer.numerator}/${task.answer.denominator}`;
}

function setSolvedState(isCorrect) {
  controls.feedback.classList.remove('hidden', 'correct', 'incorrect');
  controls.feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
  controls.feedback.textContent = isCorrect ? 'Richtig.' : 'Nicht ganz. Die Auflösung steht unten.';
  controls.solution.classList.remove('hidden');
  controls.answerInput.disabled = true;
  controls.checkButton.disabled = true;
  controls.nextButton.focus();
}

function clearSolvedState() {
  controls.feedback.classList.add('hidden');
  controls.feedback.classList.remove('correct', 'incorrect');
  controls.feedback.textContent = '';
  controls.solution.classList.add('hidden');
  controls.solution.innerHTML = '';
  controls.answerInput.disabled = false;
  controls.checkButton.disabled = false;
  controls.answerInput.value = '';
}

function newTask() {
  taskNumber += 1;
  currentTask = buildTask();
  clearSolvedState();
  controls.taskCounter.textContent = `Aufgabe ${taskNumber}`;
  renderMath(controls.taskQuestion, getQuestionLatex(currentTask));
  renderTriangle(currentTask);
  window.setTimeout(function() {
    controls.answerInput.focus();
  }, 0);
}

function submitAnswer(event) {
  event.preventDefault();
  if (!currentTask || controls.answerInput.disabled) {
    return;
  }
  const isCorrect = isCorrectAnswer(controls.answerInput.value, currentTask);
  renderMath(controls.solution, getSolutionLatex(currentTask));
  setSolvedState(isCorrect);
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

function getTriangleLabels(task, points) {
  const centroid = centroidOf(points);
  const labels = [];

  for (let vertexIndex = 0; vertexIndex < 3; vertexIndex += 1) {
    const sidePoints = [0, 1, 2].filter(function(index) {
      return index !== vertexIndex;
    });
    const midpoint = {
      x: (points[sidePoints[0]].x + points[sidePoints[1]].x) / 2,
      y: (points[sidePoints[0]].y + points[sidePoints[1]].y) / 2
    };
    const direction = angleLayout.unitVector(centroid, midpoint);
    labels.push({
      type: 'side',
      text: getSideName(task, vertexIndex),
      latex: getSideName(task, vertexIndex),
      x: midpoint.x + direction.x * 26,
      y: midpoint.y + direction.y * 26,
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
  typesetElements([surface]);
}

function renderTriangle(task) {
  renderSvgWithHtmlLabels(controls.triangleRenderer, task);
}

function startTriangleQuiz() {
  taskNumber = 0;
  rightAngleMarker = readRightAngleMarkerSetting();
  showScreen('quiz');
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

showScreen('intro');
