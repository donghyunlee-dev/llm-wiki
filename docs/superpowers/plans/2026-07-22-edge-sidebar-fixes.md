# Edge Sidebar Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 익스텐션(`apps/edge-sidebar`)의 가이드 본문 이중 노출/불가시, 추천·참고 페이지 중복, 링크 오동작을 서버 정리 HTML(A안)로 해결한다.

**Architecture:** Confluence storage-format 매크로 정리를 `@sfood/wiki-core`의 DOM-비의존 순수 함수로 구현하고, 웹 dev 서버가 새 엔드포인트 `GET /api/wiki/documents`로 정리된 문서를 반환한다. 익스텐션은 정리된 HTML을 받아 렌더만 하며, 검색 결과 dedup은 제목이 아닌 페이지 ID 기준으로 바꾼다. 익스텐션의 0-의존 격리는 유지한다.

**Tech Stack:** TypeScript, vitest, Vite dev middleware, React 19(익스텐션 side panel).

---

## File Structure

- **Create** `packages/wiki-core/src/lib/confluenceCleanHtml.ts` — DOM-비의존 매크로 정리 함수(단일 책임: storage-format → 시맨틱 HTML 문자열).
- **Create** `packages/wiki-core/src/lib/confluenceCleanHtml.test.ts` — 정리 함수 단위 테스트.
- **Modify** `packages/wiki-core/src/index.ts` — 새 모듈 export.
- **Modify** `apps/web/vite.config.ts` — `GET /api/wiki/documents` 미들웨어 추가.
- **Modify** `apps/edge-sidebar/src/sidepanel/wikiClient.ts` — 새 엔드포인트 사용, ID 기준 dedup, href 우선순위 수정, 사용 안 하게 된 storage-format 파싱 제거.
- **Modify** `apps/edge-sidebar/src/sidepanel/wikiClient.test.ts` — 변경된 API에 맞춰 테스트 갱신.
- **Modify** `apps/edge-sidebar/src/sidepanel/styles.css` — `.wiki-callout`/코드 블록 테마 스타일 추가.

---

## Task 1: wiki-core 매크로 정리 함수

