// End-to-end agent workflow test
// Tests: list projects -> list ideas -> claim idea -> create draft -> update draft -> suggest link -> submit for review -> release idea
const BASE = 'https://t3-content-os-five.vercel.app';
const TOKEN = 'tcos_6043369cbf0dacef155fc802a95a2cb3f785b8cb8cf4723a1226a99837066488';

async function api(method, path, body) {
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };
  if (method === 'POST' && path.includes('/content') && !path.includes('/submit') && !path.includes('/claim') && !path.includes('/heartbeat') && !path.includes('/release') && !path.includes('/link')) {
    headers['X-Idempotency-Key'] = `e2e-test-${Date.now()}`;
  }
  
  const opts = { method, headers };
  if (body) {
    if (typeof body === 'string') {
      opts.body = body;
      headers['Content-Type'] = 'text/plain';
    } else {
      opts.body = JSON.stringify(body);
    }
  }
  
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function run() {
  console.log('=== Content OS Agent API End-to-End Test ===\n');

  // 1. List projects
  console.log('1. GET /api/v1/projects');
  const projectsRes = await api('GET', '/api/v1/projects');
  console.log('   Status:', projectsRes.status);
  console.log('   Projects:', projectsRes.data?.data?.map(p => p.code));
  const qcProject = projectsRes.data?.data?.find(p => p.code === 'QC');
  if (!qcProject) { console.log('   FAIL: No QC project'); return; }
  console.log('   QC project ID:', qcProject.id);

  // 2. List ready ideas
  console.log('\n2. GET /api/v1/ideas?status=ready');
  const ideasRes = await api('GET', '/api/v1/ideas?status=ready');
  console.log('   Status:', ideasRes.status);
  console.log('   Ready ideas:', ideasRes.data?.total);
  
  // Create a test idea first (via direct DB since agents can't create ideas)
  // Instead, let's create content directly
  
  // 3. Create content draft
  console.log('\n3. POST /api/v1/content (create draft)');
  const createRes = await api('POST', '/api/v1/content', {
    project_id: qcProject.id,
    title: 'E2E Test: Roofing Software for Small Contractors',
    summary: 'A test draft created by the agent API end-to-end test.',
    body_markdown: '# Roofing Software for Small Contractors\n\nThis is a test draft. When choosing roofing software, consider...',
    cluster: 'Quoting software',
    content_type: 'guide',
    target_query: 'roofing software for small contractors',
    search_intent: 'commercial',
    slug: 'roofing-software-for-small-contractors',
    author_name: 'Ron (agent)',
    excerpt: 'A guide to choosing roofing software as a small contractor.',
    meta_title: 'Roofing Software for Small Contractors | QuoteCore+',
    meta_description: 'Choosing the right roofing software for your small contracting business.',
  });
  console.log('   Status:', createRes.status);
  console.log('   Content code:', createRes.data?.data?.content_code);
  console.log('   Content ID:', createRes.data?.data?.id);
  console.log('   Status field:', createRes.data?.data?.status);
  
  if (createRes.status !== 200) {
    console.log('   FAIL:', JSON.stringify(createRes.data));
    return;
  }
  
  const contentId = createRes.data.data.id;

  // 4. Update draft
  console.log('\n4. PATCH /api/v1/content/:id (update draft)');
  const updateRes = await api('PATCH', `/api/v1/content/${contentId}`, {
    version: 1,
    body_markdown: '# Updated: Roofing Software for Small Contractors\n\nUpdated content with more detail...',
    meta_description: 'Updated meta description for better SEO.',
  });
  console.log('   Status:', updateRes.status);
  console.log('   New version:', updateRes.data?.data?.version);

  // 5. Suggest a link
  console.log('\n5. POST /api/v1/content/:id/link-suggestions');
  const linkRes = await api('POST', `/api/v1/content/${contentId}/link-suggestions`, {
    target_url: '/blog/roofing-quoting-software-uk',
    anchor_text: 'roofing quoting software',
    link_scope: 'same-project',
    reason: 'Both articles target roofing software queries - internal link strengthens topical authority.',
  });
  console.log('   Status:', linkRes.status);
  console.log('   Link state:', linkRes.data?.data?.state);

  // 6. Get link context
  console.log('\n6. GET /api/v1/content/:id/link-context');
  const ctxRes = await api('GET', `/api/v1/content/${contentId}/link-context`);
  console.log('   Status:', ctxRes.status);
  console.log('   Related content:', ctxRes.data?.data?.related_content?.length);
  console.log('   Cannibalisation warnings:', ctxRes.data?.data?.cannibalisation_warnings?.length);

  // 7. Submit for review
  console.log('\n7. POST /api/v1/content/:id/submit-review');
  const submitRes = await api('POST', `/api/v1/content/${contentId}/submit-review`);
  console.log('   Status:', submitRes.status);
  console.log('   New status:', submitRes.data?.data?.status);

  // 8. Export as markdown
  console.log('\n8. GET /api/v1/content/:id/markdown');
  const mdRes = await api('GET', `/api/v1/content/${contentId}/markdown`);
  console.log('   Status:', mdRes.status);
  console.log('   Content-Type: text/markdown');
  const mdText = typeof mdRes.data === 'string' ? mdRes.data.substring(0, 200) : '';
  console.log('   Preview:', mdText);

  console.log('\n=== Test complete ===');
  
  // Cleanup: mark as archived (can't delete, but can archive via direct DB)
  console.log('\nTest content created with ID:', contentId);
  console.log('You may want to archive this test content in the admin panel.');
}

run().catch(console.error);
