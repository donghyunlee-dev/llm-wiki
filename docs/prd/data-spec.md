# Data Spec

## Source-of-Truth Rule
Confluence page content and hierarchy are the source of truth. The product must not create a separate relational application data store for wiki content.

## Content Types
- Guide
- Project Example
- Library Resource
- FAQ
- Project Design Entry

## Canonical Metadata Key
Confluence content property key: `wiki.metadata`

```json
{
  "docType": "overview",
  "visibility": "public",
  "audience": "intermediate",
  "status": "published",
  "prerequisites": [],
  "next": [],
  "related": [],
  "owner": "platform-team",
  "lastReviewedAt": "2026-04-28",
  "reviewCycleDays": 90,
  "keywords": ["wiki", "guide"]
}
```

## Field Rules
| Field | Type | Allowed Values | Required |
| --- | --- | --- | --- |
| `docType` | string | `overview`, `concept`, `tutorial`, `howto`, `reference`, `troubleshooting`, `example`, `ops` | Yes |
| `visibility` | string | `public`, `internal` | Yes |
| `audience` | string | `beginner`, `intermediate`, `advanced` | Yes |
| `status` | string | `draft`, `reviewed`, `published` | Yes |
| `prerequisites` | string[] | Confluence page IDs | Yes |
| `next` | string[] | Confluence page IDs | Yes |
| `related` | string[] | Confluence page IDs | Yes |
| `owner` | string | team or user key | No |
| `lastReviewedAt` | date string | `YYYY-MM-DD` | No |
| `reviewCycleDays` | integer | positive integer | No |
| `keywords` | string[] | search terms | No |

## Public Visibility Rule
A page is user-visible only when:
- It belongs to the configured Confluence space.
- Confluence page status is `current`.
- `wiki.metadata.visibility = public`.
- `wiki.metadata.status = published`.
- `wiki.metadata.docType != ops`.

## Core Application Models
```text
WikiPage
- id
- title
- parentId
- spaceId
- version
- bodyHtml
- sourceUrl
- metadata
- headings
- ancestors
- labels

WikiMetadata
- docType
- visibility
- audience
- status
- prerequisites[]
- next[]
- related[]
- owner?
- lastReviewedAt?
- reviewCycleDays?
- keywords[]

GraphEdge
- sourcePageId
- targetPageId
- type: prerequisite | next | related | parent | ai_suggested
- confidence?
- rationale?
```

## Validation Errors
- `missing_metadata`
- `invalid_enum`
- `broken_reference`
- `inaccessible_reference`
- `stale_review`

## MVP Storage Policy
- No RDBMS schema
- No local content duplication as product truth
- Optional memory cache only
- Attachment references stay in Confluence and are resolved on demand
