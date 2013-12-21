
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
    }
  }

})();
