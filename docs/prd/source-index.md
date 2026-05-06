# Source Index

## Confluence Pages Read
| Page ID | Title | Role In Local Docs |
| --- | --- | --- |
| `63242286` | `AI Wiki Portal Platform` | Root product page and scope frame |
| `83623964` | `Development Prompt` | Primary UI/start-step source |
| `63504385` | `AI Wiki Portal Platform Overview` | Product philosophy and knowledge-platform direction |
| `74514483` | `[PRD] AI Wiki Metadata Graph Platform` | Detailed PRD and metadata-graph direction |
| `83001361` | `[Analysis] Wiki Platform Extraction Plan` | Analysis hub and migration intent |
| `83722253` | `[Architecture] Wiki Platform Target Architecture` | Target system boundaries and component map |
| `83623945` | `[Data Model] Wiki Metadata Graph Schema` | Metadata schema and validation model |
| `83001392` | `[API Spec] Wiki Platform API Contract` | API contract basis |
| `83755009` | `[AI Guide] Wiki AI Usage And Guardrails` | AI usage and write guardrails |
| `82739240` | `[Operations] Wiki Growth And Review Playbook` | Review loop and content quality rules |
| `83722272` | `[Migration] Wiki Project Separation Roadmap` | Phased implementation order |

## Attachment Read
| Parent Page ID | Attachment | Use |
| --- | --- | --- |
| `83623964` | `sfood_wiki_home.jsx` | Main Home screen visual and policy reference |

## Attachment Retrieval Note
- The attachment record for `sfood_wiki_home.jsx` was confirmed in Confluence.
- Raw attachment download from CLI redirected to Atlassian login during re-check on `2026-04-28`.
- Local implementation reference is therefore based on the `Development Prompt` page body plus the attachment metadata until an authenticated export path is added.

## Coverage Note
The root page children and the analysis hub children were enumerated and checked for additional descendants. No deeper child pages were returned from the inspected tree at the time of reading.

## Reconciliation Decisions
- The source analysis documents mention optional Redis or operator persistence, but this local document set narrows MVP storage to Confluence plus optional non-authoritative memory cache.
- The product wording is normalized around `SFOOD Wiki` and `LLM Wiki` for UI, while internal docs may still describe the platform as an AI Wiki portal.
