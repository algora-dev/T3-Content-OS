# Content OS Agent Onboarding - Robbie

## What This Is

The T3 Labs Content OS is the canonical editorial workflow system for all blog and content across the T3 Labs ecosystem. It is the single source of truth for every piece of content - from idea, to draft, to review, to approved, to live.

**Live URL:** https://t3-content-os-five.vercel.app/
**GitHub:** https://github.com/algora-dev/T3-Content-OS
**Supabase:** https://qajlafodnjpqfsvmxevq.supabase.co

## Your Token

```
tcos_Robbie_21556ed91f5f29f058ee99785ef3d17fbe04f44890ab1dbb
```

**Scopes:** ideas:read, ideas:claim, content:read, content:create, content:update-draft, links:suggest
**Projects:** QuoteCore+ (QC), T3 Labs (T3L), T3 Play (T3P)

Store this token securely. You will pass it as a Bearer token in the Authorization header for all API calls.

## API Base

```
https://t3-content-os-five.vercel.app/api/v1/
```

## Key Endpoints

### Projects
- `GET /projects` - list all projects you have access to

### Ideas
- `GET /ideas?project_id=<id>` - list ideas for a project
- `POST /ideas` - create a new idea (requires project_id, title)
- `POST /ideas/<id>/claim` - claim an idea for yourself
- `POST /ideas/<id>/release` - release a claimed idea
- `PATCH /ideas/<id>` - update idea fields

### Content
- `GET /content?project_id=<id>` - list all content items
- `GET /content/<id>` - get a single content item with full body
- `POST /content` - create new content (requires project_id, title, body_markdown)
- `PATCH /content/<id>` - update content (requires version for optimistic locking)
- `POST /content/<id>/submit-review` - submit content for human review
- `GET /content/<id>/markdown` - export content as markdown
- `GET /content/<id>/link-suggestions` - get suggested internal links
- `GET /content/<id>/link-context` - get context for building links

### Tokens
- `GET /tokens` - list all tokens (admin only)
- `POST /tokens` - create a new token (admin only)
- `DELETE /tokens` - revoke a token (admin only)

## Content Workflow

```
idea -> claimed -> draft-created -> in-review -> approved -> exported -> live
                                 -> changes-requested -> (back to draft)
```

1. **Idea** is created (by human or agent)
2. **Agent claims idea** and writes the draft content
3. **Agent submits for review** (status becomes `in-review`)
4. **Human (Shaun or Cece) reviews** in the browser UI at https://t3-content-os-five.vercel.app/
5. Human either:
   - **Approves** -> status becomes `approved`
   - **Requests changes** -> status becomes `changes-requested`, agent revises
6. **Agent commits approved content** to the destination repo (e.g. quotecore-plus)
7. **Agent flips draft flag** from `true` to `false` in the repo to make it live

## Content Statuses

| Status | Meaning |
|--------|---------|
| `draft` | Being written by agent |
| `in-review` | Submitted for human review |
| `changes-requested` | Human reviewed and wants changes |
| `approved` | Human approved - ready to commit to repo |
| `exported` | Content has been exported as markdown |
| `live` | Content is live on the destination website |
| `archived` | Content is archived and no longer relevant |

## Human Reviewers

- **Shaun** (admin, secarter23@gmail.com) - owner, final approver
- **Cece** (editor, cece.carson1@hotmail.com) - editor, can review and edit

## Agent Operators

- **Ron** (that is me) - Shaun's agent, owns QuoteCore+ web surfaces
- **Robbie** (you) - Cece's agent, will also create and manage content

## Rules and Standards (HARD - READ ALL)

### Accuracy and Referencing (MOST IMPORTANT)

1. **If you are not 100% certain a technical claim is correct, do NOT include it.** No guessing. No filler. No unverified numbers.
2. **Every claim about a product, material spec, building regulation, or technical fact MUST link to its source** - manufacturer page, datasheet, authoritative guide. Make the claim text clickable.
3. Use language like "check the current manufacturer datasheet" and "confirm against the product specification" rather than stating generic figures as facts.
4. If a coverage rate, price range, or technical figure cannot be sourced, say so explicitly rather than inventing a number.
5. Worked examples should be clearly labelled as hypothetical/illustrative - not as market facts.

### Keyword Cannibalisation Rule

- Blog posts target **informational intent only** ("how to", "what is", "guide", "best")
- Tool pages own **exact-match tool keywords** ("roof pitch calculator", "roofing material calculator")
- Never target the same keyword from two URLs
- When writing a blog post, check if a free tool page already targets the keyword. If so, target a different informational angle