**Files:**
- Create: `packages/wiki-core/src/lib/confluenceCleanHtml.ts`
- Test: `packages/wiki-core/src/lib/confluenceCleanHtml.test.ts`
- Modify: `packages/wiki-core/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/wiki-core/src/lib/confluenceCleanHtml.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renderConfluenceContentToCleanHtml } from "./confluenceCleanHtml";
import type { WikiDocument } from "./wikiDocuments";

function doc(overrides: Partial<WikiDocument>): WikiDocument {
  return {
    id: "1",
    slug: "sample",
    title: "Sample",
    summary: "",
    updatedAt: "2026-01-01",
    metadata: {
      docType: "guide",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    },
    headings: [],
    contentHtml: "",
    ...overrides,
  };
}

describe("renderConfluenceContentToCleanHtml", () => {
  it("converts a code macro to a single pre/code block without duplicated text", () => {
    const html = `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">bash</ac:parameter><ac:plain-text-body><![CDATA[npm install]]></ac:plain-text-body></ac:structured-macro>`;
    const out = renderConfluenceContentToCleanHtml(html, []);

    expect(out).toContain(`<pre><code class="language-bash">npm install</code></pre>`);
    // "npm install" must appear exactly once (no plain + rendered duplication)
    expect(out.match(/npm install/g)?.length).toBe(1);
  });

  it("converts note/info/warning macros to themed callout divs", () => {
    const html = `<ac:structured-macro ac:name="note"><ac:parameter ac:name="title">주의</ac:parameter><ac:rich-text-body><p>본문</p></ac:rich-text-body></ac:structured-macro>`;
    const out = renderConfluenceContentToCleanHtml(html, []);

    expect(out).toContain(`<div class="wiki-callout wiki-callout--note">`);
    expect(out).toContain(`<p class="wiki-callout__title">주의</p>`);
    expect(out).toContain(`<p>본문</p>`);
    expect(out.match(/본문/g)?.length).toBe(1);
  });

  it("resolves an ac:link to an internal wiki href by page id", () => {
    const documents = [doc({ id: "99", slug: "worktrees", title: "[Guide] Worktrees", metadata: { docType: "guide", audience: "beginner", status: "published", prerequisites: [], next: [], related: [] } })];
    const html = `<ac:link><ri:page ri:content-id="99" ri:content-title="[Guide] Worktrees" /><ac:link-body>워크트리</ac:link-body></ac:link>`;
    const out = renderConfluenceContentToCleanHtml(html, documents);

    expect(out).toContain(`href="/guides/worktrees"`);
    expect(out).toContain(`[Guide] Worktrees`);
  });

  it("keeps only text when an ac:link points to an unknown page", () => {
    const html = `<ac:link><ri:page ri:content-title="Missing Page" /><ac:link-body>없는페이지</ac:link-body></ac:link>`;
    const out = renderConfluenceContentToCleanHtml(html, []);

    expect(out).not.toContain("<ac:link");
    expect(out).not.toContain("href=");
    expect(out).toContain("Missing Page");
  });

  it("strips residual ac:/ri: tags and wiki.metadata blocks", () => {
    const html = `<ac:structured-macro ac:name="metadata"><ac:parameter ac:name="docType">guide</ac:parameter></ac:structured-macro><p>본문</p><ac:emoticon ac:name="smile" />`;
    const out = renderConfluenceContentToCleanHtml(html, []);

    expect(out).not.toContain("wiki");
    expect(out).not.toMatch(/<\/?(?:ac|ri):/);
    expect(out).toContain("<p>본문</p>");
  });

  it("returns an empty string for empty input", () => {
    expect(renderConfluenceContentToCleanHtml("", [])).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sfood/wiki-core test -- --run confluenceCleanHtml`
Expected: FAIL — `renderConfluenceContentToCleanHtml` is not exported / module missing.

- [ ] **Step 3: Write the implementation**

Create `packages/wiki-core/src/lib/confluenceCleanHtml.ts`:

```ts
import { getWikiDocumentSection, type WikiDocument } from "./wikiDocuments";

const CALLOUT_LABELS: Record<string, string> = {
  info: "안내",
  tip: "팁",
  note: "참고",
  warning: "주의",
  panel: "",
};

/**
 * Confluence storage-format HTML을 DOM 없이 시맨틱 HTML 문자열로 변환한다.
 * 익스텐션/서버 전용 정리기이며, 웹앱 본체는 별도의 React 렌더러를 유지한다.
 */
export function renderConfluenceContentToCleanHtml(html: string, documents: WikiDocument[]): string {
  if (!html) {
    return "";
  }

  let out = html;

  // 1) wiki.metadata 매크로 제거
  out = out.replace(
    /<ac:structured-macro[^>]*ac:name="metadata"[\s\S]*?<\/ac:structured-macro>/gi,
    "",
  );

  // 2) code 매크로 → <pre><code>
  out = out.replace(
    /<ac:structured-macro[^>]*ac:name="code"[^>]*>([\s\S]*?)<\/ac:structured-macro>/gi,
    (_match, inner: string) => {
      const language = readMacroParameter(inner, "language");
      const code = readPlainTextBody(inner);
      const cls = language ? ` class="language-${escapeHtmlAttribute(language)}"` : "";
      return `<pre><code${cls}>${escapeHtml(code)}</code></pre>`;
    },
  );

  // 3) callout 매크로 → <div class="wiki-callout ...">
  out = out.replace(
    /<ac:structured-macro[^>]*ac:name="(info|tip|note|warning|panel)"[^>]*>([\s\S]*?)<\/ac:structured-macro>/gi,
    (_match, name: string, inner: string) => {
      const title = readMacroParameter(inner, "title") || CALLOUT_LABELS[name] || "";
      const body = readRichTextBody(inner);
      const titleHtml = title ? `<p class="wiki-callout__title">${escapeHtml(title)}</p>` : "";
      return `<div class="wiki-callout wiki-callout--${name}">${titleHtml}${body}</div>`;
    },
  );

  // 4) ac:link → <a>
  out = out.replace(/<ac:link([^>]*)>([\s\S]*?)<\/ac:link>/gi, (_match, attrs: string, inner: string) => {
    return resolveConfluenceLink(attrs, inner, documents);
  });

  // 5) 잔여 ac:/ri: 태그 제거(내부 텍스트는 유지)
  out = out.replace(/<\/?(?:ac|ri):[^>]*>/gi, "");

  return out.trim();
}

function readMacroParameter(inner: string, name: string): string {
  const pattern = new RegExp(
    `<ac:parameter[^>]*ac:name="${name}"[^>]*>([\\s\\S]*?)<\\/ac:parameter>`,
    "i",
  );
  return inner.match(pattern)?.[1]?.trim() ?? "";
}

function readPlainTextBody(inner: string): string {
  const body = inner.match(/<ac:plain-text-body[^>]*>([\s\S]*?)<\/ac:plain-text-body>/i)?.[1] ?? "";
  const cdata = body.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
  return (cdata?.[1] ?? body).trim();
}

function readRichTextBody(inner: string): string {
  return inner.match(/<ac:rich-text-body[^>]*>([\s\S]*?)<\/ac:rich-text-body>/i)?.[1]?.trim() ?? "";
}

function resolveConfluenceLink(attrs: string, inner: string, documents: WikiDocument[]): string {
  const anchor = attrs.match(/ac:anchor="([^"]+)"/i)?.[1]?.trim() ?? "";
  const pageId =
    inner.match(/ri:content-id="([^"]+)"/i)?.[1]?.trim() ??
    inner.match(/ri:page-id="([^"]+)"/i)?.[1]?.trim() ??
    "";
  const title =
    inner.match(/ri:content-title="([^"]+)"/i)?.[1]?.trim() ||
    readLinkBody(inner) ||
    "";

  const target = findDocument(documents, pageId, title);
  if (target) {
    const section = getWikiDocumentSection(target);
    if (section) {
      return `<a href="/${section}/${target.slug}" data-wiki-link="true">${escapeHtml(target.title)}</a>`;
    }
  }

  if (anchor) {
    return `<a href="#${escapeHtmlAttribute(anchor)}">${escapeHtml(title || anchor)}</a>`;
  }

  return escapeHtml(title);
}

