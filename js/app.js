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
  triangleCanvas: document.getElementById('triangleCanvas'),
  taskCounter: document.getElementById('taskCounter'),
  taskQuestion: document.getElementById('taskQuestion'),
  answerForm: document.getElementById('answerForm'),
  answerInput: document.getElementById('answerInput'),
  checkButton: document.getElementById('checkButton'),
  feedback: document.getElementById('feedback'),
  solution: document.getElementById('solution')
};

const DEGREE = Math.PI / 180;
const TASK_TYPES = ['sin', 'cos', 'tan'];
const RIGHT_ANGLE_MARKERS = {
  arcDot: 'arcDot',
  square: 'square'
};
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
    layoutScale: 0.82 + Math.random() * 0.24,
    centerOffsetX: (Math.random() - 0.5) * 0.10,
    centerOffsetY: (Math.random() - 0.5) * 0.10
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
  return `\\[
    \\text{Bestimme } ${task.taskType}\\!\\left(${angle}\\right).
  \\]`;
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
  drawTriangle(currentTask);
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

function getCanvasContext() {
  const canvas = controls.triangleCanvas;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, rect.width || canvas.width);
  const height = Math.max(320, rect.height || canvas.height);
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  return { canvas, ctx, width, height };
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
  const scale = Math.min(width * 0.64 / rawWidth, height * 0.62 / rawHeight) * task.layoutScale;
  const centerX = width * (0.45 + task.centerOffsetX);
  const centerY = height * (0.50 + task.centerOffsetY);
  const rawCenterX = (minX + maxX) / 2;
  const rawCenterY = (minY + maxY) / 2;

  return rotated.map(function(point) {
    return {
      x: centerX + (point.x - rawCenterX) * scale,
      y: centerY + (point.y - rawCenterY) * scale
    };
  });
}

function drawTriangle(task) {
  const { ctx, width, height } = getCanvasContext();
  const points = transformPoints(task, width, height);
  const centroid = {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3
  };

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawSide(ctx, points[1], points[2], '#0969da');
  drawSide(ctx, points[0], points[2], '#2ea043');
  drawSide(ctx, points[0], points[1], '#bf8700');

  drawRightAngleMarker(
    ctx,
    points[task.rightIndex],
    points[task.acuteIndices[0]],
    points[task.acuteIndices[1]],
    task.angleLabels[task.rightIndex].text
  );
  for (const index of task.acuteIndices) {
    const neighborIndices = [0, 1, 2].filter(function(otherIndex) {
      return otherIndex !== index;
    });
    drawAngleMarker(
      ctx,
      points[index],
      points[neighborIndices[0]],
      points[neighborIndices[1]],
      task.angleLabels[index].text,
      {
        radius: 44,
        labelRadius: 24,
        color: '#57606a'
      }
    );
  }

  for (let index = 0; index < 3; index += 1) {
    drawVertexLabel(ctx, points[index], centroid, task.vertexLabels[index]);
  }

  for (let vertexIndex = 0; vertexIndex < 3; vertexIndex += 1) {
    const sidePoints = [0, 1, 2].filter(function(index) {
      return index !== vertexIndex;
    });
    drawSideLabel(ctx, points[sidePoints[0]], points[sidePoints[1]], centroid, getSideName(task, vertexIndex));
  }
}

function drawSide(ctx, start, end, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function unitVector(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function drawRightAngleMarker(ctx, vertex, first, second, label) {
  if (rightAngleMarker === RIGHT_ANGLE_MARKERS.square) {
    drawSquareRightAngleMarker(ctx, vertex, first, second);
    drawAngleLabel(ctx, vertex, first, second, label, 22, '#b42318');
    return;
  }

  drawAngleMarker(ctx, vertex, first, second, label, {
    radius: 44,
    labelRadius: 22,
    color: '#b42318',
    dotRadius: 34
  });
}

function drawSquareRightAngleMarker(ctx, vertex, first, second) {
  const size = 24;
  const u = unitVector(vertex, first);
  const v = unitVector(vertex, second);
  const p1 = { x: vertex.x + u.x * size, y: vertex.y + u.y * size };
  const p2 = { x: p1.x + v.x * size, y: p1.y + v.y * size };
  const p3 = { x: vertex.x + v.x * size, y: vertex.y + v.y * size };

  ctx.strokeStyle = '#1f2328';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.stroke();
}

function getInteriorAngleGeometry(vertex, first, second) {
  const start = Math.atan2(first.y - vertex.y, first.x - vertex.x);
  let delta = Math.atan2(second.y - vertex.y, second.x - vertex.x) - start;
  while (delta <= -Math.PI) {
    delta += Math.PI * 2;
  }
  while (delta > Math.PI) {
    delta -= Math.PI * 2;
  }

  return {
    start,
    delta,
    middle: start + delta / 2
  };
}

function drawAngleMarker(ctx, vertex, first, second, label, options = {}) {
  const radius = options.radius || 34;
  const labelRadius = options.labelRadius || 50;
  const color = options.color || '#57606a';
  const geometry = getInteriorAngleGeometry(vertex, first, second);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(vertex.x, vertex.y, radius, geometry.start, geometry.start + geometry.delta, geometry.delta < 0);
  ctx.stroke();

  if (options.dotRadius) {
    const dotX = vertex.x + Math.cos(geometry.middle) * options.dotRadius;
    const dotY = vertex.y + Math.sin(geometry.middle) * options.dotRadius;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawAngleLabel(ctx, vertex, first, second, label, labelRadius, color);
}

function drawAngleLabel(ctx, vertex, first, second, label, labelRadius, color) {
  const geometry = getInteriorAngleGeometry(vertex, first, second);
  const x = vertex.x + Math.cos(geometry.middle) * labelRadius;
  const y = vertex.y + Math.sin(geometry.middle) * labelRadius;
  drawCanvasText(ctx, label, x, y, {
    color,
    font: '800 16px system-ui, sans-serif',
    align: 'center'
  });
}

function drawCanvasText(ctx, text, x, y, options = {}) {
  ctx.font = options.font || '700 15px system-ui, sans-serif';
  ctx.textAlign = options.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = options.haloWidth || 5;
  ctx.strokeStyle = options.halo || 'rgba(255, 255, 255, 0.92)';
  ctx.strokeText(text, x, y + 0.5);
  ctx.fillStyle = options.color || '#1f2328';
  ctx.fillText(text, x, y + 0.5);
}

function drawVertexLabel(ctx, point, centroid, vertexLabel) {
  const direction = unitVector(centroid, point);
  const x = point.x + direction.x * 56;
  const y = point.y + direction.y * 44;
  drawCanvasText(ctx, vertexLabel, x, y, {
    color: '#1f2328',
    font: '800 16px system-ui, sans-serif'
  });
}

function drawSideLabel(ctx, first, second, centroid, label) {
  const midpoint = {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2
  };
  const direction = unitVector(centroid, midpoint);
  drawCanvasText(ctx, label, midpoint.x + direction.x * 30, midpoint.y + direction.y * 30, {
    color: '#0969da',
    font: '800 18px system-ui, sans-serif'
  });
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
    drawTriangle(currentTask);
  }
});

showScreen('intro');
