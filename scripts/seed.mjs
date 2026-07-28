// Seed initial data: projects, auth users, and project memberships
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qajlafodnjpqfsvmxevq.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhamxhZm9kbmpwcWZzdm14ZXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI0MTcwMiwiZXhwIjoyMTAwODE3NzAyfQ.3Wn5AkdheeP21sShHUJeXYbGclB1DN3GrjH8gSFpg8I';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
  // 1. Create auth users
  console.log('Creating auth users...');

  const { data: shaun, error: shaunErr } = await supabase.auth.admin.createUser({
    email: 'secarter23@gmail.com',
    password: 'T3ContentOS!Admin2026',
    email_confirm: true,
    user_metadata: { full_name: 'Shaun Carter' },
  });

  if (shaunErr) {
    console.error('Shaun:', shaunErr.message);
  } else {
    console.log('Shaun created:', shaun.user.id);
  }

  const { data: cece, error: ceceErr } = await supabase.auth.admin.createUser({
    email: 'cece.carson1@hotmail.com',
    password: 'T3ContentOS!Editor2026',
    email_confirm: true,
    user_metadata: { full_name: 'Cece Carson' },
  });

  if (ceceErr) {
    console.error('Cece:', ceceErr.message);
  } else {
    console.log('Cece created:', cece.user.id);
  }

  // 2. Seed projects
  console.log('\nSeeding projects...');

  const projects = [
    {
      code: 'QC',
      slug: 'quotecore',
      name: 'QuoteCore+',
      description: 'Construction quoting and job management SaaS',
      brand_color: '#FF6B35',
      canonical_base_url: 'https://quote-core.com',
      repository: 'algora-dev/quotecore-plus',
      content_root: 'content/blog',
      route_pattern: '/blog/{slug}',
      default_locale: 'en-NZ',
      active: true,
    },
    {
      code: 'T3L',
      slug: 't3labs',
      name: 'T3 Labs',
      description: 'Parent company website and product showcase',
      brand_color: '#d7ff00',
      canonical_base_url: 'https://t3labs.tech',
      repository: 'algora-dev/t3-labs',
      content_root: 'content',
      route_pattern: '/{slug}',
      default_locale: 'en-NZ',
      active: true,
    },
    {
      code: 'T3P',
      slug: 't3play',
      name: 'T3 Play',
      description: 'Gaming and entertainment (Poly Gunnerz)',
      brand_color: '#7656d8',
      canonical_base_url: 'https://t3play.com',
      repository: 'algora-dev/t3-play',
      content_root: 'content',
      route_pattern: '/blog/{slug}',
      default_locale: 'en-NZ',
      active: true,
    },
  ];

  for (const project of projects) {
    const { data, error } = await supabase.from('projects').upsert(project, { onConflict: 'code' }).select().single();
    if (error) {
      console.error(`Project ${project.code}:`, error.message);
    } else {
      console.log(`Project ${project.code} seeded:`, data.id);

      // 3. Assign Shaun as admin
      if (shaun?.user) {
        const { error: memberErr } = await supabase.from('project_members').upsert({
          user_id: shaun.user.id,
          project_id: data.id,
          role: 'admin',
        }, { onConflict: 'user_id,project_id' });

        if (memberErr) {
          console.error(`  Shaun membership:`, memberErr.message);
        } else {
          console.log(`  Shaun assigned as admin`);
        }
      }

      // 4. Assign Cece as editor
      if (cece?.user) {
        const { error: memberErr } = await supabase.from('project_members').upsert({
          user_id: cece.user.id,
          project_id: data.id,
          role: 'editor',
        }, { onConflict: 'user_id,project_id' });

        if (memberErr) {
          console.error(`  Cece membership:`, memberErr.message);
        } else {
          console.log(`  Cece assigned as editor`);
        }
      }
    }
  }

  console.log('\n=== Seed complete ===');
  console.log('Shaun: secarter23@gmail.com / T3ContentOS!Admin2026');
  console.log('Cece: cece.carson1@hotmail.com / T3ContentOS!Editor2026');
  console.log('\nChange passwords after first login.');
}

seed().catch(console.error);
