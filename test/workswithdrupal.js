
'use strict';

var _ = require('underscore');
var should = require('should');
var config = require(__dirname + '/config.js');
var fixtures = require('pow-mongodb-fixtures').connect('moduletest');
var WorksWithDrupal = require(__dirname + '/../modules/workswithdrupal.js');
var DrupalModule = require(__dirname + '/../models/DrupalModule.js');
var drupal;

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

describe('REST API', function () {

});
