
var request = require('request');
var cheerio = require('cheerio');
var sleep = require('sleep');
var _ = require('underscore');
var redis = require('redis');
var client = redis.createClient();

var USER_AGENT = 'WorksWithDrupal/0.1.0alpha';

var cache = {

  prefix: 'drupal:',

  get: function (key, cb) {
    client.get(this.prefix + key, function (err, data) {
      cb(err, JSON.parse(data));
    });
  },

  set: function (key, value, cb) {
    client.set(this.prefix + key, JSON.stringify(value), function (err, result) {
      if (typeof cb === 'function') {
        cb(err, result);
      }
    });
  }
};

client.on('error', function (err) {
  console.log('Redis error ' + err);
});

function loadCoreModules(cb) {

  var options = {
    url: 'https://drupal.org/node/1283408',
    headers: { 'User-Agent': USER_AGENT }
  };

  request(options,  function (err, res, body) {

    if (err) return cb(err);

    var $ = cheerio.load(body, { ignoreWhitespace: true });
    var count = 0;

    $('table:nth-child(3), table:nth-child(5)').each(function () {

      var codes = $(this).find('tbody code');

      codes.each(function () {

        var code = $(this);
        var module = code.text();
        var parent = code.closest('tr').prev();
        var name = parent.find('th').text();
        var supported = parent.find('td:nth-child(4)').text().match(/\d/g)

        cache.set('module:' + module, { name: name, supported: supported });
        count++;
      });
    });

    cb(err, count);
  });
};

function loadPopularModules(cb) {

  cache.get('popularmodules', function (err, modules) {

    if (err) return cb(err);
    if (_.size(modules)) {
      return cb(null, modules);
    }

    var modules = {};
    var interval = 400;
    var pages = 5;
    var todo = 0;
    var options = { headers: { 'User-Agent': USER_AGENT } };

    for (var page=0; page<pages; page++) {

      // TODO: convert to setTimeout
      sleep.sleep(1);

      options.url = 'https://drupal.org/search/site?page=' + page + '&f[0]=ss_meta_type%3Amodule';

      request(options, function (err, res, body) {

        if (err) {
          console.error(err);
          return;
        }

        var $ = cheerio.load(body, { ignoreWhitespace: true });
        var links = $('.search-result .title a');

        todo += links.length;

        links.each(function (i) {
          setTimeout((function () {

            this._module = $(this).attr('href').match(/\w+$/)[0];

            checkModule(this._module, (function (err, name, supported) {

              if (err) console.error(this._module, err);

              modules[this._module] = { name: name, supported: supported };

              todo--;
              if (!todo) {
                cb(null, modules);
              }
            }).bind(this));
          }).bind(this), interval * i);
        });
      });
    }
  });
}

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

module.exports = {
  loadCoreModules: loadCoreModules,
  loadPopularModules: loadPopularModules,
  checkModule: checkModule
};
