
var redis = require('redis');
var client = redis.createClient();
var _ = require('underscore');
var workswithdrupal = require(__dirname + '/../modules/workswithdrupal.js');
var todo = 2;

var done = function () {
  todo--;
  if (!todo) process.exit();
}

client.flushdb();

workswithdrupal.loadCoreModules( function (err, count) {
  if (err) console.error(err);
  console.log(count + ' drupal core modules loaded');
  done();
});

workswithdrupal.loadPopularModules(function (err, modules) {
  console.log(_.size(modules) + ' popular modules loaded');
  done();
});
