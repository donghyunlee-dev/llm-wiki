import { describe, expect, it } from "vitest";

import {
  buildWikiSearchUrl,
  DEFAULT_WIKI_BASE_URL,
  findWikiDocumentByHref,
  normalizeWikiBaseUrl,
  normalizeWikiSearchResponse,
  resolveWikiHref,
  rewriteConfluenceStorageLinks
} from "./wikiClient";

describe("wiki sidebar client helpers", () => {
  it("normalizes empty and trailing-slash wiki base URLs", () => {
    expect(normalizeWikiBaseUrl("")).toBe(DEFAULT_WIKI_BASE_URL);
    expect(normalizeWikiBaseUrl(" http://localhost:5173/// ")).toBe("http://localhost:5173");
  });

  it("builds an encoded wiki search fallback URL", () => {
    expect(buildWikiSearchUrl("http://localhost:5173/", "claude worktree 설명")).toBe(
      "http://localhost:5173/search?q=claude+worktree+%EC%84%A4%EB%AA%85"
    );
  });

  it("resolves relative wiki links against the configured base URL", () => {
    expect(resolveWikiHref("http://localhost:5173/", "/guides/worktree")).toBe("http://localhost:5173/guides/worktree");
    expect(resolveWikiHref("http://localhost:5173", "search?q=abc")).toBe("http://localhost:5173/search?q=abc");
    expect(resolveWikiHref("http://localhost:5173", "https://wiki.example/guides/worktree")).toBe(
      "https://wiki.example/guides/worktree"
    );
  });

  it("normalizes answer and unique source titles from the wiki response", () => {
    const result = normalizeWikiSearchResponse({
      answer: " Claude Code Worktrees 설명입니다. ",
      confluenceData: [{ id: "1", title: "[Guide] Claude Code Worktrees" }],
      recommendedDocuments: [
        { title: "[Guide] Claude Code Worktrees", href: "/guides/worktrees" },
        { title: "Claude Code Index", slug: "claude-code-index" }
      ],
      relatedDocuments: [{ title: "" }, { title: 123 }]
    });

    expect(result).toEqual({
      answer: "Claude Code Worktrees 설명입니다.",
      sources: [
        { title: "[Guide] Claude Code Worktrees", href: "/guides/worktrees" },
        { title: "Claude Code Index", href: "/guides/claude-code-index" }
      ]
    });
  });

  it("keeps a guide href when the same source title also appears as confluence evidence", () => {
    const result = normalizeWikiSearchResponse({
      answer: "answer",
      confluenceData: [{ id: "1", title: "[Guide] Test" }],
      recommendedDocuments: [{ title: "[Guide] Test", href: "/guides/test-guide" }]
    });

    expect(result.sources).toEqual([{ title: "[Guide] Test", href: "/guides/test-guide" }]);
  });

  it("finds a wiki document by guide slug href", () => {
    const document = findWikiDocumentByHref(
      [
        {
          id: "119930898",
          slug: "guide-claude-code-vs-codex",
          title: "[Guide] Claude Code vs Codex",
          summary: "도구 비교",
          contentHtml: "<h1>본문</h1>"
        }
      ],
      "http://localhost:5173",
      "http://localhost:5173/guides/guide-claude-code-vs-codex"
    );

    expect(document).toEqual({
      id: "119930898",
      slug: "guide-claude-code-vs-codex",
      title: "[Guide] Claude Code vs Codex",
      summary: "도구 비교",
      contentHtml: "<h1>본문</h1>",
      relatedDocuments: []
    });
  });

  it("finds a wiki document by id fallback href", () => {
    const document = findWikiDocumentByHref(
      [
        {
          id: "95780877",
          slug: "guide-claude-code-worktrees",
          title: "[Guide] Claude Code Worktrees",
          summary: "",
          contentHtml: "<p>worktree</p>"
        }
      ],
      "http://localhost:5173",
      "/wiki/95780877"
    );

    expect(document?.slug).toBe("guide-claude-code-worktrees");
  });

  it("reads nested wiki page records from /api/wiki-pages", () => {
    const document = findWikiDocumentByHref(
      [
        {
          slug: "guide-claude-code-worktrees",
          page: {
            id: "95780877",
            title: "[Guide] Claude Code Worktrees",
            bodyHtml: "<p>nested body</p>"
          }
        }
      ],
      "http://localhost:5173",
      "/guides/guide-claude-code-worktrees"
    );

    expect(document).toEqual({
      id: "95780877",
      slug: "guide-claude-code-worktrees",
      title: "[Guide] Claude Code Worktrees",
      summary: "",
      contentHtml: "<p>nested body</p>",
      relatedDocuments: []
    });
  });

  it("resolves related page IDs to document links", () => {
    const document = findWikiDocumentByHref(
      [
        {
          slug: "guide-main",
          page: {
            id: "100",
            title: "Main Guide",
            bodyHtml: "<p>main</p>",
            metadata: { related: ["200", "300"] }
          }
        },
        {
          slug: "guide-related-a",
          page: {
            id: "200",
            title: "Related A",
            bodyHtml: "<p>a</p>",
            metadata: { related: [] }
          }
        },
        {
          slug: "guide-related-b",
          page: {
            id: "300",
            title: "Related B",
            bodyHtml: "<p>b</p>",
            metadata: { related: [] }
          }
        }
      ],
      "http://localhost:5173",
      "/guides/guide-main"
    );

    expect(document?.relatedDocuments).toEqual([
      { title: "Related A", href: "/guides/guide-related-a" },
      { title: "Related B", href: "/guides/guide-related-b" }
    ]);
  });

  it("builds href from confluenceData pageId", () => {
    const result = normalizeWikiSearchResponse({
      answer: "answer",
      confluenceData: [{ pageId: "95780877", title: "Claude Code Worktrees" }]
    });

    expect(result.sources).toEqual([{ title: "Claude Code Worktrees", href: "/wiki/95780877" }]);
  });
});

