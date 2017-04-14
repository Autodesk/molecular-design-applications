'use strict';
/**
 * Create the postgres database connection
 */
const Sequelize = require('sequelize');
const retry = require('bluebird-retry');
const log = require('../utils/log');

// defaults look to a running postgress container named 'db'
let config = {
  host: 'db',
  port: 5432,
  username:  'mstdbuser',
  password: 'dataStoreMST',
  database: 'mstdbv1'
};

if ( 'PGHOST' in  process.env) {
  config.host = process.env.PGHOST;
}
if ( 'PGPORT ' in  process.env) {
  config.port = parseInt(process.env.PGPORT, 10);
}
if ('PGUSER' in  process.env) {
  config.username = process.env.PGUSER;
}
if ('PGPASSWORD' in  process.env) {
  config.password = process.env.PGPASSWORD;
}
if ('PGDATABASE' in  process.env) {
  config.database = process.env.PGDATABASE;
}

console.log('Connecting to database with settings: \n database=' + config.database + '\n username=' + config.username + 
            '\n password=***removed**' + '\n host=' + config.host  + '\n port=' + config.port);

let db = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: 'postgres',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }

});

module.exports = retry(
    () => db.authenticate(),
    { max_tries: 50, interval: 1000, max_interval: 10000 }
  )
  .then(() => {
    log.info('Connected to the database');
    return db;
  });
