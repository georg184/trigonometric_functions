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
  svgRenderer: document.getElementById('svgRenderer'),
  svgHtmlRenderer: document.getElementById('svgHtmlRenderer'),
  jsxGraphRenderer: document.getElementById('jsxGraphRenderer'),
  geoGebraRenderer: document.getElementById('geoGebraRenderer'),
  d3Renderer: document.getElementById('d3Renderer'),
  angleTestMatrix: document.getElementById('angleTestMatrix'),
  angleTuningExport: document.getElementById('angleTuningExport'),
  copyAngleTuningButton: document.getElementById('copyAngleTuningButton'),
  resetAngleTuningButton: document.getElementById('resetAngleTuningButton'),
  angleTuningStatus: document.getElementById('angleTuningStatus'),
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
const RIGHT_ANGLE_MARKERS = {
  arcDot: 'arcDot',
  square: 'square'
};
const RIGHT_ANGLE_JSX_DOT_SIZE = 2.4;
const ACUTE_ANGLE_ARC_RADIUS = angleLayout.DEFAULTS.acuteAngleArcRadius;
const ANGLE_TEST_DEGREES = Array.from({ length: 35 }, function(_, index) {
  return (index + 1) * 10;
});
const ANGLE_LABEL_CLASSES = [
  {
    id: 'small',
    name: 'klein',
    representative: { text: 'α', latex: '\\alpha' },
    covers: [
      { text: 'α', latex: '\\alpha' },
      { text: 'ε', latex: '\\varepsilon' },
      { text: 'ι', latex: '\\iota' },
      { text: 'κ', latex: '\\kappa' },
      { text: 'ν', latex: '\\nu' },
      { text: 'ο', latex: 'o' },
      { text: 'σ', latex: '\\sigma' },
      { text: 'τ', latex: '\\tau' },
      { text: 'υ', latex: '\\upsilon' }
    ]
  },
  {
    id: 'medium',
    name: 'mittel',
    representative: { text: 'γ', latex: '\\gamma' },
    covers: [
      { text: 'γ', latex: '\\gamma' },
      { text: 'θ', latex: '\\theta' },
      { text: 'η', latex: '\\eta' },
      { text: 'μ', latex: '\\mu' },
      { text: 'π', latex: '\\pi' },
      { text: 'ρ', latex: '\\rho' },
      { text: 'φ', latex: '\\varphi' },
      { text: 'χ', latex: '\\chi' },
      { text: 'ω', latex: '\\omega' }
    ]
  },
  {
    id: 'large',
    name: 'groß',
    representative: { text: 'δ', latex: '\\delta' },
    covers: [
      { text: 'β', latex: '\\beta' },
      { text: 'δ', latex: '\\delta' },
      { text: 'ζ', latex: '\\zeta' },
      { text: 'λ', latex: '\\lambda' },
      { text: 'ξ', latex: '\\xi' },
      { text: 'ψ', latex: '\\psi' }
    ]
  }
];
const ANGLE_TEST_LABELS = ANGLE_LABEL_CLASSES.map(function(labelClass) {
  return Object.assign({}, labelClass.representative, {
    classId: labelClass.id,
    className: labelClass.name,
    covers: labelClass.covers
  });
});
const ANGLE_TEST_LABEL_CLASS_IDS = ANGLE_LABEL_CLASSES.map(function(labelClass) {
  return labelClass.id;
});
const ANGLE_TEST_LABEL_CLASS_BY_ID = ANGLE_LABEL_CLASSES.reduce(function(result, labelClass) {
  result[labelClass.id] = labelClass;
  return result;
}, {});
const ANGLE_TEST_LABEL_BY_CLASS_ID = ANGLE_TEST_LABELS.reduce(function(result, label) {
  result[label.classId] = label;
  return result;
}, {});
const ANGLE_TEST_CONTROL_LABELS = {
  arcRadius: 'Radius',
  labelPercent: 'Label %'
};
const ANGLE_TEST_CONTROL_RANGES = {
  arcRadius: {
    min: 20,
    max: 130,
    step: 1
  },
  labelPercent: {
    min: 35,
    max: 125,
    step: 1
  }
};
const ANGLE_TEST_FIELDS = [
  'arcRadius',
  'labelPercent'
];
const ANGLE_TEST_VIEWBOX = {
  width: 300,
  height: 300
};
const ANGLE_TEST_STORAGE_KEY = 'trigonometric-functions-angle-tuning-v6';
const ANGLE_TEST_DEFAULT_FONT_SIZE = 16;
const ANGLE_TEST_CALIBRATED_DEFAULT_ROWS = [
  [10, [90, 86], [100, 88], [128, 90]],
  [20, [54, 77], [60, 78], [76, 80]],
  [30, [44, 70], [46, 71], [50, 75]],
  [40, [44, 68], [44, 72], [44, 69]],
  [50, [41, 64], [42, 63], [43, 60]],
  [60, [39, 60], [39, 62], [40, 60]],
  [70, [36, 60], [35, 63], [38, 58]],
  [80, [32, 60], [32, 59], [32, 54]],
  [90, [29, 60], [30, 60], [33, 54]],
  [100, [30, 60], [30, 60], [33, 53]],
  [110, [28, 60], [29, 56], [32, 53]],
  [120, [27, 60], [27, 55], [32, 51]],
  [130, [26, 56], [27, 54], [30, 48]],
  [140, [24, 56], [25, 55], [30, 46]],
  [150, [24, 53], [24, 53], [27, 47]],
  [160, [24, 51], [26, 49], [29, 44]],
  [170, [24, 48], [25, 48], [25, 41]],
  [180, [25, 48], [25, 48], [27, 41]],
  [190, [25, 46], [25, 50], [25, 42]],
  [200, [25, 46], [23, 48], [26, 42]],
  [210, [23, 46], [24, 46], [26, 38]],
  [220, [23, 46], [24, 49], [25, 43]],
  [230, [22, 43], [22, 46], [25, 36]],
  [240, [24, 45], [23, 43], [24, 37]],
  [250, [24, 46], [24, 45], [25, 37]],
  [260, [24, 43], [24, 41], [25, 35]],
  [270, [23, 43], [23, 43], [23, 37]],
  [280, [23, 46], [25, 44], [25, 42]],
  [290, [23, 44], [22, 45], [23, 42]],
  [300, [24, 43], [23, 42], [24, 41]],
  [310, [23, 46], [24, 45], [25, 45]],
  [320, [24, 45], [24, 46], [24, 44]],
  [330, [24, 45], [24, 42], [24, 42]],
  [340, [22, 46], [23, 43], [24, 42]],
  [350, [24, 46], [24, 44], [24, 41]]
];
const ANGLE_TEST_CALIBRATED_DEFAULTS = ANGLE_TEST_CALIBRATED_DEFAULT_ROWS.reduce(function(result, row) {
  const [angleDeg, small, medium, large] = row;
  result[angleDeg] = {
    small: angleTestDefaultPair(small),
    medium: angleTestDefaultPair(medium),
    large: angleTestDefaultPair(large)
  };
  return result;
}, {});
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
let jsxBoard = null;
let geoGebraApplet = null;
let geoGebraReady = false;
let geoGebraTask = null;
let angleTestRendered = false;
let angleTestSettings = null;

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

