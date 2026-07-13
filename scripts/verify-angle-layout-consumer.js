'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const helper = require(path.join(ROOT, 'js/vendor/geometry-angle-layout.js'));
const appSource = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const stylesSource = fs.readFileSync(path.join(ROOT, 'css/styles.css'), 'utf8');
const mathJaxConfigSource = fs.readFileSync(path.join(ROOT, 'js/mathjax-config.js'), 'utf8');

const contractBlock = appSource.match(
  /const EXPECTED_ANGLE_LAYOUT_CONTRACT = Object\.freeze\(\{([\s\S]*?)\}\);/
);
assert.ok(contractBlock, 'js/app.js must declare EXPECTED_ANGLE_LAYOUT_CONTRACT.');

const expectedContract = {};
for (const key of ['helperVersion', 'calibrationVersion', 'dataVersion']) {
  const valueMatch = contractBlock[1].match(new RegExp(`${key}: '([^']+)'`));
  assert.ok(valueMatch, `EXPECTED_ANGLE_LAYOUT_CONTRACT must declare ${key}.`);
  expectedContract[key] = valueMatch[1];
}
assert.deepEqual(expectedContract, helper.ANGLE_LABEL_CALIBRATION_CONTRACT);
assert.equal(
  helper.assertAngleLabelCalibrationContract(expectedContract),
  helper.ANGLE_LABEL_CALIBRATION_CONTRACT
);

const profileMatch = appSource.match(
  /const EXPECTED_ANGLE_LABEL_RENDER_PROFILE_ID = '([^']+)'/
);
assert.ok(profileMatch, 'js/app.js must declare the expected render profile.');
assert.equal(profileMatch[1], helper.ANGLE_LABEL_RENDER_PROFILE.id);

const renderProfile = helper.ANGLE_LABEL_RENDER_PROFILE;
const expectedMathJaxUrl = `https://cdn.jsdelivr.net/npm/mathjax@${renderProfile.rendererVersion}`
  + '/es5/tex-mml-chtml.js';
const externalScriptUrls = [...indexSource.matchAll(/<script[^>]+src="([^"]+)"/g)]
  .map(match => match[1])
  .filter(url => /^https?:/.test(url));
assert.deepEqual(
  externalScriptUrls,
  [expectedMathJaxUrl],
  'index.html must load only the pinned CommonHTML MathJax bundle required by the render profile.'
);
assert.equal(renderProfile.renderer, 'MathJax');
assert.equal(renderProfile.inputProcessor, 'tex');
assert.equal(renderProfile.outputProcessor, 'chtml');

const mathJaxContext = { window: {} };
vm.createContext(mathJaxContext);
vm.runInContext(mathJaxConfigSource, mathJaxContext, { filename: 'js/mathjax-config.js' });
const mathJaxConfig = mathJaxContext.window.MathJax;
assert.ok(mathJaxConfig, 'js/mathjax-config.js must assign window.MathJax.');
assert.equal(mathJaxConfig.chtml.scale, renderProfile.outputScale);
assert.equal(mathJaxConfig.chtml.matchFontHeight, renderProfile.matchFontHeight);
assert.ok(mathJaxConfig.tex, 'The calibrated render profile requires the TeX input processor.');
assert.equal(mathJaxConfig.svg, undefined, 'The calibrated consumer must not configure SVG output.');

const appVersionMatch = appSource.match(/const APP_VERSION = '(\d{8}\.\d+)'/);
const indexVersionMatch = indexSource.match(
  /window\.GG_APP_VERSION = '(\d{8}\.\d+)'/
);
assert.ok(appVersionMatch && indexVersionMatch, 'App version declarations are missing.');
assert.equal(appVersionMatch[1], indexVersionMatch[1]);

