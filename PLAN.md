# Plan: Review Findings Fixes

This plan tracks the follow-up work from the code review on 2026-06-21.

## Goals

- Prevent stale MathJax internal math items when dynamic quiz content is replaced.
- Serialize MathJax rendering so rapid task changes and resizes cannot overlap render jobs.
- Disable `Nächste Aufgabe` until the current task has been answered.
- Keep the unit-circle placeholder unchanged for now.
- Preserve the existing shared angle-geometry helper architecture.

## Progress

- Done: `Nächste Aufgabe` is disabled for a fresh task and re-enabled after answer checking.
- Done: MathJax state is cleared before dynamic solution and triangle DOM content is removed.
- Done: dynamic MathJax updates run through a serialized render queue with stale-render tokens.
- Done: app cache/version token bumped to `20260621.12`.

## Scope

Files expected to change:

- `index.html`
- `js/app.js`
- possibly `css/styles.css` only if disabled-button styling needs adjustment
- `README.md` if verification notes or behavior notes need updating

Required cache/version updates:

- bump `window.GG_APP_VERSION` in `index.html`
- bump all local asset `?v=...` query strings in `index.html`
- bump `APP_VERSION` in `js/app.js`
- update the visible `.version-badge`

## Implementation Steps

1. Add a small MathJax rendering queue in `js/app.js`.
   - Keep a module-level promise, for example `let mathRenderQueue = Promise.resolve();`.
   - Route all dynamic MathJax updates through one helper so `typesetClear`, DOM replacement, and `typesetPromise` run in order.
   - Log rendering failures as the current code does.

2. Clear MathJax state before removing dynamic DOM.
   - Before replacing the triangle renderer with `surface.innerHTML = ''`, call `MathJax.typesetClear([surface])` when available.
   - Before clearing the solution with `controls.solution.innerHTML = ''`, call `MathJax.typesetClear([controls.solution])` when available.
   - Ensure this happens before the element contents are removed, not afterwards.

3. Replace direct MathJax calls with the queued helper.
   - Update `renderMath()` so it queues the clear/set/typeset operation for one element.
   - Update `typesetElements()` or replace it with the same queued helper for the triangle label surface.
   - Keep generated LaTeX unchanged.

4. Gate the next-task flow.
   - Disable `controls.nextButton` at the start of each new task.
   - Enable `controls.nextButton` only after `submitAnswer()` has processed an answer.
   - Keep focus behavior sensible: after checking an answer, focus `Nächste Aufgabe`; after creating a new task, focus the answer input.
   - Confirm that going back to the intro and starting a new quiz resets the state correctly.

5. Leave the unit-circle placeholder as-is.
   - Do not disable or remove the `am Einheitskreis` choice in this fix.
   - Do not add new unit-circle behavior.

## Verification Checklist

Run static checks:

```bash
node --check js/app.js
node --check js/mathjax-config.js
node --check js/vendor/geometry-angle-layout.js
```

Run browser checks through a local static server:

- intro screen opens
- right-triangle quiz starts
- `Nächste Aufgabe` is disabled before an answer
- submitting a wrong answer shows feedback and enables `Nächste Aufgabe`
- submitting a correct answer shows feedback and enables `Nächste Aufgabe`
- clicking `Nächste Aufgabe` creates exactly one new SVG triangle and five labels
- both right-angle marker modes still work
- rapid repeated clicks after an answer do not create duplicate SVGs or duplicate labels
- after many task changes, MathJax internal items do not accumulate detached entries
- no horizontal overflow at phone, tablet, and desktop widths

Suggested MathJax leak probe in the browser console after many task changes:

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

Expected result: `detached` stays at `0` or near `0` after repeated task changes.

## Non-Goals

- No service worker.
- No new renderer.
- No replacement of the shared/vendor angle helper.
- No implementation of the unit-circle path.
