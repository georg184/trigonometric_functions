window.MathJax = {
  loader: { load: ['[tex]/html', '[tex]/ams', '[tex]/boldsymbol'] },
  chtml: {
    scale: 1,
    matchFontHeight: false
  },
  tex: {
    packages: { '[+]': ['html', 'ams', 'boldsymbol'] },
    macros: {
      param: ['{\\class{param-blue}{#1}}', 1]
    }
  },
  options: {
    renderActions: {
      addMenu: []
    }
  }
};
