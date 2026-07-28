// Import existing blog content into Content OS Supabase
// Run: node scripts/import-content.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

const SUPABASE_URL = 'https://qajlafodnjpqfsvmxevq.supabase.co';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbG…pg8I';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Project IDs (fetched at runtime)
let PROJECT_IDS = {};

async function getProjectIds() {
  const { data, error } = await supabase.from('projects').select('id, code');
  if (error) throw error;
  for (const p of data) {
    PROJECT_IDS[p.code] = p.id;
  }
}

// QuoteCore+ blog posts metadata (from app/lib/blog-posts.ts)
const QC_BLOG_POSTS = [
  {
    slug: 'quotecore-plus-reviews',
    title: 'QuoteCore+ Reviews: Is It Legit and Who Is It For?',
    description: 'Wondering if QuoteCore+ is legit? Here\u2019s what the platform does, who it is for, how the free trial works, and how it helps construction businesses manage the workflow from quote to material orders, job management and invoicing.',
    date: '2026-05-27',
    lastModified: '2026-05-27',
    cluster: 'Product reviews',
    contentType: 'editorial',
    targetQuery: 'quotecore plus reviews',
    searchIntent: 'commercial',
  },
  {
    slug: 'quotecore-plus-vs-quotesmith',
    title: 'QuoteCore+ vs QuoteSmith: Proposal Writer or Full Quote Workflow?',
    description: 'QuoteSmith and QuoteCore+ both help trades create better quotes, but they solve different problems. One focuses on proposal writing, the other on the workflow from measurement to quote, material orders, job management and invoicing.',
    date: '2026-05-23',
    lastModified: '2026-05-23',
    cluster: 'Comparisons',
    contentType: 'comparison',
    targetQuery: 'quotecore vs quotesmith',
    searchIntent: 'commercial',
  },
  {
    slug: 'roofing-quoting-software-uk',
    title: 'How UK Roofing Contractors Are Getting Quotes Out Faster',
    description: 'Many UK roofing businesses lose time after the site visit, when notes, photos, pricing and material details have to be pulled together manually. Here\u2019s how a better quote workflow helps.',
    date: '2026-05-06',
    lastModified: '2026-05-06',
    cluster: 'Quoting software',
    contentType: 'guide',
    targetQuery: 'roofing quoting software uk',
    searchIntent: 'commercial',
  },
  {
    slug: 'roofing-quoting-software-vs-spreadsheets',
    title: 'Roofing Quoting Software vs Spreadsheets: What Actually Saves Time?',
    description: 'Spreadsheets can work for roofing quotes, but they start to slow businesses down when measurements, pricing, approvals, material orders, job details and invoicing need to stay connected.',
    date: '2026-05-11',
    lastModified: '2026-05-11',
    cluster: 'Quoting software',
    contentType: 'comparison',
    targetQuery: 'roofing quoting software vs spreadsheets',
    searchIntent: 'commercial',
  },
  {
    slug: 'built-by-a-roofer',
    title: 'Built From Roofing Experience: The Story Behind QuoteCore+',
    description: 'QuoteCore+ was shaped by real roofing and construction experience, with Shaun leading the product direction around the quoting and job workflow problems trades businesses deal with every day.',
    date: '2026-05-06',
    lastModified: '2026-05-06',
    cluster: 'Company story',
    contentType: 'editorial',
    targetQuery: 'quotecore plus founder story',
    searchIntent: 'navigational',
  },
  {
    slug: 'construction-quote-speed-checklist',
    title: 'The Construction Quote Speed Checklist',
    description: 'A practical checklist for construction businesses that want to send quotes faster without rushing the numbers or losing track of job details.',
    date: '2026-06-05',
    lastModified: '2026-06-05',
    cluster: 'Quoting workflow',
    contentType: 'practical-guide',
    targetQuery: 'construction quote speed checklist',
    searchIntent: 'informational',
  },
  {
    slug: 'how-to-get-more-work-as-a-contractor',
    title: 'How to Get More Work as a Contractor: 7 Things to Fix Before You Spend Money on Ads',
    description: 'Most contractors don\u2019t struggle because they\u2019re bad at the work - they struggle because getting work is left to chance. Here are 7 things to fix first, plus a free weekly checklist.',
    date: '2026-06-13',
    lastModified: '2026-06-13',
    cluster: 'Business growth',
    contentType: 'guide',
    targetQuery: 'how to get more work as a contractor',
    searchIntent: 'informational',
  },
  {
    slug: 'best-roofing-quoting-software-uk-2026',
    title: 'Best Roofing Quoting Software UK (2026): Compared for Contractors',
    description: 'Comparing the best roofing quoting software available to UK contractors in 2026. Honest breakdown of QuoteCore+, Sleepless Tradesman, Tradify, Jobber, Powered Now, Fergus, and EasyEstimate - with a comparison table and recommendations by business type.',
    date: '2026-06-15',
    lastModified: '2026-06-15',
    cluster: 'Quoting software',
    contentType: 'comparison',
    targetQuery: 'best roofing quoting software uk 2026',
    searchIntent: 'commercial',
  },
];

