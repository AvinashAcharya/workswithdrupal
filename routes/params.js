var _ = require('underscore');

module.exports = {

  version: function (req, res, next, version) {
    req.version = version;
    next();
  },

  module: function (req, res, next, module) {

    var data = {
      version: req.params.version,
      module: req.params.module
    };

    req.drupal.module(data.module, function (err, name, versions) {

      if (err) {
        return next(err);
      }

      data.name = name;
      data.versions = versions;
      req.module = new Module(data);

      next();
    });
  },

  modules: function (req, res, next, modules) {

    var modules = modules.split('+');
    var todo = modules.length;

    req.modules = {};

    modules.forEach(function (machineName) {

      var machineName = machineName.trim().toLowerCase();

      if (!machineName.length) {
        todo--;
        return;
      }

      req.drupal.getModule(machineName, function (err, drupalModule) {
        req.modules[machineName] = drupalModule;
        todo--;
        if (!todo) {
          req.modules = _.sortBy(req.modules, 'name');
          next();
        }
      }.bind(this));
    });
  }
}
