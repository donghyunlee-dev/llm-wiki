import { describe, expect, it } from "vitest";
import {
  aiAskJsonSchema,
  aiSearchJsonSchema,
  buildAiAskInput,
  buildAiAskPromptContext,
  buildSearchFollowUpQuestion,
  buildPolicyPromptContext,
  buildAiSearchInput,
  buildAiSearchPromptContext,
} from "./aiAsk";
import type { PolicyDocument } from "./wikiDataSource";
import type { WikiDocument } from "./wikiDocuments";

function document(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "page-1",
    slug: "guide",
    title: "Guide",
    summary: "Guide summary",
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
    contentHtml: "<h1>Guide</h1><p>Use the approved guide flow.</p>",
    ...overrides,
  };
}

function policyDocument(overrides: Partial<PolicyDocument> = {}): PolicyDocument {
  return {
    id: "policy-1",
    version: 1,
    title: "Policy Guide",
    summary: "Policy summary",
    contentText: "Policy summary and rules.",
    cacheKey: "policy-1:1:policy",
    sourceKind: "policy",
    ...overrides,
  };
}

describe("aiAsk prompt helpers", () => {
  it("builds a page-scoped prompt context from wiki documents", () => {
    const context = buildAiAskPromptContext(
      document(),
      [document({ id: "next-1", title: "Next" })],
      [policyDocument()],
      "무엇부터 해야 하나요?",
      [{ question: "이전 질문", answer: "이전 답변" }],
    );

    expect(context.page.contentText).toContain("Use the approved guide flow.");
    expect(context.relatedDocuments[0]).toMatchObject({
      id: "next-1",
      title: "Next",
    });
    expect(context.policyContext.selectedPolicies[0]).toMatchObject({
      id: "policy-1",
      title: "Policy Guide",
    });
    expect(context.history[0]).toMatchObject({
      question: "이전 질문",
      answer: "이전 답변",
    });
  });

  it("builds structured input and schema for the Responses API", () => {
    const context = buildAiAskPromptContext(document(), [], [policyDocument()], "질문");
    const input = buildAiAskInput(context);
    const schema = aiAskJsonSchema();

    expect(input[0]?.role).toBe("system");
    expect(input[1]?.content).toContain("candidateRecommendedPages");
    expect(input[1]?.content).toContain("policyContext");
    expect(input[1]?.content).toContain("policyNotice");
    expect(schema.required).toContain("confluenceData");
    expect(schema.required).toContain("suggestedNextPages");
    expect(schema.required).toContain("policyNotice");
  });

  it("builds a structured search answer prompt", () => {
    const context = buildAiSearchPromptContext(
      [document()],
      "MCP 설정은 어떻게 하나요?",
      [policyDocument({ id: "policy-2", title: "Search Policy" })],
      [{ question: "codex 작업 폴더 구성", answer: "작업 폴더는 ..." }],
    );
    const input = buildAiSearchInput(context);
    const schema = aiSearchJsonSchema();

    expect(input[1]?.content).toContain("searchResults");
    expect(input[1]?.content).toContain("policyContext");
    expect(input[1]?.content).toContain("conversationHistory");
    expect(input[1]?.content).toContain("policyNotice");
    expect(input[1]?.content).toContain("Supplemental next-step items only when they add useful detail");
    expect(input[1]?.content).toContain("evidence quotes");
    expect(input[0]?.content).toContain("friendly, explanatory assistant message for a non-developer employee");
    expect(input[0]?.content).toContain("Start with a friendly explanation of the topic and the document family");
    expect(input[0]?.content).toContain("blog-like teaching tone that explains why the page matters");
    expect(input[0]?.content).toContain("short vertical paragraphs");
    expect(input[0]?.content).toContain("Never use parentheses for definitions or side notes");
    expect(input[0]?.content).toContain("Do NOT create visible answer sections titled `바로 할 일`");
    expect(input[0]?.content).toContain("Keep the answer focused but not thin");
    expect(input[0]?.content).toContain("better than a three-line teaser");
    expect(input[1]?.content).toContain("short paragraphs separated by blank lines");
    expect(input[1]?.content).toContain("Do NOT use parentheses for definitions or side notes");
    expect(input[1]?.content).toContain("Do NOT create visible sections titled `바로 할 일`");
    expect(input[1]?.content).not.toContain("관련 페이지별 요약");
    expect(input[0]?.content).toContain("Do not invent exact package names, command names, file paths, or login steps unless they are explicitly present in searchResults.");
    expect(schema.required).toEqual([
      "answer",
      "policyNotice",
      "immediateActions",
      "exampleCommands",
      "verificationChecks",
      "cautions",
      "confluenceData",
      "unsupportedClaims",
      "recommendedPages",
    ]);
  });

  it("tailors search instructions for broad planning questions", () => {
    const context = buildAiSearchPromptContext(
      [document()],
      "프로젝트 설계 시작하기 전에 어떤 준비를 해야 하나?",
    );
    const input = buildAiSearchInput(context);

    expect(input[1]?.content).toContain("\"questionIntent\":\"broad-planning\"");
    expect(input[0]?.content).toContain("Avoid fixed section headings in the answer body");
    expect(input[1]?.content).toContain("avoid visible section headings");
    expect(input[0]?.content).toContain("practical checklist");
  });

  it("tailors search instructions for concept questions", () => {
    const context = buildAiSearchPromptContext(
      [document()],
      "mcp가 뭐지?",
    );
    const input = buildAiSearchInput(context);

    expect(input[1]?.content).toContain("\"questionIntent\":\"concept\"");
    expect(input[0]?.content).toContain("concept or definition questions");
    expect(input[0]?.content).toContain("Do NOT add 바로 할 일");
  });

  it("classifies 'MCP가 뭐야?' as concept not setup", () => {
    const context = buildAiSearchPromptContext([document()], "MCP가 뭐야?");
    const input = buildAiSearchInput(context);
    expect(input[1]?.content).toContain('"questionIntent":"concept"');
  });

  it("classifies 'webhook이 뭐야' as concept not setup", () => {
    const context = buildAiSearchPromptContext([document()], "webhook이 뭐야");
    const input = buildAiSearchInput(context);
    expect(input[1]?.content).toContain('"questionIntent":"concept"');
  });

  it("includes subject-mismatch hallucination guard in search instructions", () => {
    const context = buildAiSearchPromptContext([document()], "claude webhook 사용법");
    const input = buildAiSearchInput(context);
    expect(input[0]?.content).toContain("subject of the user's question does not appear");
    expect(input[0]?.content).toContain("unsupportedClaims");
  });

  it("tailors search instructions for setup questions", () => {
    const context = buildAiSearchPromptContext(
      [document()],
      "codex를 cli 환경에서 설치를 어떻게 해?",
    );
    const input = buildAiSearchInput(context);

    expect(input[1]?.content).toContain("\"questionIntent\":\"setup\"");
    expect(input[0]?.content).toContain("Do not invent exact package names");
    expect(input[0]?.content).toContain("brief explanation of what the page family is for");
    expect(input[0]?.content).toContain("friendly natural explanation first");
    expect(input[0]?.content).toContain("Do not force every setup answer into the same four-section shape");
    expect(input[1]?.content).toContain("Do NOT create visible sections titled `바로 할 일`");
    expect(input[1]?.content).toContain("Do not make the answer a three-line teaser");
    expect(input[1]?.content).toContain("Supplemental next-step items only when they add useful detail");
    expect(input[1]?.content).toContain("Do NOT include install commands, config file paths, or package names in the answer body");
  });

  it("tailors search instructions for page lookup questions", () => {
    const context = buildAiSearchPromptContext(
      [
        document({
          id: "mcp-setup",
          slug: "guide-mcp-setup",
          title: "[Guide] MCP 설정하기",
          summary: "MCP 설정 페이지",
        }),
      ],
      "mcp 설정페이지가 있지 않아?",
    );
    const input = buildAiSearchInput(context);

    expect(input[1]?.content).toContain("\"questionIntent\":\"page-lookup\"");
    expect(input[0]?.content).toContain("finding whether a relevant page exists in searchResults");
    expect(input[0]?.content).toContain("Do not explain MCP, CLI, setup, or any other topic generally");
    expect(input[0]?.content).toContain("Start the answer by saying whether the page was found");
    expect(input[1]?.content).toContain("The user is asking whether a page/document/guide/link exists or where it is");
    expect(input[1]?.content).toContain("Start by saying whether a matching page appears in searchResults");
    expect(input[1]?.content).toContain("do not explain the topic concept first");
    expect(input[1]?.content).toContain("Recommend the exact or closest matching page or pages from searchResults");
    expect(input[1]?.content).toContain("MUST be an empty array [] for concept/definition or page-lookup questions");
  });

  it("includes non-developer user profile in ask instructions", () => {
    const context = buildAiAskPromptContext(document(), [], [policyDocument()], "질문");
    const input = buildAiAskInput(context);

    expect(input[0]?.content).toContain("non-developer employees");
    expect(input[0]?.content).toContain("never with parentheses");
    expect(input[0]?.content).toContain("short follow-up paragraph");
    expect(input[0]?.content).toContain("Prefer everyday Korean expressions over English jargon");
    expect(input[0]?.content).toContain("The `answer` field is the primary readable response");
  });

  it("includes non-developer user profile in search instructions", () => {
    const context = buildAiSearchPromptContext([document()], "MCP가 뭐지?");
    const input = buildAiSearchInput(context);

    expect(input[0]?.content).toContain("non-developer employees");
    expect(input[0]?.content).toContain("never with parentheses");
    expect(input[0]?.content).toContain("Prefer everyday Korean expressions over English jargon");
    expect(input[0]?.content).toContain("The `answer` field is the primary readable response");
  });

  it("combines follow-up conversation into a search query", () => {
    const query = buildSearchFollowUpQuestion("도우에 환경설정하는 것만 알려줘", [
      { question: "codex를 사용할 때 작업 폴더는 어떻게 구성해?", answer: "작업 폴더는..." },
    ]);

    expect(query).toContain("codex를 사용할 때 작업 폴더는 어떻게 구성해?");
    expect(query).not.toContain("작업 폴더는...");
  });

  it("prefers policy documents when building policy context", () => {
    const context = buildPolicyPromptContext(
      [
        policyDocument({
          id: "policy-2",
          title: "Exact Answer Policy",
          summary: "Exact answer guidance",
          contentText: "Exactly how the answer should behave.",
          sourceKind: "policy",
          cacheKey: "policy-2:1:policy",
        }),
      ],
      "exact answer",
      "Exact Answer Policy",
    );

    expect(context.policyRules).toHaveLength(4);
    expect(context.selectedPolicies[0]?.sourceKind).toBe("policy");
    expect(context.selectedPolicies[0]?.title).toBe("Exact Answer Policy");
  });
});