function readRightAngleMarkerSetting() {
  return controls.rightAngleSquare.checked ? RIGHT_ANGLE_MARKERS.square : RIGHT_ANGLE_MARKERS.arcDot;
}

function buildTask() {
  const vertexLabels = randomChoice(VERTEX_SETS);
  const angleLabels = shuffle(randomChoice(ANGLE_SETS));
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

function getQuestionLatex(task) {
  const angle = task.angleLabels[task.targetIndex].latex;
  return `\\(${task.taskType}\\!\\left(${angle}\\right)=\\)`;
}

function getSolutionLatex(task) {
  const angle = task.angleLabels[task.targetIndex].latex;
  const numerator = task.answer.numerator;
  const denominator = task.answer.denominator;
  const ratioText = {
    sin: '\\frac{\\text{Gegenkathete}}{\\text{Hypotenuse}}',
    cos: '\\frac{\\text{Ankathete}}{\\text{Hypotenuse}}',
    tan: '\\frac{\\text{Gegenkathete}}{\\text{Ankathete}}'
  }[task.taskType];

  return `\\[
    \\begin{aligned}
      ${task.taskType}\\!\\left(${angle}\\right)
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
  renderAllTriangles(currentTask);
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

function toMathPlanePoints(points, height) {
  return points.map(function(point) {
    return {
      x: point.x,
      y: height - point.y
    };
  });
}

function centroidOf(points) {
  return {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3
  };
}

function getTriangleLabels(task, points) {
  const centroid = centroidOf(points);
  const labels = [];

  for (let index = 0; index < 3; index += 1) {
    const direction = angleLayout.unitVector(centroid, points[index]);
    labels.push({
      type: 'vertex',
      text: task.vertexLabels[index],
      latex: task.vertexLabels[index],
      x: points[index].x + direction.x * 42,
      y: points[index].y + direction.y * 34,
      color: '#1f2328'
    });
  }

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
    const neighborIndices = [0, 1, 2].filter(function(otherIndex) {
      return otherIndex !== index;
    });
    const labelPosition = angleLayout.angleLabelPosition(
      points[index],
      points[neighborIndices[0]],
      points[neighborIndices[1]],
      ACUTE_ANGLE_ARC_RADIUS
    );
    labels.push({
      type: 'angle',
      text: task.angleLabels[index].text,
      latex: task.angleLabels[index].latex,
      x: labelPosition.x,
      y: labelPosition.y,
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

function addSvgText(svg, label, options = {}) {
  const text = createSvgElement('text', {
    x: label.x,
    y: label.y,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    fill: options.color || label.color,
    class: `svg-label svg-label-${label.type}`
  });
  text.textContent = label.text;
  svg.appendChild(text);
}

function addSvgHaloText(svg, label) {
  const halo = createSvgElement('text', {
    x: label.x,
    y: label.y,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    fill: 'none',
    stroke: '#fff',
    'stroke-width': 5,
    'stroke-linejoin': 'round',
    class: `svg-label svg-label-${label.type}`
  });
  halo.textContent = label.text;
  svg.appendChild(halo);
  addSvgText(svg, label);
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
      'stroke-width': 4,
      'stroke-linecap': 'round'
    }));
  });

  drawSvgRightAngleMarker(svg, task, points);
  for (const index of task.acuteIndices) {
    const neighborIndices = [0, 1, 2].filter(function(otherIndex) {
      return otherIndex !== index;
    });
    svg.appendChild(createSvgElement('path', {
      d: angleLayout.arcSvgPath(points[index], points[neighborIndices[0]], points[neighborIndices[1]], ACUTE_ANGLE_ARC_RADIUS),
      fill: 'none',
      stroke: '#57606a',
      'stroke-width': 2,
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

function renderInlineSvg(surface, task) {
  surface.innerHTML = '';
  const size = getSurfaceSize(surface);
  const points = transformPoints(task, size.width, size.height);
  const labels = getTriangleLabels(task, points);
  const svg = createSvgElement('svg', {
    class: 'geometry-svg',
    viewBox: `0 0 ${size.width} ${size.height}`,
    role: 'img',
    'aria-label': 'Dreieck als Inline-SVG'
  });

  addSvgTrianglePrimitives(svg, task, points);
  labels.forEach(function(label) {
    addSvgHaloText(svg, label);
  });
  surface.appendChild(svg);
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

function renderD3Svg(surface, task) {
  surface.innerHTML = '';
  if (!window.d3) {
    renderUnavailable(surface, 'D3.js ist noch nicht geladen.');
    return;
  }

  const size = getSurfaceSize(surface);
  const points = transformPoints(task, size.width, size.height);
  const labels = getTriangleLabels(task, points);
  const svg = d3.select(surface)
    .append('svg')
    .attr('class', 'geometry-svg')
    .attr('viewBox', `0 0 ${size.width} ${size.height}`)
    .attr('role', 'img')
    .attr('aria-label', 'Dreieck mit D3 und SVG');

  [[1, 2], [0, 2], [0, 1]].forEach(function(pair, index) {
    svg.append('line')
      .attr('x1', points[pair[0]].x)
      .attr('y1', points[pair[0]].y)
      .attr('x2', points[pair[1]].x)
      .attr('y2', points[pair[1]].y)
      .attr('stroke', SIDE_COLORS[index])
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round');
  });

  const tempSvg = svg.node();
  drawSvgRightAngleMarker(tempSvg, task, points);
  for (const index of task.acuteIndices) {
    const neighborIndices = [0, 1, 2].filter(function(otherIndex) {
      return otherIndex !== index;
    });
    svg.append('path')
      .attr('d', angleLayout.arcSvgPath(points[index], points[neighborIndices[0]], points[neighborIndices[1]], ACUTE_ANGLE_ARC_RADIUS))
      .attr('fill', 'none')
      .attr('stroke', '#57606a')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round');
  }

  labels.forEach(function(label) {
    svg.append('text')
      .attr('x', label.x)
      .attr('y', label.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('class', `svg-label svg-label-${label.type}`)
      .attr('fill', 'none')
      .attr('stroke', '#fff')
      .attr('stroke-width', 5)
      .attr('stroke-linejoin', 'round')
      .text(label.text);
    svg.append('text')
      .attr('x', label.x)
      .attr('y', label.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('class', `svg-label svg-label-${label.type}`)
      .attr('fill', label.color)
      .text(label.text);
  });
}

function renderJsxGraph(surface, task) {
  if (jsxBoard && window.JXG) {
    JXG.JSXGraph.freeBoard(jsxBoard);
    jsxBoard = null;
  }
  surface.innerHTML = '';
  if (!window.JXG) {
    renderUnavailable(surface, 'JSXGraph ist noch nicht geladen.');
    return;
  }

  const size = getSurfaceSize(surface);
  const points = toMathPlanePoints(transformPoints(task, size.width, size.height), size.height);
  const labels = getTriangleLabels(task, points);
  jsxBoard = JXG.JSXGraph.initBoard(surface.id, {
    boundingbox: [0, size.height, size.width, 0],
    axis: false,
    showCopyright: false,
    showNavigation: false,
    pan: { enabled: false },
    zoom: { enabled: false }
  });
  jsxBoard.suspendUpdate();
  const jPoints = points.map(function(point) {
    return jsxBoard.create('point', [point.x, point.y], {
      visible: false,
      fixed: true,
      showInfobox: false
    });
  });

  [[1, 2], [0, 2], [0, 1]].forEach(function(pair, index) {
    jsxBoard.create('segment', [jPoints[pair[0]], jPoints[pair[1]]], {
      strokeColor: SIDE_COLORS[index],
      strokeWidth: 4,
      fixed: true,
      highlight: false
    });
  });

  drawJsxGraphAngleMarkers(jsxBoard, task, points);
  labels.forEach(function(label) {
    jsxBoard.create('text', [label.x, label.y, label.text], {
      fixed: true,
      highlight: false,
      anchorX: 'middle',
      anchorY: 'middle',
      fontSize: label.type === 'side' ? 18 : 16,
      cssStyle: `color:${label.color};font-weight:800;text-shadow:0 0 5px #fff;`
    });
  });
  jsxBoard.unsuspendUpdate();
}

