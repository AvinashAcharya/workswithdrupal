var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var favicon = require('static-favicon');
var methodOverride = require('method-override');
var compression = require('compression');
var errorhandler = require('errorhandler');
var morgan  = require('morgan');
var slash = require('express-slash');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;

var routes = require(__dirname + '/routes');
var params = require(__dirname + '/routes/params');
var WorksWithDrupal = require(__dirname + '/modules/workswithdrupal.js');

var server;
var app = express();

function start (config, cb, drupal) {

  var versions, versionRange;
  var router = express.Router();

  if (!drupal) {

    MongoClient.connect(
      'mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.db,
      function mongoConnect(err, db) {
        if (err) throw err;
        start(config, cb, new WorksWithDrupal(db));
      }
    );

  } else {

    drupal.getVersions(function (err, versions) {

      versionRange = versions[0] + '-' + versions[versions.length-1];

      app.use(function (req, res, next) {
        req.drupal = drupal;
        next();
      });

      app.set('port', process.env.PORT || config.port);
      app.set('views', __dirname + '/views');
      app.set('view engine', 'jade');
      app.use(favicon('public/favicon.ico'));
      app.use(bodyParser());
      app.use(methodOverride());
      // app.use(slash());
      app.use(compression());
      app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 * 365 }));

      if ('development' == app.get('env')) {
        app.use(errorhandler());
        app.use(morgan('dev'));
      }

      app.use(function (err, req, res, next) {
        // TODO: friendly html error messages
        res.send((err.code || 500), err.message);
      });

      router.param('version', params.version);
      router.param('modules', params.modules);

      router.get('/', routes.index);
      router.post('/', routes.formRedirect);
      router.get('/about', routes.about);
      router.get('/statistics', routes.statistics);
      router.get('/:version([' + versionRange + '])', routes.index);
      router.get('/:version([' + versionRange + '])/:modules([0-9a-z_+]+)', routes.modules);

      app.use('/', router);

      server = http.createServer(app);
      server.listen(app.get('port'), cb);

      app.on('error', function (err) {
        console.error(err);
      });

      server.on('error', function (err) {
        console.error(err);
      });
    });
  }
}

function close(cb) {
  server.close(cb);
}

module.exports.app = app;
module.exports.start = start;
module.exports.close = close;

process.on('uncaughtException', function (err) {
  console.error('uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
});