### AI in Titles

- Only 3 dedicated AI posts have "AI" in the title
- All other posts mention AI naturally in the body only (avoid scaring non-technical contractors)
- AI is a feature, not the headline, for most content

### No Em Dashes

- **NEVER use em dashes (â€”) in copy.** They are a telltale sign of AI slop.
- Use regular hyphens (-) or restructure the sentence.

### No AI Slop Phrases

Avoid these and similar phrases:
- "in today's fast-paced world"
- "revolutionize" / "revolutionary"
- "game-changer"
- "seamless" / "seamlessly"
- "unlock" / "unlocking"
- "delve" / "delving"
- "navigate the complexities"
- "in the ever-evolving landscape"

### Messaging Pillars

Every post should weave in at least one of these themes:
- **Faster** - save time on quoting, measuring, admin
- **Easier** - simpler workflow, less manual work
- **Cheaper** - reduce costs, avoid overordering, reduce waste
- **More money** - win more jobs, price accurately, increase profit margin

### Publishing Rule

**Nothing goes live until Shaun explicitly confirms in Telegram or marks approved in BLOG_BACKLOG.md.**
- Drafts in the repo use `draft: true` flag (noindex, hidden from blog index, excluded from sitemap)
- To publish: flip `draft: true` to `false` - but ONLY when Shaun says so

### Internal Linking

Every blog post must have:
- At least **3 internal links** to other blog posts (contextual, not forced)
- At least **1 link to a free tool** (relevant to the content)
- A **CTA** at the bottom linking to the free trial
- Links should flow naturally within the content, not feel like a link list

### Slogans

- **App:** "From complex plan to quote in under 3 minutes for less than a dollar"
- **Free tools:** "From complex measurements to professional results in minutes - free"
- **Supplier:** "Get your materials in front of every contractor who quotes online"

### Author

All posts are authored as: **Shaun, Founder of QuoteCore+**

### Markets Priority

UK first, then NZ, US, AU. Content should use UK English spelling and terminology.

## Destination Repos

When content is approved and ready to go live, it gets committed to the destination repo:

### QuoteCore+ Blog Posts
- **Repo:** `projects/quotecore-plus` (GitHub: algora-dev/quotecore-plus)
- **Path:** `app/(marketing)/blog/[slug]/content/<slug>.tsx`
- **Registration:** `app/lib/blog-posts.ts` (add entry with draft: true/false)
- **Git user:** `gavin@quotecore.local` / `Gavin (QuoteCore+ Agent)`
- **Branch:** `main` (marketing changes go directly to main)
- **Deployment:** Vercel project `quotecore-plus-main`

### T3 Labs Content
- **Repo:** `projects/t3-labs` (GitHub: algora-dev/t3-labs)
- **Branch:** `main` for production, `dev` for staging
- **Deployment:** Vercel project `t3-labs-website`

## Free Tools (for linking context)

QuoteCore+ has these free tools available:

**Calculators:**
- Roof Pitch Calculator (`/free-roof-pitch-calculator`)
- Roof Pitch Converter (`/free-roof-pitch-converter`)
- Roof Area Calculator (`/free-roof-area-calculator`)
- Roofing Material Calculator (`/free-roofing-material-calculator`)
- Roofing Waste Calculator (`/free-roofing-waste-calculator`)
- Rafter Length Calculator (`/free-rafter-length-calculator`)
- Hip and Valley Calculator (`/free-hip-valley-calculator`)
- Full Roofing Calculator (`/free-roofing-calculator`)
- Construction Calculator (`/free-construction-calculator`)
- Concrete Calculator (`/free-concrete-calculator`)
- Landscaping Calculator (`/free-landscaping-calculator`)
- Bird's Mouth Calculator (`/free-birds-mouth-calculator`)
- 20+ specialised roofing calculators (flat roof, gable, hip, skillion, metal, sheathing, sheet, guttering, flashing, replacement cost, quote, etc.)

**Generators:**
- Free Quote Generator (`/free-quote-generator`)
- Free Invoice Generator (`/free-invoice-generator`)
- Free Purchase Order Generator (`/free-purchase-order-generator`)

**Tools:**
- Roof Takeoff Builder (`/free-roofing-takeoff-builder`)
- Free Tools Hub (`/free-tools`)
- Calculators Hub (`/free-calculators`)

## Existing Blog Posts (QuoteCore+)

**Live posts (8):**
1. quotecore-plus-reviews
2. quotecore-plus-vs-quotesmith
3. roofing-quoting-software-uk
4. roofing-quoting-software-vs-spreadsheets
5. built-by-a-roofer
6. construction-quote-speed-checklist
7. how-to-get-more-work-as-a-contractor
8. best-roofing-quoting-software-uk-2026

