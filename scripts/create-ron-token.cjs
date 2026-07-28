// Create Ron agent token directly in DB
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const text = fs.readFileSync('../t3-content-os/T3ContentOSDetails.txt', 'utf-8');
const m = text.match(/Service Role:\s*(\S+)/);
const key = m[1];

const supabase = createClient('https://qajlafodnjpqfsvmxevq.supabase.co', key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createToken() {
  // Get all project IDs
  const { data: projects } = await supabase.from('projects').select('id, code');
  console.log('Projects:', projects.map(p => ({ code: p.code, id: p.id })));
  
  const projectIds = projects.map(p => p.id);
  
  // Generate token
  const rawToken = `tcos_${crypto.randomBytes(32).toString('hex')}`;
  
  // Hash it
  const encoder = new TextEncoder();
  const hashData = encoder.encode(rawToken);
  const hashBuffer = await crypto.subtle.digest('SHA-256', hashData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Insert
  const { data: tokenData, error } = await supabase.from('agent_tokens').insert({
    token_hash: tokenHash,
    agent_name: 'Ron',
    scopes: ['ideas:read', 'ideas:claim', 'content:read', 'content:create', 'content:update-draft', 'links:suggest'],
    project_ids: projectIds,
    expires_at: null, // no expiry for now
    created_by: null,
  }).select('id, agent_name, scopes, created_at').single();
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Token created:', JSON.stringify(tokenData, null, 2));
  console.log('\nRAW TOKEN (save this):', rawToken);
  console.log('\nTo use: Authorization: Bearer ' + rawToken);
}

createToken().catch(console.error);