const appVersion = appVersionMatch[1];
const assetUrls = [...indexSource.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map(match => match[1])
  .filter(url => !/^https?:/.test(url) && /\.(?:css|js)(?:\?|$)/.test(url));
for (const assetUrl of assetUrls) {
  assert.ok(
    assetUrl.endsWith(`?v=${appVersion}`),
    `Stale asset version in index.html: ${assetUrl}`
  );
}

const versionParts = appVersion.match(/^(\d{4})(\d{2})(\d{2})\.(\d+)$/);
assert.ok(versionParts, `Invalid APP_VERSION: ${appVersion}`);
const visibleVersion = `v${versionParts[1]}.${versionParts[2]}.${versionParts[3]}.${versionParts[4]}`;
assert.ok(indexSource.includes(visibleVersion), `Missing visible version ${visibleVersion}.`);

const surfaceSizeFunction = appSource.match(
  /function getSurfaceSize\(surface\) \{([\s\S]*?)\n\}/
);
assert.ok(surfaceSizeFunction, 'js/app.js must declare getSurfaceSize(surface).');
assert.match(surfaceSizeFunction[1], /surface\.clientWidth/);
assert.match(surfaceSizeFunction[1], /surface\.clientHeight/);
assert.doesNotMatch(surfaceSizeFunction[1], /getBoundingClientRect|Math\.max/);

function getCssRuleBodies(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...stylesSource.matchAll(new RegExp(`${escapedSelector}\\s*\\{([^{}]*)\\}`, 'g'))]
    .map(match => match[1]);
}

const surfaceRuleBodies = getCssRuleBodies('.render-surface');
assert.equal(surfaceRuleBodies.length, 3, 'Expected base, tablet, and mobile render-surface rules.');
assert.deepEqual(
  surfaceRuleBodies.map(body => Number(body.match(/\bheight:\s*(\d+)px/)[1])),
  [340, 320, 280]
);
for (const body of surfaceRuleBodies) {
  assert.doesNotMatch(body, /min-height/);
}

const svgRuleBodies = getCssRuleBodies('.geometry-svg');
assert.equal(svgRuleBodies.length, 1, 'geometry-svg sizing must have one shared rule.');
assert.match(svgRuleBodies[0], /\bwidth:\s*100%/);
assert.match(svgRuleBodies[0], /\bheight:\s*100%/);

const renderLabelRuleBodies = getCssRuleBodies('.render-label');
assert.equal(renderLabelRuleBodies.length, 1, 'Expected one shared render-label rule.');
assert.equal(renderProfile.horizontalAnchor, 'center');
assert.equal(renderProfile.verticalAnchor, 'center');
assert.match(renderLabelRuleBodies[0], /\btransform:\s*translate\(\s*-50%\s*,\s*-50%\s*\)/);
assert.match(renderLabelRuleBodies[0], /\bline-height:\s*1(?:\.0+)?\s*;/);
assert.match(renderLabelRuleBodies[0], /\bbackground:\s*transparent\s*;/);
assert.doesNotMatch(renderLabelRuleBodies[0], /text-shadow|background-color/i);

const angleLabelRuleBodies = getCssRuleBodies('.render-label-angle');
assert.equal(angleLabelRuleBodies.length, 1, 'Expected one calibrated angle-label rule.');
const angleLabelWeightMatch = angleLabelRuleBodies[0].match(/\bfont-weight:\s*(\d+)/);
assert.ok(angleLabelWeightMatch, 'The calibrated angle-label font weight is missing.');
assert.equal(Number(angleLabelWeightMatch[1]), renderProfile.containerFontWeight);
assert.doesNotMatch(angleLabelRuleBodies[0], /\bfont-size\s*:/);
assert.doesNotMatch(angleLabelRuleBodies[0], /text-shadow|background(?:-color)?\s*:/i);

const sideLabelRuleBodies = getCssRuleBodies('.render-label-side');
assert.equal(sideLabelRuleBodies.length, 1, 'Expected one side-label rule.');
assert.doesNotMatch(
  sideLabelRuleBodies[0],
  /\bfont-size\s*:/,
  'Side-label size must come from the exact shared JavaScript pixel setting.'
);

const mathJaxContainerRuleBodies = getCssRuleBodies('.render-label mjx-container');
assert.equal(mathJaxContainerRuleBodies.length, 1, 'Expected one MathJax geometry-label rule.');
assert.match(mathJaxContainerRuleBodies[0], /\bbackground:\s*transparent\s*!important\s*;/);
assert.match(mathJaxContainerRuleBodies[0], /\bfont-size:\s*inherit\s*!important\s*;/);
assert.match(mathJaxContainerRuleBodies[0], /\bmargin:\s*0\s*!important\s*;/);
assert.doesNotMatch(mathJaxContainerRuleBodies[0], /text-shadow|background-color/i);

