'use strict';

var util = require('util');
var fs = require('fs');
var glob = require('glob');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var ModuleCache = require(__dirname + '/cache.js');
var DrupalModule = require(__dirname + '/../models/DrupalModule.js');

var USER_AGENT = 'WorksWithDrupal/0.0.1-alpha';

module.exports = WorksWithDrupal;

function WorksWithDrupal(db) {
  this.cache = new ModuleCache(db);
}

WorksWithDrupal.prototype = {

  precache: function (cb) {

    // TODO: don't flush whole cache first, just update existing modules
    this.cache.flush(function (err, count) {

      util.log(count + ' modules deleted');
      util.log('Populating core modules...')

      this.setCoreModules(function setCoreModules(err, saved) {

        util.log(saved + ' core modules saved.');
        util.log('Populating community modules...');

        this.setCommunityModules(function setCommunityModules(err, saved, failed) {
          util.log(saved + ' community modules saved, ' + failed.length + ' failed.');
          cb();
        });
      }.bind(this));
    }.bind(this));
  },

  getModule: function (machineName, cb) {
    this.cache.get(machineName, function cacheGetModule(err, cached) {
      if (err) return cb(err);
      return cached
        ? cb(null, new DrupalModule(cached))
        : cb(new Error('"' + machineName + '" not found.'), new DrupalModule({ machineName: machineName }));
    });
  },

  setCoreModules: function (cb) {

    var count = 0;
    var done = 0;
    var filePath = __dirname + '/../data/core.html';
    var cache = this.cache;

    fs.readFile(filePath, { encoding: 'utf-8' }, function readCoreModuleHtml(err, html) {

      if (err) return cb(err, done);

      var $ = cheerio.load(html, { ignoreWhitespace: true });

      $('table:nth-child(3), table:nth-child(5)').each(function parseCoreModules(i, table) {

        var codes = $(table).find('tbody code');

        codes.each(function parseCode(i, code) {

          count++;

          var code = $(code);
          var parent = code.closest('tr').prev();
          var machineName = code.text();
          var name = parent.find('th').text();
          var supported = parent.find('td:nth-child(4)').text().match(/\d/g);

          // FIXME: DRY
          cache.get(machineName, function (err, drupalModule) {

            // merge data with an existing entry if needed
            if (!drupalModule) {
              drupalModule = new DrupalModule({
                machineName: machineName,
                name: name
              });
            }

            drupalModule.core = _(supported).uniq().map(function (n) { return parseInt(n, 10) }).sort();

            cache.set(drupalModule, function (err, result) {
              done++;
              if (done === count) {
                cb(null, done);
              }
            });
          });

        }.bind(this));
      }.bind(this));
    });
  },

  setCommunityModules: function (cb) {

    var modules = {};
    var cache = this.cache;
    var count = 0;
    var done = 0;
    var failed = [];

    glob(__dirname + '/../data/community-*.html', function globPopular(err, files) {

      files.forEach(function (filePath) {

        fs.readFile(filePath, { encoding: 'utf-8' }, function (err, html) {

          var $ = cheerio.load(html, { ignoreWhitespace: true });
          var projects = $('.node-project-module');

          projects.each(function parseModuleHTML() {

            var $this = $(this);
            var name = $this.find('h2').text().trim();

            count++;

            try {

              var machineName = $this.find('h2 a').attr('href').match(/\project\/(.+)/)[1].toLowerCase();
              var versions = $this.find('tbody .views-field-field-release-version');
              var supported = [];

              versions.each(function () {
                supported.push(parseInt($(this).text().trim()[0], 10));
              });

              // FIXME: DRY
              cache.get(machineName, function (err, drupalModule) {

                // merge data with an existing entry if needed
                if (!drupalModule) {
                  drupalModule = new DrupalModule({
                    machineName: machineName,
                    name: name
                  });
                }

                drupalModule.community = _.uniq(supported).sort()

                cache.set(drupalModule, function (err, result) {
                  done++;
                  if (done === count) {
                    cb(null, done, failed);
                  }
                });
              });

            } catch (e)  {
              done++;
              failed.push({ name: name, err: e });
            }
          });

        }.bind(this));
      }.bind(this));
    }.bind(this));
  }
};