function drawJsxGraphAngleMarkers(board, task, points) {
  drawJsxGraphRightAngleMarker(board, task, points);
  for (const index of task.acuteIndices) {
    const neighborIndices = [0, 1, 2].filter(function(otherIndex) {
      return otherIndex !== index;
    });
    drawJsxGraphArc(board, points[index], points[neighborIndices[0]], points[neighborIndices[1]], ACUTE_ANGLE_ARC_RADIUS, '#57606a');
  }
}

function drawJsxGraphRightAngleMarker(board, task, points) {
  const vertex = points[task.rightIndex];
  const first = points[task.acuteIndices[0]];
  const second = points[task.acuteIndices[1]];
  if (rightAngleMarker === RIGHT_ANGLE_MARKERS.square) {
    const marker = angleLayout.rightAngleSquareMarker(vertex, first, second);
    const [p1, p2, p3] = marker.points;
    board.create('curve', [[p1.x, p2.x, p3.x], [p1.y, p2.y, p3.y]], {
      strokeColor: '#b42318',
      strokeWidth: 2,
      fixed: true,
      highlight: false
    });
    return;
  }
  const marker = angleLayout.rightAngleArcDotMarker(vertex, first, second);
  drawJsxGraphCurve(board, marker.arc.points, '#b42318');
  board.create('point', [
    marker.dot.x,
    marker.dot.y
  ], {
    size: RIGHT_ANGLE_JSX_DOT_SIZE,
    fillColor: '#b42318',
    strokeColor: '#b42318',
    fixed: true,
    name: '',
    showInfobox: false,
    highlight: false
  });
}