function readLinkBody(inner: string): string {
  const cdata = inner.match(
    /<ac:plain-text-link-body[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-link-body>/i,
  );
  if (cdata?.[1]?.trim()) {
    return cdata[1].trim();
  }

  return inner.match(/<ac:link-body[^>]*>([\s\S]*?)<\/ac:link-body>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
}

function findDocument(documents: WikiDocument[], pageId: string, title: string): WikiDocument | null {
  if (pageId) {
    const byId = documents.find((document) => document.id === pageId);
    if (byId) {
      return byId;
    }
  }

  if (title) {
    const normalized = normalizeTitleToken(title);
    const byTitle = documents.find((document) => normalizeTitleToken(document.title) === normalized);
    if (byTitle) {
      return byTitle;
    }
  }

  return null;
}

function normalizeTitleToken(value: string): string {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(text: string): string {
  return escapeHtml(text).replace(/"/g, "&quot;");
}
```

- [ ] **Step 4: Export the new module**

Modify `packages/wiki-core/src/index.ts` — add after the `confluenceReadModel` export line:

```ts
export * from "./lib/confluenceCleanHtml";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @sfood/wiki-core test -- --run confluenceCleanHtml`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/wiki-core/src/lib/confluenceCleanHtml.ts packages/wiki-core/src/lib/confluenceCleanHtml.test.ts packages/wiki-core/src/index.ts
git commit -m "feat: add DOM-free Confluence storage-format cleaner in wiki-core"
```

---

## Task 2: 웹 dev 서버 정리 문서 엔드포인트

**Files:**
- Modify: `apps/web/vite.config.ts` (add `/api/wiki/documents` middleware near the existing `/api/wiki-pages` handler)

- [ ] **Step 1: Add the endpoint**

In `apps/web/vite.config.ts`, confirm the import block already imports from `wiki-core`; add `renderConfluenceContentToCleanHtml` to that import (it is re-exported from the package index). Then register a new middleware immediately after the `server.middlewares.use("/api/wiki-pages", ...)` block:

```ts
      server.middlewares.use("/api/wiki/documents", async (_request, response) => {
        response.setHeader("Content-Type", "application/json; charset=utf-8");

        if (!hasConfluenceConfig(env)) {
          response.statusCode = 503;
          response.end(JSON.stringify({ message: "Confluence environment is not configured." }));
          return;
        }

        try {
          const cache = await loadVisibleDevWikiCache(env);
          const byId = new Map(cache.documents.map((document) => [document.id, document]));

          const pages = cache.documents.map((document) => ({
            id: document.id,
            slug: document.slug,
            title: document.title,
            summary: document.summary,
            href: getWikiDocumentHref(document) ?? `/wiki/${document.id}`,
            docType: document.metadata.docType,
            contentHtml: renderConfluenceContentToCleanHtml(document.contentHtml, cache.documents),
            related: document.metadata.related
              .map((relatedId) => byId.get(relatedId))
              .filter((related): related is NonNullable<typeof related> => Boolean(related))
              .map((related) => ({
                title: related.title,
                href: getWikiDocumentHref(related) ?? `/wiki/${related.id}`,
              })),
          }));

          response.end(JSON.stringify({ pages }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load wiki documents.";

          response.statusCode = 502;
          response.end(JSON.stringify({ message }));
        }
      });
```

Note: `getWikiDocumentHref` is already imported in `vite.config.ts` (used by the search handler). If the `renderConfluenceContentToCleanHtml` import is missing, add it to the existing `from "../../packages/wiki-core/src/..."` import group or import from the package entry the file already uses.

- [ ] **Step 2: Verify the dev server starts and the endpoint responds**

Run: `pnpm --filter @sfood/web dev` (in a separate shell), then:
`curl -s http://localhost:5173/api/wiki/documents | head -c 400`
Expected: JSON `{"pages":[{"id":...,"contentHtml":"..."}]}` with no `ac:`/`ri:` tags in `contentHtml`. If Confluence env is not configured locally, expected is HTTP 503 with the "not configured" message — record that in test-result.md and validate via Task 1 unit tests instead.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @sfood/web typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/vite.config.ts
git commit -m "feat: add /api/wiki/documents endpoint returning cleaned wiki content"
```

---

## Task 3: 익스텐션 검색 결과 dedup을 페이지 ID 기준으로 변경

**Files:**
- Modify: `apps/edge-sidebar/src/sidepanel/wikiClient.ts` (`WikiSearchSource`, `readDocumentSources`, `normalizeWikiSearchResponse`, `isSpecificDocumentHref`)
- Test: `apps/edge-sidebar/src/sidepanel/wikiClient.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `apps/edge-sidebar/src/sidepanel/wikiClient.test.ts` inside the existing `describe` block:

```ts
  it("deduplicates the same page by id even when titles differ slightly", () => {
    const result = normalizeWikiSearchResponse({
      answer: "설명",
      confluenceData: [{ pageId: "42", title: "Claude Code Worktrees " }],
      recommendedDocuments: [{ id: "42", title: "Claude Code Worktrees", href: "/guides/worktrees" }],
      relatedDocuments: [{ id: "42", title: "Claude Code Worktrees", href: "/guides/worktrees" }],
    });

    const matches = result.sources.filter((source) => source.title.trim() === "Claude Code Worktrees");
    expect(matches).toHaveLength(1);
    // slug-based href must win over /wiki/{pageId}
    expect(matches[0]?.href).toBe("/guides/worktrees");
  });

  it("prefers slug hrefs for faq and library pages over /wiki/{pageId}", () => {
    const result = normalizeWikiSearchResponse({
      answer: "설명",
      confluenceData: [{ pageId: "7", title: "FAQ 항목" }],
      recommendedDocuments: [{ id: "7", title: "FAQ 항목", href: "/faq/faq-item" }],
    });

    expect(result.sources).toHaveLength(1);
    expect(result.sources[0]?.href).toBe("/faq/faq-item");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sfood/edge-sidebar test -- --run wikiClient`
Expected: FAIL — current dedup is title-based and treats `/wiki/42` vs `/guides/worktrees` as separate, and `isSpecificDocumentHref` does not recognize `/faq/`.

- [ ] **Step 3: Implement — extend the source type and capture ids**

In `apps/edge-sidebar/src/sidepanel/wikiClient.ts`, extend `WikiSearchSource`:

```ts
export type WikiSearchSource = {
  id?: string;
  title: string;
  href: string;
};
```

Update `readDocumentSources` to capture an id (pageId for evidence items, id for recommended/related items):

```ts
function readDocumentSources(value: unknown): WikiSearchSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isWikiDocumentLike(item) || typeof item.title !== "string") {
        return null;
      }

      const title = item.title.trim();
      const href = readDocumentHref(item);
      const id = readDocumentId(item);

      return title && href ? { id, title, href } : null;
    })
    .filter((item): item is WikiSearchSource => item !== null);
}

function readDocumentId(document: WikiDocumentLike): string | undefined {
  if (typeof document.pageId === "string" && document.pageId.trim()) {
    return document.pageId.trim();
  }

  if (typeof document.id === "string" && document.id.trim()) {
    return document.id.trim();
  }

  return undefined;
}
```

- [ ] **Step 4: Implement — dedup by id, prefer specific href**

Replace the `.reduce(...)` body inside `normalizeWikiSearchResponse` with id-first dedup:

```ts
export function normalizeWikiSearchResponse(data: WikiSearchResponse): WikiSearchResult {
  const answer =
    typeof data.answer === "string" && data.answer.trim()
      ? data.answer.trim()
      : "위키 검색 응답을 받았지만 표시할 답변 본문이 없습니다.";

  const sources = [
    ...readDocumentSources(data.confluenceData),
    ...readDocumentSources(data.recommendedDocuments),
    ...readDocumentSources(data.relatedDocuments),
  ].reduce<WikiSearchSource[]>((accumulated, source) => {
    const sourceKey = source.id ?? source.title;
    const existingIndex = accumulated.findIndex((item) => (item.id ?? item.title) === sourceKey);

    if (existingIndex < 0) {
      return [...accumulated, source];
    }

    if (isSpecificDocumentHref(source.href) && !isSpecificDocumentHref(accumulated[existingIndex]?.href ?? "")) {
      return accumulated.map((item, index) => (index === existingIndex ? source : item));
    }

    return accumulated;
  }, []);

  return { answer, sources };
}
```

- [ ] **Step 5: Implement — widen specific-href recognition**

Replace `isSpecificDocumentHref`:

```ts
function isSpecificDocumentHref(href: string) {
  return /\/(guides|faq|library)\//.test(href);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @sfood/edge-sidebar test -- --run wikiClient`
Expected: PASS (existing tests + 2 new tests). If the existing "unique source titles" test asserted the old title-based shape, update its expectations to match id-based dedup while keeping the same intent (one entry per page, slug href preferred).

- [ ] **Step 7: Commit**

```bash
git add apps/edge-sidebar/src/sidepanel/wikiClient.ts apps/edge-sidebar/src/sidepanel/wikiClient.test.ts
git commit -m "fix: deduplicate sidebar sources by page id and prefer slug hrefs"
```

---

## Task 4: 익스텐션 가이드 본문을 정리된 엔드포인트에서 로드

**Files:**
- Modify: `apps/edge-sidebar/src/sidepanel/wikiClient.ts` (`requestWikiDocumentByHref`, add `findCleanDocumentByHref`; remove `findWikiDocumentByHref`, `readSidebarDocument`, `rewriteConfluenceStorageLinks`, `extractConfluenceLinkText`, `SidebarDocumentRaw`, `WikiPagesResponse` if unused)
- Test: `apps/edge-sidebar/src/sidepanel/wikiClient.test.ts`

- [ ] **Step 1: Write the failing test**

Replace the `findWikiDocumentByHref` import in `wikiClient.test.ts` with `findCleanDocumentByHref`, remove the `rewriteConfluenceStorageLinks` import, and add:

```ts
  it("finds a cleaned document by slug href", () => {
    const pages = [
      {
        id: "42",
        slug: "worktrees",
        title: "Claude Code Worktrees",
        summary: "요약",
        href: "/guides/worktrees",
        docType: "guide",
        contentHtml: "<p>본문</p>",
        related: [{ title: "관련", href: "/guides/related" }],
      },
    ];

    const found = findCleanDocumentByHref(pages, "http://localhost:5173", "/guides/worktrees");
    expect(found?.title).toBe("Claude Code Worktrees");
    expect(found?.contentHtml).toBe("<p>본문</p>");
    expect(found?.relatedDocuments).toEqual([{ title: "관련", href: "/guides/related" }]);
  });

  it("finds a cleaned document by /wiki/{id} href", () => {
    const pages = [
      { id: "42", slug: "worktrees", title: "T", summary: "", href: "/guides/worktrees", docType: "guide", contentHtml: "<p>x</p>", related: [] },
    ];

    const found = findCleanDocumentByHref(pages, "http://localhost:5173", "/wiki/42");
    expect(found?.id).toBe("42");
  });

  it("returns null when no cleaned document matches", () => {
    expect(findCleanDocumentByHref([], "http://localhost:5173", "/guides/missing")).toBeNull();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sfood/edge-sidebar test -- --run wikiClient`
Expected: FAIL — `findCleanDocumentByHref` is not exported.

- [ ] **Step 3: Implement — new clean-document types and lookup**

In `apps/edge-sidebar/src/sidepanel/wikiClient.ts`, replace the `WikiSidebarDocument`/`WikiPagesResponse`/`WikiDocumentLike.page`/`SidebarDocumentRaw` machinery for guide loading with the cleaned-document shape. Add:

```ts
export type WikiSidebarDocument = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  contentHtml: string;
  relatedDocuments: WikiSearchSource[];
};

type CleanWikiPage = {
  id?: unknown;
  slug?: unknown;
  title?: unknown;
  summary?: unknown;
  href?: unknown;
  contentHtml?: unknown;
  related?: unknown;
};

type CleanDocumentsResponse = {
  pages?: unknown;
};
```

Rewrite `requestWikiDocumentByHref` to call the new endpoint:

```ts
export async function requestWikiDocumentByHref(baseUrl: string, href: string): Promise<WikiSidebarDocument> {
  const normalizedBaseUrl = normalizeWikiBaseUrl(baseUrl);
  const response = await fetch(`${normalizedBaseUrl}/api/wiki/documents`);

  if (!response.ok) {
    throw new Error(`Wiki documents failed with ${response.status}`);
  }

  const data = (await response.json()) as CleanDocumentsResponse;
  const document = findCleanDocumentByHref(data.pages, normalizedBaseUrl, href);

  if (!document) {
    throw new Error("가이드 본문을 찾지 못했습니다.");
  }

  return document;
}
```

Add `findCleanDocumentByHref`:

```ts
export function findCleanDocumentByHref(value: unknown, baseUrl: string, href: string): WikiSidebarDocument | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const target = parseWikiHref(baseUrl, href);

  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) {
      continue;
    }

    const page = raw as CleanWikiPage;
    const id = typeof page.id === "string" ? page.id : "";
    const slug = typeof page.slug === "string" ? page.slug : "";
    const contentHtml = typeof page.contentHtml === "string" ? page.contentHtml : "";
    const title = typeof page.title === "string" ? page.title : "";

    const matches = target.id ? id === target.id : slug === target.slug;
    if (!matches || !title) {
      continue;
    }

    return {
      id,
      slug,
      title,
      summary: typeof page.summary === "string" ? page.summary : "",
      contentHtml,
      relatedDocuments: readCleanRelated(page.related),
    };
  }

  return null;
}

function readCleanRelated(value: unknown): WikiSearchSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }
      const related = item as { title?: unknown; href?: unknown };
      const title = typeof related.title === "string" ? related.title.trim() : "";
      const href = typeof related.href === "string" ? related.href.trim() : "";
      return title && href ? { title, href } : null;
    })
    .filter((item): item is WikiSearchSource => item !== null);
}
```

- [ ] **Step 4: Remove now-dead storage-format code**

Delete from `wikiClient.ts` (no longer referenced): `rewriteConfluenceStorageLinks`, `extractConfluenceLinkText`, `readSidebarDocument`, `findWikiDocumentByHref`, `SidebarDocumentRaw`, `WikiPagesResponse`, `escapeHtml`, and the `page`/`metadata`/`bodyHtml` fields on `WikiDocumentLike` if they become unused. Keep `parseWikiHref`, `readDocumentHref`, `readDocumentId`, `resolveWikiHref`, and the search-response helpers. Verify with a repo grep that no other file imports the removed symbols:

Run: `rg "rewriteConfluenceStorageLinks|findWikiDocumentByHref" apps/edge-sidebar`
Expected: no matches outside the deleted definitions/tests.

- [ ] **Step 5: Run test + typecheck to verify pass**

Run: `pnpm --filter @sfood/edge-sidebar test -- --run wikiClient && pnpm --filter @sfood/edge-sidebar typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/edge-sidebar/src/sidepanel/wikiClient.ts apps/edge-sidebar/src/sidepanel/wikiClient.test.ts
git commit -m "fix: load sidebar guide body from cleaned documents endpoint"
```

---

## Task 5: 익스텐션 콜아웃/코드 테마 스타일

**Files:**
- Modify: `apps/edge-sidebar/src/sidepanel/styles.css`

- [ ] **Step 1: Add callout styles**

Append to `apps/edge-sidebar/src/sidepanel/styles.css` (after the existing `.guide-body` rules):

```css
.guide-body .wiki-callout {
  margin: 12px 0;
  padding: 10px 12px;
  border-left: 3px solid color-mix(in srgb, var(--accent) 55%, var(--panel-border));
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 8%, var(--panel-bg));
  color: var(--page-fg);
}

.guide-body .wiki-callout--warning {
  border-left-color: #d9534f;
  background: color-mix(in srgb, #d9534f 10%, var(--panel-bg));
}

.guide-body .wiki-callout__title {
  margin: 0 0 4px;
  font-weight: 700;
  color: var(--page-fg);
}

.guide-body .wiki-callout > :last-child {
  margin-bottom: 0;
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm --filter @sfood/edge-sidebar build`
Expected: PASS (Vite build completes; CSS bundled).

- [ ] **Step 3: Commit**

```bash
git add apps/edge-sidebar/src/sidepanel/styles.css
git commit -m "feat: add theme-aware callout styles to sidebar guide body"
```

---

## Task 6: 전체 검증 및 리뷰

**Files:** none (validation only)

- [ ] **Step 1: Full workspace tests and typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS. Record counts in `docs/tasks/edge-sidebar-fixes/test-result.md`.

- [ ] **Step 2: Playwright regression on the web guide/search paths**

Use Playwright MCP to open `http://localhost:5173`, run a search that returns page recommendations, and open a guide document. Confirm: web guide body still renders correctly (no regression), search recommendations render. Record findings in `test-result.md`.

- [ ] **Step 3: Manual extension check (user browser)**

The MCP Playwright browser cannot load the unpacked extension. Ask the user to reload the unpacked extension, then verify: (a) search "참고 문서" shows each page once, (b) recommended/reference links open the guide pane, (c) guide body shows content once with visible text in dark mode. Record the user's confirmation in `test-result.md`.

- [ ] **Step 4: Codex critical review**

Send the full diff to Codex (`mcp__codex__codex`) for critical review. Address or explicitly justify each finding. Record outcomes.

- [ ] **Step 5: Update task workspace and status**

Update `docs/tasks/edge-sidebar-fixes/{tasks.md,test-result.md,result.md}` and append a dated entry to `docs/prd/implementation-status.md`.

- [ ] **Step 6: Commit**

```bash
git add docs/
git commit -m "docs: record edge-sidebar-fixes validation and status"
```

---

## Self-Review Notes

- **Spec coverage:** AC1/AC2 → Task 1 tests; AC3 → Task 2; AC4 → Task 3; AC5 → Task 4; AC6 → Task 5; AC7 → Task 6. All spec scope items (wiki-core function, endpoint, wikiClient dedup/href/body, styles) have tasks.
- **Type consistency:** `WikiSidebarDocument` (Task 4) keeps the same shape the guide pane in `main.tsx` already consumes (`title`, `summary`, `contentHtml`, `relatedDocuments`), so no `main.tsx` change is required. `WikiSearchSource` gains an optional `id` (Task 3) used consistently by `readDocumentSources` and dedup. `findCleanDocumentByHref` reuses the existing `parseWikiHref`.
- **Isolation:** No edge-sidebar file imports `@sfood/wiki-core`; the cleaning runs server-side only. Extension `package.json` dependencies remain unchanged.
- **Placeholder scan:** No TBD/TODO; every code step includes complete code.
