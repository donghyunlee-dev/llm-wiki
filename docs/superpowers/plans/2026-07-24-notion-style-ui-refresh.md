# Notion-Style UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh `apps/web`'s visual tone to a flat, Notion/Linear-style look (approved design at `docs/superpowers/specs/2026-07-24-notion-style-ui-refresh-design.md`) — remove card borders/shadows in favor of tone-only separation, remove all left-accent-bar highlight patterns, widen typography/spacing, convert `/guides` from boxed cards to a divider list, add a real TOC active-heading indicator (text-weight only, no bar), and restyle the search page's user bubble as a light pill instead of a solid red block.

**Architecture:** Nearly all changes are CSS-only edits inside the existing `@layer components` block of `apps/web/src/styles.css` (no new build tooling, no new classes beyond a small, targeted set). The one behavioral addition is a scroll-spy `IntersectionObserver` in `apps/web/src/ui/pages/ArticlePage.tsx` to track which heading is on screen, driving a new `article-toc-link-active` class. `CategoryPage.tsx` gets a one-line className swap (`section-stack` → a new `document-list` class) so the divider-list spacing doesn't leak into other pages that reuse `section-stack`.

**Tech Stack:** React 19 + Tailwind v4 (`@apply` inside `@layer components`), Vitest + `@testing-library/react`, existing `@sfood/wiki-core` types.

---

## Scope guardrail

Only **container panels/cards** (`.page-panel`, `.home-card`, `.home-guide-card`, `.document-list-item`, `.article-aside`, `.chat-guide-spotlight`, `.empty-card`) lose their border/shadow. **Functional controls** (buttons, inputs, the pagination buttons, the home/category icon-link) keep their existing thin border — a Notion-style flat page still needs visible click targets, and the approved design doc scopes "flat" to panels/cards, not controls. Do not strip borders from `.control-input`, `.document-field input/select`, `.guide-pagination-button`, `.category-home-link`, `.prompt-composer-button`.

Do not touch: search/AI ranking logic, docType exposure rules (Frozen Behaviors in `CLAUDE.md`), `apps/edge-sidebar`, `apps/mcp-server`, or any file outside `apps/web`.

---

### Task 1: Flatten core panel/card surfaces

**Files:**
- Modify: `apps/web/src/styles.css:244-250` (`.page-panel`, `.page-panel-soft`)
- Modify: `apps/web/src/styles.css:323-333` (`.empty-card`, `.list-row-link`, `.document-list-item` — `.document-list-item` gets its full divider-list treatment in Task 4, so here just drop its border/shadow as an intermediate, safe step)
- Modify: `apps/web/src/styles.css:795-797` (`.home-card`)
- Modify: `apps/web/src/styles.css:893-897` (`.article-aside`)
- Modify: `apps/web/src/styles.css:1439-1441` (`.chat-guide-spotlight`)
- Modify: `apps/web/src/styles.css:1657-1659` (`.home-guide-card`)

- [ ] **Step 1: `.page-panel` / `.page-panel-soft` — drop border + shadow**

Before (`apps/web/src/styles.css:244-250`):
```css
  .page-panel {
    @apply rounded-[var(--radius-xl)] border border-panel-border bg-panel-bg p-5 shadow-[var(--panel-shadow)] md:p-6;
  }

  .page-panel-soft {
    @apply rounded-[var(--radius-lg)] border border-panel-border bg-card-bg p-4;
  }
```

After:
```css
  .page-panel {
    @apply rounded-[var(--radius-xl)] bg-panel-bg p-6 md:p-8;
  }

  .page-panel-soft {
    @apply rounded-[var(--radius-lg)] bg-card-bg p-4;
  }
```

(Padding bumped from `p-5 md:p-6` to `p-6 md:p-8` here — this is also part of Task 3's spacing increase, folded in since it's the same rule.)

- [ ] **Step 2: `.empty-card` / `.list-row-link` — drop border, keep `.document-list-item` as a plain block for now**

