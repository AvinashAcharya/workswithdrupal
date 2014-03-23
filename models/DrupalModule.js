
var _ = require('underscore');

module.exports = DrupalModule;

function DrupalModule (data) {

  this.type = null;
  this.machineName = null;
  this.name = null;
  this.link = null;
  this.creator = null;
  this.community = [];
  this.core = [];

  if (data) {
    this.type = data.type || null;
    this.machineName = data.machineName || null;
    this.name = data.name || null;
    this.link = data.link || null;
    this.creator = data.creator || null;
    this.community = data.community || [];
    this.core = data.core || [];
  }
};

DrupalModule.prototype.supported = function (version) {
  var supported = _.uniq(this.community.concat(this.core)).sort();
  return version ? _.contains(supported, parseInt(version, 10)) : supported;
};

DrupalModule.prototype.works = function (version) {
  return this.supported().indexOf(version) > -1;
};

DrupalModule.prototype.valid = function () {
  return !!(this.machineName && this.name);
};

DrupalModule.prototype.url = function () {
  if (this.link && this.link.length) return this.link;
  else if (this.community.length) return 'http://drupal.org/project/' + this.machineName;
  else return 'https://drupal.org/node/1283408';
};
