const PYODIDE_VERSION = '314.0.0';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v314.0.0/full/pyodide.mjs';

const CHECKER_PYTHON = String.raw`
import json
import re
from sympy import Float, Integer, Rational, Symbol, cancel, simplify
from sympy.parsing.sympy_parser import convert_xor, parse_expr, standard_transformations

TRANSFORMATIONS = standard_transformations + (convert_xor,)
SAFE_GLOBALS = {
    "__builtins__": {},
    "Float": Float,
    "Integer": Integer,
    "Rational": Rational,
}


def normalize_ratio_input(value):
    text = str(value).strip().lower()
    text = re.sub(r"\s+", "", text)
    text = text.replace("÷", "/").replace(":", "/")
    text = re.sub(r"\\+(?:dfrac|tfrac|frac)\{([a-z])\}\{([a-z])\}", r"(\1)/(\2)", text)
    text = text.replace("{", "(").replace("}", ")")
    return text


def parse_ratio_expression(value, allowed_symbols):
    expression = normalize_ratio_input(value)
    if not expression:
        raise ValueError("empty expression")
    if not re.fullmatch(r"[a-z0-9+\-*/^().]+", expression):
        raise ValueError("unsupported characters")

    symbols = {name: Symbol(name) for name in allowed_symbols}
    expression_symbols = set(re.findall(r"[a-z]", expression))
    if not expression_symbols.issubset(symbols):
        raise ValueError("unsupported symbol")

    return parse_expr(
        expression,
        local_dict=symbols,
        global_dict=SAFE_GLOBALS,
        transformations=TRANSFORMATIONS,
        evaluate=True,
    )


def check_ratio_json(payload_json):
    payload = json.loads(payload_json)
    allowed_symbols = payload.get("allowedSymbols", [])
    user_expression = parse_ratio_expression(payload.get("userAnswer", ""), allowed_symbols)
    expected_expression = parse_ratio_expression(payload.get("expectedAnswer", ""), allowed_symbols)
    difference = cancel(user_expression - expected_expression)
    return json.dumps({
        "correct": bool(simplify(difference) == 0),
        "checker": "sympy",
        "normalizedUser": str(user_expression),
        "normalizedExpected": str(expected_expression),
    })
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