describe("rewriteConfluenceStorageLinks", () => {
  it("CDATA plain-text-link-body와 page ID가 있는 ac:link를 <a> 태그로 변환한다", () => {
    const html =
      `<p><ac:link><ri:page ri:content-id="12345" /><ac:plain-text-link-body><![CDATA[Codex Index]]></ac:plain-text-link-body></ac:link></p>`;
    expect(rewriteConfluenceStorageLinks(html)).toBe(
      `<p><a href="/wiki/12345">Codex Index</a></p>`
    );
  });

  it("ac:anchor 속성이 있는 ac:link를 페이지 내 해시 링크로 변환한다", () => {
    const html =
      `<ac:link ac:anchor="section-setup"><ac:plain-text-link-body><![CDATA[설치 섹션]]></ac:plain-text-link-body></ac:link>`;
    expect(rewriteConfluenceStorageLinks(html)).toBe(
      `<a href="#section-setup">설치 섹션</a>`
    );
  });

  it("page ID 없이 content-title만 있는 경우 텍스트만 렌더링한다", () => {
    const html =
      `<ac:link><ri:page ri:content-title="Unknown Page" /></ac:link>`;
    expect(rewriteConfluenceStorageLinks(html)).toBe("Unknown Page");
  });

  it("링크 텍스트가 없으면 빈 문자열로 변환한다", () => {
    const html = `<ac:link><ri:page ri:content-id="99" /></ac:link>`;
    expect(rewriteConfluenceStorageLinks(html)).toBe("");
  });

  it("ri:page-id 속성도 page ID로 인식한다", () => {
    const html =
      `<ac:link><ri:page ri:page-id="55555" /><ac:plain-text-link-body><![CDATA[다른 가이드]]></ac:plain-text-link-body></ac:link>`;
    expect(rewriteConfluenceStorageLinks(html)).toBe(
      `<a href="/wiki/55555">다른 가이드</a>`
    );
  });

  it("일반 <a> 태그는 변경하지 않는다", () => {
    const html = `<p><a href="https://example.com">외부 링크</a></p>`;
    expect(rewriteConfluenceStorageLinks(html)).toBe(html);
  });

  it("여러 ac:link 요소를 각각 변환한다", () => {
    const html = [
      `<ac:link><ri:page ri:content-id="100" /><ac:plain-text-link-body><![CDATA[Page A]]></ac:plain-text-link-body></ac:link>`,
      `<ac:link><ri:page ri:content-id="200" /><ac:plain-text-link-body><![CDATA[Page B]]></ac:plain-text-link-body></ac:link>`,
    ].join(" ");
    const result = rewriteConfluenceStorageLinks(html);
    expect(result).toContain(`<a href="/wiki/100">Page A</a>`);
    expect(result).toContain(`<a href="/wiki/200">Page B</a>`);
  });

  it("링크 텍스트의 HTML 특수문자를 이스케이프한다", () => {
    const html =
      `<ac:link><ri:page ri:content-id="77" /><ac:plain-text-link-body><![CDATA[A & B <Guide>]]></ac:plain-text-link-body></ac:link>`;
    expect(rewriteConfluenceStorageLinks(html)).toBe(
      `<a href="/wiki/77">A &amp; B &lt;Guide&gt;</a>`
    );
  });
});

describe("findWikiDocumentByHref — contentHtml link rewriting", () => {
  it("가이드 본문의 ac:link를 <a href='/wiki/{id}'> 태그로 변환해서 반환한다", () => {
    const document = findWikiDocumentByHref(
      [
        {
          slug: "codex-cli-setup",
          page: {
            id: "95780877",
            title: "Codex CLI Setup",
            bodyHtml: `<h2>관련 문서</h2><p><ac:link><ri:page ri:content-id="12345" /><ac:plain-text-link-body><![CDATA[Codex Index]]></ac:plain-text-link-body></ac:link></p>`,
            metadata: { related: [] }
          }
        }
      ],
      "http://localhost:5173",
      "/guides/codex-cli-setup"
    );

    expect(document?.contentHtml).toContain(`<a href="/wiki/12345">Codex Index</a>`);
    expect(document?.contentHtml).not.toContain("<ac:link>");
  });
});
