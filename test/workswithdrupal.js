
'use strict';

var should = require('should');
var fixtures = require('pow-mongodb-fixtures').connect('moduletest');
var WorksWithDrupal = require(__dirname + '/../modules/workswithdrupal.js');
var drupal;

beforeEach(function (done) {
  fixtures.clearAndLoad(__dirname + '/fixtures/modules.js', function () {
    drupal = new WorksWithDrupal(fixtures.client);
    done();
  });
});

describe('Module', function () {

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

  it('returns a list of available versions', function (done) {
    drupal.getVersions(function (err, versions) {
      versions.should.eql([1, 2, 3, 4]);
      done();
    });
  });

  // TODO: return correct url based on type of module / link isset, etc.
});

describe('Statistics', function () {

  it('should count # modules supported per drupal version', function (done) {
    drupal.statistics().modulesPerVersion(function (err, results) {
      results.should.eql({ 1: 4, 2: 4, 3: 2, 4: 1 });
      done();
    });
  });
});