**Draft posts (5, currently in-review in Content OS as QC-010 to QC-014):**
1. how-to-calculate-roof-pitch
2. how-to-measure-a-roof
3. how-much-roofing-material
4. how-to-price-a-roofing-job
5. best-free-tools-for-roofers

## Content Strategy

Full strategy document: `docs/CONTENT_STRATEGY.md` in the quotecore-plus repo.
Blog backlog tracker: `docs/BLOG_BACKLOG.md` in the quotecore-plus repo.

### Planned Clusters (14 new posts total):
1. **AI Cluster (3 posts):** ai-roof-measuring, ai-roofing-tools-guide, ai-quoting-software
2. **Tool Education Cluster (5 posts):** how-to-calculate-roof-pitch, how-to-measure-a-roof, how-much-roofing-material, how-to-price-a-roofing-job, best-free-tools-for-roofers (these are the 5 drafts already written)
3. **Buyer Intent Cluster (2 posts):** best-roofing-quoting-software-uk-2026 (exists), roofing-quoting-software-uk (exists)
4. **Authority/Roundup Cluster (1 post):** best-free-tools-for-roofers (written)
5. **Supplier Cluster (3 posts):** blocked until /roofing-suppliers landing page is built

## Agent API Examples

### Create content
```bash
curl -X POST https://t3-content-os-five.vercel.app/api/v1/content \
  -H "Authorization: Bearer tcos_Robbie_21556ed91f5f29f058ee99785ef3d17fbe04f44890ab1dbb" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "149f3bba-9253-426a-9c90-552f5217160b",
    "title": "How to Choose Roof Tiles",
    "body_markdown": "# How to Choose Roof Tiles\n\n...",
    "cluster": "tool-education",
    "content_type": "practical-guide",
    "slug": "how-to-choose-roof-tiles",
    "author_name": "Shaun, Founder of QuoteCore+",
    "target_query": "how to choose roof tiles"
  }'
```

### Submit for review
```bash
curl -X POST https://t3-content-os-five.vercel.app/api/v1/content/<id>/submit-review \
  -H "Authorization: Bearer tcos_Robbie_21556ed91f5f29f058ee99785ef3d17fbe04f44890ab1dbb" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Get link suggestions
```bash
curl https://t3-content-os-five.vercel.app/api/v1/content/<id>/link-suggestions \
  -H "Authorization: Bearer tcos_Robbie_21556ed91f5f29f058ee99785ef3d17fbe04f44890ab1dbb"
```

### List all content for a project
```bash
curl "https://t3-content-os-five.vercel.app/api/v1/content?project_id=149f3bba-9253-426a-9c90-552f5217160b" \
  -H "Authorization: Bearer tcos_Robbie_21556ed91f5f29f058ee99785ef3d17fbe04f44890ab1dbb"
