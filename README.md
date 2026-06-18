# trigonometric_functions

Interactive HTML applet for exploring trigonometric functions with GeoGebra, MathJax, and a unit-circle view.

## Live Version

The public version is intended to be available through GitHub Pages:

<https://georg184.github.io/trigonometric_functions/>

## Project Structure

- `index.html`: the main document structure and external file references
- `css/styles.css`: the app styling
- `js/mathjax-config.js`: MathJax configuration
- `js/app.js`: the app logic, controls, unit-circle rendering, and GeoGebra integration

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

The project is designed to be published from the `main` branch and the repository root. After each `git push`, the public site can be updated by GitHub Pages.