Before (`apps/web/src/styles.css:323-333`):
```css
  .empty-card {
    @apply rounded-[var(--radius-md)] border border-panel-border bg-card-bg px-3.5 py-3 text-[13px] leading-5 text-muted-fg;
  }

  .list-row-link {
    @apply flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-panel-border bg-card-bg px-3.5 py-3 text-[13px] text-page-fg transition hover:border-accent/30 hover:bg-card-hover-bg;
  }

  .document-list-item {
    @apply block rounded-[var(--radius-md)] border border-panel-border bg-card-bg px-3.5 py-3 transition hover:border-accent/30 hover:bg-card-hover-bg;
  }
```

After:
```css
  .empty-card {
    @apply rounded-[var(--radius-md)] bg-card-bg px-3.5 py-3 text-[13px] leading-5 text-muted-fg;
  }

  .list-row-link {
    @apply flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-card-bg px-3.5 py-3 text-[13px] text-page-fg transition hover:bg-card-hover-bg;
  }

  .document-list-item {
    @apply block rounded-[var(--radius-md)] bg-card-bg px-3.5 py-3 transition hover:bg-card-hover-bg;
  }
```

(`.document-list-item` is rewritten again in Task 4 into a divider list — this step only removes the border so intermediate diffs stay clean and testable.)

- [ ] **Step 3: `.home-card` — drop border**

Before (`apps/web/src/styles.css:795-797`):
```css
  .home-card {
    @apply rounded-[var(--radius-lg)] border border-panel-border bg-card-bg;
  }
```

After:
```css
  .home-card {
    @apply rounded-[var(--radius-lg)] bg-card-bg;
  }
```

- [ ] **Step 4: `.article-aside` — drop border, blend TOC with the page background**

Before (`apps/web/src/styles.css:893-897`):
```css
  .article-aside {
    /* xl:top/max-h account for the sticky .site-header's rendered height (~72px) plus a 16px gap
       so the TOC no longer scrolls under the header. */
    @apply rounded-[var(--radius-lg)] border border-panel-border bg-panel-bg p-4 xl:sticky xl:top-[88px] xl:max-h-[calc(100vh-104px)] xl:self-start xl:overflow-y-auto;
  }
```

After:
```css
  .article-aside {
    /* xl:top/max-h account for the sticky .site-header's rendered height (~72px) plus a 16px gap
       so the TOC no longer scrolls under the header. No border/bg — the TOC blends into the page
       background instead of reading as a separate card. */
    @apply rounded-[var(--radius-lg)] p-4 xl:sticky xl:top-[88px] xl:max-h-[calc(100vh-104px)] xl:self-start xl:overflow-y-auto;
  }
```

- [ ] **Step 5: `.chat-guide-spotlight` — drop border**

Before (`apps/web/src/styles.css:1439-1441`):
```css
  .chat-guide-spotlight {
    @apply rounded-[var(--radius-lg)] border border-panel-border bg-card-bg px-4 py-4;
  }
```

After:
```css
  .chat-guide-spotlight {
    @apply rounded-[var(--radius-lg)] bg-card-bg px-4 py-4;
  }
```

- [ ] **Step 6: `.home-guide-card` — drop border**

Before (`apps/web/src/styles.css:1657-1659`):
```css
  .home-guide-card {
    @apply relative flex min-h-[104px] items-start gap-3 rounded-[var(--radius-lg)] border border-panel-border bg-card-bg px-3 py-3 text-left transition hover:border-accent/30 hover:bg-card-hover-bg;
  }
```

After:
```css
  .home-guide-card {
    @apply relative flex min-h-[104px] items-start gap-3 rounded-[var(--radius-lg)] bg-card-bg px-3 py-3 text-left transition hover:bg-card-hover-bg;
  }
```

- [ ] **Step 7: Run typecheck + build to make sure the CSS still parses and nothing else broke**

