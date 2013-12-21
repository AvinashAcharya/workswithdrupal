var _ = require('underscore');
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
      current: req.version || config.currentDrupalVersion
    });
  },

  formRedirect: function (req, res) {
    var modules = req.body.module.split(/[\r\n]+/);
    // TODO: trim / lowercase / sanitise module strings
    res.redirect(req.body.version + '/' + modules.join('+'));
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
