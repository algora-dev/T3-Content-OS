// Push all QuoteCore+ blog posts into Content OS
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASE = 'https://t3-content-os-five.vercel.app';
const TOKEN = 'tcos_ron_39f8d1ba1f749f33a106a13dfd8f747f4c3b7c1c9ff55028';
const QC_PROJECT_ID = '149f3bba-9253-426a-9c90-552f5217160b';
const CONTENT_DIR = join('C:\\Users\\Jimmy\\.openclaw\\workspace-ron\\projects\\quotecore-plus\\app\\(marketing)\\blog\\[slug]\\content');

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...headers, ...(body ? { 'X-Idempotency-Key': `${method}-${path}-${Date.now()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

// All 13 blog posts
const posts = [
  // 5 new drafts
  { slug: 'how-to-calculate-roof-pitch', title: 'How to Calculate Roof Pitch (And Why It Matters for Your Quote)', cluster: 'Tool Education', content_type: 'practical-guide', target_query: 'how to calculate roof pitch', search_intent: 'informational', audience: 'Roofers and contractors', isDraft: true, destination: 'app/(marketing)/blog/[slug]/content/how-to-calculate-roof-pitch.tsx' },
  { slug: 'how-to-measure-a-roof', title: 'How to Measure a Roof for Materials (Complete Guide)', cluster: 'Tool Education', content_type: 'practical-guide', target_query: 'how to measure a roof', search_intent: 'informational', audience: 'Roofers and contractors', isDraft: true, destination: 'app/(marketing)/blog/[slug]/content/how-to-measure-a-roof.tsx' },
  { slug: 'how-much-roofing-material', title: 'How Much Roofing Material Do You Need? (Material Calculator Guide)', cluster: 'Tool Education', content_type: 'practical-guide', target_query: 'how much roofing material do i need', search_intent: 'informational', audience: 'Roofers and contractors', isDraft: true, destination: 'app/(marketing)/blog/[slug]/content/how-much-roofing-material.tsx' },
  { slug: 'how-to-price-a-roofing-job', title: 'How to Price a Roofing Job: Step-by-Step Pricing Guide', cluster: 'Tool Education', content_type: 'practical-guide', target_query: 'how to price a roofing job', search_intent: 'informational', audience: 'Roofers and contractors', isDraft: true, destination: 'app/(marketing)/blog/[slug]/content/how-to-price-a-roofing-job.tsx' },
  { slug: 'best-free-tools-for-roofers', title: 'Best Free Tools for Roofers and Contractors (2026)', cluster: 'Tool Education', content_type: 'roundup', target_query: 'best free tools for roofers', search_intent: 'informational', audience: 'Roofers and contractors', isDraft: true, destination: 'app/(marketing)/blog/[slug]/content/best-free-tools-for-roofers.tsx' },
  // 8 existing published posts
  { slug: 'quotecore-plus-reviews', title: 'QuoteCore+ Reviews: Is It Legit and Who Is It For?', cluster: 'Buyer Intent', content_type: 'editorial', target_query: 'quotecore plus reviews', search_intent: 'commercial', audience: 'Contractors evaluating software', isDraft: false, destination: 'app/(marketing)/blog/[slug]/content/quotecore-plus-reviews.tsx' },
  { slug: 'quotecore-plus-vs-quotesmith', title: 'QuoteCore+ vs QuoteSmith: Proposal Writer or Full Quote Workflow?', cluster: 'Buyer Intent', content_type: 'comparison', target_query: 'quotecore plus vs quotesmith', search_intent: 'commercial', audience: 'Contractors comparing software', isDraft: false, destination: 'app/(marketing)/blog/[slug]/content/quotecore-plus-vs-quotesmith.tsx' },
  { slug: 'roofing-quoting-software-uk', title: 'How UK Roofing Contractors Are Getting Quotes Out Faster', cluster: 'Authority', content_type: 'editorial', target_query: 'roofing quoting software uk', search_intent: 'informational', audience: 'UK roofers', isDraft: false, destination: 'app/(marketing)/blog/[slug]/content/roofing-quoting-software-uk.tsx' },
  { slug: 'roofing-quoting-software-vs-spreadsheets', title: 'Roofing Quoting Software vs Spreadsheets: What Actually Saves Time?', cluster: 'Authority', content_type: 'comparison', target_query: 'roofing quoting software vs spreadsheets', search_intent: 'informational', audience: 'Contractors using spreadsheets', isDraft: false, destination: 'app/(marketing)/blog/[slug]/content/roofing-quoting-software-vs-spreadsheets.tsx' },
  { slug: 'built-by-a-roofer', title: 'Built From Roofing Experience: The Story Behind QuoteCore+', cluster: 'Authority', content_type: 'editorial', target_query: 'quotecore plus story', search_intent: 'informational', audience: 'Contractors', isDraft: false, destination: 'app/(marketing)/blog/[slug]/content/built-by-a-roofer.tsx' },
  { slug: 'construction-quote-speed-checklist', title: 'The Construction Quote Speed Checklist', cluster: 'Authority', content_type: 'workflow-guide', target_query: 'construction quote checklist', search_intent: 'informational', audience: 'Contractors', isDraft: false, destination: 'app/(marketing)/blog/[slug]/content/construction-quote-speed-checklist.tsx' },
  { slug: 'how-to-get-more-work-as-a-contractor', title: 'How to Get More Work as a Contractor: 7 Things to Fix Before You Spend Money on Ads', cluster: 'Authority', content_type: 'guide', target_query: 'how to get more work as a contractor', search_intent: 'informational', audience: 'Contractors', isDraft: false, destination: 'app/(marketing)/blog/[slug]/content/how-to-get-more-work-as-a-contractor.tsx' },
  { slug: 'best-roofing-quoting-software-uk-2026', title: 'Best Roofing Quoting Software UK (2026): Compared for Contractors', cluster: 'Buyer Intent', content_type: 'roundup', target_query: 'best roofing quoting software uk 2026', search_intent: 'commercial', audience: 'UK roofers evaluating software', isDraft: false, destination: 'app/(marketing)/blog/[slug]/content/best-roofing-quoting-software-uk-2026.tsx' },
];

// Extract text content from TSX file (strip JSX tags, keep text)
function extractMarkdown(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf-8');
  
  // Remove the export default function wrapper
  let text = content.replace(/export default function \w+\(\)\s*\{/, '');
  text = text.replace(/\n  return \(/, '');
  text = text.replace(/\);\n\}$/, '');
  
  // Remove JSX tags but keep text content
  text = text.replace(/<(\w+)([^>]*)>/g, ''); // opening tags
  text = text.replace(/<\/(\w+)>/g, ''); // closing tags
  text = text.replace(/\{\/\*.*?\*\//g, ''); // JSX comments
  text = text.replace(/\{\/\*/g, '');
  text = text.replace(/\*\/\}/g, '');
  
  // Clean up entity encoding
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  
  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
}

// Get existing content items to avoid duplicates
async function getExisting() {
  const res = await api('GET', `/api/v1/content?project=${QC_PROJECT_ID}&limit=50`);
  const existing = new Map();
  if (res.json?.data?.data) {
    for (const item of res.json.data.data) {
      if (item.slug) existing.set(item.slug, item);
    }
  }
  return existing;
}

async function main() {
  console.log('Fetching existing content items...');
  const existing = await getExisting();
  console.log(`Found ${existing.size} existing items`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    const filePath = join(CONTENT_DIR, `${post.slug}.tsx`);
    const bodyMarkdown = extractMarkdown(filePath);
    
    if (!bodyMarkdown) {
      console.log(`SKIP: Could not read ${post.slug}`);
      skipped++;
      continue;
    }

    const existingItem = existing.get(post.slug);
    
    const contentBody = {
      project_id: QC_PROJECT_ID,
      title: post.title,
      body_markdown: bodyMarkdown,
      cluster: post.cluster,
      content_type: post.content_type,
      target_query: post.target_query,
      search_intent: post.search_intent,
      audience: post.audience,
      slug: post.slug,
      destination_path: post.destination,
      author_name: 'Shaun, Founder of QuoteCore+',
      excerpt: post.title,
      meta_title: `${post.title} | QuoteCore+`,
      meta_description: post.title,
    };

    if (existingItem) {
      // Update existing item
      console.log(`UPDATE: ${post.slug} (id: ${existingItem.id}, version: ${existingItem.version})`);
      const updateBody = {
        version: existingItem.version,
        body_markdown: bodyMarkdown,
        cluster: post.cluster,
        content_type: post.content_type,
        target_query: post.target_query,
        search_intent: post.search_intent,
        audience: post.audience,
        destination_path: post.destination,
        author_name: 'Shaun, Founder of QuoteCore+',
      };
      const res = await api('PATCH', `/api/v1/content/${existingItem.id}`, updateBody);
      if (res.status === 200) {
        updated++;
        console.log(`  OK - version ${existingItem.version} -> ${existingItem.version + 1}`);
      } else if (res.status === 409) {
        // Version conflict - fetch latest and retry
        console.log(`  Version conflict, fetching latest...`);
        const latest = await api('GET', `/api/v1/content/${existingItem.id}`);
        if (latest.json?.data) {
          const retryBody = { ...updateBody, version: latest.json.data.version };
          const retryRes = await api('PATCH', `/api/v1/content/${existingItem.id}`, retryBody);
          if (retryRes.status === 200) {
            updated++;
            console.log(`  OK (retry) - version ${latest.json.data.version} -> ${latest.json.data.version + 1}`);
          } else {
            failed++;
            console.log(`  FAIL (retry): ${JSON.stringify(retryRes.json)}`);
          }
        }
      } else {
        failed++;
        console.log(`  FAIL: ${JSON.stringify(res.json)}`);
      }
    } else {
      // Create new item
      console.log(`CREATE: ${post.slug}`);
      const res = await api('POST', '/api/v1/content', contentBody);
      if (res.status === 200 || res.status === 201) {
        created++;
        console.log(`  OK - ${res.json?.data?.content_code || 'created'}`);
        
        // Submit for review if it's a draft post
        if (post.isDraft && res.json?.data?.id) {
          console.log(`  Submitting for review...`);
          const reviewRes = await api('POST', `/api/v1/content/${res.json.data.id}/submit-review`);
          if (reviewRes.status === 200) {
            console.log(`  Submitted for review`);
          }
        }
      } else {
        failed++;
        console.log(`  FAIL: ${JSON.stringify(res.json)}`);
      }
    }
  }

  console.log(`\nDone! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(console.error);
