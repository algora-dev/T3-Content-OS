const fs = require('fs');
const envContent = fs.readFileSync('C:\\Users\\Jimmy\\.openclaw\\workspace-ron\\projects\\t3-content-os\\.env.local', 'utf-8');
const lines = envContent.split('\n');
const serviceKey = lines.find(l => l.includes('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim();
const url = 'https://qajlafodnjpqfsvmxevq.supabase.co';

// Check project_members
fetch(url + '/rest/v1/project_members?select=id,user_id,project_id,role', {
  headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey }
}).then(r => r.json()).then(d => {
  console.log('Project members:');
  if (Array.isArray(d)) {
    d.forEach(m => console.log(`  user: ${m.user_id} | project: ${m.project_id} | role: ${m.role}`));
  } else {
    console.log(JSON.stringify(d));
  }
  
  // Check auth users
  return fetch(url + '/auth/v1/admin/users', {
    headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey }
  });
}).then(r => r.json()).then(d => {
  console.log('\nAuth users:');
  if (d.users) {
    d.users.forEach(u => console.log(`  id: ${u.id} | email: ${u.email}`));
  } else {
    console.log(JSON.stringify(d));
  }
}).catch(e => console.error(e));