function drawJsxGraphArc(board, vertex, first, second, radius, color) {
  drawJsxGraphCurve(board, angleLayout.arcPoints(vertex, first, second, radius, 18), color);
}

function drawJsxGraphCurve(board, samples, color) {
  board.create('curve', [
    samples.map(function(point) { return point.x; }),
    samples.map(function(point) { return point.y; })
  ], {
    strokeColor: color,
    strokeWidth: 2,
    fixed: true,
    highlight: false
  });
}

function renderGeoGebra(surface, task) {
  geoGebraTask = task;
  if (!window.GGBApplet) {
    renderUnavailable(surface, 'GeoGebra ist noch nicht geladen.');
    return;
  }
  if (!geoGebraApplet) {
    surface.innerHTML = '';
    const size = getSurfaceSize(surface);
    const applet = new GGBApplet({
      appName: 'classic',
      perspective: 'G',
      width: size.width,
      height: size.height,
      showToolBar: false,
      showToolBarHelp: false,
      showMenuBar: false,
      showAlgebraInput: false,
      showResetIcon: false,
      enableShiftDragZoom: false,
      showZoomButtons: false,
      borderRadius: 10,
      errorDialogsActive: false,
      useBrowserForJS: true,
      appletOnLoad: function(api) {
        geoGebraApplet = api;
        geoGebraReady = true;
        updateGeoGebraConstruction(geoGebraTask);
      }
    }, true);
    applet.inject(surface.id);
    return;
  }
  if (geoGebraReady) {
    updateGeoGebraConstruction(task);
  }
}

