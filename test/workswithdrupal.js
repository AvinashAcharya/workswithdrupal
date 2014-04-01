
'use strict';

var fs = require('fs');
var _ = require('underscore');
var request = require('supertest');
var should = require('should');
var MongoClient = require('mongodb').MongoClient;
var config = require(__dirname + '/config.js');
var fixtures = require('pow-mongodb-fixtures').connect('moduletest');
var WorksWithDrupal = require(__dirname + '/../modules/workswithdrupal.js');
var DrupalModule = require(__dirname + '/../models/DrupalModule.js');
var drush = require(__dirname + '/../public/js/drush.js');
var server = require(__dirname + '/../server.js');
var app = server.app;
var drupal;

describe('Fixture based tests', function () {

  beforeEach(function (done) {
    fixtures.clearAndLoad(__dirname + '/fixtures/modules.js', function () {
      drupal = new WorksWithDrupal(fixtures.client);
      done();
    });
  });

  describe('DrupalModule', function () {

    it('can check if its data is valid', function (done) {

      var module = new DrupalModule();
      module.valid().should.be.false;

      module.machineName = 'test';
      module.valid().should.be.false;

      module.machineName = null;
      module.name = 'test';
      module.valid().should.be.false;

      module.machineName = 'test';
      module.name = 'test';
      module.valid().should.be.true;

      done();
    });

    it('should merge community and core modules into "supported"', function (done) {
      var module = new DrupalModule({
        core: [1, 2],
        community: [3, 4]
      });
      module.supported().should.eql([1, 2, 3, 4]);
      done();
    });

    it('checks if a module supports a given version', function (done) {
      var module = new DrupalModule({ core: [1], community: [2] });
      module.works(1).should.be.true;
      module.works(2).should.be.true;
      module.works(3).should.be.false;
      done();
    });

    it('should get a single module', function (done) {
      drupal.getModule('test_1', function (err, module) {
        module.should.eql({
          type: 'project_module',
          machineName: 'test_1',
          name: 'Test Module 1',
          link: 'http://example.org/1',
          creator: 'Test User 1',
          community: [ 1, 2 ],
          core: [ 3, 4 ]
        });
      });
      done();
    });

    it('should return the correct url', function (done) {
      var module = new DrupalModule({
        machineName: 'test',
        link: 'http://example.org',
        community: [1, 2],
        core: [3]
      });
      module.url().should.equal('http://example.org');
      delete module.link;
      module.url().should.equal('http://drupal.org/project/test');
      module.community = [];
      module.url().should.equal('https://drupal.org/node/1283408');
      done();
    });
  });

  describe('Statistics', function () {

    it('should count # modules supported per drupal version', function (done) {
      drupal.statistics().modulesPerVersion(function (err, results) {
        results.should.eql({ 1: 4, 2: 4, 3: 2, 4: 1 });
        done();
      });
    });
  });

  describe('Misc', function () {

    it('gets a list of available versions', function (done) {
      drupal.getVersions(function (err, versions) {
        versions.should.eql([1, 2, 3, 4]);
        done();
      });
    });

    it('gets all modules by version', function (done) {
      done = _.after(4, done);
      drupal.getByVersion(1, function (err, modules) {
        modules.should.have.lengthOf(4);
        done();
      });
      drupal.getByVersion(2, function (err, modules) {
        modules.should.have.lengthOf(4);
        done();
      });
      drupal.getByVersion(3, function (err, modules) {
        modules.should.have.lengthOf(2);
        done();
      });
      drupal.getByVersion(4, function (err, modules) {
        modules.should.have.lengthOf(1);
        done();
      });
    });
  });

  describe('Frontend', function () {

    // disable logging
    app.set('env', 'test');

    beforeEach(function (done) {
      server.start(config, done, drupal);
    });

    afterEach(function (done) {
      server.close(done);
    });

    describe('REST API', function () {

      it('returns HTML by default', function (done) {
        request(app)
          .get('/1/test_1')
          .expect('Content-Type', /html/)
          .expect(200, done);
      });

      it('returns JSON when the content type is set to JSON', function (done) {
        request(app)
          .get('/1/test_1')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200, done);
      });

      it('404s when invalid versions are requested', function (done) {
        request(app).get('/666/test_1').expect(404, done);
      });

      it('returns all information about the requested module', function (done) {
        request(app)
          .get('/1/test_1')
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            res.body.modules.work.should.eql([{
              type: 'project_module',
              machineName: 'test_1',
              name: 'Test Module 1',
              link: 'http://example.org/1',
              creator: 'Test User 1',
              community: [1, 2],
              core: [3, 4]
            }]);
            done();
          });
      });

      it('returns the requested modules grouped by their support levels', function (done) {
        request(app)
          .get('/3/test_1+test_2+test_3+test_4+test_5')
          .set('Content-Type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            var data = res.body;
            data.version.should.eql(3);
            data.percentage.should.eql(50);
            data.modules.work.should.have.lengthOf(2);
            data.modules.dont.should.have.lengthOf(2);
            _.pluck(data.modules.work, 'name').should.eql([
              'Test Module 1', 'Test Module 4'
            ]);
            _.pluck(data.modules.dont, 'name').should.eql([
              'Test Module 2', 'Test Module 3'
            ]);
            done();
          });
      });

      it('reports modules not found in the db as unknown', function (done) {
        request(app)
          .get('/1/unknown1+unknown2+unknown3')
          .set('Content-Type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            res.body.modules.notfound.should.have.lengthOf(3);
            _.pluck(res.body.modules.notfound, 'machineName').should.eql([
              'unknown1', 'unknown2', 'unknown3'
            ]);
            done();
          });
      });

      it('returns module statistics', function (done) {
        request(app)
          .get('/statistics')
          .set('Content-Type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);
            res.body.should.eql({
              statistics: {
                modulesPerVersion: { 1: 4, 2: 4, 3: 2, 4: 1 }
              }
            })
            done();
          });
      });
    });
  });
});

