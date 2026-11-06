const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
const migration = fs.readFileSync('./migrations/002_psimply_schema.sql', 'utf8');
sql.unsafe(migration).then(() => {
  console.log('done');
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
