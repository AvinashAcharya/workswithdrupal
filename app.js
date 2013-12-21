
var express = require('express');
var http = require('http');
var slash = require('express-slash');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;

var config = require(__dirname + '/config.js');
var routes = require(__dirname + '/routes');
var params = require(__dirname + '/routes/params');
var WorksWithDrupal = require(__dirname + '/modules/workswithdrupal.js');
var cronJob = require('cron').CronJob;

var app = express();

MongoClient.connect('mongodb://127.0.0.1:27017/drupal', function mongoConnect(err, db) {

  if (err) throw err;

  var drupal = new WorksWithDrupal(db);

  app.use(function (req, res, next) {
    req.drupal = drupal;
    next();
  });

  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon('public/favicon.ico'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(slash());
  app.use(express.compress());
  app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 * 365 }));

  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
    app.use(express.logger('dev'));
  }

  app.use(function (err, req, res, next) {
    // TODO: friendly html error messages
    res.send((err.code || 500), err.message);
  });

  app.param('version', params.version);
  app.param('module', params.module);
  app.param('modules', params.modules);

  app.get('/', routes.index);
  app.get('/:version([6-9])', routes.index);
  app.post('/', routes.formRedirect);
  app.get('/:version([6-9])/:modules([0-9a-z_+]+)', routes.modules);

  http.createServer(app).listen(app.get('port'), function createServer() {
    console.log('Express server listening on port ' + app.get('port'));
  });

  // new cronJob('0 0 * * * *', function () {
  //   drupal.precache(function (err) {
  //     if (err) console.error(err);
  //     console.log('precached modules.');
  //     process.exit();
  //   });
  // }, null, true, config.timezone);
});
