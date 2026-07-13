const PYODIDE_VERSION = '314.0.0';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v314.0.0/full/pyodide.mjs';

const CHECKER_PYTHON = String.raw`
import json
import re
from sympy import Add, Float, Integer, Mul, Pow, Rational, Symbol, cancel, cos, preorder_traversal, simplify, sin, tan
from sympy.parsing.sympy_parser import convert_xor, parse_expr, standard_transformations

TRANSFORMATIONS = standard_transformations + (convert_xor,)
MAX_EXPRESSION_INPUT_LENGTH = 160
MAX_EXPRESSION_NODES = 64
MAX_PARENTHESIS_DEPTH = 8
MAX_ABSOLUTE_INTEGER_EXPONENT = 12
SAFE_GLOBALS = {
    "__builtins__": {},
    "Add": Add,
    "Float": Float,
    "Integer": Integer,
    "Mul": Mul,
    "Pow": Pow,
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
    raw_text = str(value)
    if len(raw_text) > MAX_EXPRESSION_INPUT_LENGTH:
        raise ValueError("expression is too long")
    text = raw_text.strip().lower()
    text = re.sub(r"\s+", "", text)
    text = text.replace("÷", "/").replace(":", "/")
    text = text.replace("\\left", "").replace("\\right", "")
    text = re.sub(r"\\+(?:dfrac|tfrac|frac)\{([^{}]+)\}\{([^{}]+)\}", r"(\1)/(\2)", text)
    text = re.sub(r"\\+(sin|cos|tan)", r"\1", text)
    for latex_name, input_name in LATEX_NAME_NORMALIZATIONS:
        text = re.sub(r"\\" + latex_name + r"\b", input_name, text)
    text = text.replace("{", "(").replace("}", ")")
    if len(text) > MAX_EXPRESSION_INPUT_LENGTH:
        raise ValueError("normalized expression is too long")
    return text


def validate_expression_parentheses(expression):
    depth = 0
    for character in expression:
        if character == "(":
            depth += 1
            if depth > MAX_PARENTHESIS_DEPTH:
                raise ValueError("parenthesis nesting is too deep")
        elif character == ")":
            depth -= 1
            if depth < 0:
                raise ValueError("unbalanced parentheses")
    if depth != 0:
        raise ValueError("unbalanced parentheses")


def validate_parsed_expression(expression):
    nodes = list(preorder_traversal(expression))
    if len(nodes) > MAX_EXPRESSION_NODES:
        raise ValueError("expression is too complex")
    for node in nodes:
        if not isinstance(node, Pow):
            continue
        exponent = node.exp
        if not isinstance(exponent, Integer):
            raise ValueError("exponent must be an integer literal")
        if abs(int(exponent)) > MAX_ABSOLUTE_INTEGER_EXPONENT:
            raise ValueError("exponent is too large")


def parse_expression(value, local_symbols, allow_trig):
    expression = normalize_expression_input(value)
    if not expression:
        raise ValueError("empty expression")
    if not re.fullmatch(r"[a-z0-9+\-*/^().]+", expression):
        raise ValueError("unsupported characters")
    validate_expression_parentheses(expression)

    local_dict = dict(local_symbols)
    allowed_names = set(local_dict)
    if allow_trig:
        local_dict.update(TRIG_FUNCTIONS)
        allowed_names.update(TRIG_FUNCTIONS)

    expression_names = set(re.findall(r"[a-z]+", expression))
    if not expression_names.issubset(allowed_names):
        raise ValueError("unsupported name")

    parsed_expression = parse_expr(
        expression,
        local_dict=local_dict,
        global_dict=SAFE_GLOBALS,
        transformations=TRANSFORMATIONS,
        evaluate=False,
    )
    validate_parsed_expression(parsed_expression)
    return parsed_expression


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


def convert_trig_to_side_expression(expression, substitutions):
    converted = expression.subs(substitutions)
    if converted.has(sin, cos, tan):
        raise ValueError("unsupported trigonometric argument")
    return converted


def invalid_input_result(checker, error):
    return json.dumps({
        "correct": False,
        "checker": checker,
        "invalidInput": True,
        "errorType": type(error).__name__,
    })


def check_side_ratio(payload):
    allowed_symbols = payload.get("allowedSymbols", [])
    expected_expression = parse_side_expression(payload.get("expectedAnswer", "") or payload.get("targetRatio", ""), allowed_symbols)
    try:
        user_expression = parse_side_expression(payload.get("userAnswer", ""), allowed_symbols)
        difference = cancel(user_expression - expected_expression)
        correct = bool(simplify(difference) == 0)
    except Exception as error:
        return invalid_input_result("sympy-side-ratio", error)
    return json.dumps({
        "correct": correct,
        "checker": "sympy-side-ratio",
        "normalizedUser": str(user_expression),
        "normalizedExpected": str(expected_expression),
    })


def check_trig_expression(payload):
    allowed_symbols = payload.get("allowedSymbols", [])
    angle_definitions = payload.get("angleDefinitions", [])
    expected_expression = parse_side_expression(payload.get("targetRatio", ""), allowed_symbols)
    substitutions = build_trig_substitutions(angle_definitions, allowed_symbols)
    try:
        user_expression = parse_trig_expression(payload.get("userAnswer", ""), angle_definitions)
        user_side_expression = convert_trig_to_side_expression(user_expression, substitutions)
        difference = cancel(user_side_expression - expected_expression)
        correct = bool(simplify(difference) == 0)
    except Exception as error:
        return invalid_input_result("sympy-trig-expression", error)
    return json.dumps({
        "correct": correct,
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
