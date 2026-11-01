const {Pool} = require('pg');
const env = require('./env');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  max: env.db.max, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('[DATABASE POOL ERROR]: Unexpected error on idle client', err);
    process.exit(-1);
  });
  
  module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
  };
  
