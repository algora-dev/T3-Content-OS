// ═══════════════════════════════════════════════════════════════════════
// Markdown Front-Matter Schema Validator
// Versioned contract for import/export of content
// ═══════════════════════════════════════════════════════════════════════

export const FRONTMATTER_SCHEMA_VERSION = 1;

export interface FrontMatter {
  schema_version: number;
  content_code: string;
  project: string;
  title: string;
  status: string;
  content_type: string;
  cluster?: string;
  target_query?: string;
  search_intent?: string;
  audience?: string;
  slug: string;
  meta_title?: string;
  meta_description?: string;
  excerpt?: string;
  author_name?: string;
  locale?: string;
  canonical_url?: string;
  destination_path?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  frontMatter: FrontMatter | null;
  body: string | null;
}

// ── Required fields ───────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof FrontMatter)[] = [
  'schema_version',
  'content_code',
  'project',
  'title',
  'status',
  'content_type',
  'slug',
];

// ── Valid enum values ─────────────────────────────────────────────────

const VALID_STATUS = [
  'draft', 'in-review', 'changes-requested', 'approved', 'exported', 'live', 'archived',
];

const VALID_CONTENT_TYPE = [
  'guide', 'comparison', 'editorial', 'landing-page', 'tool',
  'pillar-guide', 'practical-guide', 'educational-guide',
  'workflow-guide', 'roundup', 'case-study',
];

const VALID_SEARCH_INTENT = [
  'informational', 'commercial', 'transactional', 'navigational',
];

// ── Trusted fields that import must NOT accept as authority ───────────

const UNTRUSTED_IMPORT_FIELDS = [
  'role', 'approval', 'live', 'token', 'user', 'audit',
];

// ── Parse YAML front matter (simple parser, no external deps) ─────────

function parseFrontMatter(raw: string): { yaml: string; body: string } | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;

  return { yaml: match[1], body: match[2] };
}

function parseYamlSimple(yaml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = yaml.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      result[key] = value.slice(1, -1);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ── Main validation function ──────────────────────────────────────────

export function validateMarkdown(raw: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check size limit (1MB)
  if (raw.length > 1024 * 1024) {
    errors.push('File exceeds 1MB limit');
    return { valid: false, errors, warnings, frontMatter: null, body: null };
  }

  const parsed = parseFrontMatter(raw);
  if (!parsed) {
    errors.push('Missing YAML front matter (--- delimited)');
    return { valid: false, errors, warnings, frontMatter: null, body: null };
  }

  const yamlData = parseYamlSimple(parsed.yaml);

  // Check for untrusted fields
  for (const untrusted of UNTRUSTED_IMPORT_FIELDS) {
    if (untrusted in yamlData) {
      errors.push(`Field '${untrusted}' is not accepted from imported content`);
    }
  }

  // Check schema version
  const schemaVersion = parseInt(yamlData['schema_version'], 10);
  if (isNaN(schemaVersion)) {
    errors.push('Missing or invalid schema_version');
  } else if (schemaVersion > FRONTMATTER_SCHEMA_VERSION) {
    errors.push(`Schema version ${schemaVersion} is newer than supported version ${FRONTMATTER_SCHEMA_VERSION}`);
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!yamlData[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate enum fields
  if (yamlData['status'] && !VALID_STATUS.includes(yamlData['status'])) {
    errors.push(`Invalid status: ${yamlData['status']}`);
  }

  if (yamlData['content_type'] && !VALID_CONTENT_TYPE.includes(yamlData['content_type'])) {
    errors.push(`Invalid content_type: ${yamlData['content_type']}`);
  }

  if (yamlData['search_intent'] && !VALID_SEARCH_INTENT.includes(yamlData['search_intent'])) {
    errors.push(`Invalid search_intent: ${yamlData['search_intent']}`);
  }

  // Warnings for recommended fields
  if (!yamlData['meta_title']) {
    warnings.push('Missing recommended field: meta_title');
  }
  if (!yamlData['meta_description']) {
    warnings.push('Missing recommended field: meta_description');
  }
  if (!yamlData['target_query']) {
    warnings.push('Missing recommended field: target_query');
  }
  if (!yamlData['excerpt']) {
    warnings.push('Missing recommended field: excerpt');
  }

  // Check for unsafe HTML in body
  if (parsed.body) {
    const unsafeHtml = parsed.body.match(/<(?!\/?(?:h[1-6]|p|ul|ol|li|a|strong|em|blockquote|code|pre|hr|br|img|table|thead|tbody|tr|th|td|div|span)\b)[^>]+>/i);
    if (unsafeHtml) {
      errors.push(`Unsafe raw HTML detected: ${unsafeHtml[0].slice(0, 50)}`);
    }
  }

  // Build front matter object
  const frontMatter: FrontMatter | null = errors.length === 0 ? {
    schema_version: schemaVersion || FRONTMATTER_SCHEMA_VERSION,
    content_code: yamlData['content_code'],
    project: yamlData['project'],
    title: yamlData['title'],
    status: yamlData['status'],
    content_type: yamlData['content_type'],
    cluster: yamlData['cluster'],
    target_query: yamlData['target_query'],
    search_intent: yamlData['search_intent'],
    audience: yamlData['audience'],
    slug: yamlData['slug'],
    meta_title: yamlData['meta_title'],
    meta_description: yamlData['meta_description'],
    excerpt: yamlData['excerpt'],
    author_name: yamlData['author_name'],
    locale: yamlData['locale'] || 'en-NZ',
    canonical_url: yamlData['canonical_url'],
    destination_path: yamlData['destination_path'],
  } : null;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    frontMatter,
    body: parsed.body,
  };
}

// ── Deterministic export serializer ───────────────────────────────────

export function serializeMarkdown(fm: FrontMatter, body: string): string {
  const lines: string[] = ['---'];

  // Deterministic key order
  const orderedKeys: (keyof FrontMatter)[] = [
    'schema_version', 'content_code', 'project', 'title', 'status',
    'content_type', 'cluster', 'target_query', 'search_intent', 'audience',
    'slug', 'destination_path', 'canonical_url', 'locale', 'author_name',
    'excerpt', 'meta_title', 'meta_description',
  ];

  for (const key of orderedKeys) {
    const value = fm[key];
    if (value !== undefined && value !== null && value !== '') {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('---', '');
  lines.push(body);

  return lines.join('\n');
}

// ── Extract links from Markdown body ──────────────────────────────────

export interface ParsedLink {
  url: string;
  anchorText: string;
}

export function parseMarkdownLinks(body: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  const pattern = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(body)) !== null) {
    links.push({
      anchorText: match[1],
      url: match[2],
    });
  }

  return links;
}
