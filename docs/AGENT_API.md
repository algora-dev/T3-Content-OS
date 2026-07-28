# Content OS Agent API

Base URL: `https://t3-content-os-five.vercel.app` (will be `https://content.t3labs.tech`)

## Authentication

All agent API requests use Bearer token auth:

```
Authorization: Bearer tcos_<your-token>
```

Tokens are created by an admin in the Content OS admin panel. Each token has:
- **Scopes**: what actions the agent can perform
- **Project IDs**: which projects the agent can access
- **Expiry**: optional expiration date

## Available Scopes

| Scope | Description |
|---|---|
| `ideas:read` | List and view ideas |
| `ideas:claim` | Claim, heartbeat, and release ideas |
| `content:read` | List and view content items |
| `content:create` | Create new content drafts |
| `content:update-draft` | Update drafts and submit for review |
| `links:suggest` | Suggest internal/external links for content |

## Endpoints

### Projects

#### `GET /api/v1/projects`
Returns projects accessible to this token.

**Response:**
```json
{
  "data": [
    { "id": "uuid", "code": "QC", "name": "QuoteCore+", ... }
  ],
  "total": 1
}
```

### Ideas

#### `GET /api/v1/ideas?status=ready&project=<uuid>`
List ideas. Optional filters: `status`, `project`.

#### `POST /api/v1/ideas/:id/claim`
Atomically claim an idea. Lease defaults to 30 minutes.

**Body:**
```json
{
  "agent_name": "Ron",
  "lease_minutes": 30
}
```

#### `POST /api/v1/ideas/:id/heartbeat`
Extend the claim lease. Must be the same agent who claimed it.

**Body:**
```json
{ "extend_minutes": 30 }
```

#### `POST /api/v1/ideas/:id/release`
Release a claim back to `ready` status. Must be the same agent.

### Content

#### `GET /api/v1/content?project=<uuid>&status=draft`
List content items. Optional filters: `project`, `status`.

#### `GET /api/v1/content/:id`
Get a single content item with all fields.

#### `POST /api/v1/content`
Create a new content draft.

**Headers:** `X-Idempotency-Key: <unique-key>` (recommended)

**Body:**
```json
{
  "project_id": "uuid",
  "source_idea_id": "uuid",
  "title": "How to Choose Roofing Software",
  "body_markdown": "# Draft content here...",
  "cluster": "Quoting software",
  "content_type": "guide",
  "target_query": "roofing software guide",
  "search_intent": "informational",
  "slug": "how-to-choose-roofing-software",
  "destination_path": "app/(marketing)/blog/[slug]/content/how-to-choose-roofing-software.tsx",
  "author_name": "Ron",
  "excerpt": "A practical guide to choosing roofing software.",
  "meta_title": "How to Choose Roofing Software | QuoteCore+",
  "meta_description": "Guide to selecting the right roofing software for your business."
}
```

#### `PATCH /api/v1/content/:id`
Update a draft with optimistic locking. Content must be in `draft` or `changes-requested` status.

**Body:**
```json
{
  "version": 1,
  "title": "Updated title",
  "body_markdown": "Updated content...",
  "meta_title": "Updated SEO Title"
}
```

Version must match the current version. On success, version increments by 1. On mismatch, returns 409 Conflict.

#### `POST /api/v1/content/:id/submit-review`
Submit a draft for human review. Changes status from `draft` or `changes-requested` to `in-review`.

#### `GET /api/v1/content/:id/markdown`
Export content as validated Markdown with YAML front matter.

#### `POST /api/v1/content/:id/markdown`
Import Markdown body. Validates front matter, parses links, creates revision snapshot.

**Body:** Raw markdown string (with `---` front matter delimiters).

#### `GET /api/v1/content/:id/link-context`
Get link context: outgoing links, incoming links, related content, cannibalisation warnings.

#### `POST /api/v1/content/:id/link-suggestions`
Suggest a link for an editor to review.

**Body:**
```json
{
  "target_content_id": "uuid",
  "target_url": "/blog/some-article",
  "anchor_text": "roofing quoting software",
  "link_scope": "same-project",
  "reason": "Both articles target roofing software queries - internal link strengthens topical authority."
}
```

## Error Responses

All errors follow this format:

```json
{
  "data": null,
  "error": {
    "code": "CONFLICT",
    "message": "Version conflict: expected 1 but current is 2",
    "detail": null
  }
}
```

| HTTP Status | Code | Meaning |
|---|---|---|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Token lacks required scope or project access |
| 404 | NOT_FOUND | Resource doesn't exist |
| 409 | CONFLICT | Version mismatch or claim conflict |
| 422 | VALIDATION_ERROR | Invalid request body |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |

## Workflow Summary

```
1. GET /api/v1/ideas?status=ready
2. POST /api/v1/ideas/:id/claim
3. POST /api/v1/content (with source_idea_id)
4. PATCH /api/v1/content/:id (repeat as needed)
5. POST /api/v1/content/:id/link-suggestions (optional)
6. POST /api/v1/content/:id/submit-review
7. POST /api/v1/ideas/:id/release
```

Agents cannot: approve content, export content, mark content live, manage users, or manage tokens.

## Rate Limiting

- 60 requests per minute per token (planned)
- Request size limit: 1MB

## Idempotency

For content creation, send an `X-Idempotency-Key` header. If a content item with the same title and source_idea_id already exists, the existing item is returned instead of creating a duplicate.
