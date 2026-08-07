import { describe, expect, it } from "vitest";
import {
  buildFallbackSearchQuery,
  expandSearchContextDocuments,
  getIndexFirstSearchWikiDocumentsIn,
  getTopSearchWikiDocumentsIn,
  getParentWikiDocumentFrom,
  getWikiDocumentHref,
  getWikiDocumentSection,
  listWikiDocumentsBySectionFrom,
  searchWikiDocumentsIn,
  stripTitleTypePrefix,
  validateWikiGraphReferencesFrom,
  type WikiDocument,
} from "./wikiDocuments";

function document(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "1",
    slug: "doc",
    title: "Document",
    summary: "Summary",
    updatedAt: "2026-04-30",
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

describe("stripTitleTypePrefix", () => {
  it("removes a leading bracket type prefix", () => {
    expect(stripTitleTypePrefix("[Guide] Claude 모델 선택 가이드")).toBe("Claude 모델 선택 가이드");
    expect(stripTitleTypePrefix("[FAQ] 비개발자도 Codex를 배워서 쓸 수 있나요?")).toBe(
      "비개발자도 Codex를 배워서 쓸 수 있나요?",
    );
  });

  it("leaves titles without a bracket prefix unchanged", () => {
    expect(stripTitleTypePrefix("Claude Code Skills")).toBe("Claude Code Skills");
  });

  it("only strips a leading prefix, not brackets elsewhere in the title", () => {
    expect(stripTitleTypePrefix("Claude Code [Beta] 기능 안내")).toBe("Claude Code [Beta] 기능 안내");
  });
});

describe("wiki document graph helpers", () => {
  it("resolves a visible parent document", () => {
    const parent = document({ id: "parent", title: "Parent" });
    const child = document({ id: "child", parentId: "parent", title: "Child" });

    expect(getParentWikiDocumentFrom([parent, child], child)).toBe(parent);
  });

  it("reports missing parent and metadata graph references", () => {
    const source = document({
      id: "source",
      parentId: "missing-parent",
      metadata: {
        ...document().metadata,
        prerequisites: ["missing-prerequisite"],
        next: ["next"],
        related: ["missing-related"],
      },
    });
    const next = document({ id: "next" });

    expect(validateWikiGraphReferencesFrom([source, next])).toEqual([
      { documentId: "source", missingId: "missing-parent" },
      { documentId: "source", missingId: "missing-prerequisite" },
      { documentId: "source", missingId: "missing-related" },
    ]);
  });

  it("matches natural language questions against body tokens", () => {
    const groups = searchWikiDocumentsIn([
      document({
        id: "mcp",
        title: "MCP 설정",
        contentHtml: "<p>Windows에서 GPT 파일 시스템 MCP를 설정합니다.</p>",
      }),
    ], "윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?");

    expect(groups.guides[0]?.id).toBe("mcp");
  });

  it("builds a cleaner fallback query when stage-1 keyword extraction is unavailable", () => {
    const fallback = buildFallbackSearchQuery("claude worktree를 설명하세요.");
    expect(fallback).toContain("claude");
    expect(fallback).toContain("worktree");
    expect(fallback).toContain("worktrees");
    expect(fallback).not.toContain("설명");
  });

  it("normalizes Korean particles and email synonyms in search terms", () => {
    const gmailDoc = document({
      id: "gmail",
      slug: "gmail-mcp-setup",
      title: "[Guide] Gmail MCP Setup",
      summary: "Gmail 메일을 조회하고 답장 초안을 작성하는 방법",
      contentHtml: "<p>Gmail 메일을 조회하고 설정합니다.</p>",
    });
    const microsoftDoc = document({
      id: "m365",
      slug: "microsoft-365-mcp-setup",
      title: "[Guide] Microsoft 365 MCP Setup",
      summary: "Outlook 메일과 일정 연결 방법",
      contentHtml: "<p>Outlook 메일과 캘린더를 연결합니다.</p>",
    });

    expect(searchWikiDocumentsIn([gmailDoc, microsoftDoc], "gmail을 설정하는 방법이 있을까?").guides.map((doc) => doc.id)).toContain("gmail");
    expect(searchWikiDocumentsIn([gmailDoc, microsoftDoc], "mail을 보내는 mcp는 어떻게 설정해?").guides.map((doc) => doc.id)).toEqual(expect.arrayContaining(["gmail", "m365"]));
  });

  it("prioritizes mail setup guides over generic MCP setup docs", () => {
    const gmailDoc = document({
      id: "gmail",
      slug: "gmail-mcp-setup",
      title: "[Guide] Gmail MCP Setup",
      summary: "Gmail 메일을 조회하고 답장 초안을 작성하는 방법",
      contentHtml: "<p>Gmail 메일을 조회하고 설정합니다.</p>",
    });
    const microsoftDoc = document({
      id: "m365",
      slug: "microsoft-365-mcp-setup",
      title: "[Guide] Microsoft 365 MCP Setup",
      summary: "Outlook 메일과 일정 연결 방법",
      contentHtml: "<p>Outlook 메일과 캘린더를 연결합니다.</p>",
    });
    const genericDoc = document({
      id: "generic",
      slug: "generic-mcp-setup",
      title: "[Guide] Generic MCP Setup",
      summary: "MCP 설정 방법",
      contentHtml: "<p>MCP를 설정합니다.</p>",
    });

    expect(
      getTopSearchWikiDocumentsIn([genericDoc, gmailDoc, microsoftDoc], "mail을 보내는 mcp는 어떻게 설정해?", 2).map((doc) => doc.id),
    ).toEqual(["gmail", "m365"]);
  });

  it("prefers broad overview pages over tool-specific setup pages for concept questions", () => {
    const overviewDoc = document({
      id: "overview",
      metadata: {
        ...document().metadata,
        docType: "guide",
      },
      title: "[Guide] MCP 설정하기",
      summary: "MCP를 목적별로 선택해 따라갈 수 있도록 정리한 종합 가이드",
      contentHtml: "<p>목적, 개요, 정의를 함께 설명합니다.</p>",
    });
    const setupDoc = document({
      id: "setup",
      slug: "filesystem-mcp-setup",
      metadata: {
        ...document().metadata,
        docType: "page",
      },
      title: "[Guide] Filesystem MCP Setup",
      summary: "Filesystem MCP를 먼저 연결하는 방법",
      contentHtml: "<p>Filesystem MCP를 설정하고 테스트합니다.</p>",
    });

    expect(
      getTopSearchWikiDocumentsIn([setupDoc, overviewDoc], "mcp가 뭐지?", 1).map((doc) => doc.id),
    ).toEqual(["overview"]);
  });

  it("rescues exact page-backed concept topics above broad neighboring guides", () => {
    const broadGuide = document({
      id: "guide",
      metadata: {
        ...document().metadata,
        docType: "guide",
      },
      title: "[Guide] Claude Code로 자동화 워크플로우 만들기",
      summary: "Claude Code workflow guide",
      contentHtml: "<p>Claude Code로 자동화 흐름을 설명합니다.</p>",
    });
    const targetPage = document({
      id: "worktree",
      slug: "guide-claude-code-worktrees",
      metadata: {
        ...document().metadata,
        docType: "page",
      },
      title: "[Guide] Claude Code Worktrees",
      summary: "Claude Code worktree는 여러 작업을 서로 격리해 병렬로 진행하는 방법입니다.",
      contentHtml: "<p>claude --worktree와 git worktree 차이를 설명합니다.</p>",
    });

    expect(
      getTopSearchWikiDocumentsIn([broadGuide, targetPage], "claude worktree를 설명하세요.", 1).map((doc) => doc.id),
    ).toEqual(["worktree"]);
  });

  it("keeps concept overview pages ahead of generic index pages for concept questions", () => {
    const overviewDoc = document({
      id: "overview",
      metadata: {
        ...document().metadata,
        docType: "guide",
      },
      title: "[Guide] MCP 설정하기",
      summary: "MCP를 목적별로 선택해 따라갈 수 있도록 정리한 종합 가이드",
      contentHtml: "<p>목적, 개요, 정의를 함께 설명합니다.</p>",
    });
    const indexDoc = document({
      id: "index",
      slug: "guide-index",
      metadata: {
        ...document().metadata,
        docType: "nav",
      },
      title: "[Guide] Index",
      summary: "MCP 및 로컬 도구 시작 문서",
      contentHtml: "<p>MCP 시작 문서와 인덱스를 정리합니다.</p>",
    });

    expect(
      getTopSearchWikiDocumentsIn([indexDoc, overviewDoc], "mcp가 뭐지?", 1).map((doc) => doc.id),
    ).toEqual(["overview"]);
  });

  it("still expands from matched indexes for concept questions", () => {
    const indexDoc = document({
      id: "index",
      slug: "guide-mcp-index",
      metadata: {
        ...document().metadata,
        docType: "nav",
      },
      title: "[Guide] MCP Index",
      summary: "MCP 개요와 하위 문서를 모은 인덱스",
      contentHtml: "<p>MCP 개요를 정리합니다.</p>",
    });
    const childDoc = document({
      id: "child",
      parentId: "index",
      slug: "guide-alpha-detail",
      title: "[Guide] Alpha Detail",
      summary: "세부 절차를 정리한 문서",
      contentHtml: "<p>세부 절차를 정리합니다.</p>",
    });
    const overviewDoc = document({
      id: "overview",
      metadata: {
        ...document().metadata,
        docType: "guide",
      },
      title: "[Guide] MCP란 무엇인가",
      summary: "MCP 개념 설명",
      contentHtml: "<p>MCP의 정의와 역할을 설명합니다.</p>",
    });

    expect(
      getIndexFirstSearchWikiDocumentsIn([overviewDoc, childDoc, indexDoc], "mcp가 뭐지?", 2).map((doc) => doc.id),
    ).toEqual(expect.arrayContaining(["overview", "child"]));
  });

  it("routes different question shapes to different page families", () => {
    const conceptDoc = document({
      id: "concept",
      title: "[Guide] MCP란 무엇인가",
      summary: "MCP 개념 설명",
      contentHtml: "<h2>개요</h2><p>MCP의 정의와 역할을 설명합니다.</p><h2>설명</h2>",
    });
    const setupDoc = document({
      id: "setup",
      slug: "codex-browser-mcp-setup",
      metadata: {
        ...document().metadata,
        docType: "page",
      },
      title: "[Guide] Codex Browser MCP Setup",
      summary: "Browser MCP 연결 방법",
      contentHtml: "<p>Browser MCP를 설치하고 설정합니다.</p>",
    });
    const troubleshootDoc = document({
      id: "troubleshoot",
      slug: "codex-browser-mcp-troubleshooting",
      title: "[Guide] Codex Browser MCP 오류 해결",
      summary: "설정이 안 될 때 확인할 항목",
      metadata: {
        ...document().metadata,
        docType: "faq",
      },
      contentHtml: "<p>설정이 안 될 때 오류 원인과 해결 순서를 정리합니다.</p>",
    });
    const planningDoc = document({
      id: "planning",
      title: "[Guide] MCP 연결 전 준비사항",
      summary: "반드시 정할 항목과 뒤로 미룰 항목",
      contentHtml: "<p>반드시 지금 정할 것과 뒤로 미뤄도 되는 것을 나눠서 정리합니다.</p>",
    });

    expect(getTopSearchWikiDocumentsIn([conceptDoc, setupDoc, troubleshootDoc, planningDoc], "mcp가 뭐지?", 1).map((doc) => doc.id)).toEqual(["concept"]);
    expect(getTopSearchWikiDocumentsIn([conceptDoc, setupDoc, troubleshootDoc, planningDoc], "mcp 설치 방법", 1).map((doc) => doc.id)).toEqual(["setup"]);
    expect(getTopSearchWikiDocumentsIn([conceptDoc, setupDoc, troubleshootDoc, planningDoc], "오류가 나서 설정이 안 돼", 1).map((doc) => doc.id)).toEqual(["troubleshoot"]);
    expect(getTopSearchWikiDocumentsIn([conceptDoc, setupDoc, troubleshootDoc, planningDoc], "프로젝트 설계 시작하기 전에 어떤 준비를 해야 하나?", 1).map((doc) => doc.id)).toEqual(["planning"]);
  });

  it("keeps the most relevant document ahead of section ordering", () => {
    const guideDoc = document({
      id: "guide",
      title: "Generic Guide",
      summary: "Generic content",
      contentHtml: "<p>Generic content only.</p>",
    });
    const faqDoc = document({
      id: "faq",
      metadata: { ...document().metadata, docType: "faq" },
      title: "Codex CLI install",
      summary: "How to install Codex in CLI environments",
      contentHtml: "<p>Install Codex in CLI environments.</p>",
    });

    expect(getTopSearchWikiDocumentsIn([guideDoc, faqDoc], "codex cli install", 1).map((doc) => doc.id)).toEqual(["faq"]);
  });

  it("uses matched index documents to expand into detailed search candidates", () => {
    const results = getIndexFirstSearchWikiDocumentsIn([
      document({
        id: "codex-index",
        slug: "guide-codex-index",
        title: "[Guide] Codex Index",
        metadata: {
          ...document().metadata,
          docType: "nav",
          related: ["codex-mcp"],
        },
      }),
      document({
        id: "codex-mcp",
        slug: "guide-codex-mcp-setup",
        title: "[Guide] Codex MCP Setup",
        contentHtml: "<p>Codex에서 MCP를 설정합니다.</p>",
      }),
      document({
        id: "other-index",
        slug: "faq-index",
        metadata: { ...document().metadata, docType: "nav" },
        title: "[FAQ] Index",
      }),
    ], "codex mcp 설정", 4);

    expect(results.map((result) => result.id)).toEqual(["codex-mcp"]);
  });

  it("keeps index-first expansion active for concept-style questions", () => {
    const indexDoc = document({
      id: "mcp-index",
      slug: "guide-mcp-index",
      metadata: {
        ...document().metadata,
        docType: "nav",
      },
      title: "[Guide] MCP Index",
      summary: "MCP 개요와 하위 문서를 모은 인덱스",
      contentHtml: "<p>MCP 개요를 정리합니다.</p>",
    });
    const overviewDoc = document({
      id: "mcp-overview",
      slug: "guide-mcp-overview",
      metadata: {
        ...document().metadata,
        docType: "guide",
      },
      title: "[Guide] MCP란 무엇인가",
      summary: "MCP 개념 설명",
      contentHtml: "<p>MCP의 정의와 역할을 설명합니다.</p>",
    });
    const setupDoc = document({
      id: "mcp-setup",
      parentId: "mcp-index",
      slug: "guide-mcp-setup",
      title: "[Guide] MCP 개요 흐름",
      summary: "개념을 따라 읽는 하위 문서",
      contentHtml: "<p>MCP 개요와 읽는 순서를 정리합니다.</p>",
    });

    const results = getIndexFirstSearchWikiDocumentsIn([setupDoc, overviewDoc, indexDoc], "mcp가 뭐지?", 2);

    expect(results.map((result) => result.id)).toEqual(expect.arrayContaining(["mcp-overview", "mcp-setup"]));
  });

  it("does not expand matched indexes into unrelated same-category pages", () => {
    const results = getIndexFirstSearchWikiDocumentsIn([
      document({
        id: "index",
        slug: "guide-codex-index",
        title: "[Guide] Codex Index",
        metadata: {
          ...document().metadata,
          docType: "nav",
          related: ["linked-guide"],
        },
      }),
      document({
        id: "linked-guide",
        slug: "guide-codex-mcp-setup",
        title: "[Guide] Codex MCP Setup",
        contentHtml: "<p>Codex에서 MCP를 설정합니다.</p>",
      }),
      document({
        id: "unrelated-guide",
        slug: "guide-unrelated",
        title: "[Guide] Unrelated Page",
        contentHtml: "<p>Unrelated content.</p>",
      }),
    ], "codex mcp 설정", 4);

    expect(results.map((result) => result.id)).toEqual(["linked-guide"]);
  });

  it("expands search context through graph neighbors and reverse links", () => {
    const seed = document({
      id: "seed",
      parentId: "parent",
      metadata: {
        ...document().metadata,
        prerequisites: ["prereq"],
        next: ["next"],
        related: ["related"],
      },
    });
    const parent = document({ id: "parent", title: "Parent" });
    const prereq = document({ id: "prereq", title: "Prereq" });
    const next = document({ id: "next", title: "Next" });
    const related = document({ id: "related", title: "Related" });
    const child = document({ id: "child", parentId: "seed", title: "Child" });
    const reverse = document({
      id: "reverse",
      title: "Reverse",
      metadata: {
        ...document().metadata,
        related: ["seed"],
      },
    });

    const results = expandSearchContextDocuments(
      [seed, parent, prereq, next, related, child, reverse],
      [seed],
      10,
    );

    expect(results.map((item) => item.id)).toEqual([
      "seed",
      "parent",
      "prereq",
      "next",
      "related",
      "child",
      "reverse",
    ]);
  });
});

describe("lesson docType isolation", () => {
  function lessonDocument(overrides: Partial<WikiDocument> = {}): WikiDocument {
    return {
      id: "lesson-1",
      slug: "ai-first-perspective",
      title: "AI를 이해하는 첫 번째 관점",
      summary: "요약",
      updatedAt: "2026-07-30",
      metadata: {
        docType: "lesson",
        audience: "beginner",
        status: "published",
        prerequisites: [],
        next: [],
        related: [],
      },
      headings: [],
      contentHtml: "<h1>제목</h1><h2>장면 1</h2><p>본문</p>",
      ...overrides,
    };
  }

  it("getWikiDocumentSection returns null for lesson documents", () => {
    expect(getWikiDocumentSection(lessonDocument())).toBeNull();
  });

  it("getWikiDocumentHref returns null for lesson documents", () => {
    expect(getWikiDocumentHref(lessonDocument())).toBeNull();
  });

  it("excludes lesson documents from search results", () => {
    const results = searchWikiDocumentsIn(
      [lessonDocument({ title: "AI 기초교육 첫 장면", contentHtml: "<p>AI 기초교육 첫 장면 내용</p>" })],
      "AI 기초교육",
    );

    expect(results.guides).toHaveLength(0);
    expect(results.faq).toHaveLength(0);
    expect(results.library).toHaveLength(0);
  });

  it("excludes lesson documents from guides section listing", () => {
    const documents = [lessonDocument(), lessonDocument({ id: "lesson-2", slug: "context-and-memory" })];

    expect(listWikiDocumentsBySectionFrom(documents, "guides")).toHaveLength(0);
  });
});
