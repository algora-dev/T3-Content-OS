// Update existing live blog posts in Content OS with latest content from repo
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = 'https://qajlafodnjpqfsvmxevq.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhamxhZm9kbmpwcWZzdm14ZXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI0MTcwMiwiZXhwIjoyMTAwODE3NzAyfQ.3Wn5AkdheeP21sShHUJeXYbGclB1DN3GrjH8gSFpg8I';
const CONTENT_DIR = join('C:\\Users\\Jimmy\\.openclaw\\workspace-ron\\projects\\quotecore-plus\\app\\(marketing)\\blog\\[slug]\\content');

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

const posts = [
  { slug: 'quotecore-plus-reviews', id: '7f38d86e-de84-482c-8b0c-d8fbd378fd5d', version: 1, cluster: 'Buyer Intent', content_type: 'editorial', target_query: 'quotecore plus reviews', search_intent: 'commercial', audience: 'Contractors evaluating software' },
  { slug: 'quotecore-plus-vs-quotesmith', id: 'b3a5924c-0317-4237-965e-d668b7fbeeb4', version: 1, cluster: 'Buyer Intent', content_type: 'comparison', target_query: 'quotecore plus vs quotesmith', search_intent: 'commercial', audience: 'Contractors comparing software' },
  { slug: 'roofing-quoting-software-uk', id: '083ae30d-0736-4d68-8e55-25cf180a3b14', version: 1, cluster: 'Authority', content_type: 'editorial', target_query: 'roofing quoting software uk', search_intent: 'informational', audience: 'UK roofers' },
  { slug: 'roofing-quoting-software-vs-spreadsheets', id: 'c1a54d7d-dea7-49ee-a921-a8929eaa162f', version: 1, cluster: 'Authority', content_type: 'comparison', target_query: 'roofing quoting software vs spreadsheets', search_intent: 'informational', audience: 'Contractors using spreadsheets' },
  { slug: 'built-by-a-roofer', id: '621c1f82-8151-402b-8ead-792433253bd8', version: 1, cluster: 'Authority', content_type: 'editorial', target_query: 'quotecore plus story', search_intent: 'informational', audience: 'Contractors' },
  { slug: 'construction-quote-speed-checklist', id: 'ad0b50c1-a54c-42de-9576-19c1051612ab', version: 1, cluster: 'Authority', content_type: 'workflow-guide', target_query: 'construction quote checklist', search_intent: 'informational', audience: 'Contractors' },
  { slug: 'how-to-get-more-work-as-a-contractor', id: 'c8c41aa6-2abe-413b-824f-dc09bba7cb98', version: 1, cluster: 'Authority', content_type: 'guide', target_query: 'how to get more work as a contractor', search_intent: 'informational', audience: 'Contractors' },
  { slug: 'best-roofing-quoting-software-uk-2026', id: '55bf0d66-985d-43b9-bd4b-c97715bec4f1', version: 1, cluster: 'Buyer Intent', content_type: 'roundup', target_query: 'best roofing quoting software uk 2026', search_intent: 'commercial', audience: 'UK roofers evaluating software' },
];

function extractMarkdown(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf-8');
  let text = content.replace(/export default function \w+\(\)\s*\{/, '');
  text = text.replace(/\n  return \(/, '');
  text = text.replace(/\);\n\}$/, '');
  text = text.replace(/<(\w+)([^>]*)>/g, '');
  text = text.replace(/<\/(\w+)>/g, '');
  text = text.replace(/\{\/\*.*?\*\//g, '');
  text = text.replace(/\{\/\*/g, '');
  text = text.replace(/\*\/\}/g, '');
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  return text;
}

async function main() {
  let updated = 0;
  let failed = 0;

  for (const post of posts) {
    const filePath = join(CONTENT_DIR, `${post.slug}.tsx`);
    const bodyMarkdown = extractMarkdown(filePath);
    
    if (!bodyMarkdown) {
      console.log(`SKIP: Could not read ${post.slug}`);
      failed++;
      continue;
    }

    // Update body_markdown and metadata directly in Supabase
    const updateBody = {
      body_markdown: bodyMarkdown,
      cluster: post.cluster,
      content_type: post.content_type,
      target_query: post.target_query,
      search_intent: post.search_intent,
      audience: post.audience,
      author_name: 'Shaun, Founder of QuoteCore+',
      destination_path: `app/(marketing)/blog/[slug]/content/${post.slug}.tsx`,
      updated_at: new Date().toISOString(),
      version: post.version + 1,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/content_items?id=eq.${post.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateBody),
    });

    if (res.ok) {
      // Also create a revision snapshot
      const revisionBody = {
        content_item_id: post.id,
        version: post.version + 1,
        title: post.title || undefined,
        body_markdown: bodyMarkdown,
        actor_name: 'Ron (agent)',
        reason: 'Updated with latest content: internal links to new posts, updated CTAs, accuracy fixes',
      };
      
      const revRes = await fetch(`${SUPABASE_URL}/rest/v1/content_revisions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(revisionBody),
      });
      
      console.log(`OK: ${post.slug} -> v${post.version + 1}${revRes.ok ? ' +revision' : ' (no revision)'}`);
      updated++;
    } else {
      const err = await res.text();
      console.log(`FAIL: ${post.slug} - ${res.status} ${err}`);
      failed++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
}

main().catch(console.error);