describe('Database Import', function () {

  var drupal;

  beforeEach(function (done) {
    MongoClient.connect(
      'mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.db,
      function (err, db) {
        if (err) return done(err);
        drupal = new WorksWithDrupal(db, config);
        done();
      }
    );
  });

  afterEach(function (done) {
    drupal.cache.flush(done);
  });

  it('should populate the db', function (done) {
    done = _.after(2, done);
    drupal.precache(function () {

      drupal.cache.collection.count(function (err, count) {
        count.should.equal(131);
        done();
      });

      drupal.cache.get('views', function (err, module) {
        delete module._id;
        module.should.eql({
          type: 'project_module',
          machineName: 'views',
          name: 'Views',
          link: 'https://drupal.org/node/1283408',
          creator: null,
          community: [4, 5, 6, 7],
          core: [8]
        });
        done();
      })
    });
  });
});

describe('Drush.js', function () {

  it('can figure out of a given string is the result of drush pm-list', function (done) {
    var pmlist = fs.readFileSync(__dirname + '/fixtures/pm-list.txt', 'utf-8');
    drush.isPmList(NaN).should.be.false;
    drush.isPmList('lorum ipsum').should.be.false;
    drush.isPmList(pmlist).should.be.true;
    done();
  });

  it('can extract module names from a newline separated list', function (done) {
    var text = '  one\ntwo\nthree\n ';
    drush.parseModules(text, function (modules) {
      modules.should.eql(['one', 'two', 'three']);
      done();
    });
  });

  it('can extract module names from drush pm-list output', function (done) {
    var pmlist = fs.readFileSync(__dirname + '/fixtures/pm-list.txt', 'utf-8');
    drush.parseModules(pmlist, function (modules) {
      modules.should.eql(['ctools', 'chart', 'block', 'blog', 'book', 'calendar', 'date']);
      done();
    });
  });

  it('converts a list of modules to a url string', function (done) {
    var modules = ['one', 'two', 'three', 'four'];
    drush.modulesToUrl(modules).should.equal('one+two+three+four');
    done();
  });
});