Run: `pnpm --filter @sfood/web typecheck && pnpm --filter @sfood/web build`
Expected: both succeed (Tailwind `@apply` errors surface at build time if a utility class became invalid).

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/styles.css
git commit -m "style: flatten core panel/card borders and shadows"
```

---

### Task 2: Remove the per-card accent highlight (no left-accent-bar / no individual card color)

**Files:**
- Modify: `apps/web/src/styles.css:1661-1671` (`.home-guide-card-featured`, `.home-guide-card-icon-featured`)

**Why:** The user explicitly rejected a colored-highlight treatment (their words: "AI가 자주 사용하는 디자인 패턴은 사용 안 한다") on exactly this card — see `feedback_no_ai_cliche_accent_bar` memory. The featured "시작 가이드" card must be visually distinguished using only a neutral tone shift, never brand color.

- [ ] **Step 1: Rewrite `.home-guide-card-featured` and `.home-guide-card-icon-featured`**

Before (`apps/web/src/styles.css:1661-1671`):
```css
  .home-guide-card-featured {
    @apply min-h-[92px] border-accent/20 bg-accent-soft px-4 py-4;
  }

  .home-guide-card-icon {
    @apply flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-panel-border bg-page-bg text-accent;
  }

  .home-guide-card-icon-featured {
    @apply h-9 w-9 border-accent/30 bg-card-bg;
  }
```

After:
```css
  .home-guide-card-featured {
    @apply min-h-[92px] bg-card-hover-bg px-4 py-4;
  }

  .home-guide-card-icon {
    @apply flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-panel-border bg-page-bg text-accent;
  }

  .home-guide-card-icon-featured {
    @apply h-9 w-9 bg-panel-bg;
  }
```

(`.home-guide-card-icon`'s own `border-panel-border` and `text-accent` are unchanged and reprinted here only for context — every guide card's icon uses the same neutral border + accent glyph color uniformly, which is a consistent icon treatment, not a per-item highlight, so it's left as-is.)

- [ ] **Step 2: Visually confirm in the running dev server that the featured card no longer has a colored border/background, only the neutral `bg-card-hover-bg` tone**

Run: `pnpm --filter @sfood/web dev` (leave running), open `http://localhost:5173/` in a browser, confirm the "시작 가이드" card reads as a subtle neutral tone shift, not a red/tinted card.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/styles.css
git commit -m "style: replace accent-tinted featured card with neutral tone-only highlight"
```

---

### Task 3: Typography and spacing increase

**Files:**
- Modify: `apps/web/src/styles.css:232-234` (`.page-shell`)
- Modify: `apps/web/src/styles.css:885-887` (`.article-content`)
- Modify: `apps/web/src/styles.css:942-944` (`.article-paragraph`)
- Modify: `apps/web/src/styles.css:899-905` (`.article-toc`, `.article-toc-link`)

- [ ] **Step 1: `.page-shell` — more breathing room around every page**

Before (`apps/web/src/styles.css:232-234`):
```css
  .page-shell {
    @apply px-4 py-5 sm:px-5;
  }
```

After:
```css
  .page-shell {
    @apply px-4 py-7 sm:px-6;
  }
```

- [ ] **Step 2: `.article-content` / `.article-paragraph` — larger body text, looser line-height**

Before (`apps/web/src/styles.css:885-887`):
```css
  .article-content {
    @apply mt-6 text-[13px] leading-6 text-page-fg;
  }
```

After:
```css
  .article-content {
    @apply mt-6 text-[14px] leading-7 text-page-fg;
  }
```

Before (`apps/web/src/styles.css:942-944`):
```css
  .article-paragraph {
    @apply mt-3 text-[13px] leading-6 text-page-fg/90;
  }
```

After:
```css
  .article-paragraph {
    @apply mt-4 text-[14px] leading-7 text-page-fg/90;
  }
```

- [ ] **Step 3: `.article-toc` / `.article-toc-link` — looser spacing so wrapped long titles don't feel cramped**

Before (`apps/web/src/styles.css:899-905`):
```css
  .article-toc {
    @apply mt-3 space-y-0.5;
  }

  .article-toc-link {
    @apply block rounded-[var(--radius-md)] px-2 py-1 text-[13px] leading-5 text-muted-fg transition hover:bg-card-hover-bg hover:text-page-fg;
  }
```

After:
```css
  .article-toc {
    @apply mt-3 space-y-1.5;
  }

  .article-toc-link {
    @apply block rounded-[var(--radius-md)] px-2 py-1.5 text-[13px] leading-6 text-muted-fg transition hover:bg-card-hover-bg hover:text-page-fg;
  }