// Also check for MDX blog posts that aren't in the TSX list
const QC_BLOG_MDX = [
  {
    slug: 'roofing-quoting-software-uk',
    title: 'Roofing Quoting Software UK',
    description: 'MDX version',
    date: '2026-05-06',
    lastModified: '2026-05-06',
  },
  {
    slug: 'built-by-a-roofer',
    title: 'Built By a Roofer',
    description: 'MDX version',
    date: '2026-05-06',
    lastModified: '2026-05-06',
  },
];

// T3 Labs pages (legal pages and docs - not blog content per se, but worth cataloguing)
const T3L_CONTENT = [
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    description: 'T3 Labs cookie policy.',
    date: '2026-07-01',
    lastModified: '2026-07-28',
    cluster: 'Legal',
    contentType: 'editorial',
    targetQuery: null,
    searchIntent: 'navigational',
    destinationPath: 'content/legal/cookies.md',
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    description: 'T3 Labs privacy policy.',
    date: '2026-07-01',
    lastModified: '2026-07-28',
    cluster: 'Legal',
    contentType: 'editorial',
    targetQuery: null,
    searchIntent: 'navigational',
    destinationPath: 'content/legal/privacy.md',
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    description: 'T3 Labs terms of service.',
    date: '2026-07-01',
    lastModified: '2026-07-28',
    cluster: 'Legal',
    contentType: 'editorial',
    targetQuery: null,
    searchIntent: 'navigational',
    destinationPath: 'content/legal/terms.md',
  },
];

function readBlogContent(slug) {
  // Try TSX first
  const basePaths = [
    join(process.cwd(), '..', 'quotecore-plus-temp', 'app', '(marketing)', 'blog', '[slug]', 'content'),
    join(process.cwd(), 'app', '(marketing)', 'blog', '[slug]', 'content'),
  ];
  
  for (const basePath of basePaths) {
    // Try .tsx
    const tsxPath = join(basePath, `${slug}.tsx`);
    if (existsSync(tsxPath)) {
      const raw = readFileSync(tsxPath, 'utf-8');
      // Extract text content from the TSX (strip JSX tags, keep text)
      const textContent = raw
        .replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '')
        .replace(/export\s+default\s+function\s+\w+\s*\(\)\s*\{/, '')
        .replace(/return\s*\(/, '')
        .replace(/\);\s*\}/, '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/\{[^}]*\}/g, '')
        .replace(/\\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      return textContent;
    }
    
    // Try .mdx
    const mdxPath = join(basePath, `${slug}.mdx`);
    if (existsSync(mdxPath)) {
      return readFileSync(mdxPath, 'utf-8');
    }
  }
  
  return null;
}

function readT3LContent(destinationPath) {
  const basePaths = [
    join(process.cwd(), '..', 't3-labs-temp', destinationPath),
    join(process.cwd(), '..', 't3-labs', destinationPath),
  ];
  
  for (const p of basePaths) {
    if (existsSync(p)) {
      return readFileSync(p, 'utf-8');
    }
  }
  return null;
}

function generateContentCode(projectCode, slug) {
  // Generate a stable content code like QC-BLOG-001
  const slugHash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 999;
  return `${projectCode}-BLOG-${String(slugHash).padStart(3, '0')}`;
}

function extractInternalLinks(markdown) {
  const links = [];
  // Match [text](/path) - internal links
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const anchorText = match[1];
    const url = match[2];
    // Only internal links (starting with /)
    if (url.startsWith('/') && !url.startsWith('//')) {
      links.push({ anchorText, url });
    }
  }
  // Also match href="/..." in JSX
  const hrefRegex = /href="([^"]+)"/g;
  while ((match = hrefRegex.exec(markdown)) !== null) {
    const url = match[1];
    if (url.startsWith('/') && !url.startsWith('//')) {
      links.push({ anchorText: '', url });
    }
  }
  return links;
}

