/*
 * Shared geometry helpers for angle markers and angle labels.
 *
 * The functions in this file do not create DOM nodes. They only compute
 * renderer-independent geometry that can be consumed by SVG, D3, JSXGraph,
 * GeoGebra command generation, or HTML/MathJax label overlays.
 */
(function(global) {
  'use strict';

  const VERSION = '0.1.0';

  const DEFAULTS = Object.freeze({
    acuteAngleArcRadius: 44,
    labelEccentricity: 0.6,
    narrowAngleLabelEccentricity: 0.85,
    narrowAngleThresholdDeg: 25,
    rightAngleArcRadius: 26,
    rightAngleDotEccentricity: 0.6,
    rightAngleDotRadius: 3.2,
    rightAngleSquareSize: 24,
    arcSteps: 18
  });

  function mergeOptions(options) {
    return Object.assign({}, DEFAULTS, options || {});
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

  const api = Object.freeze({
    VERSION,
    DEFAULTS,
    unitVector,
    angleGeometry,
    arcPoints,
    arcSvgPath,
    labelEccentricityForAngle,
    angleLabelPosition,
    rightAngleArcDotMarker,
    rightAngleSquareMarker,
    rightAngleMarker
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.GGGeometryAngleLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