```

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm --filter @sfood/web test && pnpm --filter @sfood/web typecheck`
Expected: all existing tests still pass (these are pure CSS value changes, no class names or markup changed).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/styles.css
git commit -m "style: widen typography and spacing across pages and article TOC"
```

---

### Task 4: Convert `/guides` list from boxed cards to a divider list

**Files:**
- Modify: `apps/web/src/styles.css:256-258` (context only, not edited — confirms `.section-stack` is shared and must not be touched)
- Modify: `apps/web/src/styles.css:331-333` (`.document-list-item`, already border-free from Task 1 — now drop rounded/bg and switch to divider styling)
- Modify: `apps/web/src/ui/pages/CategoryPage.tsx:172`

**Why not touch `.section-stack` directly:** `grep -rn "section-stack" apps/web/src/ui` shows it's reused by `StaticPageShell.tsx`, `ProjectsPage.tsx`, and `ArticlePage.tsx`'s metadata chip row. Redefining it to remove the `space-y-3` gap (needed for a seamless divider list) would visually break those unrelated pages. Instead, `CategoryPage.tsx` gets its own `.document-list` wrapper class.

- [ ] **Step 1: Add a new `.document-list` rule right after `.section-stack` and rewrite `.document-list-item`**

Before (`apps/web/src/styles.css:256-258`, unchanged — shown for placement context):
```css
  .section-stack {
    @apply mt-4 space-y-3;
  }
```

Insert immediately after it:
```css
  .document-list {
    @apply mt-4 divide-y divide-panel-border-soft;
  }
```

Before (`apps/web/src/styles.css:331-333`, current state after Task 1 Step 2):
```css
  .document-list-item {
    @apply block rounded-[var(--radius-md)] bg-card-bg px-3.5 py-3 transition hover:bg-card-hover-bg;
  }
```

After:
```css
  .document-list-item {
    @apply block px-1 py-4 transition hover:bg-card-hover-bg;
  }
```

- [ ] **Step 2: Swap the wrapper className in `CategoryPage.tsx`**

Before (`apps/web/src/ui/pages/CategoryPage.tsx:172`):
```tsx
        <div className="section-stack">
```

After:
```tsx
        <div className="document-list">
```

- [ ] **Step 3: Run the existing `CategoryPage` test — it only asserts text content and unrelated class names (`category-page-header`, `category-home-link`), so it should still pass unchanged**

Run: `pnpm --filter @sfood/web test -- --run src/ui/pages/CategoryPage.test.tsx`
Expected: PASS, no changes needed to the test file (confirms the guide-docType-only filter and pagination behavior — Frozen Behaviors — are untouched).

- [ ] **Step 4: Visual check with Playwright MCP**

Navigate to `/guides`, confirm the list now reads as a divider-separated list (no boxed cards), hover on a row shows only a background tint, and the "guide only" count line (`전체 N개 중 M개 표시`) is unchanged.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/styles.css apps/web/src/ui/pages/CategoryPage.tsx
git commit -m "style: convert /guides list from boxed cards to a divider list"
```

---

### Task 5: TOC active-heading indicator (text-weight only, no bar)

**Files:**
- Modify: `apps/web/src/ui/pages/ArticlePage.tsx`
- Modify: `apps/web/src/styles.css:903-905` (insert new `.article-toc-link-active` rule after `.article-toc-link`)
- Create: `apps/web/src/ui/pages/ArticlePage.test.tsx`

