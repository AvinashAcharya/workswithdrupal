
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var redis = require('redis');
var client = redis.createClient();

var USER_AGENT = 'WorksWithDrupal/0.1.0alpha';
var coreModules = [];

var cache = {

  prefix: 'drupal:',

  get: function (key, cb) {
    client.get(this.prefix + key, function (err, data) {
      cb(err, JSON.parse(data));
    });
  },

  set: function (key, value, cb) {
    client.set(this.prefix + key, JSON.stringify(value), function (err, result) {
      cb(err, result);
    });
  }
};

client.on('error', function (err) {
  console.log('Redis error ' + err);
});

function loadCoreModules(cb) {

  cache.get('coremodules', function (err, modules) {

    if (err) return cb(err);
    if (_.size(modules)) {
      return cb(null, modules);
    }

    var options = {
      url: 'https://drupal.org/node/1283408',
      headers: { 'User-Agent': USER_AGENT }
    };

    request(options,  function (err, res, body) {

      if (err) return cb(err);

      var $ = cheerio.load(body, { ignoreWhitespace: true });
      var modules = {};

      $('table:nth-child(3), table:nth-child(5)').each(function () {

        var codes = $(this).find('tbody tr code');
        codes.each(function (i) {
          var code = $(this);
          var machine_name = code.text();
          modules[machine_name] = {
            machine_name: machine_name,
            versions: code.closest('tr').prev().find('td:nth-child(4)').text().match(/\d/g)
          };
        });
      });

      cache.set('coremodules', modules, function (err, reply) {
        cb(err, modules);
      });
    });
  });
};

function checkModule(module, cb) {

  var cacheKey = 'module:' + module;

  cache.get(cacheKey, function (err, cached) {

    if (err) return cb(err);
    if (cached && cached.name.length && cached.supported.length) {
      return cb(null, cached.name, cached.supported)
    }

    var supported = [];
    var options = {
      url: 'https://drupal.org/project/' + module,
      headers: { 'User-Agent': USER_AGENT }
    };

    if (coreModules.hasOwnProperty(module)) {
      supported = coreModules[module].versions;
    }

    request(options, function (err, res, body) {

      var $ = cheerio.load(body, { ignoreWhitespace: true });
      var name = $('h1').text();
      var versions = $('.view-project-release-download-table td.views-field-field-release-version');

      if (err) {
        return cb(err);
      }

      if (res.statusCode === 404) {
        var error = new Error('Module "' + module + '" not found.');
        error.code = 404;
        return cb(error);
      }

      // sometimes drupal.org errors with a HTTP 200...
      if (name.match('Additional uncaught')) {
        return cb(new Error('Drupal.org error, try again'));
      }

      if (res.statusCode !== 200) {
        return cb(new Error('Recieved bad HTTP response: ' + res.statusCode));
      }

      versions.each(function () {
        var version = $(this).text()[0];
        if (supported.indexOf(version) === -1) {
          supported.push(version);
        }
      });

      cache.set(cacheKey, { name: name, supported: supported }, function (err, result) {
        if (err) return cb(err);
        cb(null, name, supported);
      });
    });
  });
}

module.exports = function (module, cb) {

  if (!_.size(coreModules)) {

    console.log('loading drupal core modules');

    loadCoreModules(function (err, modules) {

      console.log(_.size(modules) + ' drupal core modules loaded');

      coreModules = modules;
      checkModule(module, cb);
    });
  } else {
    checkModule(module, cb);
  }
};
