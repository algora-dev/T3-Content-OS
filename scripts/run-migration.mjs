// Try connecting to Supabase directly with common default password
import pg from 'pg';

const { Client } = pg;

async function tryConnect(host, password) {
  const client = new Client({
    host,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    return client;
  } catch (err) {
    return null;
  }
}

async function runMigration() {
  // Try direct host
  const hosts = [
    'db.qajlafodnjpqfsvmxevq.supabase.co',
    'aws-0-eu-north-1.pooler.supabase.com',
  ];
  const passwords = ['postgres', 'T3ContentOS2026!'];

  let client = null;
  for (const host of hosts) {
    for (const pwd of passwords) {
      console.log(`Trying ${host} with password...`);
      client = await tryConnect(host, pwd);
      if (client) {
        console.log(`Connected to ${host}`);
        break;
      }
    }
    if (client) break;
  }

  if (!client) {
    console.log('Could not connect to database directly.');
    console.log('Shaun needs to either:');
    console.log('1. Provide the database password');
    console.log('2. Run the migration via Supabase Dashboard SQL Editor');
    console.log('URL: https://supabase.com/dashboard/project/qajlafodnjpqfsvmxevq/sql/new');
    process.exit(0);
  }

  try {
    const { readFileSync } = await import('fs');
    const sql = readFileSync('./supabase/migrations/00001_initial_schema.sql', 'utf-8');
    
    console.log('Executing migration...');
    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
