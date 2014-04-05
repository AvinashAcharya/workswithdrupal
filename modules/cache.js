'use strict';

var _ = require('underscore');

module.exports = ModuleCache;

function ModuleCache(db) {
  this.db = db;
  this.collection = db.collection('modules');
}

ModuleCache.prototype = {

  get: function (machineName, cb) {
    this.collection.findOne({ machineName: machineName }, function cacheFind(err, module) {
      cb(err, module)
    });
  },

  set: function (doc, cb) {
    this.collection.update(
      { machineName: doc.machineName },
      doc,
      { safe: true, upsert: true },
      function cacheInsert(err, module) {
        cb(err, module);
      }
    );
  },

  update: function (doc, cb) {

    var update = function mergeSupported(data, doc, cb) {
      var supported = data.supported.concat(doc.supported).sort();
      var updated = _.extend(data, doc);
      updated.supported = supported;
      this.set(updated, cb);
    };

    this.get(doc.machineName, function cacheUpdateGet(err, module) {
      if (!module) {
        this.set(doc, cb);
      } else {
        update.call(this, module, doc, cb);
      }
    }.bind(this));
  },

  flush: function (cb) {
    this.collection.remove(function (err, count) {
      cb(err, count);
    });
  }
};
