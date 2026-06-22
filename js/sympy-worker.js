const PYODIDE_VERSION = '314.0.0';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v314.0.0/full/pyodide.mjs';

const CHECKER_PYTHON = String.raw`
import json
import re
from sympy import Float, Integer, Rational, Symbol, cancel, cos, simplify, sin, tan
from sympy.parsing.sympy_parser import convert_xor, parse_expr, standard_transformations

TRANSFORMATIONS = standard_transformations + (convert_xor,)
SAFE_GLOBALS = {
    "__builtins__": {},
    "Float": Float,
    "Integer": Integer,
    "Rational": Rational,
}
TRIG_FUNCTIONS = {
    "sin": sin,
    "cos": cos,
    "tan": tan,
}
LATEX_NAME_NORMALIZATIONS = [
    ("alpha", "alpha"),
    ("beta", "beta"),
    ("gamma", "gamma"),
    ("varphi", "phi"),
    ("phi", "phi"),
    ("psi", "psi"),
    ("omega", "omega"),
    ("delta", "delta"),
    ("varepsilon", "epsilon"),
    ("epsilon", "epsilon"),
    ("eta", "eta"),
]


def normalize_expression_input(value):
    text = str(value).strip().lower()
    text = re.sub(r"\s+", "", text)
    text = text.replace("÷", "/").replace(":", "/")
    text = text.replace("\\left", "").replace("\\right", "")
    text = re.sub(r"\\+(?:dfrac|tfrac|frac)\{([^{}]+)\}\{([^{}]+)\}", r"(\1)/(\2)", text)
    text = re.sub(r"\\+(sin|cos|tan)", r"\1", text)
    for latex_name, input_name in LATEX_NAME_NORMALIZATIONS:
        text = re.sub(r"\\" + latex_name + r"\b", input_name, text)
    text = text.replace("{", "(").replace("}", ")")
    return text


def parse_expression(value, local_symbols, allow_trig):
    expression = normalize_expression_input(value)
    if not expression:
        raise ValueError("empty expression")
    if not re.fullmatch(r"[a-z0-9+\-*/^().]+", expression):
        raise ValueError("unsupported characters")

    local_dict = dict(local_symbols)
    allowed_names = set(local_dict)
    if allow_trig:
        local_dict.update(TRIG_FUNCTIONS)
        allowed_names.update(TRIG_FUNCTIONS)

    expression_names = set(re.findall(r"[a-z]+", expression))
    if not expression_names.issubset(allowed_names):
        raise ValueError("unsupported name")

    return parse_expr(
        expression,
        local_dict=local_dict,
        global_dict=SAFE_GLOBALS,
        transformations=TRANSFORMATIONS,
        evaluate=True,
    )


def parse_side_expression(value, allowed_symbols):
    symbols = {str(name): Symbol(str(name)) for name in allowed_symbols}
    return parse_expression(value, symbols, False)


def angle_names_for_definition(angle_definition):
    names = [angle_definition.get("name", "")]
    names.extend(angle_definition.get("aliases", []))
    result = []
    for name in names:
        normalized_name = str(name).strip().lower()
        if normalized_name and normalized_name not in result:
            result.append(normalized_name)
    return result


def parse_trig_expression(value, angle_definitions):
    symbols = {}
    for angle_definition in angle_definitions:
        for name in angle_names_for_definition(angle_definition):
            symbols[name] = Symbol(name)
    return parse_expression(value, symbols, True)


def build_trig_substitutions(angle_definitions, allowed_symbols):
    substitutions = {}
    for angle_definition in angle_definitions:
        ratios = angle_definition.get("ratios", {})
        for name in angle_names_for_definition(angle_definition):
            angle_symbol = Symbol(name)
            for function_name, trig_function in TRIG_FUNCTIONS.items():
                ratio_expression = parse_side_expression(ratios.get(function_name, ""), allowed_symbols)
                substitutions[trig_function(angle_symbol)] = ratio_expression
    return substitutions


def convert_trig_to_side_expression(expression, angle_definitions, allowed_symbols):
    converted = expression.subs(build_trig_substitutions(angle_definitions, allowed_symbols))
    if converted.has(sin, cos, tan):
        raise ValueError("unsupported trigonometric argument")
    return converted


def check_side_ratio(payload):
    allowed_symbols = payload.get("allowedSymbols", [])
    user_expression = parse_side_expression(payload.get("userAnswer", ""), allowed_symbols)
    expected_expression = parse_side_expression(payload.get("expectedAnswer", "") or payload.get("targetRatio", ""), allowed_symbols)
    difference = cancel(user_expression - expected_expression)
    return json.dumps({
        "correct": bool(simplify(difference) == 0),
        "checker": "sympy-side-ratio",
        "normalizedUser": str(user_expression),
        "normalizedExpected": str(expected_expression),
    })


def check_trig_expression(payload):
    allowed_symbols = payload.get("allowedSymbols", [])
    angle_definitions = payload.get("angleDefinitions", [])
    user_expression = parse_trig_expression(payload.get("userAnswer", ""), angle_definitions)
    user_side_expression = convert_trig_to_side_expression(user_expression, angle_definitions, allowed_symbols)
    expected_expression = parse_side_expression(payload.get("targetRatio", ""), allowed_symbols)
    difference = cancel(user_side_expression - expected_expression)
    return json.dumps({
        "correct": bool(simplify(difference) == 0),
        "checker": "sympy-trig-expression",
        "normalizedUser": str(user_expression),
        "normalizedUserAsSides": str(user_side_expression),
        "normalizedExpected": str(expected_expression),
    })


def check_ratio_json(payload_json):
    payload = json.loads(payload_json)
    if payload.get("mode") == "trig-expression":
        return check_trig_expression(payload)
    return check_side_ratio(payload)
`;

let pyodideReadyPromise = initializePyodide();

async function initializePyodide() {
  const pyodide = await loadPyodide({
    indexURL: PYODIDE_BASE_URL,
    packages: ['sympy']
  });
  await pyodide.runPythonAsync(CHECKER_PYTHON);
  return pyodide;
}

pyodideReadyPromise
  .then(function() {
    self.postMessage({ type: 'ready' });
  })
  .catch(function(error) {
    self.postMessage({
      type: 'ready-error',
      error: error && error.message ? error.message : String(error)
    });
  });

self.addEventListener('message', async function(event) {
  const message = event.data || {};
  if (message.type !== 'check-answer') {
    return;
  }

  try {
    const pyodide = await pyodideReadyPromise;
    pyodide.globals.set('__ratio_check_payload_json', JSON.stringify(message.payload || {}));
    const resultJson = await pyodide.runPythonAsync('check_ratio_json(__ratio_check_payload_json)');
    self.postMessage({
      type: 'check-result',
      id: message.id,
      result: JSON.parse(resultJson)
    });
  } catch (error) {
    self.postMessage({
      type: 'check-result',
      id: message.id,
      error: error && error.message ? error.message : String(error)
    });
  }
});
