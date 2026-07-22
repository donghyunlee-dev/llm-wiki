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
    const documents = [doc({ id: "99", slug: "worktrees", title: "[Guide] Worktrees" })];
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

    expect(out).not.toContain("docType");
    expect(out).not.toMatch(/<\/?(?:ac|ri):/);
    expect(out).toContain("<p>본문</p>");
  });

  it("returns an empty string for empty input", () => {
    expect(renderConfluenceContentToCleanHtml("", [])).toBe("");
  });
});
