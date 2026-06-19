# trigonometric_functions

Interactive HTML quiz for practicing sine, cosine, and tangent on right triangles. The triangle path generates random labeled right triangles, supports configurable right-angle markers, and currently compares five geometry rendering approaches.

## Live Version

The public version is intended to be available through GitHub Pages:

<https://georg184.github.io/trigonometric_functions/>

## Project Structure

- `index.html`: the main document structure and external file references
- `css/styles.css`: the app styling
- `js/mathjax-config.js`: MathJax configuration
- `js/vendor/geometry-angle-layout.js`: vendored copy of `ggprojects/shared/geometry-angle-layout.js` for public GitHub Pages use
- `js/app.js`: the quiz logic, random task generation, answer checking, and geometry renderers

## Vendored Shared Code

`js/vendor/geometry-angle-layout.js` is copied from the local shared helper:

`/mnt/data/sync/software/HTML/ggprojects/shared/geometry-angle-layout.js`

Current vendored helper version: `0.2.0`.

When the shared helper changes, copy the updated file into `js/vendor/` and commit the project copy so GitHub Pages can serve it publicly.

The current right-triangle angle arcs and angle-label positions use the calibrated helper data from `angle-label-tuning-v6`.

## Cache And Version Safety

The page uses a shared app version in three places:

- `window.GG_APP_VERSION` in `index.html`
- `?v=...` query strings on every local CSS/JS/vendor asset
- `APP_VERSION` at the top of `js/app.js`

Whenever `index.html`, local CSS, local JavaScript, `js/mathjax-config.js`, or `js/vendor/geometry-angle-layout.js` changes, update all three places together and keep the visible version badge current. This prevents GitHub Pages or browser caches from mixing old JavaScript with new HTML.

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
