'use strict';

const mysql = require('mysql2/promise');
const config = require('./config');

// A shared connection pool used across the whole app.
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Small helper so callers can do `const rows = await query(sql, params)`.
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { pool, query };
