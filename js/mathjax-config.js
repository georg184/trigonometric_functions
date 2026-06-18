window.MathJax = {
  loader: { load: ['[tex]/html', '[tex]/ams'] },
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