**Why this is new, not a restyle:** The current `.article-toc-link` has no active/selected state at all (confirmed by reading `ArticlePage.tsx` — `handleTocClick` only calls `scrollIntoView` and updates the URL hash, no state tracking). This supersedes the 2026-05-06 decision recorded in `docs/prd/implementation-status.md` to remove TOC active highlighting — this session's brainstorm is a fresh, explicit request to bring it back, in a non-bar form.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/ui/pages/ArticlePage.test.tsx`:
```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { ArticlePage } from "./ArticlePage";

const useWikiDataMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useParams: () => ({ slug: "guide-1" }),
  };
});

function buildDocument(): WikiDocument {
  return {
    id: "page-1",
    slug: "guide-1",
    title: "가이드 1",
    summary: "Summary",
    updatedAt: "2026-05-01",
    metadata: {
      docType: "guide",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    },
    headings: [
      { id: "h-1", level: 2, text: "첫 번째 섹션" },
      { id: "h-2", level: 2, text: "두 번째 섹션" },
    ],
    contentHtml:
      '<h2 id="h-1">첫 번째 섹션</h2><p>내용</p><h2 id="h-2">두 번째 섹션</h2><p>내용</p>',
  };
}

describe("ArticlePage TOC active state", () => {
  it("marks the clicked TOC entry active via text-weight class, not a new element", () => {
    useWikiDataMock.mockReturnValue({
      documents: [buildDocument()],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ArticlePage section="guides" />
      </MemoryRouter>,
    );

    const firstLink = screen.getByRole("link", { name: "첫 번째 섹션" });
    const secondLink = screen.getByRole("link", { name: "두 번째 섹션" });

    expect(firstLink.className).not.toContain("article-toc-link-active");
    expect(secondLink.className).not.toContain("article-toc-link-active");

    fireEvent.click(secondLink);

    expect(secondLink.className).toContain("article-toc-link-active");
    expect(firstLink.className).not.toContain("article-toc-link-active");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @sfood/web test -- --run src/ui/pages/ArticlePage.test.tsx`
Expected: FAIL — `secondLink.className` does not contain `article-toc-link-active` (the class/state doesn't exist yet).

- [ ] **Step 3: Add active-heading state and scroll-spy to `ArticlePage.tsx`**

Before (`apps/web/src/ui/pages/ArticlePage.tsx:1-27`):
```tsx
import type { WikiSection } from "@sfood/wiki-core";
import { getWikiDocumentFrom } from "@sfood/wiki-core";
import type { MouseEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { ArticleAskPanel } from "./ArticleAskPanel";
import { ArticleContentRenderer } from "./ArticleContentRenderer";
import { WikiStatePanel } from "./WikiStatePanel";

export function ArticlePage({ section }: { section: WikiSection }) {
  const params = useParams();
  const slug = params.slug ?? "";
  const { documents, errorMessage, isLoading } = useWikiData();

  const document = getWikiDocumentFrom(documents, section, slug);

  const handleTocClick = (event: MouseEvent<HTMLAnchorElement>, headingId: string) => {
    event.preventDefault();

    const element = window.document.getElementById(headingId);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.history.replaceState(null, "", `#${headingId}`);
  };
