# Product PRD

## Product Definition
SFOOD Wiki is an internal knowledge wiki portal for employees. Users search or ask questions, review guides, project examples, library resources, and FAQ content, then move into project design when they are ready.

It is not a dashboard, not a project manager, and not a raw Confluence viewer. The product must present a guided, readable knowledge experience while hiding storage details from end users.

## One-line Definition
SFOOD Wiki helps employees search internal knowledge, review related guides, project examples, and FAQ answers, and continue into project design when needed.

## Core Principles
- Keep the main screen short, focused, and action-oriented.
- Do not expose implementation storage terms such as `Confluence`, `DB`, or `database` in user-facing UI.
- Do not introduce a separate application DB as the source of product truth.
- Use Confluence documents as the canonical content system and LLM context base.
- Treat project design as a secondary CTA after exploration, not the main entry behavior.

## Primary Users
- General internal employees who need practical guidance.
- Employees exploring automation or internal tooling ideas.
- Operators who curate visible documents and manage publication quality.

## User Flow
1. User lands on Home.
2. User searches or asks a question.
3. User opens a guide, project example, library resource, or FAQ.
4. User reviews related knowledge.
5. User optionally proceeds to project design.

## MVP Goals
- Deliver a clear Home page entry point.
- Provide navigation into guides, project examples, library, and FAQ.
- Establish read-only content delivery from Confluence-backed documents.
- Prepare search and AI-assisted flows without forcing write-back or a separate product DB.

## MVP In Scope
- Home page
- Theme switch: light, dark, system
- Search input and search route structure
- Four main entry cards
- Featured guide list
- Featured project example list
- Project design CTA
- Read-only category and article page architecture
- Visibility-aware content normalization from Confluence

## MVP Out Of Scope
- User login-based personalization
- Personal dashboards, progress, activity logs, notifications
- Commenting or document editing in the product
- Admin analytics dashboard
- Separate relational product database
- Automatic AI write-back from normal user flows

## Information Architecture
- `/`
- `/search?q=`
- `/guides`
- `/guides/{slug}`
- `/projects`
- `/projects/{slug}`
- `/library`
- `/faq`
- `/faq/{slug}`
- `/project-design/start`

## Success Criteria
- Users immediately understand the search-first purpose of the Home screen.
- The four entry points are visible and distinct.
- No user-facing copy leaks storage or internal implementation vocabulary.
- The page stays compact rather than becoming a long landing page.
- Theme switching works across desktop and mobile.
- The product remains read-through on top of Confluence with no separate authoritative DB.

## Delivery Status
### Completed
- Monorepo workspace bootstrap
- React/Vite web app skeleton
- Shared wiki-core module
- Home MVP baseline UI
- Prototype-aligned Home compact layout
- Shared top GNB across Home and internal pages
- General site-style header with user and utility area
- Shared typography and spacing baseline across Home and detail pages
- Theme selection
- Initial route shells for guides, projects, library, FAQ, search, and project design
- Shared read-only wiki document model
- Shared snapshot/remote wiki source abstraction
- Remote source payload validation and public-space filtering
- Category and article pages backed by shared async read-only data
- Search results backed by shared async read-only data
- Search results linked directly into matching documents
- Search results grouped by guide, project example, FAQ, and library
- Article pages show prerequisite, next, and related document navigation blocks
- Category pages expose reading order and lightweight metadata cues

### Pending
- Real endpoint value and CORS verification for remote read-only content loading
- Metadata validation
- Graph navigation
- Read-only AI Ask
- Operator review workflow
