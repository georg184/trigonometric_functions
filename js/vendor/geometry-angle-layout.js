/*
 * Shared geometry helpers for angle markers and angle labels.
 *
 * The functions in this file do not create DOM nodes. They only compute
 * renderer-independent geometry that can be consumed by SVG, D3, JSXGraph,
 * GeoGebra command generation, or HTML/MathJax label overlays.
 */
(function(global) {
  'use strict';

  const VERSION = '0.2.0';

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

  function mergeOptions(options) {
    return Object.assign({}, DEFAULTS, options || {});
  }

  function calibrationPair(pair) {
    return {
      arcRadius: pair[0],
      labelPercent: pair[1]
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
    const calibration = angleLabelCalibrationAt(angleDeg, labelClassId);
    return {
      angleDeg: normalizeDegrees(angleDeg),
      labelClassId,
      arcRadius: scaleRadiusForFont(calibration.arcRadius, fontSizePx, settings),
      labelPercent: calibration.labelPercent,
      fontSizePx,
      baselineFontSizePx: DEFAULTS.angleLabelFontSizePx
    };
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
    const style = angleLabelStyle(geometry.angleDeg, label, options);
    const labelDistance = style.arcRadius * style.labelPercent / 100;
    return {
      geometry,
      style,
      arcRadius: style.arcRadius,
      label: Object.assign(pointOnRay(vertex, geometry.middle, labelDistance), {
        distance: labelDistance,
        eccentricity: style.labelPercent / 100,
        angleDeg: geometry.angleDeg,
        labelClassId: style.labelClassId
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

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  const api = Object.freeze({
    VERSION,
    DEFAULTS,
    ANGLE_LABEL_CLASSES,
    ANGLE_LABEL_CALIBRATION_ROWS,
    unitVector,
    angleGeometry,
    arcPoints,
    arcSvgPath,
    labelEccentricityForAngle,
    angleLabelPosition,
    angleLabelClassFor,
    angleLabelStyle,
    angleLabelCalibrationAt,
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
