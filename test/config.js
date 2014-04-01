// TODO: use base config as source and merge in only stuff that differs?
module.exports = {
  port: 1337,
  drupalVersions: [4, 3, 2, 1],
  currentDrupalVersion: 3,
  timezone: 'Europe/Madrid',
  mongodb: {
    host: '127.0.0.1',
    port: 27017,
    db: 'drupaltest'
  },
  dataDir: __dirname + '/fixtures'
};
