# trigonometric_functions

Interactive HTML quiz for practicing sine, cosine, and tangent on right triangles. The triangle path generates random labeled right triangles, asks both function-to-side-ratio and side-ratio-to-function questions, supports configurable right-angle markers, and renders the drawing with inline SVG plus HTML/MathJax labels.

## Live Version

The public version is intended to be available through GitHub Pages:

<https://georg184.github.io/trigonometric_functions/>

## Project Structure

- `index.html`: the main document structure and external file references
- `css/styles.css`: the app styling
- `js/mathjax-config.js`: MathJax configuration
- `js/vendor/geometry-angle-layout.js`: vendored copy of `ggprojects/shared/geometry-angle-layout.js` for public GitHub Pages use
- `js/sympy-worker.js`: module web worker that loads Pyodide/SymPy from a pinned CDN URL and checks answers in the browser
- `js/app.js`: the quiz logic, random task generation, answer checking, and the SVG/MathJax geometry renderer
- `scripts/verify-answer-checker.js`: regression tests for SymPy checking and the conservative infrastructure fallback
- `scripts/verify-task-flow.js`: regression tests for answer scoring and the complete ten-question round workflow
- `scripts/verify-localization.js`: static fallback and pre-start language-state regression tests
- `scripts/verify-angle-layout-consumer.js`: static consumer, cache, MathJax, and calibrated render-profile contract checks
- `scripts/verify-javascript-syntax.js`: recursive syntax checking for every local JavaScript file
- `SUPABASE_VARIANTS.md`: deferred architecture notes for optional login, registration, and online highscores

## Rendering Architecture

The app intentionally uses a single geometry renderer:

- triangle geometry and angle markers are drawn as inline SVG
- side labels and angle labels are positioned as HTML overlays and rendered with pinned MathJax `3.2.2` CommonHTML output
- reusable angle arc, right-angle marker, and angle-label placement logic comes from `js/vendor/geometry-angle-layout.js`

Older comparison renderers using JSXGraph, D3, and GeoGebra were removed. Do not reintroduce those dependencies unless the app explicitly needs a new rendering comparison mode. For the current quiz workflow, MathJax and the pinned Pyodide/SymPy worker load are the external runtime dependencies; local app assets remain cache-busted with `GG_APP_VERSION`.

## Runtime Behavior Notes

Dynamic MathJax content in `js/app.js` is intentionally routed through a small serialized render queue. Future changes that replace the task question, solution, or triangle label surface should keep using the existing queue helpers instead of calling `MathJax.typesetPromise()` directly. Clear MathJax state with `typesetClear` before removing or replacing dynamic DOM nodes; otherwise MathJax can retain detached internal math items during longer quiz sessions.

Answer checking is client-side. `js/app.js` starts `js/sympy-worker.js` as a module worker with a versioned local URL, and the worker loads pinned Pyodide/SymPy assets from jsDelivr. Keep symbolic checking inside the worker so Pyodide and SymPy do not block the UI thread. The browser and worker both enforce the 160-character answer limit. Before symbolic evaluation, the worker parses without evaluation and rejects expressions with more than 64 SymPy nodes, more than eight nested parenthesis levels, non-literal exponents, or integer exponents outside `-12` through `12`. Side-ratio answers are restricted to the current side symbols, numbers, arithmetic operators, parentheses, division variants, and simple LaTeX fractions. Side-ratio-to-function answers accept `sin`, `cos`, `tan`, reciprocals such as `1/tan(alpha)`, and the generated angle names and aliases. The worker converts valid trig expressions back to side ratios before comparing them symbolically. User syntax, validation, and unsupported-expression errors must return a normal result with `correct: false` and `invalidInput: true`; they must never activate the infrastructure fallback. When the worker is genuinely unavailable, the exact fallback accepts only conservatively validated canonical side ratios and trig expressions. A 45-second request timeout terminates the busy worker, resolves every request assigned to it through that safe fallback, and immediately creates a fresh worker for later questions.

The triangle quiz currently generates side-ratio-to-function questions with 50% probability. For those questions, 20% use a ratio that is the reciprocal of one of the generated `sin`, `cos`, or `tan` expressions. The app shows the two acute angle names and insertion buttons for trig-expression answers; keep that helper tied to side-ratio-to-function tasks so ordinary side-ratio answers stay uncluttered.

The triangle quiz runs in fixed rounds of 10 questions. A new round first shows the first triangle and a visible `Zeit: 00:00` counter, but the question and answer input stay hidden until the user presses `Start`. The timer starts only at that point and stops on the result screen. Each task is a one-score workflow. `Nächste Aufgabe` is available immediately after `Start`. If the current task has not been checked yet, moving on scores that task as incorrect and advances to the next task. While an answer check is running, `Nächste Aufgabe` is temporarily disabled to avoid racing the in-flight worker result. After question 10, the app shows a local round result with points and elapsed time and offers either `Neues Quiz starten` or `Zur Startseite`. No round results are persisted yet.

