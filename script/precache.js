
var util = require('util');
var WorksWithDrupal = require(__dirname + '/../modules/workswithdrupal.js');
var MongoClient = require('mongodb').MongoClient;

// TODO: load mongo connection from config

MongoClient.connect('mongodb://127.0.0.1:27017/drupal', function (err, db) {

  if (err) throw err;

  var drupal = new WorksWithDrupal(db);

  drupal.precache(function () {
    util.log('done.');
    process.exit();
  });
});
