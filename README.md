# trigonometric_functions

Interactive HTML quiz for practicing sine, cosine, and tangent on right triangles.

## Live Version

The public version is intended to be available through GitHub Pages:

<https://georg184.github.io/trigonometric_functions/>

## Project Structure

- `index.html`: the main document structure and external file references
- `css/styles.css`: the app styling
- `js/mathjax-config.js`: MathJax configuration
- `js/app.js`: the quiz logic, random task generation, answer checking, and triangle canvas rendering

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