function updateGeoGebraConstruction(task) {
  if (!geoGebraApplet || !task) {
    return;
  }
  const surface = controls.geoGebraRenderer;
  const size = getSurfaceSize(surface);

  try {
    geoGebraApplet.setRepaintingActive(false);
    geoGebraApplet.setWidth(size.width);
    geoGebraApplet.setHeight(size.height);
    geoGebraApplet.reset();
    geoGebraApplet.setAxesVisible(false, false);
    geoGebraApplet.setGridVisible(false);

    const viewSize = getGeoGebraViewSize(size);
    const points = toMathPlanePoints(transformPoints(task, viewSize.width, viewSize.height), viewSize.height);
    const labels = getTriangleLabels(task, points);

    geoGebraApplet.setCoordSystem(0, viewSize.width, 0, viewSize.height);

    points.forEach(function(point, index) {
      geoGebraApplet.evalCommand(`${task.vertexLabels[index]}=(${num(point.x)},${num(point.y)})`);
      geoGebraApplet.setPointSize(task.vertexLabels[index], 2);
      geoGebraApplet.setLabelVisible(task.vertexLabels[index], false);
    });

    [[1, 2], [0, 2], [0, 1]].forEach(function(pair, index) {
      const name = `s${index}`;
      geoGebraApplet.evalCommand(`${name}=Segment(${task.vertexLabels[pair[0]]},${task.vertexLabels[pair[1]]})`);
      geoGebraApplet.setColor(name, ...hexToRgb(SIDE_COLORS[index]));
      geoGebraApplet.setLineThickness(name, 6);
      geoGebraApplet.setLabelVisible(name, false);
    });

    addGeoGebraAngleMarkers(task, points);
    labels.forEach(function(label, index) {
      const name = `t${index}`;
      geoGebraApplet.evalCommand(`${name}=Text("${label.text}",(${num(label.x)},${num(label.y)}))`);
      geoGebraApplet.setColor(name, ...hexToRgb(label.color));
      geoGebraApplet.setLabelVisible(name, false);
    });
  } catch (error) {
    console.error('GeoGebra rendering failed:', error);
  } finally {
    geoGebraApplet.setRepaintingActive(true);
  }
}

function getGeoGebraViewSize(fallbackSize) {
  const fallback = {
    width: Math.max(320, fallbackSize.width),
    height: Math.max(260, fallbackSize.height)
  };
  if (!geoGebraApplet || typeof geoGebraApplet.getViewProperties !== 'function') {
    return fallback;
  }

  try {
    const properties = JSON.parse(geoGebraApplet.getViewProperties() || '{}');
    if (properties.width > 0 && properties.height > 0) {
      return {
        width: Math.round(properties.width),
        height: Math.round(properties.height)
      };
    }
    return fallback;
  } catch (error) {
    console.error('GeoGebra view size could not be read:', error);
    return fallback;
  }
}

function addGeoGebraAngleMarkers(task, points) {
  addGeoGebraRightAngleMarker(task, points);
  for (const index of task.acuteIndices) {
    const neighborIndices = [0, 1, 2].filter(function(otherIndex) {
      return otherIndex !== index;
    });
    addGeoGebraPolyline(
      `arc${index}`,
      angleLayout.arcPoints(points[index], points[neighborIndices[0]], points[neighborIndices[1]], ACUTE_ANGLE_ARC_RADIUS, 18),
      '#57606a'
    );
  }
}

function addGeoGebraRightAngleMarker(task, points) {
  const vertex = points[task.rightIndex];
  const first = points[task.acuteIndices[0]];
  const second = points[task.acuteIndices[1]];
  if (rightAngleMarker === RIGHT_ANGLE_MARKERS.square) {
    const marker = angleLayout.rightAngleSquareMarker(vertex, first, second);
    addGeoGebraPolyline('rightAngle', marker.points, '#b42318');
    return;
  }

  const marker = angleLayout.rightAngleArcDotMarker(vertex, first, second);
  addGeoGebraPolyline(
    'rightAngle',
    marker.arc.points,
    '#b42318'
  );
  geoGebraApplet.evalCommand(`RightDot=(${num(marker.dot.x)},${num(marker.dot.y)})`);
  geoGebraApplet.setColor('RightDot', ...hexToRgb('#b42318'));
  geoGebraApplet.setPointSize('RightDot', marker.dot.radius);
  geoGebraApplet.setLabelVisible('RightDot', false);
}

function addGeoGebraPolyline(name, points, color) {
  const commandPoints = points.map(function(point) {
    return `(${num(point.x)},${num(point.y)})`;
  }).join(',');
  geoGebraApplet.evalCommand(`${name}=Polyline(${commandPoints})`);
  geoGebraApplet.setColor(name, ...hexToRgb(color));
  geoGebraApplet.setLineThickness(name, 4);
  geoGebraApplet.setLabelVisible(name, false);
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  ];
}

function num(value) {
  return String(Math.round(value * 1000) / 1000);
}

function renderUnavailable(surface, message) {
  surface.innerHTML = `<div class="renderer-note">${message}</div>`;
}

