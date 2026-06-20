/*
 * Shared geometry helpers for angle markers and angle labels.
 *
 * The functions in this file do not create DOM nodes. They only compute
 * renderer-independent geometry that can be consumed by SVG, D3, JSXGraph,
 * GeoGebra command generation, or HTML/MathJax label overlays.
 */
(function(global) {
  'use strict';

  const VERSION = '0.4.0';

  const DEFAULTS = Object.freeze({
    acuteAngleArcRadius: 44,
    angleLabelFontSizePx: 16,
    angleLabelRadiusFontFloor: 12,
    labelEccentricity: 0.6,
    narrowAngleLabelEccentricity: 0.85,
    narrowAngleThresholdDeg: 25,
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
        text: row[2],
        latex: row[3]
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
    let arcRadiusRatio = 0;
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
      arcRadiusRatio += weight * clamp(
        sample.arcRadius / sample.fontSizePx - baseline.arcRadius / sample.fontSizePx,
        -2.5,
        2.5
      );
      labelPercent += weight * clamp(sample.labelPercent - baseline.labelPercent, -30, 30);
      labelAngleOffsetDeg += weight * clamp(sample.labelAngleOffsetDeg, -20, 20);
      totalWeight += weight;
    });

    if (totalWeight < 0.08) {
      return zeroSampleCorrection();
    }

    return {
      arcRadius: (arcRadiusRatio / totalWeight) * target.fontSizePx,
      labelPercent: labelPercent / totalWeight,
      labelAngleOffsetDeg: labelAngleOffsetDeg / totalWeight,
      weight: totalWeight
    };
  }

  function sampleWeight(sample, target, baseRayAngleDeg, labelClassId, targetLabel) {
    const angleDistance = Math.abs(sample.angleDeg - target.angleDeg);
    const baseRayDistance = circularDistance(sample.baseRayAngleDeg, baseRayAngleDeg);
    let distanceSquared = square(angleDistance / 35)
      + square(baseRayDistance / 70);

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

  function calibratedAngleMarker(vertex, first, second, label, options) {
    const geometry = angleGeometry(vertex, first, second);
    const style = angleLabelStyle(geometry.angleDeg, label, Object.assign({}, options || {}, {
      baseRayAngleDeg: normalizeOptionalDegrees(options && options.baseRayAngleDeg) === null
        ? normalizeDegrees(-geometry.start * 180 / Math.PI)
        : options.baseRayAngleDeg
    }));
    const strokeCorrection = angleStrokeCorrection(style.angleDeg, options);
    const markerLabel = strokeAdjustedAngleLabelPosition(vertex, geometry, style, options);
    return {
      geometry,
      style,
      thinArcRadius: style.arcRadius,
      strokeCorrection,
      arcRadius: style.arcRadius + strokeCorrection.arcRadiusOffset,
      label: markerLabel
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
      weight: 0
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
    thinAngleLabelRelativePosition,
    angleStrokeCorrection,
    strokeAdjustedAngleArcRadius,
    strokeAdjustedAngleLabelRelativePosition,
    thinAngleLabelPosition,
    strokeAdjustedAngleLabelPosition,
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
