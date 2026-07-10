'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const helper = require(path.join(ROOT, 'js/vendor/geometry-angle-layout.js'));
const appSource = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const stylesSource = fs.readFileSync(path.join(ROOT, 'css/styles.css'), 'utf8');

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

console.log(
  `Angle-layout consumer contract verified: app=${appVersion} helper=${helper.VERSION} `
  + `calibration=${helper.ANGLE_LABEL_CALIBRATION_VERSION} data=${helper.ANGLE_LABEL_DATA_VERSION}`
);