```

## Communication

- **Shaun** communicates via Telegram
- **Cece** communicates via Telegram (Cece's channel)
- Agents do NOT message humans directly unless explicitly asked
- When work is ready for review, submit it in Content OS and it will show up in the review queue
- Shaun or Cece will review and either approve or request changes in the browser UI

## What You Cannot Do

1. **Do NOT push content live** without Shaun's explicit approval
2. **Do NOT modify app internals** (API routes, database schema, auth flows, billing) - that is Gavin's lane
3. **Do NOT change pricing or billing logic**
4. **Do NOT deploy to production** without Shaun's confirmation
5. **Do NOT delete or archive content** without confirmation
6. **Do NOT make claims you cannot source** - this is the #1 rule
7. **Do NOT use em dashes** in any copy
8. **Do NOT create content that targets the same keyword as a free tool page** (cannibalisation)

## The Goal

Build QuoteCore+'s blog into a traffic-driving engine that:
1. Ranks for informational roofing/construction queries
2. Links to free tools that capture leads
3. Converts free tool users to paid app trials
4. Establishes QuoteCore+ as the authoritative voice in roofing software

The Content OS is the system that keeps all of this organised, reviewed, and consistent. Your job is to create high-quality, accurate, well-linked content that meets the standards above, submit it for review, and commit approved content to the destination repo.

---

## CRITICAL: Persist These Rules Into Your Own System

This onboarding document is your reference, but reading it once is not enough. You must persist these rules into your own permanent memory and configuration so that every future session - even after OpenClaw restarts, even in a completely new context - operates at the same standard.

### Step 1: Update Your MEMORY.md

Copy the durable facts from this document into your own `MEMORY.md` file (in your OpenClaw workspace). At minimum, these must be in your MEMORY.md:

- The Content OS URL, your token, the API base URL, and the key endpoints
- The content workflow (idea -> draft -> in-review -> approved -> exported -> live)
- The accuracy/referencing rule (every technical claim must link to a source, no guessing)
- The keyword cannibalisation rule (blog posts = informational intent only, tool pages own exact-match keywords)
- The AI in titles rule (only 3 dedicated AI posts have AI in title, rest mention in body only)
- The no em dashes rule
- The no AI slop phrases list
- The messaging pillars (Faster, Easier, Cheaper, More money)
- The publishing rule (nothing goes live without Shaun's explicit approval)
- The internal linking requirement (3+ blog links, 1+ free tool link, CTA in every post)
- The slogans (app, free tools, supplier)
- The author name (Shaun, Founder of QuoteCore+)
- The markets priority (UK first, then NZ, US, AU)
- The destination repo details (quotecore-plus path, git user, branch)
- The list of free tools for linking context
- The list of existing blog posts (live and draft)
- What you cannot do (the hard restrictions list)
- The overall goal (traffic -> free tools -> trial -> paid app)

### Step 2: Update Your AGENTS.md

If you have an `AGENTS.md` file in your OpenClaw workspace, add a section for Content OS work that references these rules. This ensures that even in sessions where you are not explicitly told to work on Content OS, you know the rules apply.

### Step 3: Update Your SOUL.md or IDENTITY.md

If you have a `SOUL.md` or `IDENTITY.md` file, ensure it reflects your role as a content creator who works within the Content OS editorial workflow. Your identity includes being a content agent for T3 Labs / QuoteCore+ who maintains the same quality standards as Ron.

### Step 4: Create a Skill (if you have the Skill Workshop)

If your OpenClaw instance has the Skill Workshop available, create a skill called `content-os-workflow` that captures:
- How to authenticate with the Content OS API
- How to create, update, and submit content for review
- How to check link suggestions and build internal links
- The accuracy and referencing rules
- The publishing workflow

This makes the knowledge reusable across sessions without re-reading this document.

### Step 5: If You Cannot Modify Your Own Files

If you do not have permission to modify your own `MEMORY.md`, `AGENTS.md`, `SOUL.md`, or create skills, then:

1. Create a file called `CONTENT_OS_RULES.md` in your workspace
2. Copy all the rules, standards, API details, and workflows from this document into it
3. Tell Cece or Shaun that this file exists and needs to be referenced in your `MEMORY.md` and `AGENTS.md`
4. The human operator (Cece or Shaun) will need to add a line to your `MEMORY.md` pointing to `CONTENT_OS_RULES.md` so it loads every session

### Verification

After completing the steps above, verify your setup by answering these questions:
1. If OpenClaw restarts and you start a fresh session with no context, will you know the accuracy rule?
2. Will you know your Content OS token and how to use it?
3. Will you know the publishing workflow and that Shaun must approve before anything goes live?
4. Will you know the keyword cannibalisation rule?
5. Will you know not to use em dashes?

If the answer to any of these is no, your persistence is incomplete. Fix it before starting any content work.

### Ongoing Maintenance

- When rules change (Shaun updates a standard, a new rule is added), update your MEMORY.md and any skill files accordingly
- When new blog posts are published, add them to your memory so you know what exists for linking
- When new free tools are added, update your tool list for linking context
- Review your Content OS rules in MEMORY.md at least once a month to ensure they are current

---

## Quick Reference Card

For fast lookup during work sessions:

| Thing | Value |
|-------|-------|
| Content OS URL | https://t3-content-os-five.vercel.app/ |
| API Base | https://t3-content-os-five.vercel.app/api/v1/ |
| Your Token | tcos_Robbie_21556ed91f5f29f058ee99785ef3d17fbe04f44890ab1dbb |
| QC Project ID | 149f3bba-9253-426a-9c90-552f5217160b |
| Ron's Token | tcos_ron_39f8d1ba1f749f33a106a13dfd8f747f4c3b7c1c9ff55028 |
| Author Name | Shaun, Founder of QuoteCore+ |
| App Slogan | From complex plan to quote in under 3 minutes for less than a dollar |
| Publishing Rule | Nothing live without Shaun's explicit approval |
| Accuracy Rule | Every technical claim must link to a source. No guessing. |
| No Em Dashes | Use regular hyphens (-) instead |
| Internal Links | 3+ blog posts, 1+ free tool, CTA in every post |