function getAppFunctionSource(functionName) {
  const match = appSource.match(
    new RegExp(`function ${functionName}\\([^\\n]*\\) \\{([\\s\\S]*?)\\n\\}`)
  );
  assert.ok(match, `js/app.js must declare ${functionName}().`);
  return match[0];
}

const markerCollectionSource = getAppFunctionSource('getAcuteAngleMarkers');
assert.equal(
  (markerCollectionSource.match(/getAcuteAngleMarker\(/g) || []).length,
  1,
  'getAcuteAngleMarkers() must calculate each marker through one call site.'
);

const acuteMarkerSource = getAppFunctionSource('getAcuteAngleMarker');
assert.match(
  acuteMarkerSource,
  /angleMode:\s*'minor'/,
  'The right-triangle adapter must explicitly request the minor opening.'
);
assert.match(acuteMarkerSource, /fontSizePx:\s*labelFontSizePx/);

const labelFontSizeOptionsMatch = appSource.match(
  /const LABEL_FONT_SIZE_OPTIONS_PX = Object\.freeze\(\[([^\]]+)\]\);/
);
const defaultLabelFontSizeMatch = appSource.match(/const DEFAULT_LABEL_FONT_SIZE_PX = (\d+);/);
const sideLabelOffsetMatch = appSource.match(/const SIDE_LABEL_OFFSET_PX = (\d+);/);
assert.ok(labelFontSizeOptionsMatch, 'The allowed label pixel sizes are missing.');
assert.ok(defaultLabelFontSizeMatch, 'The default label pixel size is missing.');
assert.ok(sideLabelOffsetMatch, 'The side-label offset is missing.');
const labelFontSizeOptions = labelFontSizeOptionsMatch[1]
  .split(',')
  .map(value => Number(value.trim()));
const defaultLabelFontSize = Number(defaultLabelFontSizeMatch[1]);
assert.equal(renderProfile.fontSizeUnit, 'px');
assert.deepEqual(labelFontSizeOptions, [18, 22, 26]);
assert.equal(defaultLabelFontSize, 22);
assert.ok(labelFontSizeOptions.includes(defaultLabelFontSize));
assert.match(appSource, /let labelFontSizePx = DEFAULT_LABEL_FONT_SIZE_PX;/);
assert.equal(Number(sideLabelOffsetMatch[1]), 22);

const labelFontSizeInputs = [...indexSource.matchAll(
  /<input id="labelFontSize(\d+)" type="radio" name="labelFontSize" value="(\d+)"([^>]*)\/>/g
)].map(match => ({
  checked: /\bchecked\b/.test(match[3]),
  idSize: Number(match[1]),
  value: Number(match[2])
}));
assert.deepEqual(
  labelFontSizeInputs.map(input => input.idSize),
  labelFontSizeOptions,
  'The label-size controls must expose every supported size in order.'
);
assert.deepEqual(labelFontSizeInputs.map(input => input.value), labelFontSizeOptions);
assert.deepEqual(
  labelFontSizeInputs.filter(input => input.checked).map(input => input.value),
  [defaultLabelFontSize],
  'Exactly the default label size must be selected in static HTML.'
);

const readLabelFontSizeSource = getAppFunctionSource('readLabelFontSizeSetting');
const settingInputs = labelFontSizeOptions.map(value => ({ checked: false, value: String(value) }));
const labelSizeSettingContext = {
  DEFAULT_LABEL_FONT_SIZE_PX: defaultLabelFontSize,
  LABEL_FONT_SIZE_INPUTS: settingInputs,
  LABEL_FONT_SIZE_OPTIONS_PX: labelFontSizeOptions
};
vm.createContext(labelSizeSettingContext);
vm.runInContext(
  `${readLabelFontSizeSource}\nthis.readLabelFontSizeForTest = readLabelFontSizeSetting;`,
  labelSizeSettingContext
);
settingInputs[1].checked = true;
assert.equal(labelSizeSettingContext.readLabelFontSizeForTest(), 22);
settingInputs[1].checked = false;
settingInputs[2].checked = true;
assert.equal(labelSizeSettingContext.readLabelFontSizeForTest(), 26);
settingInputs[2].value = '999';
assert.equal(labelSizeSettingContext.readLabelFontSizeForTest(), defaultLabelFontSize);
settingInputs[2].checked = false;
assert.equal(labelSizeSettingContext.readLabelFontSizeForTest(), defaultLabelFontSize);

