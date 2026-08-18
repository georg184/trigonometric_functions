(function(global) {
  'use strict';

  const VERSION = '1.0.0';
  const QUIZ_MODE = 'unit-circle';
  const QUESTION_KINDS = Object.freeze({
    signsToRegion: 'unit-circle-signs-to-region',
    angleToSigns: 'unit-circle-angle-to-signs'
  });
  const PRESENTATIONS = Object.freeze({
    exactAngle: 'exact-angle',
    openInterval: 'open-interval'
  });
  const SIGNS = Object.freeze({
    negative: 'negative',
    zero: 'zero',
    positive: 'positive'
  });

  const REGIONS = Object.freeze([
    Object.freeze({
      id: 'axis-0',
      kind: 'axis',
      exactAngle: 0,
      sinSign: SIGNS.zero,
      cosSign: SIGNS.positive
    }),
    Object.freeze({
      id: 'quadrant-1',
      kind: 'quadrant',
      lowerBound: 0,
      upperBound: 90,
      sinSign: SIGNS.positive,
      cosSign: SIGNS.positive
    }),
    Object.freeze({
      id: 'axis-90',
      kind: 'axis',
      exactAngle: 90,
      sinSign: SIGNS.positive,
      cosSign: SIGNS.zero
    }),
    Object.freeze({
      id: 'quadrant-2',
      kind: 'quadrant',
      lowerBound: 90,
      upperBound: 180,
      sinSign: SIGNS.positive,
      cosSign: SIGNS.negative
    }),
    Object.freeze({
      id: 'axis-180',
      kind: 'axis',
      exactAngle: 180,
      sinSign: SIGNS.zero,
      cosSign: SIGNS.negative
    }),
    Object.freeze({
      id: 'quadrant-3',
      kind: 'quadrant',
      lowerBound: 180,
      upperBound: 270,
      sinSign: SIGNS.negative,
      cosSign: SIGNS.negative
    }),
    Object.freeze({
      id: 'axis-270',
      kind: 'axis',
      exactAngle: 270,
      sinSign: SIGNS.negative,
      cosSign: SIGNS.zero
    }),
    Object.freeze({
      id: 'quadrant-4',
      kind: 'quadrant',
      lowerBound: 270,
      upperBound: 360,
      sinSign: SIGNS.negative,
      cosSign: SIGNS.positive
    })
  ]);

  const ANGLE_LABELS = Object.freeze([
    Object.freeze({ text: 'α', latex: '\\alpha', name: 'alpha' }),
    Object.freeze({ text: 'β', latex: '\\beta', name: 'beta' }),
    Object.freeze({ text: 'γ', latex: '\\gamma', name: 'gamma' }),
    Object.freeze({ text: 'δ', latex: '\\delta', name: 'delta' }),
    Object.freeze({ text: 'ε', latex: '\\varepsilon', name: 'epsilon' }),
    Object.freeze({ text: 'η', latex: '\\eta', name: 'eta' }),
    Object.freeze({ text: 'φ', latex: '\\varphi', name: 'phi' }),
    Object.freeze({ text: 'ψ', latex: '\\psi', name: 'psi' }),
    Object.freeze({ text: 'ω', latex: '\\omega', name: 'omega' }),
    Object.freeze({ text: 'θ', latex: '\\theta', name: 'theta' }),
    Object.freeze({ text: 'λ', latex: '\\lambda', name: 'lambda' }),
    Object.freeze({ text: 'μ', latex: '\\mu', name: 'mu' })
  ]);

  const QUADRANT_REGIONS = Object.freeze(REGIONS.filter(function(region) {
    return region.kind === 'quadrant';
  }));

  function randomIndex(items, random) {
    return Math.floor(random() * items.length);
  }

  function randomChoice(items, random) {
    return items[randomIndex(items, random)];
  }

  function randomInteger(minimum, maximum, random) {
    return minimum + Math.floor(random() * (maximum - minimum + 1));
  }

  function regionForId(regionId) {
    const region = REGIONS.find(function(candidate) {
      return candidate.id === regionId;
    });
    if (!region) {
      throw new RangeError(`Unknown unit-circle region: ${regionId}`);
    }
    return region;
  }

  function createTask(randomSource) {
    const random = typeof randomSource === 'function' ? randomSource : Math.random;
    const angleLabel = randomChoice(ANGLE_LABELS, random);
    const questionKind = random() < 0.5
      ? QUESTION_KINDS.signsToRegion
      : QUESTION_KINDS.angleToSigns;

    if (questionKind === QUESTION_KINDS.signsToRegion) {
      const region = randomChoice(REGIONS, random);
      return Object.freeze({
        quizMode: QUIZ_MODE,
        questionKind,
        angleLabel,
        regionId: region.id,
        presentation: null,
        angleDegrees: null,
        sinSign: region.sinSign,
        cosSign: region.cosSign
      });
    }

    const presentation = random() < 0.5
      ? PRESENTATIONS.exactAngle
      : PRESENTATIONS.openInterval;
    const regionPool = presentation === PRESENTATIONS.exactAngle
      ? REGIONS
      : QUADRANT_REGIONS;
    const region = randomChoice(regionPool, random);
    const angleDegrees = presentation === PRESENTATIONS.exactAngle
      ? (region.kind === 'axis'
        ? region.exactAngle
        : randomInteger(region.lowerBound + 1, region.upperBound - 1, random))
      : null;

    return Object.freeze({
      quizMode: QUIZ_MODE,
      questionKind,
      angleLabel,
      regionId: region.id,
      presentation,
      angleDegrees,
      sinSign: region.sinSign,
      cosSign: region.cosSign
    });
  }

  function signComparisonLatex(sign) {
    if (sign === SIGNS.negative) return '\\lt 0';
    if (sign === SIGNS.zero) return '=0';
    if (sign === SIGNS.positive) return '\\gt 0';
    throw new RangeError(`Unknown trigonometric sign: ${sign}`);
  }

  function regionLatex(regionId, angleLabel) {
    const region = regionForId(regionId);
    const angle = angleLabel.latex;
    if (region.kind === 'axis') {
      return `${angle}=${region.exactAngle}^{\\circ}`;
    }
    return `${region.lowerBound}^{\\circ}\\lt ${angle}\\lt ${region.upperBound}^{\\circ}`;
  }

  function angleStatementLatex(task) {
    if (task.presentation === PRESENTATIONS.exactAngle) {
      return `${task.angleLabel.latex}=${task.angleDegrees}^{\\circ}`;
    }
    return regionLatex(task.regionId, task.angleLabel);
  }

  function signsStatementLatex(task) {
    const angle = task.angleLabel.latex;
    return [
      `\\sin\\!\\left(${angle}\\right)${signComparisonLatex(task.sinSign)}`,
      `\\cos\\!\\left(${angle}\\right)${signComparisonLatex(task.cosSign)}`
    ].join(',\\quad ');
  }

  function questionLatex(task) {
    const statement = task.questionKind === QUESTION_KINDS.signsToRegion
      ? signsStatementLatex(task)
      : angleStatementLatex(task);
    return `\\(${statement}\\)`;
  }

  function solutionLatex(task) {
    const angleOrSigns = task.questionKind === QUESTION_KINDS.signsToRegion
      ? signsStatementLatex(task)
      : angleStatementLatex(task);
    const result = task.questionKind === QUESTION_KINDS.signsToRegion
      ? regionLatex(task.regionId, task.angleLabel)
      : signsStatementLatex(task);
    return `\\[${angleOrSigns}\\quad\\Longrightarrow\\quad ${result}\\]`;
  }

  function checkAnswer(answer, task) {
    if (!answer || typeof answer !== 'object') return false;
    if (task.questionKind === QUESTION_KINDS.signsToRegion) {
      return answer.regionId === task.regionId;
    }
    if (task.questionKind === QUESTION_KINDS.angleToSigns) {
      return answer.sinSign === task.sinSign && answer.cosSign === task.cosSign;
    }
    return false;
  }

  REGIONS.forEach(function(region) {
    const zeroCount = [region.sinSign, region.cosSign].filter(function(sign) {
      return sign === SIGNS.zero;
    }).length;
    if ((region.kind === 'axis' && zeroCount !== 1) || (region.kind === 'quadrant' && zeroCount !== 0)) {
      throw new Error(`Invalid unit-circle sign model for ${region.id}.`);
    }
  });

  const api = Object.freeze({
    VERSION,
    QUIZ_MODE,
    QUESTION_KINDS,
    PRESENTATIONS,
    SIGNS,
    REGIONS,
    ANGLE_LABELS,
    QUADRANT_REGIONS,
    createTask,
    regionForId,
    regionLatex,
    signComparisonLatex,
    questionLatex,
    solutionLatex,
    checkAnswer
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.GGUnitCircleQuiz = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
