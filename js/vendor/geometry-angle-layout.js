/*
 * Shared geometry helpers for angle markers and angle labels.
 *
 * The functions in this file do not create DOM nodes. They only compute
 * renderer-independent geometry that can be consumed by SVG, D3, JSXGraph,
 * GeoGebra command generation, or HTML/MathJax label overlays.
 *
 * CALIBRATED ANGLE-LABEL RENDER CONTRACT
 * --------------------------------------
 * The fitted values are renderer-independent geometry, but the observations
 * were made against the MathJax render profile exported below. Consumers must
 * render calibrated labels with that same pinned MathJax version, output
 * processor, scale, exact CSS-pixel font size, font weight, line height, and
 * center anchor.
 * `fontSizePx` means the actual CSS pixel size applied to the label element;
 * it is not a nominal rem/em value. Call assertAngleLabelRenderProfile() in an
 * application adapter so an incompatible renderer fails visibly instead of
 * silently producing labels whose geometry is numerically correct but whose
 * glyph boxes differ from the calibration environment.
 */
(function(global) {
  'use strict';

  const VERSION = '0.4.19';
  const ANGLE_LABEL_CALIBRATION_VERSION = 'angle-label-tuning-v33';
  const ANGLE_LABEL_DATA_VERSION = 'angle-label-data-cloud-v24';
  const ANGLE_LABEL_RENDER_PROFILE = Object.freeze({
    id: 'mathjax-3.2.2-chtml-tex-scale1-css-px-v1',
    renderer: 'MathJax',
    rendererVersion: '3.2.2',
    inputProcessor: 'tex',
    outputProcessor: 'chtml',
    outputScale: 1,
    matchFontHeight: false,
    fontSizeUnit: 'px',
    containerFontWeight: 900,
    lineHeight: 1,
    horizontalAnchor: 'center',
    verticalAnchor: 'center'
  });

  const DEFAULTS = Object.freeze({
    acuteAngleArcRadius: 44,
    angleLabelFontSizePx: 16,
    angleLabelRadiusFontFloor: 12,
    labelEccentricity: 0.6,
    narrowAngleLabelEccentricity: 0.85,
    narrowAngleThresholdDeg: 25,
    angleLabelSampleMinWeight: 0.08,
    angleLabelResidualMinWeight: 0.35,
    angleLabelResidualFullWeight: 8,
    angleLabelResidualConfidenceWeightCap: 1,
    angleLabelResidualFullEffectiveSampleSize: 3,
    angleLabelResidualSingleSampleMaxBlend: 0.1,
    angleLabelResidualMaxBlend: 0.85,
    angleRayStrokeWidthPx: 3.25,
    angleArcStrokeWidthPx: 2.25,
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
    [10,[46,83],[73,87],[87,88]],
    [20,[40,79],[60,85],[63,83]],
    [30,[35,77],[47,80],[43,77]],
    [40,[31,75],[34,70],[35,73]],
    [50,[27,71],[29,68],[32,70]],
    [60,[25,68],[26,66],[29,68]],
    [70,[22,65],[25,64],[26,65]],
    [80,[20,64],[23,63],[24,62]],
    [90,[20,62],[22,61],[22,61]],
    [100,[19,60],[21,60],[22,59]],
    [110,[19,59],[20,59],[21,58]],
    [120,[18,56],[20,58],[21,57]],
    [130,[17,55],[20,56],[20,56]],
    [140,[17,53],[19,56],[20,54]],
    [150,[16,52],[19,55],[20,53]],
    [160,[16,51],[19,54],[20,53]],
    [170,[16,51],[18,53],[20,52]],
    [180,[16,51],[18,53],[20,52]],
    [190,[16,52],[18,53],[20,52]],
    [200,[16,52],[18,53],[19,52]],
    [210,[16,52],[18,52],[19,52]],
    [220,[16,53],[18,51],[19,51]],
    [230,[16,53],[18,51],[19,50]],
    [240,[16,52],[17,50],[19,50]],
    [250,[16,52],[17,50],[19,50]],
    [260,[16,51],[18,49],[19,50]],
    [270,[16,50],[18,49],[19,50]],
    [280,[16,50],[17,49],[18,50]],
    [290,[16,49],[17,49],[18,50]],
    [300,[16,49],[17,49],[19,50]],
    [310,[16,49],[17,49],[19,50]],
    [320,[16,49],[17,50],[19,50]],
    [330,[16,48],[17,50],[19,50]],
    [340,[16,49],[17,50],[19,50]],
    [350,[15,49],[17,51],[19,50]]
  ]);

  const ANGLE_LABEL_SAMPLE_ROWS = Object.freeze([
    [350,260,"\\kappa","κ","small",20,22,58,0,2.2,2,"estimated-old-lab"],
    [10,170,"\\chi","χ","medium",12,92,90,-1,2.2,2,"estimated-old-lab"],
    [100,30,"\\varepsilon","ε","small",12,18,62,0,2.2,2,"estimated-old-lab"],
    [50,190,"\\rho","ρ","medium",20,36,61,-3,2.2,2,"estimated-old-lab"],
    [150,140,"\\sigma","σ","small",20,24,45,-2,2.2,2,"estimated-old-lab"],
    [40,130,"o","ο","small",12,27,74,-2,2.2,2,"estimated-old-lab"],
    [40,80,"\\varepsilon","ε","small",24,41,77,-2,2.2,2,"estimated-old-lab"],
    [60,210,"\\alpha","α","small",14,23,60,0,2.2,2,"estimated-old-lab"],
    [310,150,"\\pi","π","medium",22,20,45,5,2.2,2,"estimated-old-lab"],
    [250,160,"\\alpha","α","small",22,21,40,8,2.2,2,"estimated-old-lab"],
    [240,260,"\\rho","ρ","medium",24,23,52,5,2.2,2,"estimated-old-lab"],
    [230,30,"\\kappa","κ","small",24,22,59,-10,2.2,2,"estimated-old-lab"],
    [230,290,"\\zeta","ζ","large",22,26,48,0,2.2,2,"estimated-old-lab"],
    [210,190,"\\lambda","λ","large",14,20,47,3,2.2,2,"estimated-old-lab"],
    [240,270,"o","ο","small",24,22,54,10,2.2,2,"estimated-old-lab"],
    [120,320,"\\iota","ι","small",14,16,60,8,2.2,2,"estimated-old-lab"],
    [150,120,"\\gamma","γ","medium",14,16,55,0,2.2,2,"estimated-old-lab"],
    [330,240,"\\tau","τ","small",16,17,55,3,2.2,2,"estimated-old-lab"],
    [230,250,"\\lambda","λ","large",18,20,48,0,2.2,2,"estimated-old-lab"],
    [350,260,"\\pi","π","medium",20,21,60,4,2.2,2,"estimated-old-lab"],
    [270,250,"\\lambda","λ","large",22,22,52,0,2.2,2,"estimated-old-lab"],
    [190,10,"\\theta","θ","medium",14,18,50,-3.5,2.2,2,"estimated-old-lab"],
    [310,40,"\\chi","χ","medium",20,24,45,-17,2.2,2,"estimated-old-lab"],
    [210,0,"\\varepsilon","ε","small",14,17,56,-2,2.2,2,"estimated-old-lab"],
    [140,220,"\\gamma","γ","medium",24,26,46,0,2.2,2,"estimated-old-lab"],
    [290,190,"\\alpha","α","small",18,20,49,22.5,2.2,2,"estimated-old-lab"],
    [240,30,"o","ο","small",24,21,51,-8.5,2.2,2,"estimated-old-lab"],
    [20,80,"\\psi","ψ","large",22,73,81,-0.5,2.2,2,"estimated-old-lab"],
    [330,40,"\\varphi","φ","medium",16,20,47,-6,2.2,2,"estimated-old-lab"],
    [310,170,"\\rho","ρ","medium",18,18,46,12.5,2.2,2,"estimated-old-lab"],
    [180,40,"\\varepsilon","ε","small",16,19,52,-4.5,2.2,2,"estimated-old-lab"],
    [80,20,"\\nu","ν","small",16,22,66,2,2.2,2,"estimated-old-lab"],
    [200,50,"\\gamma","γ","medium",20,21,54,-6.5,2.2,2,"estimated-old-lab"],
    [260,10,"\\iota","ι","small",18,17,52,-5.5,2.2,2,"estimated-old-lab"],
    [240,40,"\\upsilon","υ","small",16,17,48,-7,2.2,2,"estimated-old-lab"],
    [190,310,"\\delta","δ","large",24,26,47,0,2.2,2,"estimated-old-lab"],
    [150,160,"\\eta","η","medium",12,16,50,0,2.2,2,"estimated-old-lab"],
    [320,310,"\\theta","θ","medium",12,16,46,3.5,2.2,2,"estimated-old-lab"],
    [130,60,"\\psi","ψ","large",22,26,55,0,2.2,2,"estimated-old-lab"],
    [270,140,"\\nu","ν","small",14,16,43,7.5,2.2,2,"estimated-old-lab"],
    [100,10,"\\lambda","λ","large",16,22,58,0,2.2,2,"estimated-old-lab"],
    [280,190,"\\lambda","λ","large",18,20,44,6,2.2,2,"estimated-old-lab"],
    [310,240,"\\theta","θ","medium",12,15.1,51,-7.5,2.2,2,"estimated-old-lab"],
    [110,60,"\\beta","β","large",16,21.4,56,-2.5,2.2,2,"estimated-old-lab"],
    [70,0,"\\chi","χ","medium",16,25,70,5.5,2.2,2,"estimated-old-lab"],
    [10,220,"\\psi","ψ","large",24,145,90,0,2.2,2,"estimated-old-lab"],
    [210,130,"\\alpha","α","small",22,20.7,44,-4,2.2,2,"estimated-old-lab"],
    [250,0,"\\rho","ρ","medium",24,23,55,-2.9,2.2,2,"estimated-old-lab"],
    [70,120,"\\nu","ν","small",20,29.3,65,-5,2.2,2,"estimated-old-lab"],
    [300,350,"\\rho","ρ","medium",22,20,53,-6.9,2.2,2,"estimated-old-lab"],
    [90,120,"\\mu","μ","medium",12,19.1,61,-3,2.2,2,"estimated-old-lab"],
    [30,200,"\\varepsilon","ε","small",18,36.4,72.9,-2,2.2,2,"estimated-old-lab"],
    [290,160,"\\eta","η","medium",18,19,43,9,2.2,2,"estimated-old-lab"],
    [30,10,"\\rho","ρ","medium",24,52,78,4.5,2.2,2,"estimated-old-lab"],
    [240,270,"o","ο","small",20,20,55,6.5,2.2,2,"estimated-old-lab"],
    [290,60,"\\tau","τ","small",22,21,49.3,-6.5,2.2,2,"estimated-old-lab"],
    [80,280,"\\nu","ν","small",22,28,62,2.1,2.2,2,"estimated-old-lab"],
    [170,210,"\\eta","η","medium",12,16,49,-0.1,2.2,2,"estimated-old-lab"],
    [100,200,"\\psi","ψ","large",22,30,54,-2.5,2.2,2,"estimated-old-lab"],
    [340,200,"\\varphi","φ","medium",22,21,52,9.5,2.2,2,"estimated-old-lab"],
    [310,290,"\\xi","ξ","large",12,19,55,0.5,2.2,2,"estimated-old-lab"],
    [180,270,"\\alpha","α","small",18,20,55,10.5,2.2,2,"estimated-old-lab"],
    [100,260,"\\rho","ρ","medium",20,25,52,4,2.2,2,"estimated-old-lab"],
    [150,310,"\\lambda","λ","large",12,16,57,0.7,2.2,2,"estimated-old-lab"],
    [240,290,"\\eta","η","medium",16,17.4,55,-6,2.2,2,"estimated-old-lab"],
    [190,200,"\\sigma","σ","small",22,22,48,10.5,2.2,2,"estimated-old-lab"],
    [100,10,"\\psi","ψ","large",20,27.1,59,1.5,2.2,2,"estimated-old-lab"],
    [10,170,"\\mu","μ","medium",24,135.5,91,-1.5,2.2,2,"estimated-old-lab"],
    [220,160,"\\xi","ξ","large",24,29,50,1.1,2.2,2,"estimated-old-lab"],
    [60,100,"\\varphi","φ","medium",22,36.9,70,-4,2.2,2,"estimated-old-lab"],
    [140,320,"\\eta","η","medium",20,22.1,59,5.5,2.2,2,"estimated-old-lab"],
    [220,20,"\\gamma","γ","medium",12,15,49,4,2.2,2,"estimated-old-lab"],
    [270,190,"\\alpha","α","small",12,16,52,17,2.2,2,"estimated-old-lab"],
    [80,110,"\\rho","ρ","medium",18,24.8,67,-4.5,2.2,2,"estimated-old-lab"],
    [300,280,"o","ο","small",24,23.6,55,1,2.2,2,"estimated-old-lab"],
    [250,340,"\\kappa","κ","small",22,21.4,58,5,2.2,2,"estimated-old-lab"],
    [30,320,"\\zeta","ζ","large",24,65,82,1,2.2,2,"estimated-old-lab"],
    [40,140,"\\iota","ι","small",22,34,75,-4.5,2.2,2,"estimated-old-lab"],
    [280,350,"\\varphi","φ","medium",14,18.7,48,3,2.2,2,"estimated-old-lab"],
    [150,100,"\\iota","ι","small",16,17,52.4,-5.5,2.2,2,"estimated-old-lab"],
    [290,90,"\\omega","ω","medium",24,24,44,-11,2.2,2,"estimated-old-lab"],
    [120,0,"\\xi","ξ","large",12,20,55.7,0.5,2.2,2,"estimated-old-lab"],
    [180,190,"\\nu","ν","small",20,21,45.7,3.5,2.2,2,"estimated-old-lab"],
    [320,240,"\\alpha","α","small",18,19.7,59,3.5,2.2,2,"estimated-old-lab"],
    [350,230,"\\psi","ψ","large",14,18,50,1,2.2,2,"estimated-old-lab"],
    [10,200,"\\lambda","λ","large",20,138.3,91,0,2.2,2,"estimated-old-lab"],
    [90,130,"\\upsilon","υ","small",20,22.9,62.2,-5.5,2.2,2,"estimated-transition-lab"],
    [110,50,"\\chi","χ","medium",12,19,63,-3.5,2.2,2,"estimated-transition-lab"],
    [90,210,"\\chi","χ","medium",24,32,49,0.8,2.2,2,"estimated-transition-lab"],
    [200,130,"\\lambda","λ","large",12,17,54,2.9,2.2,2,"estimated-transition-lab"],
    [250,70,"\\kappa","κ","small",20,21,50,-11,2.2,2,"estimated-transition-lab"],
    [170,60,"\\rho","ρ","medium",16,18,54,-7,2.2,2,"estimated-transition-lab"],
    [140,250,"\\zeta","ζ","large",16,23,50,-1.5,3.25,2.25,"estimated-transition-lab"],
    [140,220,"\\upsilon","υ","small",20,20.8,48,3.7,3.25,2.25,"estimated-transition-lab"],
    [220,0,"\\zeta","ζ","large",20,25,55,3,3.25,2.25,"estimated-transition-lab"],
    [180,350,"\\gamma","γ","medium",22,26,60,5.5,3.25,2.25,"estimated-transition-lab"],
    [350,130,"\\sigma","σ","small",12,17,52,11,3.25,2.25,"estimated-transition-lab"],
    [200,40,"\\varphi","φ","medium",14,19,49.2,-5.5,3.25,2.25,"estimated-transition-lab"],
    [240,230,"\\iota","ι","small",14,16.6,51.7,13,3.25,2.25,"estimated-transition-lab"],
    [130,290,"\\beta","β","large",14,22,58,0.5,3.25,2.25,"estimated-transition-lab"],
    [30,120,"\\beta","β","large",18,65,82,-0.5,3.25,2.25,"estimated-transition-lab"],
    [80,190,"\\theta","θ","medium",14,27,63,-1.5,3.25,2.25,"estimated-transition-lab"],
    [280,110,"\\pi","π","medium",22,26,43.9,-5,3.25,2.25,"estimated-transition-lab"],
    [70,280,"\\sigma","σ","small",22,33.4,63,5,3.25,2.25,"estimated-transition-lab"],
    [90,340,"o","ο","small",14,22,65,2.9,3.25,2.25,"estimated-transition-lab"],
    [130,90,"\\upsilon","υ","small",18,23,58,-4.5,3.25,2.25,"estimated-transition-lab"],
    [290,350,"\\varphi","φ","medium",24,25,53.4,-7.2,3.25,2.25,"estimated-transition-lab"],
    [260,130,"\\mu","μ","medium",18,21,40.6,2.5,3.25,2.25,"estimated-current-lab"],
    [190,210,"\\upsilon","υ","small",18,19.6,47,4,3.25,2.25,"estimated-current-lab"],
    [90,130,"\\varepsilon","ε","small",12,18,62.8,-4.5,3.25,2.25,"estimated-current-lab"],
    [320,110,"\\iota","ι","small",22,22.7,46,2,3.25,2.25,"estimated-current-lab"],
    [30,240,"\\eta","η","medium",14,45,75,0,3.25,2.25,"estimated-current-lab"],
    [200,80,"\\omega","ω","medium",20,24,54,-7.5,3.25,2.25,"estimated-current-lab"],
    [160,10,"\\psi","ψ","large",12,19,51.9,0.4,3.25,2.25,"estimated-current-lab"],
    [10,240,"\\rho","ρ","medium",20,115,87,-1,3.25,2.25,"estimated-current-lab"],
    [60,290,"\\lambda","λ","large",20,38,65,0.6,3.25,2.25,"estimated-current-lab"],
    [160,350,"\\delta","δ","large",20,27,50.8,0.3,3.25,2.25,"estimated-current-lab"],
    [110,270,"\\nu","ν","small",14,21,59,5.1,3.25,2.25,"estimated-current-lab"],
    [270,190,"\\sigma","σ","small",18,20,50,14.5,3.25,2.25,"estimated-current-lab"],
    [60,320,"\\pi","π","medium",16,31,67.4,4.5,3.25,2.25,"estimated-current-lab"],
    [60,300,"\\gamma","γ","medium",14,30,66,2.5,3.25,2.25,"estimated-current-lab"],
    [200,0,"\\varepsilon","ε","small",20,22.3,58,-4,3.25,2.25,"estimated-current-lab"],
    [240,270,"\\delta","δ","large",22,25,48.8,-1,3.25,2.25,"estimated-current-lab"],
    [350,100,"\\varphi","φ","medium",24,26,43,1.5,3.25,2.25,"estimated-current-lab"],
    [180,290,"\\omega","ω","medium",12,18,58,-1.2,3.25,2.25,"estimated-current-lab"],
    [120,330,"\\beta","β","large",12,22,58.2,0.4,3.25,2.25,"estimated-current-lab"],
    [300,200,"\\omega","ω","medium",22,24,52,8.5,3.25,2.25,"estimated-current-lab"],
    [230,350,"\\varepsilon","ε","small",14,18,56,-2.6,3.25,2.25,"estimated-current-lab"],
    [250,200,"\\delta","δ","large",12,18,52,3.2,3.25,2.25,"estimated-current-lab"],
    [160,0,"\\gamma","γ","medium",16,21,55,0,3.25,2.25,"estimated-current-lab"],
    [190,200,"\\varepsilon","ε","small",12,17,50,6.3,3.25,2.25,"estimated-current-lab"],
    [100,60,"\\delta","δ","large",22,31,58.5,-1,3.25,2.25,"estimated-current-lab"],
    [310,140,"\\gamma","γ","medium",12,18,46.2,4.7,3.25,2.25,"estimated-current-lab"],
    [330,160,"\\lambda","λ","large",24,25,46,4.3,3.25,2.25,"estimated-current-lab"],
    [340,10,"\\beta","β","large",14,20,50,0,3.25,2.25,"estimated-current-lab"],
    [280,120,"\\varepsilon","ε","small",20,20,42,2.6,3.25,2.25,"estimated-current-lab"],
    [200,70,"\\xi","ξ","large",14,20,53.2,1.5,3.25,2.25,"estimated-current-lab"],
    [350,60,"\\chi","χ","medium",18,24,42,-16,3.25,2.25,"estimated-current-lab"],
    [290,270,"\\varphi","φ","medium",20,24,62,-0.9,3.25,2.25,"estimated-current-lab"],
    [230,200,"\\varphi","φ","medium",12,16,53.3,4.5,3.25,2.25,"estimated-current-lab"],
    [330,220,"\\theta","θ","medium",24,23.6,52,-3.5,3.25,2.25,"estimated-current-lab"],
    [340,150,"\\rho","ρ","medium",20,20,45,9.5,3.25,2.25,"estimated-current-lab"],
    [240,250,"\\nu","ν","small",22,23,53.3,3.5,3.25,2.25,"estimated-current-lab"],
    [240,10,"\\lambda","λ","large",18,24,49,2,3.25,2.25,"estimated-current-lab"],
    [270,210,"\\nu","ν","small",12,17,53,9.5,3.25,2.25,"estimated-current-lab"],
    [320,40,"\\rho","ρ","medium",18,23,47,-9.2,3.25,2.25,"estimated-current-lab"],
    [140,100,"\\beta","β","large",20,25,57,-4.5,3.25,2.25,"estimated-current-lab"],
    [160,60,"\\beta","β","large",22,25.5,52,1.5,3.25,2.25,"estimated-current-lab"],
    [60,300,"\\theta","θ","medium",22,39.2,68,0,3.25,2.25,"estimated-current-lab"],
    [140,30,"\\chi","χ","medium",22,29,67,-2.5,3.25,2.25,"estimated-current-lab"],
    [170,140,"\\beta","β","large",12,19,55,2.5,3.25,2.25,"estimated-current-lab"],
    [290,200,"\\mu","μ","medium",16,19,51,6.2,3.25,2.25,"estimated-current-lab"],
    [290,150,"\\rho","ρ","medium",16,17,44.8,15.5,3.25,2.25,"estimated-current-lab"],
    [260,70,"\\delta","δ","large",14,19,51,-9.5,3.25,2.25,"estimated-current-lab"],
    [200,80,"\\upsilon","υ","small",20,23,54,-4.5,3.25,2.25,"estimated-current-lab"],
    [160,300,"\\xi","ξ","large",12,19,52.9,-2,3.25,2.25,"estimated-current-lab"],
    [150,20,"\\alpha","α","small",18,20,62,-2,3.25,2.25,"estimated-current-lab"],
    [270,40,"\\varepsilon","ε","small",18,18,49,-10.5,3.25,2.25,"estimated-current-lab"],
    [130,260,"\\iota","ι","small",24,25.7,49,4.1,3.25,2.25,"estimated-current-lab"],
    [290,20,"\\nu","ν","small",12,15,49.8,-3.3,3.25,2.25,"estimated-current-lab"],
    [80,150,"\\varepsilon","ε","small",20,27,62,-5,3.25,2.25,"estimated-current-lab"],
    [230,40,"\\rho","ρ","medium",16,19,51,-3,3.25,2.25,"estimated-current-lab"],
    [170,210,"\\rho","ρ","medium",18,21.2,45,2.5,3.25,2.25,"estimated-current-lab"],
    [280,120,"\\theta","θ","medium",20,24,50,1.4,3.25,2.25,"estimated-current-lab"],
    [110,310,"\\pi","π","medium",16,23,59,3.1,3.25,2.25,"estimated-current-lab"],
    [190,20,"\\varphi","φ","medium",14,21,53,-5,3.25,2.25,"estimated-current-lab"],
    [120,330,"\\beta","β","large",20,29,57.5,1.5,3.25,2.25,"estimated-current-lab"],
    [330,280,"\\pi","π","medium",18,22,59,-0.5,3.25,2.25,"estimated-current-lab"],
    [150,10,"\\tau","τ","small",18,21,60,-1.2,3.25,2.25,"estimated-current-lab"],
    [100,210,"\\chi","χ","medium",24,34,49.7,0.8,3.25,2.25,"estimated-current-lab"],
    [170,120,"\\pi","π","medium",22,26,51,-4.4,3.25,2.25,"estimated-current-lab"],
    [30,290,"\\alpha","α","small",16,46,76,3,3.25,2.25,"estimated-current-lab"],
    [150,190,"\\iota","ι","small",20,22,47,2.3,3.25,2.25,"estimated-current-lab"],
    [300,310,"\\alpha","α","small",12,18,56,1.5,3.25,2.25,"estimated-current-lab"],
    [90,130,"\\upsilon","υ","small",12,21,62.7,-3.9,3.25,2.25,"estimated-current-lab"],
    [10,100,"o","ο","small",14,98,91.8,-1,3.25,2.25,"estimated-current-lab"],
    [250,90,"\\chi","χ","medium",16,25,47,-17.5,3.25,2.25,"estimated-current-lab"],
    [160,100,"\\eta","η","medium",12,19,54,2.5,3.25,2.25,"estimated-current-lab"],
    [270,250,"\\psi","ψ","large",22,27,50,0.4,3.25,2.25,"estimated-current-lab"],
    [140,100,"\\delta","δ","large",16,23,56,-1.5,3.25,2.25,"estimated-current-lab"],
    [80,180,"\\eta","η","medium",14,27,62.1,-1.7,3.25,2.25,"estimated-current-lab"],
    [180,180,"\\tau","τ","small",18,22,47.7,4,3.25,2.25,"estimated-current-lab"],
    [180,250,"\\psi","ψ","large",24,29.3,51,2,3.25,2.25,"estimated-current-lab"],
    [260,90,"\\rho","ρ","medium",14,23,44,-5.5,3.25,2.25,"estimated-current-lab"],
    [60,160,"\\nu","ν","small",20,33,64.6,-4,3.25,2.25,"estimated-current-lab"],
    [310,320,"\\tau","τ","small",18,19,56.8,5,3.25,2.25,"estimated-current-lab"],
    [260,110,"\\nu","ν","small",14,18,47,3.5,3.25,2.25,"estimated-current-lab"],
    [310,100,"\\iota","ι","small",16,17.5,45,-3.5,3.25,2.25,"estimated-current-lab"],
    [160,350,"\\pi","π","medium",18,24,61,1.5,3.25,2.25,"estimated-current-lab"],
    [300,350,"\\nu","ν","small",20,22,51.4,-5,3.25,2.25,"estimated-current-lab"],
    [20,180,"o","ο","small",22,62,81.8,-2,3.25,2.25,"estimated-current-lab"],
    [100,280,"\\varphi","φ","medium",18,26,58,4.5,3.25,2.25,"estimated-current-lab"],
    [270,190,"\\beta","β","large",18,21,51,6,3.25,2.25,"estimated-current-lab"],
    [50,150,"\\sigma","σ","small",16,32,70,-2.7,3.25,2.25,"estimated-current-lab"],
    [60,30,"\\beta","β","large",24,45,65.1,1.5,3.25,2.25,"estimated-current-lab"],
    [50,350,"\\pi","π","medium",16,36,70,2.5,3.25,2.25,"estimated-current-lab"],
    [80,200,"\\sigma","σ","small",16,24,61,-0.8,3.25,2.25,"estimated-current-lab"],
    [270,260,"\\iota","ι","small",14,17,56,6.5,3.25,2.25,"estimated-current-lab"],
    [70,130,"\\zeta","ζ","large",20,38,69,-2,3.25,2.25,"estimated-current-lab"],
    [290,270,"\\mu","μ","medium",20,26,60,-7,3.25,2.25,"estimated-current-lab"],
    [350,50,"\\xi","ξ","large",16,22,48.7,-8,3.25,2.25,"estimated-current-lab"],
    [300,290,"\\eta","η","medium",16,23,53,-3,3.25,2.25,"estimated-current-lab"],
    [320,280,"\\kappa","κ","small",14,18,58,-2,3.25,2.25,"estimated-current-lab"],
    [20,340,"\\omega","ω","medium",16,60,83.7,2,3.25,2.25,"estimated-current-lab"],
    [40,270,"\\beta","β","large",16,42,77,-1.5,3.25,2.25,"estimated-current-lab"],
    [290,150,"\\lambda","λ","large",20,24,48,8,3.25,2.25,"estimated-current-lab"],
    [200,250,"\\varepsilon","ε","small",20,22,51,8.5,3.25,2.25,"estimated-current-lab"],
    [140,130,"\\mu","μ","medium",24,30,51,-4,3.25,2.25,"estimated-current-lab"],
    [310,340,"\\beta","β","large",16,23,50,10.5,3.25,2.25,"estimated-current-lab"],
    [180,120,"\\psi","ψ","large",16,25,54,-1.5,3.25,2.25,"estimated-current-lab"],
    [340,330,"\\beta","β","large",18,23,49,0.2,3.25,2.25,"estimated-current-lab"],
    [290,200,"\\upsilon","υ","small",16,22,47,6.5,3.25,2.25,"estimated-current-lab"],
    [110,150,"\\varepsilon","ε","small",20,26,59,-8,3.25,2.25,"estimated-current-lab"],
    [220,80,"\\theta","θ","medium",12,18,53,-2.5,3.25,2.25,"estimated-current-lab"],
    [190,50,"\\sigma","σ","small",24,25.7,53.6,-9,3.25,2.25,"estimated-current-lab"],
    [80,160,"\\lambda","λ","large",24,34,61,-1.9,3.25,2.25,"estimated-current-lab"],
    [350,250,"\\rho","ρ","medium",22,24,62,1.5,3.25,2.25,"estimated-current-lab"],
    [160,60,"\\lambda","λ","large",20,25,56,-7.5,3.25,2.25,"estimated-current-lab"],
    [250,180,"\\sigma","σ","small",18,21,49,10.5,3.25,2.25,"estimated-current-lab"],
    [140,240,"\\alpha","α","small",12,18,55,6,3.25,2.25,"estimated-current-lab"],
    [240,130,"\\theta","θ","medium",20,24,52,-2,3.25,2.25,"estimated-current-lab"],
    [350,290,"\\gamma","γ","medium",22,25,58,5,3.25,2.25,"estimated-current-lab"],
    [310,170,"\\mu","μ","medium",16,21,48,7.5,3.25,2.25,"estimated-current-lab"],
    [110,330,"\\gamma","γ","medium",18,26,59,5.5,3.25,2.25,"estimated-current-lab"],
    [150,210,"\\kappa","κ","small",20,21.2,47,3.2,3.25,2.25,"estimated-current-lab"],
    [240,270,"\\eta","η","medium",22,23,53,2.3,3.25,2.25,"estimated-current-lab"],
    [60,210,"\\beta","β","large",12,28,69,1,3.25,2.25,"estimated-current-lab"],
    [330,10,"\\beta","β","large",18,22.9,50,-0.5,3.25,2.25,"estimated-current-lab"],
    [80,50,"\\psi","ψ","large",14,24,61,-0.5,3.25,2.25,"estimated-current-lab"],
    [90,120,"\\varepsilon","ε","small",14,21,64,-5.5,3.25,2.25,"estimated-current-lab"],
    [30,320,"\\zeta","ζ","large",16,53,80.1,0.7,3.25,2.25,"estimated-current-lab"],
    [300,60,"\\gamma","γ","medium",14,19,53,-3,3.25,2.25,"estimated-current-lab"],
    [350,280,"\\rho","ρ","medium",14,19,56,0.7,3.25,2.25,"estimated-current-lab"],
    [10,110,"\\psi","ψ","large",16,126.1,91,0,3.25,2.25,"estimated-current-lab"],
    [280,220,"\\eta","η","medium",14,19.4,50,4.5,3.25,2.25,"estimated-current-lab"],
    [30,260,"\\delta","δ","large",14,41,78,-0.5,3.25,2.25,"estimated-current-lab"],
    [80,110,"\\delta","δ","large",20,29.2,65,-0.5,3.25,2.25,"estimated-current-lab"],
    [190,160,"\\theta","θ","medium",22,25.6,54,-1.5,3.25,2.25,"estimated-current-lab"],
    [140,250,"\\psi","ψ","large",18,25.4,52,0,3.25,2.25,"estimated-current-lab"],
    [70,350,"\\theta","θ","medium",22,34.9,68.1,2.4,3.25,2.25,"estimated-current-lab"],
    [190,290,"\\upsilon","υ","small",20,21.9,55,5.2,3.25,2.25,"estimated-current-lab"],
    [170,50,"\\omega","ω","medium",20,24,56,-6.5,3.25,2.25,"estimated-current-lab"],
    [340,210,"\\varphi","φ","medium",18,21,54,5.5,3.25,2.25,"estimated-current-lab"],
    [200,30,"\\chi","χ","medium",20,24,61,-10.5,3.25,2.25,"estimated-current-lab"],
    [310,10,"\\iota","ι","small",14,16.5,53.7,-1.5,3.25,2.25,"estimated-current-lab"],
    [310,40,"\\sigma","σ","small",14,18,50,-6,3.25,2.25,"estimated-current-lab"],
    [340,60,"\\sigma","σ","small",22,21,46,-5,3.25,2.25,"estimated-current-lab"],
    [330,340,"\\mu","μ","medium",22,24.4,55,-8.5,3.25,2.25,"estimated-current-lab"],
    [340,250,"\\beta","β","large",16,24,53,-5.5,3.25,2.25,"estimated-current-lab"],
    [100,190,"\\upsilon","υ","small",16,23,57,-1.6,3.25,2.25,"estimated-current-lab"],
    [60,60,"\\upsilon","υ","small",16,31,72,0,3.25,2.25,"estimated-current-lab"],
    [40,270,"\\varepsilon","ε","small",14,35.8,72.2,2,3.25,2.25,"estimated-current-lab"],
    [240,140,"\\pi","π","medium",20,22.5,43,-4,3.25,2.25,"estimated-current-lab"],
    [320,220,"\\beta","β","large",20,25,50,-0.5,3.25,2.25,"estimated-current-lab"],
    [110,280,"\\eta","η","medium",24,30.5,57,6.5,3.25,2.25,"estimated-current-lab"],
    [210,300,"\\nu","ν","small",16,20,58,-1,3.25,2.25,"estimated-current-lab"],
    [40,340,"\\delta","δ","large",20,43.6,74.6,0.8,3.25,2.25,"estimated-current-lab"],
    [70,190,"\\delta","δ","large",18,33.1,67,-0.5,3.25,2.25,"estimated-current-lab"],
    [90,50,"\\psi","ψ","large",18,29,62,-0.5,3.25,2.25,"estimated-current-lab"],
    [120,220,"\\beta","β","large",24,32.5,56,-5,3.25,2.25,"estimated-current-lab"],
    [140,70,"\\zeta","ζ","large",18,23.4,59,-0.5,3.25,2.25,"estimated-current-lab"],
    [20,70,"\\sigma","σ","small",14,57,86,0,3.25,2.25,"estimated-current-lab"],
    [310,170,"\\psi","ψ","large",24,27.8,50.9,8.5,1.5,2.3,"known"],
    [110,350,"\\lambda","λ","large",22,29.5,60,1,2.5,1.5,"known"],
    [310,200,"\\gamma","γ","medium",12,14,56,7,1.25,1.5,"known"],
    [130,210,"\\lambda","λ","large",14,18,52.8,-0.5,2.5,1.25,"known"],
    [110,250,"\\chi","χ","medium",18,24,51,10.5,2.5,4,"known"],
    [140,340,"\\mu","μ","medium",22,24,61.1,2,5,1,"known"],
    [10,100,"\\kappa","κ","small",14,76,92.2,-1,4,2.25,"known"],
    [90,180,"\\nu","ν","small",24,28,57,-2.5,3.25,1,"known"],
    [180,260,"\\nu","ν","small",14,16,53,7.2,3.25,1.5,"known"],
    [180,40,"\\kappa","κ","small",14,15,58,-12.5,4,1.25,"known"],
    [80,200,"\\zeta","ζ","large",18,28,60.1,0.5,1.25,2,"known"],
    [130,140,"\\mu","μ","medium",16,21,52.6,-1.5,5,1,"known"],
    [110,220,"\\tau","τ","small",22,25,54,2,1.5,4,"known"],
    [160,280,"\\xi","ξ","large",20,25.3,52,2,2,1.25,"known"],
    [40,10,"o","ο","small",24,44,76,4,4,4,"known"],
    [100,0,"\\sigma","σ","small",22,27.6,65,3,6.5,2.25,"known"],
    [30,140,"\\varepsilon","ε","small",22,42,78,-3.5,2,1.5,"known"],
    [260,90,"\\theta","θ","medium",24,28.6,52,-3,1.25,2.25,"known"],
    [80,260,"\\rho","ρ","medium",12,19,59,1,1.25,1.5,"known"],
    [340,250,"\\zeta","ζ","large",18,23,54,-1.7,1.5,1,"known"],
    [220,320,"\\tau","τ","small",12,13,58,-3,3.25,1.25,"known"],
    [160,310,"\\varphi","φ","medium",24,27.9,58,3.5,2.5,1.25,"known"],
    [40,230,"\\chi","χ","medium",18,38.2,69,-0.4,2,3,"known"],
    [80,290,"\\gamma","γ","medium",22,29,59.8,3.5,3.25,1.5,"known"],
    [80,20,"\\varepsilon","ε","small",12,15.6,67,1,5,2.25,"known"],
    [290,180,"\\sigma","σ","small",14,14.5,48.2,16.5,4,3,"known"],
    [90,130,"\\delta","δ","large",14,18.9,62,-1.5,2.5,4,"known"],
    [250,220,"\\tau","τ","small",20,20.4,55,14.5,2,1.25,"known"],
    [170,150,"\\beta","β","large",14,19,52.2,0.6,2.5,2,"known"],
    [280,140,"\\omega","ω","medium",24,26.9,44.6,4.5,2.5,1.25,"known"],
    [330,180,"\\delta","δ","large",20,21,46.9,3.5,4,2,"known"],
    [30,330,"\\varepsilon","ε","small",14,32,76,3.5,1.25,1.5,"known"],
    [10,80,"\\lambda","λ","large",20,119,91,0,4,4,"known"],
    [290,280,"\\rho","ρ","medium",12,15,58,-4,2,2,"known"],
    [190,120,"\\xi","ξ","large",20,23.5,53.3,-5,1.5,1,"known"],
    [350,200,"\\chi","χ","medium",18,20,59,16.5,1.5,1,"known"],
    [230,80,"\\omega","ω","medium",18,20,49.1,-10.5,5,1.5,"known"],
    [190,20,"\\varphi","φ","medium",24,28,57,-4.6,3.25,1,"known"],
    [260,200,"\\beta","β","large",16,18.3,49,-2.5,2.5,4,"known"],
    [70,20,"\\varepsilon","ε","small",14,22,72,1.5,2.5,1,"known"],
    [160,320,"\\nu","ν","small",24,24,59,2.5,1.5,4,"known"],
    [310,0,"\\lambda","λ","large",20,24.9,52,-3,5,3,"known"],
    [90,100,"\\varphi","φ","medium",24,30.2,66,-6.5,4,2,"known"],
    [270,100,"\\mu","μ","medium",14,17,42,-9.5,3.25,1.5,"known"],
    [130,180,"\\pi","π","medium",12,16,49.9,-4,2,2,"known"],
    [70,30,"\\tau","τ","small",24,34,72,3,5,4,"known"],
    [250,0,"\\zeta","ζ","large",22,25.8,54,0.5,3.25,3,"known"],
    [160,320,"\\varphi","φ","medium",12,16,61,2,3.25,4,"known"],
    [190,110,"\\varphi","φ","medium",12,14,49,-4.4,5,3,"known"],
    [30,20,"\\kappa","κ","small",16,35,77.4,1.5,3.25,3,"known"],
    [240,130,"\\rho","ρ","medium",18,19.3,39,-2,5,2.25,"known"],
    [60,190,"\\zeta","ζ","large",16,28.6,67,-0.5,5,1.25,"known"],
    [250,210,"\\chi","χ","medium",24,26.2,50.6,19.5,2,4,"known"],
    [140,250,"\\omega","ω","medium",22,23,52,6,5,3,"known"],
    [210,120,"\\xi","ξ","large",16,21,49,-2,4,2.25,"known"],
    [50,20,"\\rho","ρ","medium",14,26,70,3.3,4,3,"known"],
    [50,170,"\\varphi","φ","medium",14,26.8,63.1,-2.3,1.25,1.5,"known"],
    [250,110,"\\eta","η","medium",24,28.1,46.5,-15.5,4,1.25,"known"],
    [290,300,"\\varphi","φ","medium",20,22,62,-5,2.5,3,"known"],
    [280,130,"\\iota","ι","small",24,22,44,3,2.5,1,"known"],
    [90,320,"o","ο","small",24,27.8,62.6,6,3.25,1,"known"],
    [340,260,"\\rho","ρ","medium",18,18,65,1.8,4,1.25,"known"],
    [130,10,"\\varphi","φ","medium",16,19.3,62,0.4,2.5,2.25,"known"],
    [250,200,"\\xi","ξ","large",20,23.2,48.2,6,3.25,4,"known"],
    [320,280,"\\lambda","λ","large",14,17.2,52.3,0.6,2.5,4,"known"],
    [220,150,"\\rho","ρ","medium",20,23,42,-2.5,2,2,"known"],
    [170,330,"\\rho","ρ","medium",14,19,65,0,1.25,2.25,"known"],
    [290,290,"\\xi","ξ","large",16,21,52,-2,4,1.25,"known"],
    [250,220,"\\iota","ι","small",18,17,45,14,6.5,1.5,"known"],
    [130,70,"\\alpha","α","small",24,25.8,61,-10,3.25,1,"known"],
    [320,80,"\\nu","ν","small",16,17,45.5,-2.2,2,3,"known"],
    [190,320,"\\delta","δ","large",20,22,49.1,2.5,2.5,1.25,"known"],
    [10,330,"\\varphi","φ","medium",20,125,91,2,2.5,3,"known"],
    [20,200,"\\pi","π","medium",20,61.6,78.8,-3,1.25,2.25,"known"],
    [90,290,"\\iota","ι","small",24,26.5,61,7.5,1.25,2.25,"known"],
    [50,280,"\\beta","β","large",22,43.9,72,-1.5,6.5,2.25,"known"],
    [220,180,"\\tau","τ","small",20,18,47,9,3.3,4,"known"],
    [50,330,"\\lambda","λ","large",18,35.5,70,0.5,4,2,"known"],
    [230,40,"\\nu","ν","small",16,15,56,-11,1.5,2,"known"],
    [50,80,"\\pi","π","medium",24,38,77,-3,2,1.5,"known"],
    [300,70,"\\iota","ι","small",12,12,43,-22.5,5,3,"known"],
    [310,320,"\\zeta","ζ","large",22,26,55,1.9,3.25,3,"known"],
    [250,300,"\\sigma","σ","small",16,15.5,53,6.5,6.5,1.25,"known"],
    [160,260,"\\lambda","λ","large",24,29,52,4,1.5,4,"known"],
    [90,140,"\\omega","ω","medium",24,31.6,61.7,-6,2,2.25,"known"],
    [120,80,"\\eta","η","medium",16,20,60,-4,3.25,1.25,"known"],
    [120,340,"\\chi","χ","medium",14,18,64,9,2.5,1.5,"known"],
    [290,200,"\\kappa","κ","small",24,24.9,49,8.5,1.5,3,"known"],
    [230,110,"\\varepsilon","ε","small",14,15,46,-8,2.5,1.25,"known"],
    [170,260,"\\nu","ν","small",20,20.3,51.6,6.6,4,3,"known"],
    [330,320,"o","ο","small",24,23,56,-1.5,2,1.5,"known"],
    [140,180,"\\varepsilon","ε","small",18,17.2,46,1.3,4,2,"known"],
    [180,350,"\\psi","ψ","large",12,17,52,0.4,1.25,1,"known"],
    [270,170,"\\pi","π","medium",14,15,44.8,24.5,5,1.25,"known"],
    [60,110,"\\omega","ω","medium",16,27.2,69,-3.3,1.25,2,"known"],
    [40,200,"\\kappa","κ","small",18,33,69,-4.5,2,2,"known"],
    [220,180,"\\alpha","α","small",16,16,42,12.5,2.5,2.25,"known"],
    [250,70,"\\pi","π","medium",14,16.7,51,-13.5,2.5,4,"known"],
    [140,200,"\\alpha","α","small",14,16,49,2.5,1.25,2,"known"],
    [240,270,"\\upsilon","υ","small",16,16,55,4,2.5,3,"known"],
    [170,60,"\\nu","ν","small",22,21.4,52,-10,6.5,1.5,"known"],
    [20,140,"\\nu","ν","small",20,55,85,-2,4,4,"known"],
    [130,220,"\\theta","θ","medium",22,25.9,58,-1.5,5,1.25,"known"],
    [220,280,"\\chi","χ","medium",24,27,60,17,4,1,"known"],
    [160,280,"\\upsilon","υ","small",24,23.4,53.5,7.5,2.5,1.25,"known"],
    [180,320,"\\zeta","ζ","large",14,19,55,0.7,1.5,1,"known"],
    [190,300,"\\zeta","ζ","large",24,25.1,51,1,1.25,1,"known"],
    [40,90,"\\alpha","α","small",16,31.2,78,-1.5,3.25,1.5,"known"],
    [310,130,"\\alpha","α","small",16,16,48,13.5,2,2.25,"known"],
    [120,200,"\\mu","μ","medium",24,28.6,46,3.5,2,4,"known"],
    [170,320,"\\alpha","α","small",14,15,60,8,3.25,4,"known"],
    [300,170,"\\rho","ρ","medium",16,15.2,43.6,15.5,3.25,2,"known"],
    [10,60,"o","ο","small",20,84,92.8,0.5,2.5,3,"known"],
    [10,290,"\\mu","μ","medium",12,80,89,1.1,4,1,"known"],
    [240,80,"\\mu","μ","medium",16,18.1,48,-6.8,1.5,4,"known"],
    [350,300,"\\gamma","γ","medium",12,15,53,5,1.25,1.25,"known"],
    [240,350,"\\psi","ψ","large",14,16,51,-0.5,2,2,"known"],
    [10,310,"\\zeta","ζ","large",22,151,90,0,3.25,3,"known"],
    [310,340,"\\kappa","κ","small",24,23.4,56,-10.5,5,2.25,"known"],
    [110,270,"\\nu","ν","small",16,19.6,59,4.5,1.25,2.25,"known"],
    [130,10,"\\mu","μ","medium",22,26.8,64,-0.5,2,2.25,"known"],
    [250,200,"\\tau","τ","small",22,22.4,51.6,6.5,2.5,1,"known"],
    [180,150,"\\beta","β","large",22,31.1,54,0.9,2,1.5,"known"],
    [300,10,"\\varphi","φ","medium",24,24.4,48.7,-6.4,2.5,1.5,"known"],
    [120,340,"\\beta","β","large",20,28.4,57.3,2.5,2.5,1.25,"known"],
    [250,0,"\\sigma","σ","small",20,18.9,54.9,-4.5,5,1.25,"known"],
    [110,260,"\\sigma","σ","small",22,25,56,7,4,1.5,"known"],
    [100,190,"\\mu","μ","medium",12,19,55,0.5,4,1,"known"],
    [240,310,"\\pi","π","medium",12,13,59,1.5,2.5,1.5,"known"],
    [190,160,"\\gamma","γ","medium",12,13.5,52,-3.5,1.5,1.25,"known"],
    [160,120,"\\rho","ρ","medium",24,28.6,50.6,-7,6.5,1.25,"known"],
    [110,240,"\\upsilon","υ","small",18,20.5,54,2,4,1.25,"known"],
    [140,240,"\\kappa","κ","small",24,23.3,47,4.6,1.5,2.25,"known"],
    [260,330,"\\zeta","ζ","large",22,25.8,54,3,2,2,"known"],
    [250,150,"\\xi","ξ","large",12,15,48,0,6.5,3,"known"],
    [80,200,"\\theta","θ","medium",14,23,61,-1.1,2.5,1,"known"],
    [260,60,"\\upsilon","υ","small",22,20.9,53,-9,2,1.25,"known"],
    [230,230,"\\mu","μ","medium",22,21,49,10.5,6.5,4,"known"],
    [10,300,"\\omega","ω","medium",22,116,92,0.5,6.5,4,"known"],
    [310,150,"\\delta","δ","large",22,24.8,50.3,5.5,2.5,4,"known"],
    [95,330,"\\upsilon","υ","small",12,15,63.1,4.5,5,2.25,"known"],
    [240,240,"\\sigma","σ","small",12,13,54,11.5,6.5,1,"known"],
    [120,340,"\\iota","ι","small",12,13,63,5.5,5,4,"known"],
    [15,280,"\\varepsilon","ε","small",12,46.9,83,1,4,2,"known"],
    [20,220,"\\tau","τ","small",14,40,81,-1,1.25,1.25,"known"],
    [170,210,"\\varepsilon","ε","small",18,17.7,46.6,5.5,1.25,1.5,"known"],
    [175,170,"\\eta","η","medium",22,24.8,47,-2,2,1,"known"],
    [255,50,"\\delta","δ","large",16,18.7,51,-5,1.5,1.5,"known"],
    [130,160,"\\varepsilon","ε","small",16,17.2,50.7,-4.5,3.25,2.25,"known"],
    [30,210,"\\iota","ι","small",20,36.7,72.8,-3,2.5,2,"known"],
    [345,200,"\\lambda","λ","large",18,20,51,0,2.5,4,"known"],
    [180,280,"\\rho","ρ","medium",24,28.3,54,4.5,5,1.25,"known"],
    [65,190,"\\omega","ω","medium",20,34.8,62.4,-2.5,4,2.25,"known"],
    [280,320,"\\nu","ν","small",16,16,54,-0.6,4,2.25,"known"],
    [90,220,"\\xi","ξ","large",22,30.8,56,-1,1.5,2,"known"],
    [295,190,"\\omega","ω","medium",12,14,49.1,10.5,3.25,1.5,"known"],
    [35,190,"\\tau","τ","small",22,40.4,74,-2.8,1.5,2.25,"known"],
    [105,330,"\\delta","δ","large",18,25,58,-1,2,2,"known"],
    [195,200,"\\varphi","φ","medium",16,18,50,-2,1.25,1.25,"known"],
    [35,230,"\\psi","ψ","large",24,48,71,-0.4,5,2.25,"known"],
    [310,140,"\\omega","ω","medium",12,12.6,46,15,2.5,1.25,"known"],
    [180,190,"\\delta","δ","large",20,26.1,54,0,1.5,1.25,"known"],
    [135,110,"\\varepsilon","ε","small",20,20.4,55.4,-7.5,4,4,"known"],
    [15,50,"\\pi","π","medium",24,89,89.6,1,2,2,"known"],
    [95,30,"\\iota","ι","small",16,18.9,67,1.5,2,1.25,"known"],
    [255,100,"\\xi","ξ","large",18,21.4,49,-7,2,1.5,"known"],
    [125,150,"\\alpha","α","small",20,22.1,49,-11,5,1.5,"known"],
    [115,270,"\\upsilon","υ","small",16,18.1,54,2.5,2,1,"known"],
    [330,120,"\\tau","τ","small",20,20.4,43,10,2,1.25,"known"],
    [115,80,"\\eta","η","medium",12,15.5,60.3,-4.5,4,2.25,"known"],
    [40,270,"\\beta","β","large",22,47.5,74,-1.3,1.5,2.25,"known"],
    [235,10,"\\tau","τ","small",14,12.9,55,-5.3,4,3,"known"],
    [95,70,"\\mu","μ","medium",16,20.9,66,-5.5,2.5,4,"known"],
    [30,180,"\\beta","β","large",14,37,77,-0.4,5,1,"known"],
    [45,250,"\\xi","ξ","large",18,35.6,67,-0.5,2.5,1,"known"],
    [95,150,"\\zeta","ζ","large",22,30.4,60.5,-0.5,5,1.25,"known"],
    [245,30,"\\psi","ψ","large",20,23.1,50.3,-1,2,1,"known"],
    [350,10,"\\xi","ξ","large",16,19,50,-4,2.5,3,"known"],
    [320,50,"\\iota","ι","small",20,19,42,-20.5,4,2,"known"],
    [195,130,"\\omega","ω","medium",22,24,48,-4.5,3.25,4,"known"],
    [185,10,"\\delta","δ","large",18,22,50.3,0.5,1.25,1.25,"known"],
    [165,200,"\\chi","χ","medium",16,21,47.1,8.5,1.5,1,"known"],
    [20,330,"\\pi","π","medium",20,64.4,82,2.5,2,2,"known"],
    [65,190,"\\beta","β","large",16,30,66.3,1.5,1.25,1.25,"known"],
    [300,220,"\\gamma","γ","medium",24,25.1,48,4.5,5,2,"known"],
    [225,310,"\\mu","μ","medium",24,26,64,-1,2.5,1.5,"known"],
    [345,270,"\\lambda","λ","large",20,24.5,50.6,1,4,3,"known"],
    [170,140,"\\lambda","λ","large",22,26.7,52.4,-3.5,1.5,2,"known"],
    [290,330,"\\pi","π","medium",16,16,54.5,-0.5,1.5,3,"known"],
    [290,190,"\\lambda","λ","large",24,23.1,46,3.5,2,2,"known"],
    [105,180,"\\eta","η","medium",14,19.2,55,-0.4,3.25,1.25,"known"],
    [275,110,"\\beta","β","large",24,28,48.7,-5,6.5,1.25,"known"],
    [40,230,"\\nu","ν","small",22,42,70.2,0.5,3.25,3,"known"],
    [105,30,"\\psi","ψ","large",16,22,59.1,1,4,1.25,"known"],
    [175,160,"\\kappa","κ","small",16,16.1,45,0,5,2,"known"],
    [70,110,"\\upsilon","υ","small",18,26.9,69,-3.9,3.25,2.25,"known"],
    [35,100,"\\sigma","σ","small",24,48.1,76.2,-1.9,6.5,1.25,"known"],
    [250,290,"\\beta","β","large",14,19,53,2,4,2.25,"known"],
    [15,90,"\\varepsilon","ε","small",18,61,88.6,-1.3,6.5,1.25,"known"],
    [345,40,"\\theta","θ","medium",14,15.1,45.5,-8.8,4,2,"known"],
    [15,270,"o","ο","small",18,63,83,0.5,2,1.25,"known"],
    [160,300,"\\zeta","ζ","large",24,30,52.4,2.5,2,1.25,"known"],
    [15,290,"\\rho","ρ","medium",16,71.5,87,1.5,1.25,4,"known"],
    [40,130,"\\zeta","ζ","large",22,47,75,-2.5,2,1.25,"known"],
    [115,180,"\\rho","ρ","medium",12,17,51,-0.2,1.5,1.25,"known"],
    [55,280,"\\varphi","φ","medium",22,41.5,64.6,2,3.25,1.25,"known"],
    [80,150,"\\nu","ν","small",20,24.9,61.6,-5,1.25,1.25,"known"],
    [145,120,"\\zeta","ζ","large",24,28.4,56.5,-2.5,3.25,3,"known"],
    [210,70,"\\kappa","κ","small",16,14.7,52,-12,6.5,1.5,"known"],
    [40,180,"\\sigma","σ","small",22,39,69,-3,6.5,1.3,"known"],
    [15,330,"\\eta","η","medium",24,94,86.8,2,1.5,1,"known"],
    [85,70,"o","ο","small",24,28.9,72,-3.5,5,2,"known"],
    [135,130,"\\eta","η","medium",24,28.9,54.1,-3,6.5,2,"known"],
    [95,200,"\\pi","π","medium",14,19.4,54,-2.5,1.5,1.5,"known"],
    [40,270,"\\zeta","ζ","large",20,41,69,-0.4,3.25,2,"known"],
    [130,270,"\\delta","δ","large",24,30.9,55,-1,1.25,1,"known"],
    [100,60,"\\pi","π","medium",22,29.3,66,-3.5,6.5,1,"known"],
    [260,120,"\\varepsilon","ε","small",22,22.3,43.9,-6.5,6.5,1,"known"],
    [80,140,"\\beta","β","large",24,33,66,-0.5,6.5,1,"known"],
    [345,80,"\\varphi","φ","medium",16,17,42.8,-7.5,1.5,4,"known"],
    [105,310,"\\alpha","α","small",12,14.3,62,2,2,3,"known"],
    [160,10,"\\kappa","κ","small",16,15.7,62,-1,1.25,3,"known"],
    [225,160,"\\tau","τ","small",12,12,46,3.5,1.25,2,"known"],
    [315,210,"\\gamma","γ","medium",20,22.1,53.5,6,2.5,2,"known"],
    [155,230,"\\mu","μ","medium",16,17.8,49.7,8.5,5,1.5,"known"],
    [225,330,"\\sigma","σ","small",24,22.3,56,-1,2.5,2.25,"known"],
    [170,280,"\\psi","ψ","large",22,22.8,51,1.2,3.25,1,"known"],
    [75,60,"\\eta","η","medium",20,28.1,67.4,-2.1,3.25,1.25,"known"],
    [105,250,"\\iota","ι","small",20,22,53,5.5,2,4,"known"],
    [130,180,"\\nu","ν","small",14,15.1,49,1.5,5,2,"known"],
    [65,10,"\\rho","ρ","medium",16,25.1,68.5,3,2,2.25,"known"],
    [200,140,"\\beta","β","large",24,30.7,51,0.1,6.5,2.25,"known"],
    [15,310,"\\iota","ι","small",12,46.3,82,1.8,2.5,2.25,"known"],
    [110,0,"\\omega","ω","medium",14,18.1,63,3,6.5,2.25,"known"],
    [180,50,"\\mu","μ","medium",18,20.6,58,-8,2,2.25,"known"],
    [55,180,"\\beta","β","large",14,27.5,66,0.2,1.25,1.25,"known"],
    [70,180,"\\kappa","κ","small",20,29,60,-5.5,4,1.5,"known"],
    [295,110,"\\zeta","ζ","large",18,22,48.7,-1.5,5,1.25,"known"],
    [260,310,"\\iota","ι","small",14,13.8,64,-2,1.5,1.5,"known"],
    [135,130,"\\gamma","γ","medium",14,16.5,54.3,-3,2,1.5,"known"],
    [95,10,"\\omega","ω","medium",16,20.5,66,3,1.25,2.25,"known"],
    [10,300,"\\zeta","ζ","large",18,114,90,0,2.5,1,"known"],
    [330,10,"\\beta","β","large",14,16.2,51,0.5,1.25,4,"known"],
    [65,100,"\\sigma","σ","small",14,21.7,70,-5,1.25,4,"known"],
    [200,200,"\\psi","ψ","large",14,18,54,1.2,1.5,1.25,"known"],
    [150,340,"\\varepsilon","ε","small",18,17.5,62,2.5,2,2,"known"],
    [125,250,"\\rho","ρ","medium",16,18.6,50,4.5,2.5,1.5,"known"],
    [55,250,"\\upsilon","υ","small",20,34.3,63.8,0,4,3,"known"],
    [310,300,"\\theta","θ","medium",16,18.4,52.4,0,2.5,1,"known"],
    [345,190,"\\zeta","ζ","large",22,24.6,49,1.5,4,1.5,"known"],
    [190,280,"\\zeta","ζ","large",12,14,53,1.1,3.25,1,"known"],
    [160,140,"\\iota","ι","small",18,17.6,47.7,-2.5,6.5,2.25,"known"],
    [105,110,"\\mu","μ","medium",20,26.7,60.4,-6,1.25,1.5,"known"],
    [10,180,"\\xi","ξ","large",14,95,92.1,-0.3,6.5,1,"known"],
    [345,150,"\\omega","ω","medium",16,15.7,47.5,10,3.25,1,"known"],
    [115,150,"\\nu","ν","small",14,15.7,51,-2.5,4,1.25,"known"],
    [75,250,"\\kappa","κ","small",20,27.6,57,4.5,2.5,1.5,"known"],
    [250,270,"\\lambda","λ","large",16,18.2,60,-1,1.25,2,"known"],
    [305,90,"\\alpha","α","small",24,23.5,45.1,-12,2,3,"known"],
    [60,180,"\\omega","ω","medium",22,40.5,63,-3,3.25,4,"known"],
    [155,160,"\\iota","ι","small",24,23.5,47,-2,6.5,2,"known"],
    [120,30,"\\pi","π","medium",16,19.3,62,-0.4,6.5,2.25,"known"],
    [240,340,"\\tau","τ","small",24,23.9,57,-2.5,2.5,1.25,"known"],
    [175,220,"\\varphi","φ","medium",22,25.1,50,7,2,4,"known"],
    [165,80,"\\alpha","α","small",20,19.4,54,-14,3.25,1.25,"known"],
    [15,270,"\\gamma","γ","medium",18,75,85,-0.5,2.5,1.25,"known"],
    [10,260,"\\psi","ψ","large",20,120,89,0,5,2,"known"],
    [20,170,"\\nu","ν","small",22,55,80,-1.5,1.25,3,"known"],
    [340,210,"\\gamma","γ","medium",16,15.5,52,6,4,2,"known"],
    [260,290,"\\varphi","φ","medium",20,22.3,59,0.2,5,1.25,"known"],
    [100,20,"\\sigma","σ","small",14,17.3,67,-1,6.5,1.5,"known"],
    [215,190,"\\omega","ω","medium",12,13.3,51,4.5,1.5,1.5,"known"],
    [25,130,"\\alpha","α","small",22,51,81,-2.3,6.5,2,"known"],
    [50,170,"\\chi","χ","medium",12,25,67,-4,1.25,1.25,"known"],
    [195,0,"\\varepsilon","ε","small",24,23.9,59,-3.9,1.25,3,"known"],
    [75,20,"\\lambda","λ","large",24,36.1,62,1.5,2,1.5,"known"],
    [45,220,"\\pi","π","medium",22,43,65.8,-1.1,4,1.25,"known"],
    [125,60,"\\xi","ξ","large",22,28,59,-0.9,1.25,1.5,"known"],
    [200,350,"\\gamma","γ","medium",22,24.6,55.8,1.5,5,4,"known"],
    [105,30,"\\kappa","κ","small",18,21.8,68,0.4,6.5,4,"known"],
    [320,280,"o","ο","small",14,14,57,2,3.25,1,"known"],
    [100,140,"\\upsilon","υ","small",18,21.1,58.9,-6.5,2,1,"known"],
    [305,20,"\\beta","β","large",16,17,44,1.6,4,3,"known"],
    [65,220,"\\mu","μ","medium",20,33.6,61.3,-1,2,2.25,"known"],
    [60,300,"\\tau","τ","small",18,29,68,3.5,2,1.25,"known"],
    [20,340,"\\lambda","λ","large",16,64,84.5,0.4,5,1,"known"],
    [280,50,"\\pi","π","medium",22,23,50,-14,2,1.5,"known"],
    [85,130,"\\lambda","λ","large",16,21.7,64,-2.5,1.5,3,"known"],
    [105,70,"\\sigma","σ","small",14,16.8,65,-4.5,2,2,"known"],
    [290,20,"\\eta","η","medium",22,23.1,49.7,-5.5,5,2,"known"],
    [15,220,"\\lambda","λ","large",18,81,86.8,-0.2,6.5,1.5,"known"],
    [155,250,"\\theta","θ","medium",20,22,51,3.3,4,1,"known"],
    [65,180,"\\gamma","γ","medium",22,36,65,-2.5,4,2,"known"],
    [295,300,"\\xi","ξ","large",14,21,54,-0.4,2,2.25,"known"],
    [285,140,"\\iota","ι","small",22,21.1,44.5,6.5,2,1,"known"],
    [205,0,"\\omega","ω","medium",14,15.7,59,-3.4,3.25,2,"known"],
    [45,110,"\\delta","δ","large",24,47,72.9,-0.5,2,3,"known"],
    [65,280,"\\eta","η","medium",14,22.9,63.2,2.1,6.5,3,"known"],
    [90,320,"\\kappa","κ","small",22,27.3,62,5,2.5,1.5,"known"],
    [265,10,"\\varepsilon","ε","small",22,20.2,52,-6,3.25,4,"known"],
    [190,230,"\\mu","μ","medium",18,20.1,54,10.5,1.5,3,"known"],
    [220,280,"\\pi","π","medium",14,16,56.3,4.3,2,3,"known"],
    [10,160,"\\gamma","γ","medium",24,124.8,92,-1,5,2,"known"],
    [95,340,"\\alpha","α","small",18,22,66,9.5,4,4,"known"],
    [220,110,"\\alpha","α","small",18,17,45,-15,1.25,2,"known"],
    [30,290,"\\gamma","γ","medium",12,32,79.6,1.1,4,2.25,"known"],
    [325,40,"\\zeta","ζ","large",24,26,43,-10.5,5,1.5,"known"],
    [310,90,"\\lambda","λ","large",12,13.9,48.5,-9,6.5,1.25,"known"],
    [185,160,"\\xi","ξ","large",22,29,52,-2,1.25,1,"known"],
    [340,220,"\\varphi","φ","medium",24,23.6,53.4,6.5,5,2.25,"known"],
    [315,120,"\\sigma","σ","small",18,17.7,42,11.5,5,3,"known"],
    [130,180,"\\tau","τ","small",14,14.6,47,-0.4,3.25,2,"known"],
    [305,250,"o","ο","small",20,19.9,58,4,2.5,2,"known"],
    [25,70,"\\theta","θ","medium",20,52,81,-0.5,1.25,3,"known"],
    [120,40,"\\delta","δ","large",14,17.8,56,2,3.25,3,"known"],
    [315,30,"\\beta","β","large",20,23.7,49.9,-1.5,2,1.5,"known"],
    [45,60,"\\gamma","γ","medium",16,29.5,72.4,-0.3,3.25,4,"known"],
    [290,50,"\\sigma","σ","small",14,14,47.4,-12,2,1.5,"known"],
    [20,240,"\\varepsilon","ε","small",16,43,77.3,0,3.25,1.5,"known"],
    [340,50,"\\chi","χ","medium",16,20,44,-12.5,1.25,1.5,"known"],
    [125,160,"\\upsilon","υ","small",12,13,51.5,-2.6,5,2.25,"known"],
    [285,260,"\\alpha","α","small",22,22.6,57,2,1.5,1.25,"known"],
    [15,160,"\\gamma","γ","medium",20,85,87,-1.8,1.25,1.25,"known"],
    [45,190,"\\tau","τ","small",24,36,68,-2.5,1.5,2.25,"known"],
    [65,40,"\\xi","ξ","large",24,39.8,66,2,1.5,1,"known"],
    [165,340,"\\zeta","ζ","large",20,27,56,5,1.5,1.25,"known"],
    [200,220,"\\iota","ι","small",18,17.9,50,13,2,2.25,"known"],
    [15,100,"\\xi","ξ","large",20,79,87.2,-0.4,2,1.25,"known"],
    [110,150,"\\varepsilon","ε","small",20,23.2,57.3,-6,4,3,"known"],
    [295,300,"\\lambda","λ","large",22,26.5,52.2,0.8,1.25,4,"known"],
    [45,10,"\\gamma","γ","medium",24,44.7,70.5,2.6,6.5,1,"known"],
    [250,190,"\\theta","θ","medium",20,21,52,5.4,1.5,1.5,"known"],
    [295,120,"\\omega","ω","medium",18,18.6,42,3,5,1,"known"],
    [125,290,"\\theta","θ","medium",22,26.6,55.9,0.5,2,2.25,"known"],
    [55,140,"\\lambda","λ","large",12,23.2,69.6,-0.9,1.25,2.25,"known"],
    [210,10,"\\zeta","ζ","large",20,22.7,54,1.7,4,3,"known"],
    [120,300,"\\sigma","σ","small",24,26.4,56.3,5.5,6.5,3,"known"],
    [115,120,"\\delta","δ","large",24,30,59,-0.5,3.25,2.25,"known"],
    [345,130,"\\eta","η","medium",16,16,45,5.3,2.5,1,"known"],
    [45,40,"\\gamma","γ","medium",16,29.4,71.6,0.5,4,1.5,"known"],
    [50,310,"\\pi","π","medium",18,33.3,68,4,5,1.25,"known"],
    [75,300,"\\omega","ω","medium",18,27.1,62.5,4.5,1.25,3,"known"],
    [70,190,"\\delta","δ","large",18,29.3,65.4,2,1.5,2.25,"known"],
    [145,340,"\\mu","μ","medium",24,27.3,60.3,3,6.5,4,"known"],
    [255,340,"\\delta","δ","large",24,28,49,2,5,1.5,"known"],
    [155,340,"\\nu","ν","small",18,17.9,58.2,4,3.25,2.25,"known"],
    [195,210,"\\mu","μ","medium",16,17.8,50.4,7.5,2.5,4,"known"],
    [70,170,"\\eta","η","medium",22,35,61,-2.2,1.5,3,"known"],
    [135,320,"\\iota","ι","small",14,14.2,61,4.7,1.5,2,"known"],
    [310,320,"\\theta","θ","medium",18,20,51.1,2,2.5,3,"known"],
    [60,250,"\\kappa","κ","small",16,25.3,63.5,1.5,6.5,3,"known"],
    [295,270,"\\psi","ψ","large",20,23.5,49,0.8,6.5,1.25,"known"],
    [80,0,"\\omega","ω","medium",20,27.7,66.3,3,4,1.5,"known"],
    [210,190,"\\gamma","γ","medium",24,26,43,1.1,4,1.5,"known"],
    [80,70,"\\chi","χ","medium",18,27,70,-7.5,2.5,1.5,"known"],
    [70,80,"\\eta","η","medium",20,29.4,69,-4.5,3.25,4,"known"],
    [140,280,"\\eta","η","medium",12,14,56,5,1.25,2.25,"known"],
    [135,180,"\\pi","π","medium",14,17.8,48,-6,4,1.5,"known"],
    [300,180,"\\alpha","α","small",18,18.3,46,14,3.25,2,"known"],
    [10,310,"\\tau","τ","small",16,71,89,1,6.5,3,"known"],
    [35,20,"\\pi","π","medium",12,25.7,80,2.5,1.5,3,"known"],
    [10,270,"\\omega","ω","medium",12,62,88.2,0.5,6.5,2,"known"],
    [95,60,"\\alpha","α","small",12,14.8,67,-3,4,1.25,"known"],
    [205,50,"\\xi","ξ","large",20,23.7,52,-2.5,1.5,1,"known"],
    [65,260,"\\zeta","ζ","large",22,37,61,-0.5,6.5,1.5,"known"],
    [20,150,"\\chi","χ","medium",14,63,86.7,-2.5,4,1,"known"],
    [270,90,"\\nu","ν","small",16,16.1,45,-2,4,2.25,"known"],
    [245,180,"\\varphi","φ","medium",20,21.1,44,8.5,5,4,"known"],
    [55,240,"\\tau","τ","small",22,36.1,65.1,1.5,1.25,2.25,"known"],
    [190,110,"\\varepsilon","ε","small",12,13,49.6,-8.5,2,2.25,"known"],
    [170,40,"\\sigma","σ","small",12,12,58,-10,2,2,"known"],
    [265,230,"\\varphi","φ","medium",16,18,54,6,2,2.25,"known"],
    [125,270,"\\xi","ξ","large",12,17,53,-5.5,6.5,1,"known"],
    [35,30,"\\beta","β","large",14,33.1,73,0.5,2.5,1.25,"known"],
    [315,210,"\\chi","χ","medium",20,21.3,52.2,20,6.5,4,"known"],
    [315,130,"\\rho","ρ","medium",14,13.8,43.9,9.5,1.5,4,"known"],
    [25,100,"\\gamma","γ","medium",22,59,82,0,6.5,2.25,"known"],
    [160,150,"\\psi","ψ","large",18,23.5,54.1,-3,3.25,1.25,"known"],
    [35,270,"\\nu","ν","small",14,32.4,73,2,3.25,1.5,"known"],
    [150,250,"\\omega","ω","medium",20,21.4,49,6.5,1.5,1,"known"],
    [180,120,"\\kappa","κ","small",18,17.7,48.3,-11.5,2.5,2,"known"],
    [10,350,"\\sigma","σ","small",24,94,89,2,5,4,"known"],
    [200,60,"\\iota","ι","small",22,20,55,-11,1.25,1.25,"known"],
    [60,290,"\\beta","β","large",24,43,68.3,-0.6,5,1.5,"known"],
    [55,300,"\\varphi","φ","medium",14,26.6,68,3.5,6.5,2,"known"],
    [300,110,"\\psi","ψ","large",12,14.4,49,-2.5,2,1.25,"known"],
    [215,290,"\\chi","χ","medium",22,26,65,11.5,2,1,"known"],
    [210,20,"\\varepsilon","ε","small",14,13.9,58,-6.5,1.25,1.25,"known"],
    [210,70,"\\eta","η","medium",20,22.4,52,-7,3.25,1,"known"],
    [250,320,"\\iota","ι","small",12,12,61.5,-4,2.5,4,"known"],
    [80,130,"\\tau","τ","small",18,22.2,63,-6.5,4,2,"known"],
    [115,130,"\\theta","θ","medium",24,28,57,-3,3.25,1.25,"known"],
    [280,60,"\\mu","μ","medium",12,13,43,-8,2.5,2,"known"],
    [210,270,"\\nu","ν","small",12,12.3,62,0.5,3.25,4,"known"],
    [175,110,"\\eta","η","medium",16,18,46,-6,5,2,"known"],
    [240,10,"\\mu","μ","medium",20,19.9,58,-6,2,4,"known"],
    [50,320,"\\beta","β","large",14,30,72,1,4,1,"known"],
    [15,310,"\\rho","ρ","medium",18,72,86.8,2.5,1.25,1.25,"known"],
    [95,320,"\\alpha","α","small",18,21.8,63.9,7,5,3,"known"],
    [160,210,"\\xi","ξ","large",20,25.1,52.2,0.1,2.5,4,"known"],
    [265,30,"o","ο","small",24,20,49,-7.8,6.5,2.25,"known"],
    [60,30,"\\eta","η","medium",12,19,68.9,2,6.5,2,"known"],
    [175,60,"o","ο","small",18,18,53.5,-9.5,4,1.25,"known"],
    [130,40,"\\gamma","γ","medium",20,24.6,61.4,-1,4,1.25,"known"],
    [55,180,"\\gamma","γ","medium",12,20.6,65.7,-1,1.25,1.5,"known"],
    [315,50,"\\eta","η","medium",24,26.4,50,-13.5,1.25,4,"known"],
    [100,280,"\\nu","ν","small",18,21.7,60.2,5,2.5,3,"known"],
    [60,300,"\\alpha","α","small",24,38.1,66.9,5,1.25,4,"known"],
    [170,270,"\\alpha","α","small",16,16.2,59,10.5,1.25,1.5,"known"],
    [250,110,"\\alpha","α","small",18,17.6,44,-14,2,4,"known"],
    [70,320,"\\varepsilon","ε","small",16,22.3,66,4.5,5,2.25,"known"],
    [225,10,"\\mu","μ","medium",24,26.1,56,-2.5,2.5,4,"known"],
    [155,80,"\\alpha","α","small",24,23.2,61,-13,2.5,4,"known"],
    [140,210,"\\beta","β","large",22,27.6,55,-2.5,4,1.5,"known"],
    [105,130,"\\xi","ξ","large",14,18.1,59.4,-3,2.5,1,"known"],
    [240,330,"\\kappa","κ","small",12,12,60,-5,2,3,"known"],
    [20,220,"\\alpha","α","small",24,68,77.8,-2.5,2,1.25,"known"],
    [30,160,"\\alpha","α","small",22,44.7,76.6,-3.5,6.5,1,"known"],
    [170,0,"\\chi","χ","medium",18,21,66,-4.5,1.5,1.5,"known"],
    [260,300,"\\zeta","ζ","large",20,25,55,5.5,1.25,2.25,"known"],
    [130,160,"\\omega","ω","medium",24,30.5,51.7,-4.5,4,1.5,"known"],
    [215,310,"\\omega","ω","medium",16,17.7,59.1,-1.5,2,2,"known"],
    [140,30,"\\theta","θ","medium",14,16.4,56,0.5,2.5,3,"known"],
    [350,30,"o","ο","small",14,13,47,-19,2.5,2.25,"known"],
    [35,110,"\\kappa","κ","small",20,43,80,-4.5,3.25,2,"known"],
    [55,120,"\\kappa","κ","small",24,38,72,-6,5,1.5,"known"],
    [260,70,"\\rho","ρ","medium",16,18,43.7,-12,3.25,2,"known"],
    [105,70,"\\delta","δ","large",22,27.1,57.4,-1.1,1.25,1,"known"],
    [170,190,"\\upsilon","υ","small",14,13.6,45.5,3.4,6.5,1,"known"],
    [310,210,"\\varphi","φ","medium",20,21.1,55,6.5,1.5,1.25,"known"],
    [250,310,"\\omega","ω","medium",24,24.6,55,1,6.5,4,"known"],
    [285,260,"\\eta","η","medium",18,21,56.4,-2.7,2.5,1.5,"known"],
    [350,260,"\\xi","ξ","large",14,20,54,-1,1.5,1.5,"known"],
    [165,290,"\\omega","ω","medium",22,26.6,57.5,7.5,4,3,"known"],
    [155,270,"\\chi","χ","medium",24,27.7,54,15.5,2,2,"known"],
    [80,20,"\\theta","θ","medium",14,22,66.9,4,3.25,4,"known"],
    [250,80,"\\psi","ψ","large",18,21.2,48,-9.5,6.5,2,"known"],
    [270,70,"\\iota","ι","small",12,12,44,-14,4,1.5,"known"],
    [55,30,"\\zeta","ζ","large",14,25.5,68,4,1.5,1.25,"known"],
    [115,120,"\\chi","χ","medium",20,25.3,59,-11.5,2.5,2,"known"],
    [95,120,"\\zeta","ζ","large",20,27.1,65,-2.5,2.5,2,"known"],
    [145,100,"\\gamma","γ","medium",18,19.4,56.1,-6,2.5,4,"known"],
    [290,90,"\\lambda","λ","large",14,15.8,43,-13.5,5,1,"known"],
    [10,110,"\\varepsilon","ε","small",14,73,93,-1.5,2,2.25,"known"],
    [85,250,"\\pi","π","medium",22,31.6,57.5,1.7,2.5,1,"known"],
    [190,250,"\\chi","χ","medium",12,13.6,49,17.5,6.5,2,"known"],
    [110,30,"\\upsilon","υ","small",24,29.3,64.8,-1.5,6.5,1.25,"known"],
    [75,120,"\\psi","ψ","large",20,29.9,65.4,-3,5,1,"known"],
    [40,150,"\\psi","ψ","large",12,32,73.9,0,6.5,3,"known"],
    [75,10,"\\varepsilon","ε","small",14,19.7,71,6,1.5,1.25,"known"],
    [25,120,"\\chi","χ","medium",14,48.5,84,-2.5,4,1,"known"],
    [175,160,"\\rho","ρ","medium",22,24.2,39,-2.5,6.5,4,"known"],
    [135,130,"\\eta","η","medium",12,14.5,53.6,-2.7,4,2,"known"],
    [260,300,"\\chi","χ","medium",20,24,63,-1,2.5,2.25,"known"],
    [50,320,"\\iota","ι","small",18,29,70.6,5.5,3.25,1,"known"],
    [25,10,"\\upsilon","υ","small",20,50.5,79.4,2.5,4,2,"known"],
    [130,240,"o","ο","small",24,24.9,47,4.1,5,4,"known"],
    [140,280,"\\omega","ω","medium",18,20,55.5,4.3,1.25,1.5,"known"],
    [115,270,"\\omega","ω","medium",20,24,54.6,7.5,3.25,3,"known"],
    [105,320,"\\zeta","ζ","large",18,25,59,8,2.5,1.5,"known"],
    [155,150,"\\psi","ψ","large",18,23.2,53,0.5,4,1.25,"known"],
    [80,90,"\\pi","π","medium",20,27.5,68,-6.5,3.25,2.25,"known"],
    [90,230,"\\tau","τ","small",12,14.7,58.1,3,2.5,1,"known"],
    [165,60,"\\upsilon","υ","small",24,23.8,54.6,-9,4,4,"known"],
    [325,280,"o","ο","small",16,16,60,0.5,2,1,"known"],
    [105,290,"\\rho","ρ","medium",18,21.4,57,12,2,1.25,"known"],
    [230,30,"\\mu","μ","medium",14,15,56,-7,1.25,1.25,"known"],
    [170,240,"\\pi","π","medium",14,15.5,50,13.5,2.5,1.25,"known"],
    [170,140,"\\psi","ψ","large",12,16.2,53,0.5,5,1,"known"],
    [175,330,"\\upsilon","υ","small",22,22.2,59,5,2,2,"known"],
    [185,260,"\\gamma","γ","medium",20,22.7,50,11.5,5,4,"known"],
    [20,220,"\\psi","ψ","large",22,78,82,-0.1,5,2,"known"],
    [120,60,"\\pi","π","medium",14,17.5,63,-8,2.5,2.25,"known"],
    [80,300,"\\psi","ψ","large",20,29.7,60.9,1,3.25,1,"known"],
    [235,180,"\\lambda","λ","large",14,16.5,50,6,3.25,2.25,"known"],
    [180,140,"\\beta","β","large",12,17,56,-2,1.5,2,"known"],
    [255,90,"o","ο","small",12,12,46.9,-11.5,3.25,3,"known"],
    [255,250,"\\upsilon","υ","small",22,22.3,51,9,4,2,"known"],
    [105,160,"\\delta","δ","large",14,18.1,58.6,4,6.5,4,"known"],
    [50,60,"\\tau","τ","small",14,24.7,74.3,-0.9,1.25,1.25,"known"],
    [55,280,"\\tau","τ","small",20,33,66,4.5,1.25,1.5,"known"],
    [25,220,"\\pi","π","medium",16,45.2,76.6,-0.5,1.5,2.25,"known"],
    [10,10,"\\eta","η","medium",22,112,90,1.5,5,2.25,"known"],
    [105,270,"\\eta","η","medium",16,18.9,55.4,2.5,1.25,1.5,"known"],
    [315,290,"\\varepsilon","ε","small",24,24.5,58,-0.5,2.5,1,"known"],
    [10,340,"\\alpha","α","small",22,96,86.7,1.5,4,3,"known"],
    [50,80,"\\nu","ν","small",20,34.3,74,-3,5,2,"known"],
    [45,30,"\\tau","τ","small",16,30,75,1.5,5,1.25,"known"],
    [45,280,"\\beta","β","large",16,33.7,72.8,-1.5,1.25,1.25,"known"],
    [265,160,"\\theta","θ","medium",16,17.6,50,9,3.25,3,"known"],
    [125,210,"\\varepsilon","ε","small",16,16.8,51,1.5,2.5,1,"known"],
    [245,90,"\\nu","ν","small",14,14.2,43,-5.5,6.5,2.25,"known"],
    [25,120,"\\mu","μ","medium",18,60.3,82,-2.5,6.5,4,"known"],
    [345,310,"\\nu","ν","small",14,13.5,56,-7,1.5,1.5,"known"],
    [35,20,"\\upsilon","υ","small",14,29.2,78,1.5,1.5,2.25,"known"],
    [30,260,"\\nu","ν","small",20,45,72,1.2,6.5,4,"known"],
    [345,60,"\\upsilon","υ","small",16,16,46,-10.5,1.5,2.25,"known"],
    [40,30,"\\tau","τ","small",22,42,78,1.6,1.25,1,"known"],
    [25,320,"\\xi","ξ","large",22,70,81,0.5,2,3,"known"],
    [25,0,"\\upsilon","υ","small",12,31.8,79.5,1.5,2.5,1.5,"known"],
    [235,270,"\\mu","μ","medium",24,23.3,55.5,3.8,5,3,"known"],
    [70,90,"\\varphi","φ","medium",14,20.3,69,-7,6.5,1,"known"],
    [65,290,"\\varepsilon","ε","small",16,23.8,64.8,2.5,6.5,1.5,"known"],
    [295,130,"\\sigma","σ","small",14,13.6,43.7,11.5,2,2.25,"known"],
    [290,310,"\\alpha","α","small",24,21,56,0,6.5,2.25,"known"],
    [305,100,"\\rho","ρ","medium",22,23,42,-11,1.25,1,"known"],
    [30,180,"\\rho","ρ","medium",16,38,77,-2,2.5,1.25,"known"],
    [10,230,"\\tau","τ","small",16,64,84.4,0,3.25,2.25,"known"],
    [55,290,"\\chi","χ","medium",24,43.3,64,5.5,4,1.25,"known"],
    [85,190,"o","ο","small",14,17.2,57,-2.1,1.25,3,"known"],
    [35,120,"\\kappa","κ","small",22,46,78.9,-3.5,2,2,"known"],
    [100,330,"\\alpha","α","small",16,19.1,63.8,6.3,1.5,1.25,"known"],
    [60,10,"\\psi","ψ","large",18,31.4,66.6,1.6,3.25,4,"known"],
    [50,80,"\\pi","π","medium",14,22.5,76,-3,2.5,3,"known"],
    [45,120,"\\iota","ι","small",16,23.3,76,-7,6.5,1.25,"known"],
    [80,350,"\\theta","θ","medium",22,30.4,64,4,1.5,2,"known"],
    [40,220,"\\pi","π","medium",16,31,66.2,-1,3.25,1.25,"known"],
    [60,290,"\\sigma","σ","small",14,22.1,65.7,5,5,2,"known"],
    [10,170,"\\theta","θ","medium",20,109,91,0.5,2,2,"known"],
    [10,70,"\\varphi","φ","medium",16,75,91,-0.5,4,1,"known"],
    [40,180,"\\sigma","σ","small",20,34,69.8,-3,1.5,2,"known"],
    [30,20,"\\rho","ρ","medium",20,42,79.6,4.1,1.5,2.25,"known"],
    [15,120,"\\mu","μ","medium",14,63,87,-2,3.25,2.25,"known"],
    [70,240,"\\sigma","σ","small",24,33.2,59,1.5,2.5,3,"known"],
    [20,180,"\\lambda","λ","large",16,60,85,-0.3,2.5,3,"known"],
    [35,250,"\\tau","τ","small",18,38,72,1.2,4,1,"known"],
    [285,200,"\\alpha","α","small",22,23.3,49.5,7,3.25,2,"known"],
    [25,260,"\\delta","δ","large",18,48,79.8,-0.4,1.25,1.5,"known"],
    [30,330,"\\sigma","σ","small",18,44,77.7,2.9,4,1.5,"known"],
    [65,130,"\\eta","η","medium",18,28.5,69,-6,6.5,1,"known"],
    [65,210,"\\gamma","γ","medium",22,32,63.3,-0.9,1.5,4,"known"],
    [70,140,"\\xi","ξ","large",24,38.3,68,-2,5,3,"known"],
    [50,40,"\\rho","ρ","medium",16,25.7,70.2,2,4,4,"known"],
    [265,30,"\\varepsilon","ε","small",22,19.1,49.4,-12.5,5,2.25,"known"],
    [25,20,"\\psi","ψ","large",20,61,79.7,1,1.5,2,"known"],
    [135,0,"\\theta","θ","medium",18,21.3,57,-3,1.25,1,"known"],
    [190,310,"\\psi","ψ","large",18,19.9,49.7,3,6.5,2.25,"known"],
    [350,220,"\\upsilon","υ","small",16,15.2,56.4,3.5,2,2,"known"],
    [70,40,"\\mu","μ","medium",16,24.1,69,0.5,2,2,"known"],
    [45,310,"\\theta","θ","medium",20,39.1,70,1,1.5,2.25,"known"],
    [25,150,"\\omega","ω","medium",20,60,81,-2.5,1.5,1.25,"known"],
    [10,50,"\\beta","β","large",16,87,88,-0.1,2.5,2,"known"],
    [35,40,"\\psi","ψ","large",22,50.7,75,0,1.25,1.5,"known"],
    [70,120,"\\omega","ω","medium",24,37,67,-6,4,1.5,"known"],
    [15,350,"\\upsilon","υ","small",22,76,84.1,1.8,2,2,"known"],
    [50,160,"\\alpha","α","small",18,27.7,68.4,-6,6.5,3,"known"],
    [25,150,"\\alpha","α","small",24,54.7,79.4,-3,2,2.25,"known"],
    [20,80,"\\iota","ι","small",16,45,84.7,-1.4,1.5,1.25,"known"],
    [15,150,"\\mu","μ","medium",18,78,88,-2,2.5,2,"known"],
    [65,0,"\\tau","τ","small",16,24.2,71,4,4,1.25,"known"],
    [35,350,"\\omega","ω","medium",14,29.4,75.2,3.5,4,3,"known"],
    [65,300,"\\psi","ψ","large",24,40,65.3,0.2,2,2.25,"known"],
    [20,210,"\\theta","θ","medium",16,56.8,81.9,0.8,3.25,1,"known"],
    [30,340,"\\beta","β","large",16,43.9,79.7,0.3,1.5,2.25,"known"],
    [45,210,"\\varphi","φ","medium",24,46.7,65.2,-1.3,5,1,"known"],
    [245,0,"\\mu","μ","medium",24,23.1,58.2,-7.5,3.25,4,"known"],
    [235,90,"\\upsilon","υ","small",22,21.8,47.3,-7.2,3.25,3,"known"],
    [15,190,"\\zeta","ζ","large",12,61.2,87.4,-0.2,3.25,3,"known"],
    [45,200,"\\varepsilon","ε","small",18,27.3,67.6,-2.4,5,1,"known"],
    [275,40,"\\beta","β","large",16,18.2,51.5,-3.7,1.5,1.25,"known"],
    [100,260,"\\zeta","ζ","large",24,33.4,56.5,-0.5,2,1.5,"known"],
    [80,240,"\\psi","ψ","large",16,23.8,60.4,0.5,2,3,"known"],
    [15,130,"\\varepsilon","ε","small",16,54.8,87.1,-1.4,3.25,1,"known"],
    [55,290,"o","ο","small",18,29.4,65.7,3.7,3.25,1.25,"known"],
    [45,190,"\\iota","ι","small",22,32.4,67.8,-3.4,5,4,"known"],
    [25,270,"\\alpha","α","small",18,47.6,75.4,1.8,1.5,2.25,"known"],
    [80,270,"\\varepsilon","ε","small",16,19.6,61.3,1.5,2.5,3,"known"],
    [10,260,"\\varepsilon","ε","small",24,91,84,0.2,1.5,3,"known"],
    [60,300,"\\omega","ω","medium",22,37.1,65.7,3,6.5,1.5,"known"],
    [350,20,"\\sigma","σ","small",20,18.2,47.6,-14.3,6.5,3,"known"],
    [75,60,"\\theta","θ","medium",16,23.4,63.9,0,3.25,1.5,"known"],
    [10,160,"\\sigma","σ","small",22,92.3,90.2,-1.2,4,1.25,"known"],
    [60,120,"\\nu","ν","small",16,24,69,-6,1.5,2,"known"],
    [45,330,"\\kappa","κ","small",18,34,71,5,1.25,1,"known"],
    [35,100,"\\sigma","σ","small",16,33,77.1,-1.5,1.5,3,"known"],
    [25,40,"\\psi","ψ","large",16,50.8,78.9,0.2,2.5,4,"known"],
    [45,280,"\\eta","η","medium",24,45,67.2,1.5,2.5,1.5,"known"],
    [40,260,"\\lambda","λ","large",14,29.4,71.3,1,1.25,2,"known"],
    [280,110,"\\rho","ρ","medium",24,25.3,41.3,-8.5,1.5,1.5,"known"],
    [20,160,"\\sigma","σ","small",22,55.6,79.9,-2.1,1.25,1.25,"known"],
    [50,30,"\\rho","ρ","medium",16,26.7,70.8,3,2.5,4,"known"],
    [130,280,"\\delta","δ","large",18,22,55.5,-2,1.5,2.25,"known"],
    [220,180,"\\tau","τ","small",20,18.8,46.1,9.5,1.25,3,"known"],
    [15,50,"\\eta","η","medium",24,91.4,89.3,1.1,5,1.25,"known"],
    [50,210,"\\alpha","α","small",16,24.6,63.6,-3.5,6.5,3,"known"],
    [80,10,"\\eta","η","medium",24,33.8,66.3,6.5,6.5,2.25,"known"],
    [85,250,"\\omega","ω","medium",14,20.2,56.6,3,1.25,1,"known"],
    [85,190,"\\kappa","κ","small",12,16.3,57.7,-2.9,2,4,"known"],
    [75,180,"\\alpha","α","small",14,18.2,57.8,-6,4,1,"known"],
    [30,30,"\\upsilon","υ","small",18,41.3,79.1,1.4,5,4,"known"],
    [50,330,"\\nu","ν","small",24,41.9,70.9,5,2.5,1.25,"known"],
    [15,10,"\\lambda","λ","large",18,84.5,86.2,0.1,1.25,1.25,"known"],
    [30,350,"\\tau","τ","small",22,55.3,79,2.4,6.5,4,"known"],
    [25,330,"\\varepsilon","ε","small",16,43.9,78.3,2.7,4,1,"known"],
    [60,30,"\\gamma","γ","medium",16,25.5,68.7,1.5,4,3,"known"],
    [15,90,"\\lambda","λ","large",20,80.3,86.9,-0.6,1.25,1.25,"known"],
    [320,190,"\\kappa","κ","small",24,24.3,51.1,13.5,1.25,1.5,"known"],
    [60,320,"\\rho","ρ","medium",24,38.4,66.5,10,4,2.25,"known"],
    [315,0,"\\iota","ι","small",16,15.6,52.8,-17.5,5,1,"known"],
    [20,350,"o","ο","small",18,50.3,81.3,2.4,2.5,3,"known"],
    [30,290,"\\rho","ρ","medium",18,44.1,76.5,2.9,2,1.5,"known"],
    [80,310,"\\alpha","α","small",24,29.8,63,9.5,2,4,"known"],
    [15,0,"\\upsilon","υ","small",22,75,84.1,1.8,2,1.5,"known"],
    [75,50,"\\zeta","ζ","large",18,27.3,62.7,1,2.5,2,"known"],
    [25,300,"\\varphi","φ","medium",16,52.3,81.9,1.9,1.5,3,"known"],
    [35,170,"\\pi","π","medium",16,36.2,72,-2,4,4,"known"],
    [250,230,"\\chi","χ","medium",12,13.9,52.9,17,2,1,"known"],
    [40,240,"\\pi","π","medium",24,46.3,66.2,-0.5,4,2.25,"known"],
    [185,160,"\\eta","η","medium",20,22.4,46.5,-4.5,3.25,2.25,"known"],
    [55,170,"\\zeta","ζ","large",24,43.2,68.3,-0.7,2,1,"known"],
    [80,310,"\\nu","ν","small",24,29.3,64.3,5.3,5,2.3,"known"],
    [30,70,"\\chi","χ","medium",18,46.5,82,-0.3,3.25,4,"known"],
    [60,200,"\\nu","ν","small",24,32.3,61.9,-1.5,2.5,4,"known"],
    [70,350,"\\sigma","σ","small",12,17.2,68,6.5,4,1.25,"known"],
    [50,350,"\\eta","η","medium",24,42.1,70.6,4.5,2.5,1.5,"known"],
    [40,80,"\\lambda","λ","large",22,43.4,73.7,-1.5,1.25,2.25,"known"],
    [70,0,"\\kappa","κ","small",16,22.8,68.5,5.5,5,1,"known"],
    [80,80,"\\alpha","α","small",22,27.5,68.2,-4,1.5,1.5,"known"],
    [50,190,"\\chi","χ","medium",24,44.3,65.4,-5,6.5,1.5,"known"],
    [70,180,"\\pi","π","medium",22,32.8,62.2,-4,2,3,"known"],
    [40,210,"\\gamma","γ","medium",16,31.2,67.6,-0.9,4,2.25,"known"],
    [125,180,"\\iota","ι","small",22,23.5,49.8,-2.5,2.5,1.5,"known"],
    [50,60,"\\eta","η","medium",18,30.1,72.8,1,2,4,"known"],
    [25,210,"\\xi","ξ","large",14,46.5,80.3,-0.3,2.5,3,"known"],
    [35,230,"\\alpha","α","small",12,24.8,71.3,0.5,2,1,"known"],
    [300,80,"\\mu","μ","medium",24,25.5,41.7,-12.5,4,2.25,"known"],
    [20,170,"\\sigma","σ","small",14,37.9,80,-2.3,4,3,"known"],
    [95,70,"\\lambda","λ","large",16,20.7,60,-5.5,5,1.5,"known"],
    [250,0,"\\iota","ι","small",16,14.4,56.9,-7,5,1.5,"known"],
    [30,70,"o","ο","small",14,34.6,81.6,-0.7,1.25,1,"known"],
    [75,180,"\\delta","δ","large",24,34.9,64.9,5,6.5,1.5,"known"],
    [45,30,"\\mu","μ","medium",18,32.7,74.1,2.5,6.5,2,"known"],
    [345,300,"\\upsilon","υ","small",16,15.5,56,-1,5,4,"known"],
    [175,130,"\\varepsilon","ε","small",20,20.5,47.9,-10,2,3,"known"],
    [40,260,"\\eta","η","medium",20,39.9,66.5,1.5,2,1.5,"known"],
    [35,230,"\\varphi","φ","medium",12,29.7,71.3,1.5,1.5,1,"known"],
    [165,300,"\\psi","ψ","large",18,21.2,54,2.5,2.5,1,"known"],
    [15,190,"o","ο","small",22,61.4,81.8,-2.3,2.5,1.25,"known"],
    [35,270,"\\xi","ξ","large",12,28,72.7,-1,1.25,4,"known"],
    [80,140,"\\rho","ρ","medium",20,26,64.7,-8.5,1.5,4,"known"],
    [55,130,"\\rho","ρ","medium",24,36.6,73,-6,3.25,1,"known"],
    [80,260,"\\theta","θ","medium",22,32.7,61,-4,4,2.25,"known"],
    [50,60,"\\theta","θ","medium",24,38.6,68,-0.5,1.25,3,"known"],
    [10,60,"\\psi","ψ","large",16,86.6,88,-0.3,3.25,3,"known"],
    [65,120,"\\psi","ψ","large",16,27.6,68.3,-2.3,2.5,2.25,"known"],
    [65,220,"\\chi","χ","medium",22,36.1,56.7,-0.4,3.25,3,"known"],
    [45,220,"\\varphi","φ","medium",22,42.8,65.3,-1,4,2,"known"],
    [120,340,"\\chi","χ","medium",24,30.6,64.3,10,1.25,4,"known"],
    [45,320,"\\zeta","ζ","large",16,34.9,73.2,0.9,1.5,3,"known"],
    [60,20,"\\gamma","γ","medium",16,25.4,69.8,2,1.5,3,"known"],
    [30,200,"\\delta","δ","large",16,39.9,77.9,1.7,6.5,1.25,"known"],
    [85,40,"\\varphi","φ","medium",14,19.2,66.1,-3,3.25,1.25,"known"],
    [30,150,"\\nu","ν","small",24,50.7,77.1,-2.2,4,1.25,"known"],
    [20,120,"\\alpha","α","small",18,52.9,84.2,-2.1,1.5,1,"known"],
    [30,290,"\\eta","η","medium",24,56.8,72.9,1.5,3.25,4,"known"],
    [70,170,"\\xi","ξ","large",18,29.1,64.9,-0.7,5,4,"known"],
    [55,70,"\\pi","π","medium",20,30.7,74.6,-2,5,2.25,"known"],
    [225,230,"\\kappa","κ","small",24,23.6,50.8,12,1.5,1,"known"],
    [75,40,"\\iota","ι","small",16,21.2,69.3,0,6.5,2,"known"],
    [10,160,"\\iota","ι","small",22,82.1,88.2,-2,2.5,1,"known"],
    [10,110,"\\delta","δ","large",14,79.5,89.3,-0.1,4,4,"known"],
    [10,150,"o","ο","small",16,64.7,88.4,-1.5,3.25,1.5,"known"],
    [60,30,"\\sigma","σ","small",16,25.5,70.9,2,5,4,"known"],
    [25,290,"\\iota","ι","small",18,44.6,76.5,2.2,3.25,1.25,"known"],
    [60,240,"o","ο","small",16,22.9,61.5,1,1.25,2,"known"],
    [30,50,"\\delta","δ","large",22,54.5,70.9,0.4,1.5,2.25,"known"],
    [85,30,"\\eta","η","medium",20,27.7,67.4,6,5,1,"known"],
    [25,230,"\\tau","τ","small",20,49.9,76,-0.5,3.25,4,"known"],
    [35,150,"\\nu","ν","small",22,42.8,73.8,-2,2.5,2.25,"known"],
    [30,150,"\\upsilon","υ","small",14,32.7,76.9,-2.3,4,1.25,"known"],
    [85,60,"\\rho","ρ","medium",16,21.5,67.9,-3.5,4,4,"known"],
    [70,290,"\\varepsilon","ε","small",20,27.6,63.3,5.5,4,2,"known"],
    [265,160,"\\alpha","α","small",20,18.4,38.4,21,5,1.5,"known"],
    [15,310,"\\iota","ι","small",16,54.5,83,1.9,4,2.25,"known"],
    [80,310,"\\alpha","α","small",24,29.8,61.5,7.8,2.5,2.25,"known"],
    [140,80,"\\gamma","γ","medium",20,21.4,59.4,-9,1.25,1.25,"known"],
    [20,100,"\\alpha","α","small",14,43.9,85.1,-1.7,1.5,1.5,"known"],
    [215,160,"\\psi","ψ","large",20,24.1,50.2,-1.5,6.5,2,"known"],
    [35,190,"\\alpha","α","small",16,29.9,72,-4,4,1,"known"],
    [345,160,"\\alpha","α","small",24,23.8,47.5,18,3.25,2.25,"known"],
    [40,20,"\\alpha","α","small",20,41.3,77.4,4.5,6.5,1.25,"known"],
    [15,110,"\\alpha","α","small",16,58.4,87.4,-1.5,1.25,4,"known"],
    [95,100,"\\pi","π","medium",20,26,67,-11.5,6.5,2,"known"],
    [55,160,"\\alpha","α","small",24,35.6,66.3,-7.5,4,1,"known"],
    [80,170,"\\mu","μ","medium",18,28,56.4,-3.5,1.25,1.5,"known"],
    [10,170,"\\alpha","α","small",18,70,86.5,-2.2,5,1.25,"known"],
    [40,120,"\\alpha","α","small",22,39.9,76.6,-3.7,2.5,2.25,"known"],
    [120,290,"\\alpha","α","small",22,24.8,57.2,8.5,6.5,4,"known"],
    [15,200,"\\alpha","α","small",20,62.2,80.4,-3.1,5,2,"known"],
    [55,20,"\\alpha","α","small",18,30.1,72.7,4.5,4,3,"known"],
    [25,180,"\\alpha","α","small",24,54.7,77.2,-3.4,1.5,1,"known"],
    [25,310,"o","ο","small",22,53.4,78.4,2,5,1,"known"],
    [95,10,"\\tau","τ","small",20,24.8,66.4,5.5,3.25,3,"known"],
    [30,270,"\\alpha","α","small",24,56.6,72.8,1.2,1.5,1,"known"],
    [155,300,"\\alpha","α","small",16,16.3,59.7,10.5,2.5,1.5,"known"],
    [40,220,"\\alpha","α","small",14,26.1,69.4,-2,2.5,4,"known"],
    [40,140,"\\alpha","α","small",24,41.5,75,-4,3.25,1,"known"],
    [40,290,"\\alpha","α","small",14,29.2,72.2,5,2,2,"known"],
    [40,50,"\\alpha","α","small",16,30.7,77.6,0.4,3.25,4,"known"],
    [90,10,"\\alpha","α","small",18,23,69.7,4.1,6.5,2.25,"known"],
    [35,100,"\\xi","ξ","large",16,36.2,76.3,-3.5,1.5,1.25,"known"],
    [10,210,"\\alpha","α","small",18,80,85.8,-2,4,2,"known"],
    [330,200,"\\mu","μ","medium",18,18.1,51.1,7.5,5,3,"known"],
    [80,190,"\\alpha","α","small",14,17.3,57.3,-6,5,3,"known"],
    [60,170,"\\theta","θ","medium",18,29.9,66.2,1.5,2.5,1.5,"known"],
    [215,290,"\\alpha","α","small",24,24.4,57.3,9,5,4,"known"],
    [15,210,"\\alpha","α","small",24,78.7,83.1,-2.2,2,1.25,"known"],
    [15,170,"\\alpha","α","small",24,71.9,82.7,-2.6,5,2.25,"known"],
    [45,50,"\\alpha","α","small",18,33.2,76.9,0.3,3.25,3,"known"],
    [75,290,"\\iota","ι","small",20,21.7,60.2,6.5,3.25,1.25,"known"],
    [45,90,"\\alpha","α","small",20,35.8,76.4,-2.5,1.25,1.5,"known"],
    [25,340,"\\alpha","α","small",20,47.4,79.4,4.1,4,2.25,"known"],
    [30,110,"\\alpha","α","small",18,39.1,80.3,-2.6,6.5,4,"known"],
    [15,20,"\\alpha","α","small",16,55.5,85.1,1.6,2,1,"known"],
    [45,330,"\\alpha","α","small",18,31.6,72.7,5,4,4,"known"],
    [45,180,"\\kappa","κ","small",16,27.4,69.1,-4.4,1.25,4,"known"],
    [60,200,"\\omega","ω","medium",12,20.8,62.1,-2.1,4,1,"known"],
    [75,170,"\\alpha","α","small",20,25.5,59,-6.5,6.5,1.25,"known"],
    [75,240,"\\alpha","α","small",18,23.2,57.3,2.2,3.25,1.25,"known"],
    [65,160,"\\alpha","α","small",24,32.8,62.4,-6,1.5,1.5,"known"],
    [155,90,"\\alpha","α","small",20,19.5,56.6,-16,1.5,2.25,"known"],
    [30,240,"\\alpha","α","small",16,38.1,73.3,0.2,3.25,2.25,"known"],
    [310,220,"\\alpha","α","small",12,13,54.6,8.3,6.5,4,"known"],
    [40,170,"\\alpha","α","small",22,38.3,71.9,-3.8,1.5,1,"known"],
    [165,10,"\\alpha","α","small",18,17.8,60.7,-6.5,2.5,1,"known"],
    [15,240,"\\omega","ω","medium",24,89.6,84.6,-0.3,3.25,3,"known"],
    [25,110,"\\alpha","α","small",24,60.9,82,-2.1,2,2,"known"],
    [30,260,"\\pi","π","medium",16,38.7,74.4,0.6,5,1,"known"],
    [55,280,"\\alpha","α","small",18,29.8,66.4,4.4,1.25,2,"known"],
    [85,50,"\\psi","ψ","large",22,31.2,60.7,-1.5,2,4,"known"],
    [35,320,"\\alpha","α","small",20,44.3,75.4,4.5,3.25,1,"known"],
    [55,350,"\\alpha","α","small",16,27.5,71.3,5,3.25,2.25,"known"],
    [15,20,"\\alpha","α","small",20,69.2,85,2.1,4,2.25,"known"],
    [85,330,"\\alpha","α","small",18,22.6,65.4,8,5,3,"known"],
    [345,280,"\\alpha","α","small",24,23.6,57.9,-4,5,1.25,"known"],
    [75,160,"\\alpha","α","small",16,20.2,60,-8,1.5,1.25,"known"],
    [15,160,"\\mu","μ","medium",16,68.9,87.5,-1.9,4,1.25,"known"],
    [45,90,"\\alpha","α","small",22,39.3,75.8,-2.1,4,1,"known"],
    [20,60,"o","ο","small",22,55.3,85.6,0.1,3.25,1,"known"],
    [70,190,"\\alpha","α","small",20,26.4,58.4,-6,6.5,4,"known"],
    [10,60,"\\kappa","κ","small",18,85.5,90.7,0.8,1.5,3,"known"],
    [10,210,"\\alpha","α","small",12,62.2,87.4,-1.1,2.5,1,"known"],
    [75,110,"\\alpha","α","small",14,17.9,65.9,-8.5,6.5,3,"known"],
    [80,330,"\\alpha","α","small",16,20.2,65.6,7,1.25,2,"known"],
    [45,70,"\\alpha","α","small",20,35.9,77.9,-1.1,2,1.25,"known"],
    [45,280,"\\varphi","φ","medium",22,41.9,67.2,1.9,2,3,"known"],
    [15,220,"\\alpha","α","small",14,49.5,81.5,-1.6,3.25,2.25,"known"],
    [130,280,"\\alpha","α","small",18,19.2,54.2,10.5,5,1,"known"],
    [30,200,"\\alpha","α","small",20,42.5,73.8,-3.9,2,1.5,"known"],
    [65,170,"\\alpha","α","small",24,33.2,62.6,-5.7,6.5,3,"known"],
    [60,0,"\\alpha","α","small",24,36.8,71.9,5.5,6.5,4,"known"],
    [20,200,"\\kappa","κ","small",20,55,77.9,-2.8,6.5,4,"known"],
    [45,340,"\\alpha","α","small",14,25.6,73.3,5,2.5,1,"known"],
    [55,150,"\\eta","η","medium",20,34.2,67.7,-6.5,2,3,"known"],
    [15,220,"\\zeta","ζ","large",22,80,83.8,-0.8,2.5,1.25,"known"],
    [25,160,"\\alpha","α","small",22,52.8,78.7,-3,5,2,"known"],
    [10,270,"\\alpha","α","small",22,98.1,86.7,0.5,4,4,"known"],
    [20,80,"\\alpha","α","small",20,58.3,87,-0.8,2.5,3,"known"],
    [90,30,"\\alpha","α","small",14,17.8,68.3,2.2,4,1,"known"],
    [20,200,"\\alpha","α","small",18,48.2,78.4,-2.6,6.5,1.25,"known"],
    [10,130,"\\upsilon","υ","small",16,84.9,90.4,-1,1.25,2,"known"],
    [85,250,"\\alpha","α","small",16,19.5,58.1,3,3.25,1.25,"known"],
    [80,0,"\\beta","β","large",16,23.5,61.2,0.7,3.25,2.25,"known"],
    [60,230,"\\alpha","α","small",20,29.7,58.4,-1,3.25,2,"known"],
    [50,130,"\\alpha","α","small",24,37.2,71.3,-4.9,5,4,"known"],
    [50,190,"\\alpha","α","small",16,24,65.7,-5.5,1.25,2,"known"],
    [20,180,"\\alpha","α","small",14,43.4,79.4,-3.1,1.25,2,"known"],
    [35,20,"\\alpha","α","small",24,49.5,77.5,3.5,6.5,3,"known"],
    [30,270,"\\alpha","α","small",24,56.2,73.6,1.4,4,1,"known"],
    [245,50,"\\alpha","α","small",24,22,52,-16,2,4,"known"],
    [30,40,"\\alpha","α","small",24,53.8,80.3,2.2,2,1,"known"],
    [85,90,"\\mu","μ","medium",18,24.7,65.8,-6.5,1.5,1.25,"known"],
    [40,0,"\\alpha","α","small",24,45.9,74.9,6,3.25,1.25,"known"]
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
    const sample = {
      angleDeg: row[0],
      baseRayAngleDeg: row[1],
      label: {
        latex: row[2],
        text: row[3]
      },
      labelClassId: row[4],
      fontSizePx: row[5],
      arcRadius: row[6],
      labelPercent: row[7],
      labelAngleOffsetDeg: row[8],
      rayStrokeWidthPx: numericOr(row[9], DEFAULTS.angleRayStrokeWidthPx),
      arcStrokeWidthPx: numericOr(row[10], DEFAULTS.angleArcStrokeWidthPx),
      strokeWidthConfidence: row[11] || 'estimated'
    };
    return sample.strokeWidthConfidence === 'known'
      ? Object.assign({ referenceLine: 'thin' }, sample)
      : displaySampleToThinReference(sample);
  }

  function displaySampleToThinReference(sample) {
    const correction = angleStrokeCorrection(sample.angleDeg, sample);
    if (correction.arcRadiusOffset <= 0) {
      return Object.assign({ referenceLine: 'thin-estimated' }, sample);
    }

    const displayArcRadius = sample.arcRadius;
    const thinArcRadius = Math.max(12, displayArcRadius - correction.arcRadiusOffset);
    const bisectorAngleDeg = normalizeDegrees(sample.angleDeg) / 2;
    const displayLabelDistance = displayArcRadius * sample.labelPercent / 100;
    const displayLabelAngleRad = (bisectorAngleDeg + sample.labelAngleOffsetDeg) * Math.PI / 180;
    const bisectorAngleRad = bisectorAngleDeg * Math.PI / 180;
    const displayVector = {
      x: Math.cos(displayLabelAngleRad) * displayLabelDistance,
      y: Math.sin(displayLabelAngleRad) * displayLabelDistance
    };
    const thinVector = {
      x: displayVector.x - Math.cos(bisectorAngleRad) * correction.bisectorOffset,
      y: displayVector.y - Math.sin(bisectorAngleRad) * correction.bisectorOffset
    };
    const thinLabelDistance = Math.hypot(thinVector.x, thinVector.y);
    const thinLabelAngleDeg = Math.atan2(thinVector.y, thinVector.x) * 180 / Math.PI;

    return Object.assign({}, sample, {
      arcRadius: thinArcRadius,
      labelPercent: thinArcRadius > 0
        ? thinLabelDistance / thinArcRadius * 100
        : sample.labelPercent,
      labelAngleOffsetDeg: normalizeSignedDegrees(thinLabelAngleDeg - bisectorAngleDeg),
      referenceLine: 'thin-converted-from-display',
      originalDisplayArcRadius: sample.arcRadius,
      originalDisplayLabelPercent: sample.labelPercent,
      originalDisplayLabelAngleOffsetDeg: sample.labelAngleOffsetDeg
    });
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

  function normalizedCoordinateSystem(options) {
    return options && options.coordinateSystem === 'math' ? 'math' : 'svg';
  }

  function counterclockwiseRayOrder(geometry, coordinateSystem) {
    const firstRayIsStart = coordinateSystem === 'math'
      ? geometry.delta >= 0
      : geometry.delta <= 0;
    return {
      firstRayIsStart,
      startRay: firstRayIsStart ? 'first' : 'second',
      endRay: firstRayIsStart ? 'second' : 'first'
    };
  }

  function directedCounterclockwiseBaseRayAngleDeg(geometry, coordinateSystem) {
    const order = counterclockwiseRayOrder(geometry, coordinateSystem);
    const baseRayCoordinateAngle = order.firstRayIsStart ? geometry.start : geometry.end;
    const coordinateSign = coordinateSystem === 'math' ? 1 : -1;
    return normalizeDegrees(coordinateSign * baseRayCoordinateAngle * 180 / Math.PI);
  }

  function angleContextFromRays(vertex, first, second, options) {
    const coordinateSystem = normalizedCoordinateSystem(options);
    const geometry = angleGeometry(vertex, first, second);
    const rayOrder = counterclockwiseRayOrder(geometry, coordinateSystem);
    const baseRayAngleDeg = directedCounterclockwiseBaseRayAngleDeg(geometry, coordinateSystem);
    return {
      angleDeg: geometry.angleDeg,
      angleRad: geometry.angleRad,
      baseRayAngleDeg,
      bisectorAngleDeg: normalizeDegrees(baseRayAngleDeg + geometry.angleDeg / 2),
      coordinateSystem,
      rayOrder,
      startRayPoint: rayOrder.firstRayIsStart ? first : second,
      endRayPoint: rayOrder.firstRayIsStart ? second : first,
      firstRayPoint: first,
      secondRayPoint: second,
      geometry
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
      classCorrectionWeight: correction.classWeight,
      labelResidualWeight: correction.labelResidualWeight,
      labelResidualEffectiveSampleSize: correction.labelResidualEffectiveSampleSize,
      labelResidualSampleCount: correction.labelResidualSampleCount,
      labelResidualBlend: correction.labelResidualBlend,
      fontSizePx,
      baselineFontSizePx: DEFAULTS.angleLabelFontSizePx,
      renderProfileId: ANGLE_LABEL_RENDER_PROFILE.id
    };
  }

  /**
   * Verifies the renderer adapter used by a calibration producer or consumer.
   * Pass the adapter's independently declared profile id, not the value read
   * back from this helper; the duplication is intentional and catches drift.
   */
  function assertAngleLabelRenderProfile(profile) {
    const actualId = typeof profile === 'string' ? profile : profile && profile.id;
    if (actualId !== ANGLE_LABEL_RENDER_PROFILE.id) {
      throw new Error(
        `Incompatible angle-label render profile: expected ${ANGLE_LABEL_RENDER_PROFILE.id}, got ${actualId || 'missing'}.`
      );
    }
    return ANGLE_LABEL_RENDER_PROFILE;
  }

  function angleLabelStyleFromRays(vertex, first, second, label, options) {
    const context = angleContextFromRays(vertex, first, second, options);
    return angleLabelStyle(context.angleDeg, label, Object.assign({}, options || {}, {
      baseRayAngleDeg: context.baseRayAngleDeg
    }));
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
    const safeClassId = ANGLE_LABEL_CLASS_IDS.includes(target.labelClassId) ? target.labelClassId : 'medium';
    const targetLabel = normalizeLabel(target.label);
    let classCorrection = classSampleCorrection(
      target,
      settings,
      baseRayAngleDeg,
      safeClassId,
      targetLabel
    );

    if (classCorrection.weight < settings.angleLabelSampleMinWeight) {
      classCorrection = classSampleCorrection(
        target,
        settings,
        baseRayAngleDeg,
        safeClassId,
        null
      );
    }

    const labelResidual = labelSpecificResidualCorrection(
      target,
      settings,
      baseRayAngleDeg,
      safeClassId,
      targetLabel
    );
    const residualBlend = angleLabelResidualBlend(
      labelResidual.weight,
      labelResidual.effectiveSampleSize,
      settings
    );
    totalWeight = classCorrection.weight + labelResidual.weight * residualBlend;

    return {
      arcRadius: (classCorrection.arcRadiusRatio + labelResidual.arcRadiusRatio * residualBlend) * target.fontSizePx,
      labelPercent: classCorrection.labelPercent + labelResidual.labelPercent * residualBlend,
      labelAngleOffsetDeg: classCorrection.labelAngleOffsetDeg + labelResidual.labelAngleOffsetDeg * residualBlend,
      weight: totalWeight,
      classWeight: classCorrection.weight,
      labelResidualWeight: labelResidual.weight,
      labelResidualEffectiveSampleSize: labelResidual.effectiveSampleSize,
      labelResidualSampleCount: labelResidual.sampleCount,
      labelResidualBlend: residualBlend
    };
  }

  function classSampleCorrection(target, settings, baseRayAngleDeg, labelClassId, excludedLabel) {
    let totalWeight = 0;
    let arcRadiusRatio = 0;
    let labelPercent = 0;
    let labelAngleOffsetDeg = 0;

    ANGLE_LABEL_SAMPLE_DATA.forEach(function(sample) {
      const weight = classSampleWeight(sample, target, baseRayAngleDeg, labelClassId, excludedLabel);
      if (weight < 0.01) {
        return;
      }

      const residual = sampleBaselineResidual(sample, settings);
      arcRadiusRatio += weight * residual.arcRadiusRatio;
      labelPercent += weight * residual.labelPercent;
      labelAngleOffsetDeg += weight * residual.labelAngleOffsetDeg;
      totalWeight += weight;
    });

    if (totalWeight < settings.angleLabelSampleMinWeight) {
      return zeroRawCorrection();
    }

    return {
      arcRadiusRatio: arcRadiusRatio / totalWeight,
      labelPercent: labelPercent / totalWeight,
      labelAngleOffsetDeg: labelAngleOffsetDeg / totalWeight,
      weight: totalWeight
    };
  }

  function labelSpecificResidualCorrection(target, settings, baseRayAngleDeg, labelClassId, targetLabel) {
    if (!targetLabel || (!targetLabel.text && !targetLabel.latex)) {
      return zeroRawCorrection();
    }

    let totalWeight = 0;
    let confidenceWeightTotal = 0;
    let confidenceWeightSquares = 0;
    let arcRadiusRatio = 0;
    let labelPercent = 0;
    let labelAngleOffsetDeg = 0;
    let sampleCount = 0;
    const confidenceWeightCap = Math.max(
      0.01,
      numericOr(settings.angleLabelResidualConfidenceWeightCap, 1)
    );

    ANGLE_LABEL_SAMPLE_DATA.forEach(function(sample) {
      const weight = labelResidualSampleWeight(sample, target, baseRayAngleDeg, labelClassId, targetLabel);
      if (weight < 0.01) {
        return;
      }

      const sampleBaseRayAngleDeg = normalizeOptionalDegrees(sample.baseRayAngleDeg);
      const genericClassCorrection = classSampleCorrection(
        sample,
        settings,
        sampleBaseRayAngleDeg,
        labelClassId,
        targetLabel
      );
      const residual = sampleBaselineResidual(sample, settings);

      arcRadiusRatio += weight * (residual.arcRadiusRatio - genericClassCorrection.arcRadiusRatio);
      labelPercent += weight * (residual.labelPercent - genericClassCorrection.labelPercent);
      labelAngleOffsetDeg += weight * (
        residual.labelAngleOffsetDeg - genericClassCorrection.labelAngleOffsetDeg
      );
      totalWeight += weight;
      const confidenceWeight = Math.min(weight, confidenceWeightCap);
      confidenceWeightTotal += confidenceWeight;
      confidenceWeightSquares += square(confidenceWeight);
      sampleCount += 1;
    });

    if (totalWeight < settings.angleLabelResidualMinWeight) {
      return zeroRawCorrection();
    }

    return {
      arcRadiusRatio: arcRadiusRatio / totalWeight,
      labelPercent: labelPercent / totalWeight,
      labelAngleOffsetDeg: labelAngleOffsetDeg / totalWeight,
      weight: totalWeight,
      effectiveSampleSize: effectiveSampleSize(
        confidenceWeightTotal,
        confidenceWeightSquares
      ),
      sampleCount
    };
  }

  function sampleBaselineResidual(sample, settings) {
    const baseline = baselineAngleLabelStyle(
      sample.angleDeg,
      sample.labelClassId,
      sample.fontSizePx,
      settings
    );
    return {
      arcRadiusRatio: clamp(
        sample.arcRadius / sample.fontSizePx - baseline.arcRadius / sample.fontSizePx,
        -2.5,
        2.5
      ),
      labelPercent: clamp(sample.labelPercent - baseline.labelPercent, -30, 30),
      labelAngleOffsetDeg: clamp(sample.labelAngleOffsetDeg, -20, 20)
    };
  }

  function classSampleWeight(sample, target, baseRayAngleDeg, labelClassId, excludedLabel) {
    if (sample.labelClassId !== labelClassId) {
      return 0;
    }
    if (excludedLabel && labelsMatch(sample.label, excludedLabel)) {
      return 0;
    }
    return neighborhoodSampleWeight(sample, target, baseRayAngleDeg);
  }

  function labelResidualSampleWeight(sample, target, baseRayAngleDeg, labelClassId, targetLabel) {
    if (sample.labelClassId !== labelClassId || !labelsMatch(sample.label, targetLabel)) {
      return 0;
    }
    return neighborhoodSampleWeight(sample, target, baseRayAngleDeg);
  }

  function neighborhoodSampleWeight(sample, target, baseRayAngleDeg) {
    const angleDistance = Math.abs(sample.angleDeg - target.angleDeg);
    const baseRayDistance = circularDistance(sample.baseRayAngleDeg, baseRayAngleDeg);
    const distanceSquared = square(angleDistance / 35)
      + square(baseRayDistance / 70);

    return Math.exp(-0.5 * distanceSquared) / (0.05 + distanceSquared);
  }

  /**
   * Returns the exact-label residual blend for a weighted neighborhood.
   * Consumers normally receive this through angleLabelStyle(). This public
   * form exists for tuning diagnostics and contract tests.
   */
  function angleLabelResidualBlend(weight, effectiveSamples, options) {
    const settings = mergeOptions(options);
    const safeWeight = Math.max(0, numericOr(weight, 0));
    const safeEffectiveSamples = Math.max(0, numericOr(effectiveSamples, 0));
    if (safeWeight <= settings.angleLabelResidualMinWeight || safeEffectiveSamples <= 0) {
      return 0;
    }
    const weightConfidence = (safeWeight - settings.angleLabelResidualMinWeight)
      / Math.max(0.001, settings.angleLabelResidualFullWeight - settings.angleLabelResidualMinWeight);
    const maxBlend = clamp(numericOr(settings.angleLabelResidualMaxBlend, 0.85), 0, 1);
    const singleSampleMaxBlend = clamp(
      numericOr(settings.angleLabelResidualSingleSampleMaxBlend, 0.1),
      0,
      maxBlend
    );
    const fullEffectiveSampleSize = Math.max(
      1.001,
      numericOr(settings.angleLabelResidualFullEffectiveSampleSize, 3)
    );
    const diversityConfidence = (safeEffectiveSamples - 1)
      / (fullEffectiveSampleSize - 1);
    const diversityLimitedBlend = lerp(
      singleSampleMaxBlend,
      maxBlend,
      clamp(diversityConfidence, 0, 1)
    );
    return clamp(weightConfidence, 0, 1) * diversityLimitedBlend;
  }

  function effectiveSampleSize(weightTotal, weightSquares) {
    if (weightTotal <= 0 || weightSquares <= 0) {
      return 0;
    }
    return square(weightTotal) / weightSquares;
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
    return radius * scale;
  }

  function thinAngleLabelRelativePosition(angleDeg, style, options) {
    const settings = mergeOptions(options);
    const baseRayAngleDeg = numericOr(settings.baseRayAngleDeg, 0);
    const normalizedAngle = normalizeDegrees(angleDeg);
    const labelDistance = style.arcRadius * style.labelPercent / 100;
    const bisectorAngleDeg = baseRayAngleDeg + normalizedAngle / 2;
    const labelAngleDeg = bisectorAngleDeg + style.labelAngleOffsetDeg;
    return Object.assign(relativeVector(labelAngleDeg, labelDistance, settings.coordinateSystem), {
      distance: labelDistance,
      eccentricity: style.labelPercent / 100,
      angleDeg: normalizedAngle,
      labelClassId: style.labelClassId,
      labelAngleOffsetDeg: style.labelAngleOffsetDeg,
      labelAngleDeg,
      bisectorAngleDeg,
      arcRadius: style.arcRadius,
      thinArcRadius: style.arcRadius
    });
  }

  function angleStrokeCorrection(angleDeg, options) {
    const settings = mergeOptions(options);
    const normalizedAngle = normalizeDegrees(angleDeg);
    const rayStrokeWidthPx = Math.max(0, numericOr(
      settings.rayStrokeWidthPx,
      settings.angleRayStrokeWidthPx
    ));
    const arcStrokeWidthPx = Math.max(0, numericOr(
      settings.arcStrokeWidthPx,
      settings.angleArcStrokeWidthPx
    ));
    let bisectorOffset = 0;
    let formula = 'none';

    if (rayStrokeWidthPx > 0 && normalizedAngle > 0) {
      if (normalizedAngle <= 180) {
        const halfAngleSin = Math.sin(normalizedAngle * Math.PI / 360);
        bisectorOffset = halfAngleSin > 0
          ? (rayStrokeWidthPx / 2) / halfAngleSin
          : 0;
        formula = 'convex-inner-edge';
      } else {
        bisectorOffset = rayStrokeWidthPx / 2;
        formula = 'reflex-bounded';
      }
    }

    return {
      angleDeg: normalizedAngle,
      rayStrokeWidthPx,
      arcStrokeWidthPx,
      bisectorOffset,
      arcRadiusOffset: bisectorOffset + arcStrokeWidthPx / 2,
      formula
    };
  }

  function strokeAdjustedAngleArcRadius(angleDeg, style, options) {
    return style.arcRadius + angleStrokeCorrection(angleDeg, options).arcRadiusOffset;
  }

  function strokeAdjustedAngleLabelRelativePosition(angleDeg, style, options) {
    const settings = mergeOptions(options);
    const thinPosition = thinAngleLabelRelativePosition(angleDeg, style, settings);
    const correction = angleStrokeCorrection(angleDeg, settings);
    const shift = relativeVector(
      thinPosition.bisectorAngleDeg,
      correction.bisectorOffset,
      settings.coordinateSystem
    );
    return Object.assign({}, thinPosition, {
      x: thinPosition.x + shift.x,
      y: thinPosition.y + shift.y,
      distanceFromThinVertex: Math.hypot(thinPosition.x + shift.x, thinPosition.y + shift.y),
      strokeShift: shift,
      strokeCorrection: correction,
      arcRadius: style.arcRadius + correction.arcRadiusOffset,
      thinPosition
    });
  }

  function thinAngleLabelPosition(vertex, geometry, style) {
    const labelDistance = style.arcRadius * style.labelPercent / 100;
    const labelAngle = geometry.middle - style.labelAngleOffsetDeg * Math.PI / 180;
    return Object.assign(pointOnRay(vertex, labelAngle, labelDistance), {
      distance: labelDistance,
      eccentricity: style.labelPercent / 100,
      angleDeg: geometry.angleDeg,
      labelClassId: style.labelClassId,
      labelAngleOffsetDeg: style.labelAngleOffsetDeg,
      labelAngleRad: labelAngle,
      bisectorAngleRad: geometry.middle,
      arcRadius: style.arcRadius,
      thinArcRadius: style.arcRadius
    });
  }

  function strokeAdjustedAngleLabelPosition(vertex, geometry, style, options) {
    const thinPosition = thinAngleLabelPosition(vertex, geometry, style);
    const correction = angleStrokeCorrection(style.angleDeg || geometry.angleDeg, options);
    const shift = pointOnRay({ x: 0, y: 0 }, geometry.middle, correction.bisectorOffset);
    return Object.assign({}, thinPosition, {
      x: thinPosition.x + shift.x,
      y: thinPosition.y + shift.y,
      distanceFromThinVertex: Math.hypot(
        thinPosition.x + shift.x - vertex.x,
        thinPosition.y + shift.y - vertex.y
      ),
      strokeShift: shift,
      strokeCorrection: correction,
      arcRadius: style.arcRadius + correction.arcRadiusOffset,
      thinPosition
    });
  }

  function calibratedAngleMarkerFromRays(vertex, first, second, label, options) {
    const context = angleContextFromRays(vertex, first, second, options);
    const geometry = context.geometry;
    const style = angleLabelStyle(context.angleDeg, label, Object.assign({}, options || {}, {
      baseRayAngleDeg: context.baseRayAngleDeg
    }));
    const strokeCorrection = angleStrokeCorrection(style.angleDeg, options);
    const markerLabel = strokeAdjustedAngleLabelPosition(vertex, geometry, style, options);
    return {
      angleContext: context,
      geometry,
      style,
      thinArcRadius: style.arcRadius,
      strokeCorrection,
      arcRadius: style.arcRadius + strokeCorrection.arcRadiusOffset,
      label: markerLabel
    };
  }

  function calibratedAngleMarker(vertex, first, second, label, options) {
    return calibratedAngleMarkerFromRays(vertex, first, second, label, options);
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

  function normalizeSignedDegrees(angleDeg) {
    let normalized = normalizeDegrees(angleDeg);
    if (normalized > 180) {
      normalized -= 360;
    }
    return normalized;
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

  function numericOr(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function zeroSampleCorrection() {
    return {
      arcRadius: 0,
      labelPercent: 0,
      labelAngleOffsetDeg: 0,
      weight: 0,
      classWeight: 0,
      labelResidualWeight: 0,
      labelResidualEffectiveSampleSize: 0,
      labelResidualSampleCount: 0,
      labelResidualBlend: 0
    };
  }

  function zeroRawCorrection() {
    return {
      arcRadiusRatio: 0,
      labelPercent: 0,
      labelAngleOffsetDeg: 0,
      weight: 0,
      effectiveSampleSize: 0,
      sampleCount: 0
    };
  }

  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  function relativeVector(degrees, distance, coordinateSystem) {
    const radians = degrees * Math.PI / 180;
    const ySign = coordinateSystem === 'math' ? 1 : -1;
    return {
      x: Math.cos(radians) * distance,
      y: ySign * Math.sin(radians) * distance
    };
  }

  const api = Object.freeze({
    VERSION,
    ANGLE_LABEL_CALIBRATION_VERSION,
    ANGLE_LABEL_DATA_VERSION,
    ANGLE_LABEL_RENDER_PROFILE,
    DEFAULTS,
    ANGLE_LABEL_CLASSES,
    ANGLE_LABEL_CALIBRATION_ROWS,
    ANGLE_LABEL_SAMPLE_DATA,
    unitVector,
    angleGeometry,
    angleContextFromRays,
    arcPoints,
    arcSvgPath,
    labelEccentricityForAngle,
    angleLabelPosition,
    angleLabelClassFor,
    assertAngleLabelRenderProfile,
    angleLabelResidualBlend,
    angleLabelStyle,
    angleLabelStyleFromRays,
    angleLabelCalibrationAt,
    angleLabelSampleCorrection,
    thinAngleLabelRelativePosition,
    angleStrokeCorrection,
    strokeAdjustedAngleArcRadius,
    strokeAdjustedAngleLabelRelativePosition,
    thinAngleLabelPosition,
    strokeAdjustedAngleLabelPosition,
    calibratedAngleMarkerFromRays,
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
