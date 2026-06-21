# trigonometric_functions

Interactive HTML quiz for practicing sine, cosine, and tangent on right triangles. The triangle path generates random labeled right triangles, supports configurable right-angle markers, and renders the drawing with inline SVG plus HTML/MathJax labels.

## Live Version

The public version is intended to be available through GitHub Pages:

<https://georg184.github.io/trigonometric_functions/>

## Project Structure

- `index.html`: the main document structure and external file references
- `css/styles.css`: the app styling
- `js/mathjax-config.js`: MathJax configuration
- `js/vendor/geometry-angle-layout.js`: vendored copy of `ggprojects/shared/geometry-angle-layout.js` for public GitHub Pages use
- `js/app.js`: the quiz logic, random task generation, answer checking, and the SVG/MathJax geometry renderer

## Rendering Architecture

The app intentionally uses a single geometry renderer:

- triangle geometry and angle markers are drawn as inline SVG
- side labels and angle labels are positioned as HTML overlays and rendered with MathJax
- reusable angle arc, right-angle marker, and angle-label placement logic comes from `js/vendor/geometry-angle-layout.js`

Older comparison renderers using JSXGraph, D3, and GeoGebra were removed. Do not reintroduce those dependencies unless the app explicitly needs a new rendering comparison mode. For the current quiz workflow, MathJax is the only external runtime dependency; local app assets remain cache-busted with `GG_APP_VERSION`.

## Runtime Behavior Notes

Dynamic MathJax content in `js/app.js` is intentionally routed through a small serialized render queue. Future changes that replace the task question, solution, or triangle label surface should keep using the existing queue helpers instead of calling `MathJax.typesetPromise()` directly. Clear MathJax state with `typesetClear` before removing or replacing dynamic DOM nodes; otherwise MathJax can retain detached internal math items during longer quiz sessions.

The triangle quiz treats each task as an answered-before-next workflow. `Nächste Aufgabe` is disabled when a new task is created and is enabled only after the submitted answer has been checked. Keep that behavior unless the app deliberately changes from quiz mode to free practice mode.

The `am Einheitskreis` entry is currently a placeholder by design. Do not add partial unit-circle behavior unless that path is implemented as a complete workflow.

## Vendored Shared Code

`js/vendor/geometry-angle-layout.js` is copied from the local shared helper:

`/mnt/data/sync/software/HTML/ggprojects/shared/geometry-angle-layout.js`

Current vendored helper version: `0.4.4`.

When the shared helper changes, copy the updated file into `js/vendor/` and commit the project copy so GitHub Pages can serve it publicly.

The current right-triangle angle arcs and angle-label positions use the calibrated helper data from `angle-label-tuning-v21`. The app calls `calibratedAngleMarker()`, which first computes thin/reference-line angle-label values and then analytically adjusts the rendered arc radius and label position for the triangle side and angle-arc stroke widths.

## Cache And Version Safety

The page uses a shared app version in three places:

- `window.GG_APP_VERSION` in `index.html`
- `?v=...` query strings on every local CSS/JS/vendor asset
- `APP_VERSION` at the top of `js/app.js`

Whenever `index.html`, local CSS, local JavaScript, `js/mathjax-config.js`, or `js/vendor/geometry-angle-layout.js` changes, update all three places together and keep the visible version badge current. This prevents GitHub Pages or browser caches from mixing old JavaScript with new HTML.

## Verification

Useful local checks after runtime changes:

```bash
node --check js/app.js
node --check js/mathjax-config.js
node --check js/vendor/geometry-angle-layout.js
```

For browser checks, start a local static server and verify:

- the intro screen opens
- the right-triangle quiz starts
- `Nächste Aufgabe` is disabled before an answer and enabled after answer checking
- exactly one triangle rendering is visible
- SVG geometry and five MathJax labels are present
- both right-angle marker modes work
- answer checking and the next-task flow work
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
