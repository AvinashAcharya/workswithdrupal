'use strict';

var util = require('util');
var fs = require('fs');
var xml2js = require('xml2js');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var ModuleCache = require(__dirname + '/cache.js');
var DrupalModule = require(__dirname + '/../models/DrupalModule.js');

var USER_AGENT = 'WorksWithDrupal/0.0.1-alpha';
var CORE_MODULE_URL = 'https://drupal.org/node/1283408';

module.exports = WorksWithDrupal;

function WorksWithDrupal(db, config) {
  this.cache = new ModuleCache(db);
  this.config = config;
}

WorksWithDrupal.prototype = {

  precache: function (cb, verbose) {

    verbose = verbose || false;

    // TODO: don't flush whole cache first, just update existing modules
    this.cache.flush(function (err, count) {

      if (verbose) {
        util.log(count + ' modules deleted');
        util.log('Populating core modules...')
      }

      this.setCoreModules(function setCoreModules(err, saved) {

        if (verbose) {
          util.log(saved + ' core modules saved.');
          util.log('Populating community modules...');
        }

        this.setCommunityModules(function setCommunityModules(err, saved, failed) {
          if (verbose) {
            util.log(saved + ' community modules saved, ' + failed.length + ' failed.');
          }
          cb();
        });
      }.bind(this));
    }.bind(this));
  },

  setCoreModules: function (cb) {

    var count = 0;
    var done = 0;
    var filePath = this.config.dataDir + '/core.html';
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
                type: 'project_module',
                name: name,
                link: CORE_MODULE_URL
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
    var supported = [];
    var failed = [];

    fs.readFile(this.config.dataDir + '/community.xml', function(err, data) {
      xml2js.parseString(data, function (err, community) {

        count = community.projects.project.length;

        community.projects.project.forEach(function (project) {

          var api_versions;
          var version, versions = [];
          var machineName = project.short_name[0].trim();

          cache.get(machineName, function (err, drupalModule) {

            if (!drupalModule) {
              drupalModule = new DrupalModule({
                machineName: project.short_name[0].trim(),
                type: project.type[0].trim(),
                name: project.title[0].trim(),
                link: project.link[0].trim(),
                creator: project['dc:creator'][0].trim()
              });
            }

            if (project.api_versions) {
              api_versions = project.api_versions[0].api_version;
              for (var i = api_versions.length - 1; i >= 0; i--) {
                version = parseInt(api_versions[i].replace('.x', ''), 10);
                if (drupalModule.core.indexOf(version) == -1) {
                  versions.push(version);
                }
              };
              drupalModule.community = _.uniq(versions).sort();
            }

            cache.set(drupalModule, function (err, result) {
              done++;
              if (done === count) {
                cb(null, done, failed);
              }
            });
          });
        });
      });
    });
  },

  getModule: function (machineName, cb) {
    this.cache.get(machineName, function cacheGetModule(err, cached) {
      if (err) return cb(err);
      return cached
        ? cb(null, new DrupalModule(cached))
        : cb(new Error('"' + machineName + '" not found.'),
             new DrupalModule({ machineName: machineName }));
    });
  },

  // TODO: cache everything below this line ------------------------------------

  getVersions: function (cb) {

    var addVersions;
    var versions = [];


    cb = _.after(2, cb);

    addVersions = function (err, result) {
      versions = versions.concat(result);
      cb(err, _.uniq(versions).sort());
    }.bind(this);

    this.cache.collection.distinct('core', addVersions);
    this.cache.collection.distinct('community', addVersions);
  },

  getByVersion: function (version, cb) {

    var query = {
      $or: [
        { community: { $in: [version] } },
        { core: { $in: [version] } }
      ]
    };

    this.cache.collection.find(query, function findByVersion(err, results) {
      results.toArray(function (err, modules) {
        // TODO: instanciate new DrupalModule for each one
        cb(err, modules);
      });
    });
  },

  statistics: function () {
    return {

      modulesPerVersion: function (cb) {

        var results = {};

        this.getVersions(function getVersions(err, versions) {

          cb = _.after(versions.length, cb);

          versions.forEach(function (version) {
            this.getByVersion(version, function getByVersion(err, modules) {
              results[version] = modules.length;
              cb(err, results);
            });
          }.bind(this));

        }.bind(this))
      }.bind(this)
    }
  }
};
