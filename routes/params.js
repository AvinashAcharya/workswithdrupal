
var workswithdrupal = require(__dirname + '/../modules/workswithdrupal.js');

function Module(data) {
  this.version = data.version;
  this.module = data.module;
  this.name = data.name;
  this.versions = data.versions;
  this.works = this.versions.indexOf(data.version) > -1;
}

module.exports = {

  module: function (req, res, next, module) {

    var data = {
      version: req.params.version,
      module: req.params.module
    };

    workswithdrupal.module(data.module, function (err, name, versions) {

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

    modules.forEach(function (module) {

      var module = module.trim().toLowerCase();

      if (!module.length) {
        todo--
        return;
      }

      workswithdrupal.module(module, function (err, name, versions) {

        req.modules[module] = (err) ? { err: err } : new Module({
          module: module,
          name: name,
          version: req.params.version,
          versions: versions
        });

        todo--;
        if (!todo) {
          next();
        }
      }.bind(this));
    });
  }
}
