const fs = require('fs');
const envContent = fs.readFileSync('C:\\Users\\Jimmy\\.openclaw\\workspace-ron\\projects\\t3-content-os\\.env.local', 'utf-8');
const lines = envContent.split('\n');
const serviceKey = lines.find(l => l.includes('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim();
const url = 'https://qajlafodnjpqfsvmxevq.supabase.co';

// Check RLS policies via Supabase Management API or direct SQL
// Try the SQL endpoint
fetch(url + '/rest/v1/rpc/exec_sql', {
  method: 'POST',
  headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ sql: "SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('content_items', 'project_members') ORDER BY tablename, cmd;" })
}).then(r => r.json()).then(d => {
  console.log('Policies:', JSON.stringify(d, null, 2));
}).catch(e => console.error(e));

// Also check if RLS is enabled
fetch(url + '/rest/v1/rpc/exec_sql', {
  method: 'POST',
  headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ sql: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('content_items', 'project_members', 'ideas', 'projects');" })
}).then(r => r.json()).then(d => {
  console.log('RLS status:', JSON.stringify(d, null, 2));
}).catch(e => console.error(e));
