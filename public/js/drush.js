
var drush = (function () {

  'use strict';

  return {

    isPmList: function (text) {
      return /Package\s+Name\s+Type\s+Status\s+Version/.test(text.trim())
    },

    parsePmList: function (text) {

      var modules = [];
      var exp = new RegExp(/\(([a-z_]+?)\)\s+Module/g);
      var match;

      do {
        match = exp.exec(text);
        if (match) {
          modules.push(match[1]);
        }
      } while (match !== null);

      return modules;
    },

    parseModules: function (text, cb) {

      var modules = [];

      if (this.isPmList(text)) {
        modules = this.parsePmList(text);
      } else {

        text.split('\n').forEach(function (module) {

          // TODO: strip any non [a-z_] chars
          var module = module.trim().toLowerCase();

          if (module.length) {
            modules.push(module);
          }
        });
      }

      cb(modules);
    },

    modulesToUrl: function (modules) {
      return (modules.length > 1) ? modules.join('+') : modules[0];
    }
  }

})();

if (module && module.exports) module.exports = drush;
