
module.exports = {
  port: 3000,
  currentDrupalVersion: 8,
  timezone: 'Europe/Madrid',
  mongodb: {
    host: '127.0.0.1',
    port: 27017,
    db: 'drupal'
  },
  dataDir: __dirname + '/data'
};