```

After:
```tsx
import type { WikiSection } from "@sfood/wiki-core";
import { getWikiDocumentFrom } from "@sfood/wiki-core";
import { useEffect, useState, type MouseEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { ArticleAskPanel } from "./ArticleAskPanel";
import { ArticleContentRenderer } from "./ArticleContentRenderer";
import { WikiStatePanel } from "./WikiStatePanel";

export function ArticlePage({ section }: { section: WikiSection }) {
  const params = useParams();
  const slug = params.slug ?? "";
  const { documents, errorMessage, isLoading } = useWikiData();

  const document = getWikiDocumentFrom(documents, section, slug);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Hooks must run unconditionally before the early returns below (see 2026-05-06 fix in
  // implementation-status.md for why a conditional hook previously broke this page).
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || !document?.headings.length) {
      return;
    }

    const headingElements = document.headings
      .map((heading) => window.document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!headingElements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const nextActive = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (nextActive) {
          setActiveHeadingId(nextActive.target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    headingElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [document?.id]);

  const handleTocClick = (event: MouseEvent<HTMLAnchorElement>, headingId: string) => {
    event.preventDefault();
    setActiveHeadingId(headingId);

    const element = window.document.getElementById(headingId);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.history.replaceState(null, "", `#${headingId}`);
  };
```

- [ ] **Step 4: Apply the active class in the TOC render loop**

Before (`apps/web/src/ui/pages/ArticlePage.tsx`, inside the `<nav className="article-toc">` block):
```tsx
            {document.headings.length ? document.headings.map((heading) => (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                onClick={(event) => handleTocClick(event, heading.id)}
                className={`article-toc-link article-toc-level-${Math.min(heading.level, 4)}`}
              >
                {heading.text}
              </a>
            )) : (
```

After:
```tsx
            {document.headings.length ? document.headings.map((heading) => (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                onClick={(event) => handleTocClick(event, heading.id)}
                className={`article-toc-link article-toc-level-${Math.min(heading.level, 4)}${
                  activeHeadingId === heading.id ? " article-toc-link-active" : ""
                }`}
              >
                {heading.text}
              </a>
            )) : (
```

- [ ] **Step 5: Add the CSS rule — text color/weight only, no bar, no background**

Insert immediately after `.article-toc-link` (`apps/web/src/styles.css:903-905`):
```css
  .article-toc-link {
    @apply block rounded-[var(--radius-md)] px-2 py-1.5 text-[13px] leading-6 text-muted-fg transition hover:bg-card-hover-bg hover:text-page-fg;
  }

  .article-toc-link-active {
    @apply font-semibold text-page-fg;
  }
```

- [ ] **Step 6: Run the test again to confirm it passes**

Run: `pnpm --filter @sfood/web test -- --run src/ui/pages/ArticlePage.test.tsx`
Expected: PASS.

- [ ] **Step 7: Run the full web test suite + typecheck**

Run: `pnpm --filter @sfood/web test && pnpm --filter @sfood/web typecheck`
Expected: all pass, including the new file.

- [ ] **Step 8: Playwright MCP check for the scroll-spy in a real browser (jsdom has no `IntersectionObserver`, so this is the only way to see it live)**

Navigate to a guide page with multiple headings (e.g. `/guides/agent-start`), scroll through the article, and confirm the TOC entry for the section currently in view becomes bold/dark while others stay muted gray — with no colored bar anywhere.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/ui/pages/ArticlePage.tsx apps/web/src/ui/pages/ArticlePage.test.tsx apps/web/src/styles.css
git commit -m "feat: add TOC active-heading indicator via scroll-spy (text-weight only)"
```

---

### Task 6: Search page — chat-bubble-style user question

**Files:**
- Modify: `apps/web/src/styles.css:1419-1421` (`.chat-message-user`)

- [ ] **Step 1: Replace the solid red bubble with a light pill**

Before (`apps/web/src/styles.css:1419-1421`):
```css
  .chat-message-user {
    @apply ml-auto max-w-2xl bg-accent text-white;
  }
```

After:
```css
  .chat-message-user {
    @apply ml-auto max-w-2xl rounded-[999px] bg-accent-soft text-page-fg;
  }
```

- [ ] **Step 2: Playwright MCP check**

Run a search query on `/search?q=...`, confirm the user's question renders as a right-aligned light pill (not a solid red block) and the answer text below it is unchanged (already a plain, background-free block from `.chat-message-assistant`).

- [ ] **Step 3: Run tests + typecheck + build**

Run: `pnpm --filter @sfood/web test && pnpm --filter @sfood/web typecheck && pnpm --filter @sfood/web build`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/styles.css
git commit -m "style: restyle search question bubble as a light pill instead of a solid accent block"
```

---

### Task 7: Task workspace docs + implementation-status update

**Files:**
- Create: `docs/tasks/notion-style-ui-refresh/spec.md`
- Create: `docs/tasks/notion-style-ui-refresh/plan.md`
- Create: `docs/tasks/notion-style-ui-refresh/tasks.md`
- Create: `docs/tasks/notion-style-ui-refresh/test-result.md`
- Create: `docs/tasks/notion-style-ui-refresh/result.md`
- Modify: `docs/prd/implementation-status.md`

This repo's `docs/ops/spec-driven-workflow.md` requires a `docs/tasks/{task-id}/` workspace for non-trivial work, in addition to the Superpowers spec/plan already written to `docs/superpowers/`. Use `docs/tasks/_template/*.md` as the starting point (already used for the earlier `sfood-design-system-tone` task in this same session — follow that task's file structure as the pattern to copy).

- [ ] **Step 1: Copy the design intent into `spec.md`** — problem statement, scope, out-of-scope, acceptance criteria drawn directly from `docs/superpowers/specs/2026-07-24-notion-style-ui-refresh-design.md`.

- [ ] **Step 2: Copy the technical approach into `plan.md`** — impacted files (this plan's Task 1-6 file list), validation plan (Task 8 below).

- [ ] **Step 3: List the 6 implementation tasks above in `tasks.md`** under "Implementation Tasks", plus a "Documentation Tasks" entry for this task itself.

- [ ] **Step 4: Leave `test-result.md` and `result.md` as templates until Task 8 (Validation) is complete** — do not mark them done yet.

- [ ] **Step 5: Add a dated entry to the top of `docs/prd/implementation-status.md`'s "Latest Completed Work" section** once Task 8 passes, following the same format as the `2026-07-24 — SFOOD 디자인 시스템(@sfood/ui) 톤앤매너 적용...` entry already there.

- [ ] **Step 6: Commit**

```bash
git add docs/tasks/notion-style-ui-refresh docs/prd/implementation-status.md
git commit -m "docs: add task workspace for Notion-style UI refresh"
```

---

### Task 8: Validation (required before reporting completion)

Per `docs/ops/spec-driven-workflow.md` gates: do not report completion before both Playwright review and Codex critical review are done.

- [ ] **Step 1: Full workspace test + typecheck + build**

Run: `pnpm test && pnpm typecheck && pnpm --filter @sfood/web build`
Expected: all pass (this also re-confirms wiki-core/edge-sidebar/mcp-server/serverless are untouched and still green).

- [ ] **Step 2: Playwright MCP — light mode, all 4 screens**

Start the dev server (`pnpm --filter @sfood/web dev`), then in Playwright MCP visit and screenshot:
- `/` — confirm the featured "시작 가이드" card has no colored border/background, and the search hero is unchanged in structure.
- `/search?q=<any question>` — confirm the user bubble is a light pill, not solid red.
- `/guides` — confirm the divider-list layout (no boxed cards), and re-verify the `guide` docType only count still matches the Frozen Behavior.
- `/guides/agent-start` (or any guide with 3+ headings) — scroll through and confirm the TOC active entry changes as bold/dark text only, no bar, and long headings wrap onto 2 lines without looking cramped.

- [ ] **Step 3: Playwright MCP — dark mode, same 4 screens**

Toggle `다크` in the header, repeat the same 4 checks. Confirm flattened panels still read as distinct from the page background (dark tone-only separation established in the prior `sfood-design-system-tone` task).

- [ ] **Step 4: Codex critical review**

Send the full diff (`git diff` across all 6 implementation commits, or the working tree diff if not yet committed) to Codex (`mcp__codex__codex`, `sandbox: "read-only"`) asking specifically:
- Does the `IntersectionObserver` scroll-spy in `ArticlePage.tsx` leak observers across re-renders or navigations?
- Does removing `border`/`shadow` from `.page-panel` and friends leave any element with zero visual separation from its background in either theme?
- Is `.document-list` correctly scoped so it doesn't affect `StaticPageShell.tsx` / `ProjectsPage.tsx` / `ArticlePage.tsx`'s reuse of `.section-stack`?

- [ ] **Step 5: Record results in `docs/tasks/notion-style-ui-refresh/test-result.md`**

Commands run, pass/fail, Playwright findings (screenshots or descriptions), Codex findings and how each was addressed.

- [ ] **Step 6: Fill in `docs/tasks/notion-style-ui-refresh/result.md`** — delivered scope, key decisions (e.g. the TOC active-state supersedes the 2026-05-06 removal decision), open gaps, next steps.

- [ ] **Step 7: Commit**

```bash
git add docs/tasks/notion-style-ui-refresh apps/web
git commit -m "test: record validation results for Notion-style UI refresh"
```

---

## Plan self-review notes

- **Spec coverage:** flat backgrounds (Task 1), no-accent-highlight rule (Task 2), typography/spacing (Task 3), `/guides` divider list (Task 4), TOC active state without a bar + natural wrap spacing (Task 3 Step 3 + Task 5), search chat bubble (Task 6), dark mode re-check (Task 8 Step 3), task docs + Codex/Playwright gates (Task 7-8). All design-doc sections have a corresponding task.
- **Scope check:** single cohesive visual-tone task across one app (`apps/web`); not split further since every task shares the same validation pass and touches the same file (`styles.css`) repeatedly — splitting would cause merge conflicts between parallel workers.
- **Type consistency:** `activeHeadingId` (`string | null`) is introduced once in Task 5 and used consistently in both the effect and the render loop; no renamed variants elsewhere.