The quiz can be left through `Zur Startseite` without resetting the current task or score. Returning to `am rechtwinkligen Dreieck` resumes the in-memory quiz state; a full page reload starts fresh.

The `am Einheitskreis` entry is currently a placeholder by design. Do not add partial unit-circle behavior unless that path is implemented as a complete workflow.

## Language Maintenance

The app is trilingual (`de`, `en`, `fr`). Unless a request explicitly limits a change to one language, every user-visible text change must be made synchronously in all three languages. Keep static HTML fallback text and the corresponding entries in the `TEXT` object in `js/app.js` aligned.

When changing labels, button text, titles, placeholders, ARIA labels, feedback, result text, or MathJax explanation text, update all language variants in the same commit. Verification should include switching the language selector and checking the affected UI in each language.

## Vendored Shared Code

`js/vendor/geometry-angle-layout.js` is copied from the local shared helper:

`/mnt/data/sync/software/HTML/ggprojects/shared/geometry-angle-layout.js`

Current vendored helper version: `0.4.28`.

When the shared helper changes, run `node shared/angle-label-contract-tool.js --write` from the parent workspace and commit the synchronized project copy so GitHub Pages can serve it publicly. Do not edit the vendored helper manually. The non-writing `--check` mode must pass before deployment.

The current right-triangle angle arcs and angle-label positions use the calibrated helper data from `angle-label-tuning-v35`. The helper starts with a softly name-normalized class baseline and adds a guarded exact-label residual correction when enough matching label samples are nearby. Class rows are normalized by name with exponent `0.25`, so the heavily sampled `alpha` cannot dominate the class merely through collection frequency. Raw geometric weights are also multiplied by the sample-provenance factor (`known: 1.00`, recorded `estimated-*`: `0.90`) before interpolation. A separately capped, quality-adjusted effective sample size controls the residual blend, so neither an isolated sample nor low-confidence support can activate the maximum correction. Based on global evidence, `alpha` currently receives model strength `1` and can reach own-label blend `0.97`; `beta` and `gamma` remain partially pooled at maximum `0.85`. The app calls `calibratedAngleMarkerFromRays()` with `coordinateSystem: 'svg'` and explicit `angleMode: 'minor'`, which normalizes SVG ray endpoints to the smaller calibrated mathematical counterclockwise opening, computes thin/reference-line angle-label values, and then analytically adjusts the rendered arc radius and label position for the triangle side and angle-arc stroke widths. Positive label offset is always mathematical counterclockwise; the helper performs the required SVG sign conversion. The SVG renderer uses the `arcPath` returned by that same marker so the arc and label cannot diverge in ray order or angle mode. The general helper default is `angleMode: 'directed'`, which preserves ray order and includes reflex angles; this triangle app intentionally overrides that default.

The angle labels also obey the helper's calibration render profile `mathjax-3.2.2-chtml-tex-scale1-css-px-v1`. The app independently declares this id and verifies it with `assertAngleLabelRenderProfile()`. MathJax is pinned to `3.2.2`, uses CommonHTML with `scale: 1` and `matchFontHeight: false`, and the selected label-size value is passed to the helper and assigned directly to every rendered angle and side label. The display settings offer exact `18px`, `22px`, and `26px` sizes for both label types, with `22px` as the default; side labels are placed `22px` outward from their side midpoint. The MathJax container inherits the exact selected pixel size and uses container font weight `900` for angle labels, line height `1`, and center anchoring. Do not replace calibrated angle-label sizing with `rem`, `em`, `clamp()`, or viewport-relative units. A renderer, version, scale, font-metric, or label-box CSS change requires a new render profile and visual regression validation.

The app independently pins helper `0.4.28`, calibration `angle-label-tuning-v35`, and data cloud `angle-label-data-cloud-v24` in `EXPECTED_ANGLE_LAYOUT_CONTRACT`. `assertAngleLabelCalibrationContract()` runs before quiz generation, so a stale vendored helper fails explicitly rather than silently using a different model. All exported helper calibration structures are deeply frozen, including nested sample labels, class members, and compact calibration pairs; application code must copy them before attempting local edits. The helper clamps only data-based label-style lookup to 10–350 degrees; rendered stroke correction always uses the actual ray opening. Explicit label font sizes must be positive finite numbers, and discrete arc step counts must be positive integers. The quiz itself currently generates acute angles from 24 to 66 degrees.

