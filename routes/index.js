var _ = require('underscore');
var config = require(__dirname + '/../config.js');
var drush = require(__dirname + '/../public/js/drush.js');

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
      current: req.version || config.currentDrupalVersion
    });
  },

  formRedirect: function (req, res) {

    drush.parseModules(req.body.module, function (modules) {
      if (!modules.length) {
        // FIXME: set error flash message
        res.redirect('/');
      } else {
        res.redirect(req.body.version + '/' + drush.modulesToUrl(modules));
      }
    });
  },

  modules: function (req, res) {

    var modules = req.modules;
    var grouped = {
      work: _.filter(modules, function (m) { if (m.valid() && m.supported(req.version)) return m; }),
      dont: _.filter(modules, function (m) { if (m.valid() && !m.supported(req.version)) return m; }),
      notfound: _.filter(modules, function (m) { if (!m.valid()) return m; }),
    };
    var total = grouped.work.length + grouped.dont.length;
    var percentage = grouped.work.length ? Math.round(grouped.work.length / total * 100) : 0;

    grouped.notfound = _.sortBy(grouped.notfound, function (m) { return m.machineName; });

    render(req, res, 'modules', {
      version: req.params.version,
      modules: grouped,
      percentage: percentage
    });
  }
}
