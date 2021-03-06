var _ = require('underscore');
var config = require(__dirname + '/../config.js');
var drush = require(__dirname + '/../public/js/drush.js');

var render = function (req, res, view, data) {
  // FIXME: req.is('json') seems to not work the same in express 4.0
  var contentType = req.get('Content-Type');
  if (contentType && contentType.indexOf('json')) {
    res.json(data);
  } else {
    res.render(view, data)
  }
};

module.exports = {

  index: function (req, res) {
    req.drupal.getVersions(function (err, versions) {
      res.render('index', {
        versions: versions.reverse(),
        current: req.version || config.currentDrupalVersion
      });
    });
  },

  about: function (req, res) {
    res.render('about');
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
  },

  statistics: function (req, res) {

    var data = {};
    var reports = req.drupal.statistics();

    _.each(reports, function (report, name) {
      report(function (err, results) {
        data[name] = results;
        if (_.size(data) === _.size(reports)) {
          render(req, res, 'statistics', { statistics: data });
        }
      });
    });
  }
}