GitHub Pages runs the recursive JavaScript syntax check, answer-checker regressions, ten-question task-flow tests, localization regressions, and `verify-angle-layout-consumer.js` before packaging the site. The localization check validates static German fallbacks, translated version-mismatch text, and language-state updates before a round starts. The consumer check compares the app expectation with the vendored helper; validates every static asset cache token and the versioned module-worker URL; and enforces the pinned MathJax CommonHTML URL, configuration, exact-pixel label sizing, transparent label CSS, font weight, line height, and center anchoring. Deployment is rejected on any drift.

## Cache And Version Safety

The page uses a shared app version in three places:

- `window.GG_APP_VERSION` in `index.html`
- `?v=...` query strings on every local CSS/JS/vendor asset
- `APP_VERSION` at the top of `js/app.js`

Whenever `index.html`, local CSS, local JavaScript, `js/mathjax-config.js`, `js/sympy-worker.js`, or `js/vendor/geometry-angle-layout.js` changes, update all three places together and keep the visible version badge current. This prevents GitHub Pages or browser caches from mixing old JavaScript with new HTML. The worker is not loaded from `index.html`, but `js/app.js` must create it with the same `?v=${APP_VERSION}` token.

## Verification

Useful local checks after runtime changes:

```bash
node scripts/verify-javascript-syntax.js
node scripts/verify-answer-checker.js
node scripts/verify-task-flow.js
node scripts/verify-localization.js
node scripts/verify-angle-layout-consumer.js
```

`verify-answer-checker.js` requires Python with SymPy `1.14.0`; set the
`PYTHON` environment variable when the desired interpreter is not available as
`python3`. The GitHub Pages workflow installs this pinned test dependency.

For browser checks, start a local static server and verify:

- the intro screen opens
- the right-triangle quiz starts
- before pressing `Start`, the first triangle and timer are visible, but the question and answer input are hidden
- pressing `Start` reveals the first question and starts the visible timer
- `Nächste Aufgabe` is available before an answer, and skipping an unanswered task adds one answered question with no point
- a round ends after 10 scored questions and shows the local result as points out of 10 plus elapsed time
- the result screen offers both `Neues Quiz starten` and `Zur Startseite`
- the language selector updates the affected UI consistently in German, English, and French
- exactly one triangle rendering is visible
- SVG geometry and five MathJax labels are present
- the display settings offer `18px`, `22px`, and `26px` label sizes, default to `22px`, and update both angle and side labels together
- angle labels contain `data-angle-label-render-profile="mathjax-3.2.2-chtml-tex-scale1-css-px-v1"`, use CommonHTML rather than nested SVG output, and have the exact selected CSS-pixel font size
- side labels have the same exact selected font size and remain clearly separated from their triangle sides at the configured `22px` center-line offset
- both right-angle marker modes work
- answer checking and the next-task flow work
- `Zur Startseite` returns to the intro screen without clearing the current score, and reopening the right-triangle quiz resumes the same in-memory round
- equivalent symbolic answers such as `a:c`, `\frac{a}{c}`, `2*a/(2*c)`, and `a*c/c^2` are accepted when they match the expected ratio
- side-ratio-to-function tasks accept equivalent trig expressions such as `sin(alpha)`, `cos(beta)`, or `1/tan(alpha)` when they match the displayed ratio
- side-ratio-to-function tasks show the two acute angle names and clicking an angle helper inserts the typed angle name
- wrong answers show the red feedback text `Falsch.`
- rapid answer/next/resize interactions do not create duplicate SVGs, duplicate labels, overlapping MathJax render jobs, or detached MathJax items
- no horizontal page overflow appears around desktop, tablet, and phone widths

Useful MathJax leak probe for browser-console checks after many task changes:

```js
(() => {
  const list = MathJax.startup.document.math.list;
  let count = 0;
  let detached = 0;
  for (let item = list.next; item !== list; item = item.next) {
    count += 1;
    const start = item.data && item.data.start && item.data.start.node;
    const end = item.data && item.data.end && item.data.end.node;
    const attached = Boolean((start && start.isConnected) || (end && end.isConnected));
    if (!attached) detached += 1;
  }
  return { count, detached };
})()
```

The expected `detached` value is `0` after normal repeated task changes.

## Local Workflow

The project can be edited locally and then transferred to GitHub with Git.

```bash
git status
git add .
git commit -m "Briefly describe the change"
git push
```

## Useful `gh` Commands

When GitHub CLI is logged in, these commands are useful in day-to-day work:

```bash
gh auth status
gh repo view georg184/trigonometric_functions --web
gh browse
```

## GitHub Pages

The project is published with the GitHub Actions workflow in `.github/workflows/deploy-pages.yml`. After each `git push`, the workflow uploads the static files and deploys them to GitHub Pages.
