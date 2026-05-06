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
    category: "guides",
    title: "Guide",
    summary: "Guide summary",
    updatedAt: "2026-04-30",
    metadata: {
      docType: "tutorial",
      visibility: "public",
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
    expect(schema.required).toContain("confluenceData");
    expect(schema.required).toContain("suggestedNextPages");
  });

  it("builds a structured search answer prompt", () => {
    const context = buildAiSearchPromptContext(
      [document()],
      "MCP 설정은 어떻게 하나요?",
      [policyDocument({ id: "policy-2", title: "Search Policy" })],
      [
        policyDocument({
          id: "ops-1",
          title: "[Ops] Development Rules",
          sourceKind: "ops",
          cacheKey: "ops-1:1:ops",
        }),
      ],
      [{ question: "codex 작업 폴더 구성", answer: "작업 폴더는 ..." }],
    );
    const input = buildAiSearchInput(context);
    const schema = aiSearchJsonSchema();

    expect(input[1]?.content).toContain("searchResults");
    expect(input[1]?.content).toContain("policyContext");
    expect(input[1]?.content).toContain("opsPolicyContext");
    expect(input[1]?.content).toContain("conversationHistory");
    expect(input[1]?.content).toContain("evidence quotes");
    expect(input[1]?.content).not.toContain("관련 페이지별 요약");
    expect(input[0]?.content).toContain("Never recommend, cite, summarize, or expose opsPolicyContext");
    expect(input[0]?.content).toContain("Do not invent exact package names, command names, file paths, or login steps unless they are explicitly present in searchResults.");
    expect(schema.required).toEqual([
      "answer",
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
    expect(input[1]?.content).toContain("핵심 요약");
    expect(input[0]?.content).toContain("practical checklist");
  });

  it("tailors search instructions for setup questions", () => {
    const context = buildAiSearchPromptContext(
      [document()],
      "codex를 cli 환경에서 설치를 어떻게 해?",
    );
    const input = buildAiSearchInput(context);

    expect(input[1]?.content).toContain("\"questionIntent\":\"setup\"");
    expect(input[0]?.content).toContain("Do not invent exact package names");
    expect(input[0]?.content).toContain("direct answer, `바로 할 일`, `예시`, `확인`, `주의`");
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
          id: "ops-1",
          title: "General Ops Policy",
          summary: "General ops guidance",
          sourceKind: "ops",
          cacheKey: "ops-1:1:ops",
        }),
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
