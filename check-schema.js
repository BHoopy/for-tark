const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='tournaments' ORDER BY ordinal_position`.then(r => {
  console.log(JSON.stringify(r));
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
