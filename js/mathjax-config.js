window.MathJax = {
  loader: { load: ['[tex]/html', '[tex]/ams'] },
  chtml: {
    scale: 1,
    matchFontHeight: false
  },
  tex: {
    packages: { '[+]': ['html', 'ams'] },
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
