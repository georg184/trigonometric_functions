/*
 * Shared geometry helpers for angle markers and angle labels.
 *
 * The functions in this file do not create DOM nodes. They only compute
 * renderer-independent geometry that can be consumed by SVG, D3, JSXGraph,
 * GeoGebra command generation, or HTML/MathJax label overlays.
 */
(function(global) {
  'use strict';

  const VERSION = '0.3.4';

  const DEFAULTS = Object.freeze({
    acuteAngleArcRadius: 44,
    angleLabelFontSizePx: 16,
    angleLabelRadiusFontFloor: 12,
    labelEccentricity: 0.6,
    narrowAngleLabelEccentricity: 0.85,
    narrowAngleThresholdDeg: 25,
    rightAngleArcRadius: 26,
    rightAngleDotEccentricity: 0.6,
    rightAngleDotRadius: 3.2,
    rightAngleSquareSize: 24,
    arcSteps: 18
  });

  const ANGLE_LABEL_CLASSES = Object.freeze([
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
  ]);

  const ANGLE_LABEL_CALIBRATION_ROWS = Object.freeze([
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
  ]);

  const ANGLE_LABEL_SAMPLE_ROWS = Object.freeze([
    [350, 260, 'κ', '\\kappa', 'small', 20, 22, 58, 0],
    [10, 170, 'χ', '\\chi', 'medium', 12, 92, 90, -1],
    [100, 30, 'ε', '\\varepsilon', 'small', 12, 18, 62, 0],
    [50, 190, 'ρ', '\\rho', 'medium', 20, 36, 61, -3],
    [150, 140, 'σ', '\\sigma', 'small', 20, 24, 45, -2],
    [40, 130, 'ο', 'o', 'small', 12, 27, 74, -2],
    [40, 80, 'ε', '\\varepsilon', 'small', 24, 41, 77, -2],
    [60, 210, 'α', '\\alpha', 'small', 14, 23, 60, 0],
    [310, 150, 'π', '\\pi', 'medium', 22, 20, 45, 5],
    [250, 160, 'α', '\\alpha', 'small', 22, 21, 40, 8],
    [240, 260, 'ρ', '\\rho', 'medium', 24, 23, 52, 5],
    [230, 30, 'κ', '\\kappa', 'small', 24, 22, 59, -10],
    [230, 290, 'ζ', '\\zeta', 'large', 22, 26, 48, 0],
    [210, 190, 'λ', '\\lambda', 'large', 14, 20, 47, 3],
    [240, 270, 'ο', 'o', 'small', 24, 22, 54, 10],
    [120, 320, 'ι', '\\iota', 'small', 14, 16, 60, 8],
    [150, 120, 'γ', '\\gamma', 'medium', 14, 16, 55, 0],
    [330, 240, 'τ', '\\tau', 'small', 16, 17, 55, 3],
    [230, 250, 'λ', '\\lambda', 'large', 18, 20, 48, 0],
    [350, 260, 'π', '\\pi', 'medium', 20, 21, 60, 4],
    [270, 250, 'λ', '\\lambda', 'large', 22, 22, 52, 0],
    [190, 10, 'θ', '\\theta', 'medium', 14, 18, 50, -3.5],
    [310, 40, 'χ', '\\chi', 'medium', 20, 24, 45, -17],
    [210, 0, 'ε', '\\varepsilon', 'small', 14, 17, 56, -2],
    [140, 220, 'γ', '\\gamma', 'medium', 24, 26, 46, 0],
    [290, 190, 'α', '\\alpha', 'small', 18, 20, 49, 22.5],
    [240, 30, 'ο', 'o', 'small', 24, 21, 51, -8.5],
    [20, 80, 'ψ', '\\psi', 'large', 22, 73, 81, -0.5],
    [330, 40, 'φ', '\\varphi', 'medium', 16, 20, 47, -6],
    [310, 170, 'ρ', '\\rho', 'medium', 18, 18, 46, 12.5],
    [180, 40, 'ε', '\\varepsilon', 'small', 16, 19, 52, -4.5],
    [80, 20, 'ν', '\\nu', 'small', 16, 22, 66, 2],
    [200, 50, 'γ', '\\gamma', 'medium', 20, 21, 54, -6.5],
    [260, 10, 'ι', '\\iota', 'small', 18, 17, 52, -5.5],
    [240, 40, 'υ', '\\upsilon', 'small', 16, 17, 48, -7],
    [190, 310, 'δ', '\\delta', 'large', 24, 26, 47, 0],
    [150, 160, 'η', '\\eta', 'medium', 12, 16, 50, 0],
    [320, 310, 'θ', '\\theta', 'medium', 12, 16, 46, 3.5],
    [130, 60, 'ψ', '\\psi', 'large', 22, 26, 55, 0],
    [270, 140, 'ν', '\\nu', 'small', 14, 16, 43, 7.5],
    [100, 10, 'λ', '\\lambda', 'large', 16, 22, 58, 0],
    [280, 190, 'λ', '\\lambda', 'large', 18, 20, 44, 6],
    [310, 240, 'θ', '\\theta', 'medium', 12, 15.1, 51, -7.5],
    [110, 60, 'β', '\\beta', 'large', 16, 21.4, 56, -2.5],
    [70, 0, 'χ', '\\chi', 'medium', 16, 25, 70, 5.5],
    [10, 220, 'ψ', '\\psi', 'large', 24, 145, 90, 0],
    [210, 130, 'α', '\\alpha', 'small', 22, 20.7, 44, -4],
    [250, 0, 'ρ', '\\rho', 'medium', 24, 23, 55, -2.9],
    [70, 120, 'ν', '\\nu', 'small', 20, 29.3, 65, -5],
    [300, 350, 'ρ', '\\rho', 'medium', 22, 20, 53, -6.9],
    [90, 120, 'μ', '\\mu', 'medium', 12, 19.1, 61, -3],
    [30, 200, 'ε', '\\varepsilon', 'small', 18, 36.4, 72.9, -2],
    [290, 160, 'η', '\\eta', 'medium', 18, 19, 43, 9],
    [30, 10, 'ρ', '\\rho', 'medium', 24, 52, 78, 4.5],
    [240, 270, 'ο', 'o', 'small', 20, 20, 55, 6.5],
    [290, 60, 'τ', '\\tau', 'small', 22, 21, 49.3, -6.5],
    [80, 280, 'ν', '\\nu', 'small', 22, 28, 62, 2.1],
    [170, 210, 'η', '\\eta', 'medium', 12, 16, 49, -0.1],
    [100, 200, 'ψ', '\\psi', 'large', 22, 30, 54, -2.5],
    [340, 200, 'φ', '\\varphi', 'medium', 22, 21, 52, 9.5],
    [310, 290, 'ξ', '\\xi', 'large', 12, 19, 55, 0.5],
    [180, 270, 'α', '\\alpha', 'small', 18, 20, 55, 10.5],
    [100, 260, 'ρ', '\\rho', 'medium', 20, 25, 52, 4],
    [150, 310, 'λ', '\\lambda', 'large', 12, 16, 57, 0.7],
    [240, 290, 'η', '\\eta', 'medium', 16, 17.4, 55, -6],
    [190, 200, 'σ', '\\sigma', 'small', 22, 22, 48, 10.5],
    [100, 10, 'ψ', '\\psi', 'large', 20, 27.1, 59, 1.5],
    [10, 170, 'μ', '\\mu', 'medium', 24, 135.5, 91, -1.5],
    [220, 160, 'ξ', '\\xi', 'large', 24, 29, 50, 1.1],
    [60, 100, 'φ', '\\varphi', 'medium', 22, 36.9, 70, -4],
    [140, 320, 'η', '\\eta', 'medium', 20, 22.1, 59, 5.5],
    [220, 20, 'γ', '\\gamma', 'medium', 12, 15, 49, 4],
    [270, 190, 'α', '\\alpha', 'small', 12, 16, 52, 17],
    [80, 110, 'ρ', '\\rho', 'medium', 18, 24.8, 67, -4.5],
    [300, 280, 'ο', 'o', 'small', 24, 23.6, 55, 1],
    [250, 340, 'κ', '\\kappa', 'small', 22, 21.4, 58, 5],
    [30, 320, 'ζ', '\\zeta', 'large', 24, 65, 82, 1],
    [40, 140, 'ι', '\\iota', 'small', 22, 34, 75, -4.5],
    [280, 350, 'φ', '\\varphi', 'medium', 14, 18.7, 48, 3],
    [150, 100, 'ι', '\\iota', 'small', 16, 17, 52.4, -5.5],
    [290, 90, 'ω', '\\omega', 'medium', 24, 24, 44, -11],
    [120, 0, 'ξ', '\\xi', 'large', 12, 20, 55.7, 0.5],
    [180, 190, 'ν', '\\nu', 'small', 20, 21, 45.7, 3.5],
    [320, 240, 'α', '\\alpha', 'small', 18, 19.7, 59, 3.5],
    [350, 230, 'ψ', '\\psi', 'large', 14, 18, 50, 1],
    [10, 200, 'λ', '\\lambda', 'large', 20, 138.3, 91, 0],
    [90, 130, 'υ', '\\upsilon', 'small', 20, 22.9, 62.2, -5.5],
    [110, 50, 'χ', '\\chi', 'medium', 12, 19, 63, -3.5],
    [90, 210, 'χ', '\\chi', 'medium', 24, 32, 49, 0.8],
    [200, 130, 'λ', '\\lambda', 'large', 12, 17, 54, 2.9],
    [250, 70, 'κ', '\\kappa', 'small', 20, 21, 50, -11],
    [170, 60, 'ρ', '\\rho', 'medium', 16, 18, 54, -7],
    [140, 250, 'ζ', '\\zeta', 'large', 16, 23, 50, -1.5],
    [140, 220, 'υ', '\\upsilon', 'small', 20, 20.8, 48, 3.7],
    [220, 0, 'ζ', '\\zeta', 'large', 20, 25, 55, 3],
    [180, 350, 'γ', '\\gamma', 'medium', 22, 26, 60, 5.5],
    [350, 130, 'σ', '\\sigma', 'small', 12, 17, 52, 11],
    [200, 40, 'φ', '\\varphi', 'medium', 14, 19, 49.2, -5.5],
    [240, 230, 'ι', '\\iota', 'small', 14, 16.6, 51.7, 13],
    [130, 290, 'β', '\\beta', 'large', 14, 22, 58, 0.5],
    [30, 120, 'β', '\\beta', 'large', 18, 65, 82, -0.5],
    [80, 190, 'θ', '\\theta', 'medium', 14, 27, 63, -1.5],
    [280, 110, 'π', '\\pi', 'medium', 22, 26, 43.9, -5],
    [70, 280, 'σ', '\\sigma', 'small', 22, 33.4, 63, 5],
    [90, 340, 'ο', 'o', 'small', 14, 22, 65, 2.9],
    [130, 90, 'υ', '\\upsilon', 'small', 18, 23, 58, -4.5],
    [290, 350, 'φ', '\\varphi', 'medium', 24, 25, 53.4, -7.2],
    [260, 130, 'μ', '\\mu', 'medium', 18, 21, 40.6, 2.5],
    [190, 210, 'υ', '\\upsilon', 'small', 18, 19.6, 47, 4],
    [90, 130, 'ε', '\\varepsilon', 'small', 12, 18, 62.8, -4.5],
    [320, 110, 'ι', '\\iota', 'small', 22, 22.7, 46, 2],
    [30, 240, 'η', '\\eta', 'medium', 14, 45, 75, 0],
    [200, 80, 'ω', '\\omega', 'medium', 20, 24, 54, -7.5],
    [160, 10, 'ψ', '\\psi', 'large', 12, 19, 51.9, 0.4],
    [10, 240, 'ρ', '\\rho', 'medium', 20, 115, 87, -1],
    [60, 290, 'λ', '\\lambda', 'large', 20, 38, 65, 0.6],
    [160, 350, 'δ', '\\delta', 'large', 20, 27, 50.8, 0.3],
    [110, 270, 'ν', '\\nu', 'small', 14, 21, 59, 5.1],
    [270, 190, 'σ', '\\sigma', 'small', 18, 20, 50, 14.5],
    [60, 320, 'π', '\\pi', 'medium', 16, 31, 67.4, 4.5],
    [60, 300, 'γ', '\\gamma', 'medium', 14, 30, 66, 2.5],
    [200, 0, 'ε', '\\varepsilon', 'small', 20, 22.3, 58, -4],
    [240, 270, 'δ', '\\delta', 'large', 22, 25, 48.8, -1],
    [350, 100, 'φ', '\\varphi', 'medium', 24, 26, 43, 1.5],
    [180, 290, 'ω', '\\omega', 'medium', 12, 18, 58, -1.2],
    [120, 330, 'β', '\\beta', 'large', 12, 22, 58.2, 0.4],
    [300, 200, 'ω', '\\omega', 'medium', 22, 24, 52, 8.5],
    [230, 350, 'ε', '\\varepsilon', 'small', 14, 18, 56, -2.6],
    [250, 200, 'δ', '\\delta', 'large', 12, 18, 52, 3.2],
    [160, 0, 'γ', '\\gamma', 'medium', 16, 21, 55, 0],
    [190, 200, 'ε', '\\varepsilon', 'small', 12, 17, 50, 6.3],
    [100, 60, 'δ', '\\delta', 'large', 22, 31, 58.5, -1],
    [310, 140, 'γ', '\\gamma', 'medium', 12, 18, 46.2, 4.7],
    [330, 160, 'λ', '\\lambda', 'large', 24, 25, 46, 4.3],
    [340, 10, 'β', '\\beta', 'large', 14, 20, 50, 0],
    [280, 120, 'ε', '\\varepsilon', 'small', 20, 20, 42, 2.6],
    [200, 70, 'ξ', '\\xi', 'large', 14, 20, 53.2, 1.5],
    [350, 60, 'χ', '\\chi', 'medium', 18, 24, 42, -16],
    [290, 270, 'φ', '\\varphi', 'medium', 20, 24, 62, -0.9],
    [230, 200, 'φ', '\\varphi', 'medium', 12, 16, 53.3, 4.5],
    [330, 220, 'θ', '\\theta', 'medium', 24, 23.6, 52, -3.5],
    [340, 150, 'ρ', '\\rho', 'medium', 20, 20, 45, 9.5],
    [240, 250, 'ν', '\\nu', 'small', 22, 23, 53.3, 3.5],
    [240, 10, 'λ', '\\lambda', 'large', 18, 24, 49, 2],
    [270, 210, 'ν', '\\nu', 'small', 12, 17, 53, 9.5],
    [320, 40, 'ρ', '\\rho', 'medium', 18, 23, 47, -9.2],
    [140, 100, 'β', '\\beta', 'large', 20, 25, 57, -4.5],
    [160, 60, 'β', '\\beta', 'large', 22, 25.5, 52, 1.5],
    [60, 300, 'θ', '\\theta', 'medium', 22, 39.2, 68, 0],
    [140, 30, 'χ', '\\chi', 'medium', 22, 29, 67, -2.5],
    [170, 140, 'β', '\\beta', 'large', 12, 19, 55, 2.5],
    [290, 200, 'μ', '\\mu', 'medium', 16, 19, 51, 6.2],
    [290, 150, 'ρ', '\\rho', 'medium', 16, 17, 44.8, 15.5],
    [260, 70, 'δ', '\\delta', 'large', 14, 19, 51, -9.5],
    [200, 80, 'υ', '\\upsilon', 'small', 20, 23, 54, -4.5],
    [160, 300, 'ξ', '\\xi', 'large', 12, 19, 52.9, -2]
  ]);

  const ANGLE_LABEL_CLASS_IDS = ANGLE_LABEL_CLASSES.map(function(labelClass) {
    return labelClass.id;
  });

  const ANGLE_LABEL_CLASS_LOOKUP = ANGLE_LABEL_CLASSES.reduce(function(result, labelClass) {
    labelClass.covers.forEach(function(label) {
      result[label.text] = labelClass.id;
      result[label.latex] = labelClass.id;
    });
    return result;
  }, {});

  const ANGLE_LABEL_CALIBRATION = ANGLE_LABEL_CALIBRATION_ROWS.map(function(row) {
    const [angleDeg, small, medium, large] = row;
    return {
      angleDeg,
      small: calibrationPair(small),
      medium: calibrationPair(medium),
      large: calibrationPair(large)
    };
  });

  const ANGLE_LABEL_SAMPLE_DATA = Object.freeze(ANGLE_LABEL_SAMPLE_ROWS.map(sampleRow));

  function mergeOptions(options) {
    return Object.assign({}, DEFAULTS, options || {});
  }

  function calibrationPair(pair) {
    return {
      arcRadius: pair[0],
      labelPercent: pair[1]
    };
  }

  function sampleRow(row) {
    return {
      angleDeg: row[0],
      baseRayAngleDeg: row[1],
      label: {
        text: row[2],
        latex: row[3]
      },
      labelClassId: row[4],
      fontSizePx: row[5],
      arcRadius: row[6],
      labelPercent: row[7],
      labelAngleOffsetDeg: row[8]
    };
  }

  function unitVector(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  function angleGeometry(vertex, first, second) {
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
      end: start + delta,
      middle: start + delta / 2,
      angleRad: Math.abs(delta),
      angleDeg: Math.abs(delta) * 180 / Math.PI,
      sweep: delta > 0 ? 1 : 0
    };
  }

  function pointOnRay(vertex, angle, distance) {
    return {
      x: vertex.x + Math.cos(angle) * distance,
      y: vertex.y + Math.sin(angle) * distance
    };
  }

  function arcPoints(vertex, first, second, radius, steps) {
    const geometry = angleGeometry(vertex, first, second);
    const result = [];
    const segmentCount = Math.max(1, steps || DEFAULTS.arcSteps);
    for (let index = 0; index <= segmentCount; index += 1) {
      const angle = geometry.start + geometry.delta * (index / segmentCount);
      result.push(pointOnRay(vertex, angle, radius));
    }
    return result;
  }

  function arcSvgPath(vertex, first, second, radius) {
    const geometry = angleGeometry(vertex, first, second);
    const start = pointOnRay(vertex, geometry.start, radius);
    const end = pointOnRay(vertex, geometry.end, radius);
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, 0, geometry.sweep, end.x, end.y
    ].join(' ');
  }

  function labelEccentricityForAngle(angleDeg, options) {
    const settings = mergeOptions(options);
    if (angleDeg >= settings.narrowAngleThresholdDeg) {
      return settings.labelEccentricity;
    }

    const t = Math.max(0, Math.min(1, angleDeg / settings.narrowAngleThresholdDeg));
    return settings.narrowAngleLabelEccentricity
      + (settings.labelEccentricity - settings.narrowAngleLabelEccentricity) * t;
  }

  function angleLabelClassFor(label) {
    if (!label) {
      return 'medium';
    }
    const text = typeof label === 'string' ? label : label.text;
    const latex = typeof label === 'string' ? label : label.latex;
    return ANGLE_LABEL_CLASS_LOOKUP[latex] || ANGLE_LABEL_CLASS_LOOKUP[text] || 'medium';
  }

  function angleLabelStyle(angleDeg, label, options) {
    const settings = mergeOptions(options);
    const labelClassId = settings.labelClassId || angleLabelClassFor(label);
    const fontSizePx = settings.fontSizePx || settings.angleLabelFontSizePx;
    const normalizedAngle = clamp(normalizeDegrees(angleDeg), 10, 350);
    const baseline = baselineAngleLabelStyle(normalizedAngle, labelClassId, fontSizePx, settings);
    const correction = angleLabelSampleCorrection({
      angleDeg: normalizedAngle,
      baseRayAngleDeg: settings.baseRayAngleDeg,
      label,
      labelClassId,
      fontSizePx
    }, settings);
    return {
      angleDeg: normalizedAngle,
      labelClassId,
      arcRadius: clamp(baseline.arcRadius + correction.arcRadius, 12, 220),
      labelPercent: clamp(baseline.labelPercent + correction.labelPercent, 25, 130),
      labelAngleOffsetDeg: clamp(correction.labelAngleOffsetDeg, -90, 90),
      sampleCorrectionWeight: correction.weight,
      fontSizePx,
      baselineFontSizePx: DEFAULTS.angleLabelFontSizePx
    };
  }

  function baselineAngleLabelStyle(angleDeg, labelClassId, fontSizePx, settings) {
    const calibration = angleLabelCalibrationAt(angleDeg, labelClassId);
    return {
      arcRadius: scaleRadiusForFont(calibration.arcRadius, fontSizePx, settings),
      labelPercent: calibration.labelPercent,
      labelAngleOffsetDeg: 0
    };
  }

  function angleLabelSampleCorrection(target, options) {
    const settings = mergeOptions(options);
    const baseRayAngleDeg = normalizeOptionalDegrees(target.baseRayAngleDeg);
    if (baseRayAngleDeg === null || ANGLE_LABEL_SAMPLE_DATA.length === 0) {
      return zeroSampleCorrection();
    }

    let totalWeight = 0;
    let arcRadius = 0;
    let labelPercent = 0;
    let labelAngleOffsetDeg = 0;
    const safeClassId = ANGLE_LABEL_CLASS_IDS.includes(target.labelClassId) ? target.labelClassId : 'medium';
    const targetLabel = normalizeLabel(target.label);

    ANGLE_LABEL_SAMPLE_DATA.forEach(function(sample) {
      const weight = sampleWeight(sample, target, baseRayAngleDeg, safeClassId, targetLabel);
      if (weight < 0.01) {
        return;
      }

      const baseline = baselineAngleLabelStyle(
        sample.angleDeg,
        sample.labelClassId,
        sample.fontSizePx,
        settings
      );
      arcRadius += weight * clamp(sample.arcRadius - baseline.arcRadius, -40, 40);
      labelPercent += weight * clamp(sample.labelPercent - baseline.labelPercent, -30, 30);
      labelAngleOffsetDeg += weight * clamp(sample.labelAngleOffsetDeg, -20, 20);
      totalWeight += weight;
    });

    if (totalWeight < 0.08) {
      return zeroSampleCorrection();
    }

    return {
      arcRadius: arcRadius / totalWeight,
      labelPercent: labelPercent / totalWeight,
      labelAngleOffsetDeg: labelAngleOffsetDeg / totalWeight,
      weight: totalWeight
    };
  }

  function sampleWeight(sample, target, baseRayAngleDeg, labelClassId, targetLabel) {
    const angleDistance = Math.abs(sample.angleDeg - target.angleDeg);
    const baseRayDistance = circularDistance(sample.baseRayAngleDeg, baseRayAngleDeg);
    const fontDistance = Math.abs(sample.fontSizePx - target.fontSizePx);
    let distanceSquared = square(angleDistance / 35)
      + square(baseRayDistance / 70)
      + square(fontDistance / 6);

    if (sample.labelClassId !== labelClassId) {
      distanceSquared += 5;
    } else if (!labelsMatch(sample.label, targetLabel)) {
      distanceSquared += 0.35;
    }

    return Math.exp(-0.5 * distanceSquared) / (0.05 + distanceSquared);
  }

  function angleLabelCalibrationAt(angleDeg, labelClassId) {
    const safeClassId = ANGLE_LABEL_CLASS_IDS.includes(labelClassId) ? labelClassId : 'medium';
    const angle = clamp(normalizeDegrees(angleDeg), 10, 350);
    const exact = ANGLE_LABEL_CALIBRATION.find(function(row) {
      return row.angleDeg === angle;
    });
    if (exact) {
      return exact[safeClassId];
    }

    let lower = ANGLE_LABEL_CALIBRATION[0];
    let upper = ANGLE_LABEL_CALIBRATION[ANGLE_LABEL_CALIBRATION.length - 1];
    for (let index = 0; index < ANGLE_LABEL_CALIBRATION.length - 1; index += 1) {
      const current = ANGLE_LABEL_CALIBRATION[index];
      const next = ANGLE_LABEL_CALIBRATION[index + 1];
      if (current.angleDeg <= angle && angle <= next.angleDeg) {
        lower = current;
        upper = next;
        break;
      }
    }

    const t = (angle - lower.angleDeg) / (upper.angleDeg - lower.angleDeg);
    return {
      arcRadius: lerp(lower[safeClassId].arcRadius, upper[safeClassId].arcRadius, t),
      labelPercent: lerp(lower[safeClassId].labelPercent, upper[safeClassId].labelPercent, t)
    };
  }

  function scaleRadiusForFont(radius, fontSizePx, settings) {
    const scale = fontSizePx / DEFAULTS.angleLabelFontSizePx;
    const floor = settings.angleLabelRadiusFontFloor;
    return floor + (radius - floor) * scale;
  }

  function calibratedAngleMarker(vertex, first, second, label, options) {
    const geometry = angleGeometry(vertex, first, second);
    const style = angleLabelStyle(geometry.angleDeg, label, Object.assign({}, options || {}, {
      baseRayAngleDeg: normalizeOptionalDegrees(options && options.baseRayAngleDeg) === null
        ? normalizeDegrees(-geometry.start * 180 / Math.PI)
        : options.baseRayAngleDeg
    }));
    const labelDistance = style.arcRadius * style.labelPercent / 100;
    const labelAngle = geometry.middle - style.labelAngleOffsetDeg * Math.PI / 180;
    return {
      geometry,
      style,
      arcRadius: style.arcRadius,
      label: Object.assign(pointOnRay(vertex, labelAngle, labelDistance), {
        distance: labelDistance,
        eccentricity: style.labelPercent / 100,
        angleDeg: geometry.angleDeg,
        labelClassId: style.labelClassId,
        labelAngleOffsetDeg: style.labelAngleOffsetDeg
      })
    };
  }

  function calibratedAngleLabelPosition(vertex, first, second, label, options) {
    return calibratedAngleMarker(vertex, first, second, label, options).label;
  }

  function angleLabelPosition(vertex, first, second, radius, options) {
    const geometry = angleGeometry(vertex, first, second);
    const eccentricity = labelEccentricityForAngle(geometry.angleDeg, options);
    const distance = radius * eccentricity;
    return Object.assign(pointOnRay(vertex, geometry.middle, distance), {
      distance,
      eccentricity,
      angleDeg: geometry.angleDeg
    });
  }

  function rightAngleArcDotMarker(vertex, first, second, options) {
    const settings = mergeOptions(options);
    const radius = settings.rightAngleArcRadius;
    const geometry = angleGeometry(vertex, first, second);
    const dotDistance = radius * settings.rightAngleDotEccentricity;

    return {
      type: 'arcDot',
      arc: {
        radius,
        path: arcSvgPath(vertex, first, second, radius),
        points: arcPoints(vertex, first, second, radius, settings.arcSteps)
      },
      dot: Object.assign(pointOnRay(vertex, geometry.middle, dotDistance), {
        radius: settings.rightAngleDotRadius,
        distance: dotDistance,
        eccentricity: settings.rightAngleDotEccentricity
      })
    };
  }

  function rightAngleSquareMarker(vertex, first, second, options) {
    const settings = mergeOptions(options);
    const size = settings.rightAngleSquareSize;
    const u = unitVector(vertex, first);
    const v = unitVector(vertex, second);
    const p1 = { x: vertex.x + u.x * size, y: vertex.y + u.y * size };
    const p2 = { x: p1.x + v.x * size, y: p1.y + v.y * size };
    const p3 = { x: vertex.x + v.x * size, y: vertex.y + v.y * size };

    return {
      type: 'square',
      size,
      points: [p1, p2, p3]
    };
  }

  function rightAngleMarker(vertex, first, second, options) {
    const settings = mergeOptions(options);
    return settings.rightAngleType === 'square'
      ? rightAngleSquareMarker(vertex, first, second, settings)
      : rightAngleArcDotMarker(vertex, first, second, settings);
  }

  function normalizeDegrees(angleDeg) {
    return ((Number(angleDeg) % 360) + 360) % 360;
  }

  function normalizeOptionalDegrees(angleDeg) {
    const number = Number(angleDeg);
    return Number.isFinite(number) ? normalizeDegrees(number) : null;
  }

  function normalizeLabel(label) {
    return {
      text: label && typeof label === 'object' ? label.text : label,
      latex: label && typeof label === 'object' ? label.latex : label
    };
  }

  function labelsMatch(first, second) {
    return Boolean(first && second)
      && (first.text === second.text || first.latex === second.latex);
  }

  function circularDistance(firstDeg, secondDeg) {
    const difference = Math.abs(normalizeDegrees(firstDeg) - normalizeDegrees(secondDeg));
    return Math.min(difference, 360 - difference);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function square(value) {
    return value * value;
  }

  function zeroSampleCorrection() {
    return {
      arcRadius: 0,
      labelPercent: 0,
      labelAngleOffsetDeg: 0,
      weight: 0
    };
  }

  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  const api = Object.freeze({
    VERSION,
    DEFAULTS,
    ANGLE_LABEL_CLASSES,
    ANGLE_LABEL_CALIBRATION_ROWS,
    ANGLE_LABEL_SAMPLE_DATA,
    unitVector,
    angleGeometry,
    arcPoints,
    arcSvgPath,
    labelEccentricityForAngle,
    angleLabelPosition,
    angleLabelClassFor,
    angleLabelStyle,
    angleLabelCalibrationAt,
    angleLabelSampleCorrection,
    calibratedAngleMarker,
    calibratedAngleLabelPosition,
    rightAngleArcDotMarker,
    rightAngleSquareMarker,
    rightAngleMarker
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.GGGeometryAngleLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
