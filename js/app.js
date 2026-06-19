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
  taskCounter: document.getElementById('taskCounter'),
  taskQuestion: document.getElementById('taskQuestion'),
  answerForm: document.getElementById('answerForm'),
  answerInput: document.getElementById('answerInput'),
  checkButton: document.getElementById('checkButton'),
  feedback: document.getElementById('feedback'),
  solution: document.getElementById('solution')
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const DEGREE = Math.PI / 180;
const TASK_TYPES = ['sin', 'cos', 'tan'];
const SIDE_COLORS = ['#bf8700', '#2ea043', '#0969da'];
const RIGHT_ANGLE_MARKERS = {
  arcDot: 'arcDot',
  square: 'square'
};
const RIGHT_ANGLE_ARC_RADIUS = 26;
const RIGHT_ANGLE_DOT_DISTANCE = RIGHT_ANGLE_ARC_RADIUS / 2;
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

function unitVector(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function centroidOf(points) {
  return {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3
  };
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

function getTriangleLabels(task, points) {
  const centroid = centroidOf(points);
  const labels = [];

  for (let index = 0; index < 3; index += 1) {
    const direction = unitVector(centroid, points[index]);
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
    const direction = unitVector(centroid, midpoint);
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
    const geometry = getInteriorAngleGeometry(points[index], points[neighborIndices[0]], points[neighborIndices[1]]);
    labels.push({
      type: 'angle',
      text: task.angleLabels[index].text,
      latex: task.angleLabels[index].latex,
      x: points[index].x + Math.cos(geometry.middle) * 24,
      y: points[index].y + Math.sin(geometry.middle) * 24,
      color: '#57606a'
    });
  }

  return labels;
}

function buildArcPath(vertex, first, second, radius) {
  const geometry = getInteriorAngleGeometry(vertex, first, second);
  const start = {
    x: vertex.x + Math.cos(geometry.start) * radius,
    y: vertex.y + Math.sin(geometry.start) * radius
  };
  const end = {
    x: vertex.x + Math.cos(geometry.start + geometry.delta) * radius,
    y: vertex.y + Math.sin(geometry.start + geometry.delta) * radius
  };
  const sweep = geometry.delta > 0 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`;
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
      d: buildArcPath(points[index], points[neighborIndices[0]], points[neighborIndices[1]], 44),
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
    const size = 24;
    const u = unitVector(vertex, first);
    const v = unitVector(vertex, second);
    const p1 = { x: vertex.x + u.x * size, y: vertex.y + u.y * size };
    const p2 = { x: p1.x + v.x * size, y: p1.y + v.y * size };
    const p3 = { x: vertex.x + v.x * size, y: vertex.y + v.y * size };
    svg.appendChild(createSvgElement('polyline', {
      points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`,
      fill: 'none',
      stroke: '#b42318',
      'stroke-width': 2,
      'stroke-linejoin': 'round'
    }));
    return;
  }

  const geometry = getInteriorAngleGeometry(vertex, first, second);
  svg.appendChild(createSvgElement('path', {
    d: buildArcPath(vertex, first, second, RIGHT_ANGLE_ARC_RADIUS),
    fill: 'none',
    stroke: '#b42318',
    'stroke-width': 2,
    'stroke-linecap': 'round'
  }));
  svg.appendChild(createSvgElement('circle', {
    cx: vertex.x + Math.cos(geometry.middle) * RIGHT_ANGLE_DOT_DISTANCE,
    cy: vertex.y + Math.sin(geometry.middle) * RIGHT_ANGLE_DOT_DISTANCE,
    r: 4,
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
      .attr('d', buildArcPath(points[index], points[neighborIndices[0]], points[neighborIndices[1]], 44))
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
    drawJsxGraphArc(board, points[index], points[neighborIndices[0]], points[neighborIndices[1]], 44, '#57606a');
  }
}

function drawJsxGraphRightAngleMarker(board, task, points) {
  const vertex = points[task.rightIndex];
  const first = points[task.acuteIndices[0]];
  const second = points[task.acuteIndices[1]];
  if (rightAngleMarker === RIGHT_ANGLE_MARKERS.square) {
    const size = 24;
    const u = unitVector(vertex, first);
    const v = unitVector(vertex, second);
    const p1 = { x: vertex.x + u.x * size, y: vertex.y + u.y * size };
    const p2 = { x: p1.x + v.x * size, y: p1.y + v.y * size };
    const p3 = { x: vertex.x + v.x * size, y: vertex.y + v.y * size };
    board.create('curve', [[p1.x, p2.x, p3.x], [p1.y, p2.y, p3.y]], {
      strokeColor: '#b42318',
      strokeWidth: 2,
      fixed: true,
      highlight: false
    });
    return;
  }
  const geometry = getInteriorAngleGeometry(vertex, first, second);
  drawJsxGraphArc(board, vertex, first, second, RIGHT_ANGLE_ARC_RADIUS, '#b42318');
  board.create('point', [
    vertex.x + Math.cos(geometry.middle) * RIGHT_ANGLE_DOT_DISTANCE,
    vertex.y + Math.sin(geometry.middle) * RIGHT_ANGLE_DOT_DISTANCE
  ], {
    size: 3,
    fillColor: '#b42318',
    strokeColor: '#b42318',
    fixed: true,
    name: '',
    showInfobox: false,
    highlight: false
  });
}

function drawJsxGraphArc(board, vertex, first, second, radius, color) {
  const samples = sampleArc(vertex, first, second, radius, 18);
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

function sampleArc(vertex, first, second, radius, steps) {
  const geometry = getInteriorAngleGeometry(vertex, first, second);
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = geometry.start + geometry.delta * (i / steps);
    points.push({
      x: vertex.x + Math.cos(angle) * radius,
      y: vertex.y + Math.sin(angle) * radius
    });
  }
  return points;
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
    addGeoGebraPolyline(`arc${index}`, sampleArc(points[index], points[neighborIndices[0]], points[neighborIndices[1]], 44, 18), '#57606a');
  }
}

function addGeoGebraRightAngleMarker(task, points) {
  const vertex = points[task.rightIndex];
  const first = points[task.acuteIndices[0]];
  const second = points[task.acuteIndices[1]];
  if (rightAngleMarker === RIGHT_ANGLE_MARKERS.square) {
    const size = 24;
    const u = unitVector(vertex, first);
    const v = unitVector(vertex, second);
    const p1 = { x: vertex.x + u.x * size, y: vertex.y + u.y * size };
    const p2 = { x: p1.x + v.x * size, y: p1.y + v.y * size };
    const p3 = { x: vertex.x + v.x * size, y: vertex.y + v.y * size };
    addGeoGebraPolyline('rightAngle', [p1, p2, p3], '#b42318');
    return;
  }

  const geometry = getInteriorAngleGeometry(vertex, first, second);
  addGeoGebraPolyline(
    'rightAngle',
    sampleArc(vertex, first, second, RIGHT_ANGLE_ARC_RADIUS, 18),
    '#b42318'
  );
  geoGebraApplet.evalCommand(`rightDot=(${num(vertex.x + Math.cos(geometry.middle) * RIGHT_ANGLE_DOT_DISTANCE)},${num(vertex.y + Math.sin(geometry.middle) * RIGHT_ANGLE_DOT_DISTANCE)})`);
  geoGebraApplet.setColor('rightDot', ...hexToRgb('#b42318'));
  geoGebraApplet.setPointSize('rightDot', 4);
  geoGebraApplet.setLabelVisible('rightDot', false);
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
    renderAllTriangles(currentTask);
  }
});

showScreen('intro');
