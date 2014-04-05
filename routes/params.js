var _ = require('underscore');

module.exports = {

  version: function (req, res, next, version) {
    req.version = version;
    next();
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