function renderAngleTestMatrix() {
  if (!controls.angleTestMatrix || angleTestRendered) {
    return;
  }

  if (!angleTestSettings) {
    angleTestSettings = loadAngleTestSettings();
  }

  controls.angleTestMatrix.innerHTML = '';

  const corner = document.createElement('div');
  corner.className = 'angle-test-header angle-test-corner';
  corner.textContent = 'Winkel';
  controls.angleTestMatrix.appendChild(corner);

  ANGLE_TEST_LABELS.forEach(function(label) {
    const header = document.createElement('div');
    header.className = 'angle-test-header mathjax-inline';
    header.innerHTML = [
      `<span class="angle-test-header-main">${label.className}</span>`,
      `<span class="angle-test-header-representative">\\(${label.latex}\\)</span>`,
      `<span class="angle-test-header-covers">${label.covers.map(function(item) {
        return item.text;
      }).join(' ')}</span>`
    ].join('');
    controls.angleTestMatrix.appendChild(header);
  });

  ANGLE_TEST_DEGREES.forEach(function(degrees) {
    const rowLabel = document.createElement('div');
    rowLabel.className = 'angle-test-row-label mathjax-inline';
    rowLabel.innerHTML = `<span>\\(${degrees}^{\\circ}\\)</span>`;
    controls.angleTestMatrix.appendChild(rowLabel);

    ANGLE_TEST_LABELS.forEach(function(label) {
      controls.angleTestMatrix.appendChild(createAngleTestCell(degrees, label));
    });
  });

  angleTestRendered = true;
  updateAngleTuningExport();
  typesetElements([controls.angleTestMatrix]);
}

function createAngleTestControl(degrees, labelClassId, field) {
  const wrapper = document.createElement('div');
  wrapper.className = 'angle-test-control';

  const range = ANGLE_TEST_CONTROL_RANGES[field];
  const inputId = `angleTest-${degrees}-${labelClassId}-${field}`;
  const inputLabel = document.createElement('label');
  inputLabel.setAttribute('for', inputId);
  inputLabel.textContent = ANGLE_TEST_CONTROL_LABELS[field];

  const input = document.createElement('input');
  input.id = inputId;
  input.className = 'angle-test-number';
  input.type = 'number';
  input.min = String(range.min);
  input.max = String(range.max);
  input.step = String(range.step);
  input.inputMode = 'decimal';
  input.dataset.angle = String(degrees);
  input.dataset.labelClass = labelClassId;
  input.dataset.field = field;
  input.value = String(getAngleTestSetting(degrees, labelClassId)[field]);
  input.setAttribute('aria-label', `${ANGLE_TEST_CONTROL_LABELS[field]} für ${degrees} Grad und ${labelClassId}`);

  wrapper.appendChild(inputLabel);
  wrapper.appendChild(input);
  return wrapper;
}

function createAngleTestCell(degrees, label) {
  const cell = document.createElement('div');
  cell.className = 'angle-test-cell';
  cell.dataset.angle = String(degrees);
  cell.dataset.label = label.text;
  cell.dataset.labelClass = label.classId;

  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'angle-test-cell-controls';
  ANGLE_TEST_FIELDS.forEach(function(field) {
    controlsContainer.appendChild(createAngleTestControl(degrees, label.classId, field));
  });

  cell.appendChild(createAngleTestDrawing(degrees, label));
  cell.appendChild(controlsContainer);
  return cell;
}

function createAngleTestDrawing(degrees, label) {
  const settings = getAngleTestSetting(degrees, label.classId);
  const width = ANGLE_TEST_VIEWBOX.width;
  const height = ANGLE_TEST_VIEWBOX.height;
  const vertex = { x: width / 2, y: height / 2 };
  const rayLength = 132;
  const first = angleTestPointOnRay(vertex, 0, rayLength);
  const second = angleTestPointOnRay(vertex, degrees, rayLength);
  const labelPosition = angleTestLabelPosition(vertex, degrees, settings.arcRadius, settings.labelPercent);

  const drawing = document.createElement('div');
  drawing.className = 'angle-test-drawing';

  const svg = createSvgElement('svg', {
    class: 'angle-test-svg',
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': `${degrees} Grad mit ${label.text}`
  });

  svg.appendChild(createSvgElement('line', {
    x1: vertex.x,
    y1: vertex.y,
    x2: first.x,
    y2: first.y,
    stroke: '#1f2328',
    'stroke-width': 2.2,
    'stroke-linecap': 'round'
  }));
  svg.appendChild(createSvgElement('line', {
    x1: vertex.x,
    y1: vertex.y,
    x2: second.x,
    y2: second.y,
    stroke: '#1f2328',
    'stroke-width': 2.2,
    'stroke-linecap': 'round'
  }));
  svg.appendChild(createSvgElement('path', {
    d: angleTestArcSvgPath(vertex, settings.arcRadius, degrees),
    fill: 'none',
    stroke: '#57606a',
    'stroke-width': 2,
    'stroke-linecap': 'round'
  }));

  const labelElement = document.createElement('span');
  labelElement.className = 'angle-test-label mathjax-inline';
  labelElement.style.left = `${labelPosition.x}px`;
  labelElement.style.top = `${labelPosition.y}px`;
  labelElement.style.fontSize = `${settings.fontSizePx}px`;
  labelElement.innerHTML = `\\(${label.latex}\\)`;

  drawing.appendChild(svg);
  drawing.appendChild(labelElement);
  return drawing;
}

