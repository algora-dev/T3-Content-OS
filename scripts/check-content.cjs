const fs = require('fs');
const envContent = fs.readFileSync('C:\\Users\\Jimmy\\.openclaw\\workspace-ron\\projects\\t3-content-os\\.env.local', 'utf-8');
const lines = envContent.split('\n');
const serviceKey = lines.find(l => l.includes('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim();
const url = 'https://qajlafodnjpqfsvmxevq.supabase.co';

fetch(url + '/rest/v1/content_items?select=id,content_code,slug,title,status&limit=20', {
  headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey }
}).then(r => r.json()).then(d => {
  if (Array.isArray(d)) {
    console.log('Count:', d.length);
    d.forEach(i => console.log(i.content_code, '|', i.slug, '|', i.status));
  } else {
    console.log(JSON.stringify(d));
  }
}).catch(e => console.error(e));