async function importContent() {
  await getProjectIds();
  console.log('Project IDs:', PROJECT_IDS);

  let imported = 0;
  let skipped = 0;

  // Import QuoteCore+ blog posts
  console.log('\n--- Importing QuoteCore+ blog posts ---');
  for (const post of QC_BLOG_POSTS) {
    const contentCode = generateContentCode('QC', post.slug);
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('content_items')
      .select('id')
      .eq('content_code', contentCode)
      .single();
    
    if (existing) {
      console.log(`  SKIP: ${contentCode} - ${post.title} (already exists)`);
      skipped++;
      continue;
    }

    const bodyMarkdown = readBlogContent(post.slug) || '';
    
    const contentItem = {
      content_code: contentCode,
      project_id: PROJECT_IDS['QC'],
      title: post.title,
      summary: post.description,
      body_markdown: bodyMarkdown.substring(0, 50000), // Cap at 50KB
      status: 'live',
      cluster: post.cluster,
      content_type: post.contentType,
      target_query: post.targetQuery,
      search_intent: post.searchIntent,
      audience: 'Trades contractors',
      slug: post.slug,
      destination_path: `app/(marketing)/blog/[slug]/content/${post.slug}.tsx`,
      canonical_url: `https://quote-core.com/blog/${post.slug}`,
      locale: 'en-NZ',
      author_name: 'Shaun',
      excerpt: post.description,
      meta_title: `${post.title} | QuoteCore+`,
      meta_description: post.description,
      version: 1,
      sync_status: 'verified-live',
      published_at: post.date,
    };

    const { data, error } = await supabase
      .from('content_items')
      .insert(contentItem)
      .select()
      .single();
    
    if (error) {
      console.error(`  ERROR: ${contentCode} - ${error.message}`);
      continue;
    }
    
    console.log(`  IMPORTED: ${contentCode} - ${post.title}`);
    imported++;

    // Extract and store internal links
    const internalLinks = extractInternalLinks(bodyMarkdown);
    for (const link of internalLinks) {
      // Try to find a matching content item by slug
      const linkSlug = link.url.replace('/blog/', '').replace(/^\//, '');
      const { data: targetContent } = await supabase
        .from('content_items')
        .select('id')
        .or(`slug.eq.${linkSlug},slug.eq.${link.url}`)
        .limit(1)
        .single();
      
      const linkRecord = {
        source_content_id: data.id,
        target_content_id: targetContent?.id || null,
        target_url: link.url,
        anchor_text: link.anchorText || null,
        link_scope: link.url.startsWith('/blog/') ? 'same-project' : 'same-project',
        state: 'present',
        source: 'markdown-parser',
        reason: 'Found in imported blog content',
      };
      
      await supabase.from('content_links').insert(linkRecord);
    }
    
    if (internalLinks.length > 0) {
      console.log(`    -> ${internalLinks.length} internal links found`);
    }
  }

  // Import T3 Labs content
  console.log('\n--- Importing T3 Labs content ---');
  for (const page of T3L_CONTENT) {
    const contentCode = generateContentCode('T3L', page.slug);
    
    const { data: existing } = await supabase
      .from('content_items')
      .select('id')
      .eq('content_code', contentCode)
      .single();
    
    if (existing) {
      console.log(`  SKIP: ${contentCode} - ${page.title} (already exists)`);
      skipped++;
      continue;
    }

    const bodyMarkdown = readT3LContent(page.destinationPath) || '';
    
    const contentItem = {
      content_code: contentCode,
      project_id: PROJECT_IDS['T3L'],
      title: page.title,
      summary: page.description,
      body_markdown: bodyMarkdown.substring(0, 50000),
      status: 'live',
      cluster: page.cluster,
      content_type: page.contentType,
      target_query: page.targetQuery,
      search_intent: page.searchIntent,
      audience: 'Website visitors',
      slug: page.slug,
      destination_path: page.destinationPath,
      canonical_url: `https://t3labs.tech/${page.slug}`,
      locale: 'en-NZ',
      author_name: 'T3 Labs',
      excerpt: page.description,
      meta_title: `${page.title} | T3 Labs`,
      meta_description: page.description,
      version: 1,
      sync_status: 'verified-live',
      published_at: page.date,
    };

    const { data, error } = await supabase
      .from('content_items')
      .insert(contentItem)
      .select()
      .single();
    
    if (error) {
      console.error(`  ERROR: ${contentCode} - ${error.message}`);
      continue;
    }
    
    console.log(`  IMPORTED: ${contentCode} - ${page.title}`);
    imported++;
  }

  // Log activity
  if (imported > 0) {
    await supabase.from('activity_log').insert({
      project_id: PROJECT_IDS['QC'],
      activity_type: 'import-run',
      actor_name: 'Ron (agent)',
      actor_type: 'agent',
      detail: { imported, skipped, source: 'blog-posts-import-script' },
    });
  }

  console.log(`\n=== Import complete: ${imported} imported, ${skipped} skipped ===`);
}

importContent().catch(console.error);
