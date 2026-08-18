'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const model = require(path.join(ROOT, 'js/unit-circle-quiz.js'));
const appSource = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

assert.equal(model.VERSION, '1.0.0');
assert.equal(model.QUIZ_MODE, 'unit-circle');
assert.equal(model.REGIONS.length, 8);
assert.equal(model.QUADRANT_REGIONS.length, 4);
assert.equal(model.ANGLE_LABELS.length, 12);

const expectedRegions = [
  ['axis-0', 'axis', 0, 'zero', 'positive'],
  ['quadrant-1', 'quadrant', null, 'positive', 'positive'],
  ['axis-90', 'axis', 90, 'positive', 'zero'],
  ['quadrant-2', 'quadrant', null, 'positive', 'negative'],
  ['axis-180', 'axis', 180, 'zero', 'negative'],
  ['quadrant-3', 'quadrant', null, 'negative', 'negative'],
  ['axis-270', 'axis', 270, 'negative', 'zero'],
  ['quadrant-4', 'quadrant', null, 'negative', 'positive']
];
assert.deepEqual(model.REGIONS.map(region => [
  region.id,
  region.kind,
  region.exactAngle ?? null,
  region.sinSign,
  region.cosSign
]), expectedRegions);

const signPairs = new Set();
for (const region of model.REGIONS) {
  const zeroCount = [region.sinSign, region.cosSign]
    .filter(sign => sign === model.SIGNS.zero).length;
  assert.equal(zeroCount, region.kind === 'axis' ? 1 : 0, region.id);
  signPairs.add(`${region.sinSign}/${region.cosSign}`);
}
assert.equal(signPairs.size, 8, 'Every valid sign pair must identify exactly one region.');

const alpha = model.ANGLE_LABELS[0];
assert.equal(model.regionLatex('axis-90', alpha), String.raw`\alpha=90^{\circ}`);
assert.equal(
  model.regionLatex('quadrant-2', alpha),
  String.raw`90^{\circ}\lt \alpha\lt 180^{\circ}`
);
assert.equal(model.signComparisonLatex(model.SIGNS.negative), String.raw`\lt 0`);
assert.equal(model.signComparisonLatex(model.SIGNS.zero), '=0');
assert.equal(model.signComparisonLatex(model.SIGNS.positive), String.raw`\gt 0`);

const regionTask = {
  quizMode: model.QUIZ_MODE,
  questionKind: model.QUESTION_KINDS.signsToRegion,
  angleLabel: alpha,
  regionId: 'quadrant-2',
  sinSign: model.SIGNS.positive,
  cosSign: model.SIGNS.negative
};
assert.equal(model.checkAnswer({ regionId: 'quadrant-2' }, regionTask), true);
assert.equal(model.checkAnswer({ regionId: 'axis-90' }, regionTask), false);
assert.match(model.questionLatex(regionTask), /\\sin/);
assert.match(model.solutionLatex(regionTask), /90\^\{\\circ\}\\lt \\alpha/);

const signsTask = {
  quizMode: model.QUIZ_MODE,
  questionKind: model.QUESTION_KINDS.angleToSigns,
  presentation: model.PRESENTATIONS.exactAngle,
  angleLabel: alpha,
  regionId: 'axis-270',
  angleDegrees: 270,
  sinSign: model.SIGNS.negative,
  cosSign: model.SIGNS.zero
};
assert.equal(model.checkAnswer({
  sinSign: model.SIGNS.negative,
  cosSign: model.SIGNS.zero
}, signsTask), true);
assert.equal(model.checkAnswer({
  sinSign: model.SIGNS.zero,
  cosSign: model.SIGNS.negative
}, signsTask), false);

let randomState = 0x1842026;
function seededRandom() {
  randomState = (1664525 * randomState + 1013904223) >>> 0;
  return randomState / 0x100000000;
}

