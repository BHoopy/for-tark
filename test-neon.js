const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`.then(r => {
  console.log(JSON.stringify(r));
  process.exit(0);
}).catch(e => {
  console.error('ERR');
  console.error(e.message);
  process.exit(1);
});
