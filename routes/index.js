
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
    var modules = req.body.module.split(/[\r\n]+/);
    // TODO: trim / lowercase / sanitise module strings
    res.redirect(req.body.version + '/' + modules.join('+'));
  },

  modules: function (req, res) {
    render(req, res, 'modules', { version: req.params.version, modules: req.modules });
  }
}