const sideLabelPositionSource = getAppFunctionSource('sideLabelPosition');
assert.equal(
  (sideLabelPositionSource.match(/SIDE_LABEL_OFFSET_PX/g) || []).length,
  2,
  'Side-label x and y coordinates must share the configured offset.'
);
const sidePositionContext = {
  SIDE_LABEL_OFFSET_PX: Number(sideLabelOffsetMatch[1]),
  angleLayout: helper
};
vm.createContext(sidePositionContext);
vm.runInContext(
  `${sideLabelPositionSource}\nthis.sideLabelPositionForTest = sideLabelPosition;`,
  sidePositionContext
);
const testSidePosition = sidePositionContext.sideLabelPositionForTest(
  [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }],
  [0, 1],
  { x: 100 / 3, y: 100 / 3 }
);
assert.equal(Math.hypot(testSidePosition.x - 50, testSidePosition.y), 22);

const triangleLabelsSource = getAppFunctionSource('getTriangleLabels');
assert.match(
  triangleLabelsSource,
  /function getTriangleLabels\(task, points, acuteAngleMarkers\)/
);
assert.doesNotMatch(triangleLabelsSource, /getAcuteAngleMarker\(/);
assert.equal(
  (triangleLabelsSource.match(/fontSizePx:\s*labelFontSizePx/g) || []).length,
  2,
  'Angle and side labels must use the same selected pixel size.'
);
assert.match(triangleLabelsSource, /renderProfileId:\s*marker\.style\.renderProfileId/);

const htmlLabelSource = getAppFunctionSource('addHtmlMathLabel');
assert.match(htmlLabelSource, /element\.style\.fontSize = `\$\{label\.fontSizePx\}px`/);
assert.match(
  htmlLabelSource,
  /element\.dataset\.angleLabelRenderProfile = label\.renderProfileId/
);
assert.doesNotMatch(
  htmlLabelSource,
  /style\.fontSize\s*=\s*(?:`[^`]*(?:rem|em|vw|vh)|clamp\()/
);

const svgPrimitivesSource = getAppFunctionSource('addSvgTrianglePrimitives');
assert.match(
  svgPrimitivesSource,
  /function addSvgTrianglePrimitives\(svg, task, points, acuteAngleMarkers\)/
);
assert.doesNotMatch(svgPrimitivesSource, /getAcuteAngleMarker\(/);

const renderSource = getAppFunctionSource('renderSvgWithHtmlLabels');
assert.equal((renderSource.match(/getAcuteAngleMarkers\(/g) || []).length, 1);
assert.match(renderSource, /getTriangleLabels\(task, points, acuteAngleMarkers\)/);
assert.match(renderSource, /addSvgTrianglePrimitives\(svg, task, points, acuteAngleMarkers\)/);

const workerInitializerSource = getAppFunctionSource('initializeAnswerChecker');
assert.equal(
  (appSource.match(/new Worker\(/g) || []).length,
  1,
  'The app must have exactly one answer-worker construction site.'
);
assert.match(
  workerInitializerSource,
  /new Worker\(\s*`js\/sympy-worker\.js\?v=\$\{APP_VERSION\}`\s*,\s*\{\s*type:\s*'module'\s*\}\s*\)/,
  'The module worker URL must carry the current APP_VERSION cache token.'
);
assert.doesNotMatch(indexSource, /sympy-worker\.js/, 'The worker must be created by app.js, not index.html.');

console.log(
  `Angle-layout consumer contract verified: app=${appVersion} helper=${helper.VERSION} `
  + `calibration=${helper.ANGLE_LABEL_CALIBRATION_VERSION} data=${helper.ANGLE_LABEL_DATA_VERSION}`
);
