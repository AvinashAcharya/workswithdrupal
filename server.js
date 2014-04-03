var http = require('http');
var express = require('express');
var slash = require('express-slash');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;

var routes = require(__dirname + '/routes');
var params = require(__dirname + '/routes/params');
var WorksWithDrupal = require(__dirname + '/modules/workswithdrupal.js');

var server;
var app = express();

function start (config, cb, drupal) {

  var versions = config.drupalVersions.sort();
  var versionRange = versions[0] + '-' + versions[versions.length-1];

  if (!drupal) {

    MongoClient.connect(
      'mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.db,
      function mongoConnect(err, db) {
        if (err) throw err;
        start(config, cb, new WorksWithDrupal(db));
      }
    );

  } else {

    app.use(function (req, res, next) {
      req.drupal = drupal;
      next();
    });

    app.set('port', process.env.PORT || config.port);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon('public/favicon.ico'));

    // TODO: restore express.bodyParser() once express has been updated to use
    // connect 3.0
    // app.use(express.bodyParser());
    app.use(express.urlencoded())
    app.use(express.json())

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
    app.get('/about', routes.about);
    app.get('/statistics', routes.statistics);
    app.get('/:version([' + versionRange + '])', routes.index);
    app.post('/', routes.formRedirect);
    app.get('/:version([' + versionRange + '])/:modules([0-9a-z_+]+)', routes.modules);

    server = http.createServer(app);
    server.listen(app.get('port'), cb);
  }
}

function close(cb) {
  server.close(cb);
}

module.exports.app = app;
module.exports.start = start;
module.exports.close = close;
