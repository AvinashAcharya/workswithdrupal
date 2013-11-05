
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var workswithdrupal = require(__dirname + '/modules/workswithdrupal.js');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
  app.use(express.logger('dev'));
}

app.use(function(err, req, res, next) {
  // TODO: friendly html error messages
  res.send((err.code || 500), err.message);
});

app.param('module', function (req, res, next, module) {

  var data = {
    version: req.params.version,
    module: req.params.module
  };

  workswithdrupal(data.module, function (err, name, versions) {

    if (err) {
      return next(err);
    }

    data.name = name;
    data.works = versions.indexOf(data.version) > -1;

    req.module = data;

    next();
  });
});

app.get('/', routes.index);
app.post('/', routes.formRedirect);
app.get('/:version([6-9])/:module', routes.module);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