function angleTestPointOnRay(vertex, degrees, distance) {
  const angle = degrees * DEGREE;
  return {
    x: vertex.x + Math.cos(angle) * distance,
    y: vertex.y - Math.sin(angle) * distance
  };
}

function angleTestArcSvgPath(vertex, radius, degrees) {
  const start = angleTestPointOnRay(vertex, 0, radius);
  const end = angleTestPointOnRay(vertex, degrees, radius);
  const normalizedDegrees = normalizeDirectedDegrees(degrees);
  const largeArcFlag = normalizedDegrees > 180 ? 1 : 0;

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
}

function angleTestLabelPosition(vertex, degrees, radius, labelPercent) {
  return angleTestPointOnRay(vertex, normalizeDirectedDegrees(degrees) / 2, radius * labelPercent / 100);
}

function normalizeDirectedDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

function angleTestDefaultPair(pair) {
  return {
    arcRadius: pair[0],
    labelPercent: pair[1]
  };
}

function defaultAngleTestSetting(degrees, labelClassId) {
  if (!ANGLE_TEST_LABEL_CLASS_BY_ID[labelClassId]) {
    throw new Error(`Unknown angle label class: ${labelClassId}`);
  }
  const calibratedDefaults = ANGLE_TEST_CALIBRATED_DEFAULTS[degrees]?.[labelClassId];
  if (calibratedDefaults) {
    return {
      arcRadius: calibratedDefaults.arcRadius,
      labelPercent: calibratedDefaults.labelPercent,
      fontSizePx: ANGLE_TEST_DEFAULT_FONT_SIZE
    };
  }

  return {
    arcRadius: labelClassId === 'large' ? 35 : 32,
    labelPercent: 60,
    fontSizePx: ANGLE_TEST_DEFAULT_FONT_SIZE
  };
}

function buildDefaultAngleTestSettings() {
  const settings = {};
  ANGLE_TEST_DEGREES.forEach(function(degrees) {
    settings[String(degrees)] = {};
    ANGLE_TEST_LABEL_CLASS_IDS.forEach(function(labelClassId) {
      settings[String(degrees)][labelClassId] = defaultAngleTestSetting(degrees, labelClassId);
    });
  });
  return settings;
}

function getAngleTestSetting(degrees, labelClassId) {
  if (!angleTestSettings) {
    angleTestSettings = loadAngleTestSettings();
  }
  return angleTestSettings[String(degrees)][labelClassId];
}

function loadAngleTestSettings() {
  const settings = buildDefaultAngleTestSettings();

  try {
    const raw = window.localStorage.getItem(ANGLE_TEST_STORAGE_KEY);
    if (!raw) {
      return settings;
    }
    const parsed = JSON.parse(raw);
    const values = Array.isArray(parsed) ? parsed : parsed.values;
    if (!Array.isArray(values)) {
      return settings;
    }

    values.forEach(function(item) {
      const degrees = Number(item.angleDeg);
      if (!ANGLE_TEST_DEGREES.includes(degrees)) {
        return;
      }
      ANGLE_TEST_LABEL_CLASS_IDS.forEach(function(labelClassId) {
        const classSetting = item[labelClassId] || item;
        settings[String(degrees)][labelClassId] = sanitizeAngleTestSetting(degrees, labelClassId, classSetting);
      });
    });
  } catch (error) {
    console.warn('Angle tuning settings could not be loaded:', error);
  }

  return settings;
}

function sanitizeAngleTestSetting(degrees, labelClassId, setting) {
  const defaults = defaultAngleTestSetting(degrees, labelClassId);
  return {
    arcRadius: clampNumber(
      setting.arcRadius,
      ANGLE_TEST_CONTROL_RANGES.arcRadius.min,
      ANGLE_TEST_CONTROL_RANGES.arcRadius.max,
      defaults.arcRadius
    ),
    labelPercent: clampNumber(
      setting.labelPercent,
      ANGLE_TEST_CONTROL_RANGES.labelPercent.min,
      ANGLE_TEST_CONTROL_RANGES.labelPercent.max,
      defaults.labelPercent
    ),
    fontSizePx: ANGLE_TEST_DEFAULT_FONT_SIZE
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(number * 10) / 10));
}

function handleAngleTestInput(event) {
  const input = event.target.closest('.angle-test-number');
  if (!input || input.value === '') {
    return;
  }

  const degrees = Number(input.dataset.angle);
  const labelClassId = input.dataset.labelClass;
  const field = input.dataset.field;
  const settings = getAngleTestSetting(degrees, labelClassId);
  settings[field] = clampNumber(input.value, Number(input.min), Number(input.max), settings[field]);
  input.value = String(settings[field]);
  saveAngleTestSettings();
  redrawAngleTestCell(degrees, labelClassId);
  updateAngleTuningExport();
  setAngleTuningStatus('');
}