const sampleCount = 400000;
const questionCounts = new Map();
const presentationCounts = new Map();
const angleLabelCounts = new Map();
const exactAngleCounts = new Map();
const intervalRegionCounts = new Map();
for (let index = 0; index < sampleCount; index += 1) {
  const task = model.createTask(seededRandom);
  questionCounts.set(task.questionKind, (questionCounts.get(task.questionKind) || 0) + 1);
  angleLabelCounts.set(task.angleLabel.name, (angleLabelCounts.get(task.angleLabel.name) || 0) + 1);
  const region = model.regionForId(task.regionId);
  assert.equal(task.sinSign, region.sinSign);
  assert.equal(task.cosSign, region.cosSign);
  if (task.questionKind === model.QUESTION_KINDS.signsToRegion) {
    assert.equal(task.presentation, null);
    assert.equal(task.angleDegrees, null);
    continue;
  }
  presentationCounts.set(task.presentation, (presentationCounts.get(task.presentation) || 0) + 1);
  if (task.presentation === model.PRESENTATIONS.openInterval) {
    assert.equal(region.kind, 'quadrant');
    assert.equal(task.angleDegrees, null);
    intervalRegionCounts.set(region.id, (intervalRegionCounts.get(region.id) || 0) + 1);
    continue;
  }
  assert.ok(Number.isInteger(task.angleDegrees));
  assert.ok(task.angleDegrees >= 0 && task.angleDegrees < 360);
  if (region.kind === 'axis') {
    assert.equal(task.angleDegrees, region.exactAngle);
  } else {
    assert.ok(task.angleDegrees > region.lowerBound && task.angleDegrees < region.upperBound);
  }
  exactAngleCounts.set(task.angleDegrees, (exactAngleCounts.get(task.angleDegrees) || 0) + 1);
}

function assertNearHalf(count, total, label) {
  const ratio = count / total;
  assert.ok(ratio > 0.49 && ratio < 0.51, `${label} ratio was ${ratio}.`);
}

assertNearHalf(
  questionCounts.get(model.QUESTION_KINDS.signsToRegion),
  sampleCount,
  'signs-to-region questions'
);
const angleQuestionCount = questionCounts.get(model.QUESTION_KINDS.angleToSigns);
assertNearHalf(
  presentationCounts.get(model.PRESENTATIONS.exactAngle),
  angleQuestionCount,
  'exact-angle presentations'
);
assert.equal(angleLabelCounts.size, model.ANGLE_LABELS.length);
assert.equal(intervalRegionCounts.size, 4);
assert.equal(exactAngleCounts.size, 360, 'Every integer angle from 0 through 359 must be reachable.');

const cardinalCounts = [0, 90, 180, 270].map(angle => exactAngleCounts.get(angle));
const nonCardinalCounts = [...exactAngleCounts.entries()]
  .filter(([angle]) => ![0, 90, 180, 270].includes(angle))
  .map(([, count]) => count);
const largestNonCardinalCount = Math.max(...nonCardinalCounts);
for (const count of cardinalCounts) {
  assert.ok(
    count > largestNonCardinalCount * 50,
    'Each cardinal angle must be substantially more likely than each individual non-cardinal angle.'
  );
}
const smallestNonCardinalCount = Math.min(...nonCardinalCounts);
assert.ok(
  largestNonCardinalCount / smallestNonCardinalCount < 2.1,
  'Non-cardinal integer angles are not distributed uniformly enough.'
);

assert.match(indexSource, /src="js\/unit-circle-quiz\.js\?v=20260818\.3"/);
assert.match(indexSource, /id="unitCircleStage" class="unit-circle-stage hidden"/);
assert.match(indexSource, /id="unitCircleAnswerArea"/);
assert.doesNotMatch(indexSource, /placeholderScreen|placeholderText|placeholderBackButton/);
assert.match(appSource, /const EXPECTED_UNIT_CIRCLE_QUIZ_VERSION = '1\.0\.0'/);
assert.match(appSource, /return unitCircleQuiz\.createTask\(\)/);
assert.match(appSource, /correct: unitCircleQuiz\.checkAnswer\(rawValue, task\)/);
assert.match(appSource, /controls\.startUnitCircleButton\.addEventListener\('click', startUnitCircleQuiz\)/);
assert.match(appSource, /angleLayout\.calibratedAngleMarkerFromRays\([\s\S]*?angleMode: 'directed'/);
assert.doesNotMatch(appSource, /addUnitCircleSector|data-unit-circle-region/);
assert.doesNotMatch(appSource, /addUnitCircleAxisLabel|unit-circle-axis-label/);
assert.match(appSource, /renderCurrentTaskVisualization\(true\)/);

console.log('Unit-circle task model, distribution, integration, and helper contracts passed');
