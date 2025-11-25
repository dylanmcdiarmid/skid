import Database from 'better-sqlite3';

const db = new Database('db/skid.sqlite');

const tables = [
  'practice_session_templates',
  'day_instances'
];

for (const table of tables) {
  console.log(`--- ${table} ---`);
  const info = db.pragma(`table_info(${table})`);
  console.log(info);
}