function redrawAngleTestCell(degrees, labelClassId) {
  const cell = controls.angleTestMatrix.querySelector(
    `.angle-test-cell[data-angle="${degrees}"][data-label-class="${labelClassId}"]`
  );
  const label = ANGLE_TEST_LABEL_BY_CLASS_ID[labelClassId];
  if (!cell || !label) {
    return;
  }

  const drawing = cell.querySelector('.angle-test-drawing');
  const nextDrawing = createAngleTestDrawing(degrees, label);
  drawing.replaceWith(nextDrawing);
  typesetElements([nextDrawing]);
}

function saveAngleTestSettings() {
  try {
    window.localStorage.setItem(ANGLE_TEST_STORAGE_KEY, JSON.stringify({
      values: getAngleTestExportValues()
    }));
  } catch (error) {
    console.warn('Angle tuning settings could not be saved:', error);
  }
}

function getAngleTestExportValues() {
  return ANGLE_TEST_DEGREES.map(function(degrees) {
    const result = { angleDeg: degrees };
    ANGLE_TEST_LABEL_CLASS_IDS.forEach(function(labelClassId) {
      const settings = getAngleTestSetting(degrees, labelClassId);
      result[labelClassId] = {
        arcRadius: settings.arcRadius,
        labelPercent: settings.labelPercent,
        fontSizePx: settings.fontSizePx
      };
    });
    return result;
  });
}

function updateAngleTuningExport() {
  if (!controls.angleTuningExport) {
    return;
  }
  controls.angleTuningExport.value = JSON.stringify({
    version: 'angle-label-tuning-v6',
    labelClasses: getAngleLabelClassExportValues(),
    units: {
      angleDeg: 'directed counterclockwise degrees from the positive horizontal ray',
      arcRadius: 'SVG units in the test cells',
      labelPercent: 'label distance / arc radius * 100',
      fontSizePx: 'MathJax label font size in px'
    },
    values: getAngleTestExportValues()
  }, null, 2);
}

function getAngleLabelClassExportValues() {
  return ANGLE_LABEL_CLASSES.map(function(labelClass) {
    return {
      id: labelClass.id,
      name: labelClass.name,
      representative: labelClass.representative,
      covers: labelClass.covers
    };
  });
}

function copyAngleTuningValues() {
  updateAngleTuningExport();
  const text = controls.angleTuningExport.value;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function() {
      setAngleTuningStatus('Kopiert.');
    }).catch(function() {
      copyAngleTuningValuesFallback();
    });
    return;
  }

  copyAngleTuningValuesFallback();
}

function copyAngleTuningValuesFallback() {
  controls.angleTuningExport.focus();
  controls.angleTuningExport.select();
  try {
    document.execCommand('copy');
    setAngleTuningStatus('Kopiert.');
  } catch (error) {
    setAngleTuningStatus('Bitte manuell kopieren.');
  }
}

function resetAngleTuningValues() {
  angleTestSettings = buildDefaultAngleTestSettings();
  try {
    window.localStorage.removeItem(ANGLE_TEST_STORAGE_KEY);
  } catch (error) {
    console.warn('Angle tuning settings could not be reset:', error);
  }
  angleTestRendered = false;
  renderAngleTestMatrix();
  setAngleTuningStatus('Zurückgesetzt.');
}

function setAngleTuningStatus(message) {
  if (controls.angleTuningStatus) {
    controls.angleTuningStatus.textContent = message;
  }
}

function renderAllTriangles(task) {
  renderInlineSvg(controls.svgRenderer, task);
  renderSvgWithHtmlLabels(controls.svgHtmlRenderer, task);
  renderJsxGraph(controls.jsxGraphRenderer, task);
  renderGeoGebra(controls.geoGebraRenderer, task);
  renderD3Svg(controls.d3Renderer, task);
}

function startTriangleQuiz() {
  taskNumber = 0;
  rightAngleMarker = readRightAngleMarkerSetting();
  showScreen('quiz');
  renderAngleTestMatrix();
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
controls.angleTestMatrix.addEventListener('input', handleAngleTestInput);
controls.copyAngleTuningButton.addEventListener('click', copyAngleTuningValues);
controls.resetAngleTuningButton.addEventListener('click', resetAngleTuningValues);

controls.rightAngleArcDot.addEventListener('change', function() {
  rightAngleMarker = readRightAngleMarkerSetting();
});

controls.rightAngleSquare.addEventListener('change', function() {
  rightAngleMarker = readRightAngleMarkerSetting();
});

window.addEventListener('resize', function() {
  if (currentTask && !screens.quiz.classList.contains('hidden')) {
    renderAllTriangles(currentTask);
  }
});

showScreen('intro');
