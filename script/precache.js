
var _ = require('underscore');
var workswithdrupal = require(__dirname + '/../modules/workswithdrupal.js');

workswithdrupal.loadCoreModules( function (err, modules) {

  if (err) console.error(err);
  else console.log(_.size(modules) + ' drupal core modules loaded');

  workswithdrupal.loadPopularModules(function (err, modules) {
    if (err) console.error(err);
    else {
      console.log('---------------------------------------------');
      console.log(_.size(modules) + ' popular modules loaded');
    }
    process.exit();
  });
});
