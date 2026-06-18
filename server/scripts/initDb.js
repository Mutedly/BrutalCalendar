'use strict';

// ---------------------------------------------------------------------------
// Creates the database and tables from db/schema.sql using the .env settings.
// Run with:  npm run init-db
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

async function main() {
  const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Connect WITHOUT selecting a database so CREATE DATABASE works.
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  console.log('Applying schema from db/schema.sql ...');
  await connection.query(sql);
  await connection.end();
  console.log('Database ready.');
}

main().catch((err) => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});
