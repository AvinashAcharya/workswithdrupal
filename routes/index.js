
var config = require(__dirname + '/../config.js');

var render = function (req, res, view, data) {
  if (req.is('json')) {
    res.send(data);
  } else {
    res.render(view, data)
  }
};

module.exports = {

  index: function (req, res) {
    res.render('index', {
      versions: config.drupalVersions,
      current: config.currentDrupalVersion
    });
  },

  formRedirect: function (req, res) {
    res.redirect([req.body.version, req.body.module].join('/'));
  },

  module: function (req, res) {
    render(req, res, 'module', req.module);
  }
}
