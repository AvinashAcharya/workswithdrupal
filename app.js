var server = require(__dirname + '/server.js');
var config = require(__dirname + '/config.js');

server.start(config, function (err) {
  console.log('Express server listening on port ' + server.app.get('port'));
});
