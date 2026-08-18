import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { HomePage } from "./HomePage";

const useWikiDataMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

function document(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "page-1",
    slug: "guide-index",
    title: "Guide Index",
    summary: "Index summary",
    updatedAt: "2026-05-01",
    metadata: {
      docType: "guide",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    },
    headings: [],
    contentHtml: "<p>Index</p>",
    ...overrides,
  };
}

describe("HomePage", () => {
  beforeEach(() => {
    useWikiDataMock.mockReset();
  });

  it("renders only search and an even recommendation card grid with the starting guide pinned first", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        document({
          id: "start",
          slug: "agent-start",
          title: "Agent 시작하기",
          metadata: {
            ...document().metadata,
            docType: "nav",
          },
        }),
        document({
          id: "guide-1",
          slug: "wiki-usage",
          title: "사내 위키 활용 방법",
        }),
        document({
          id: "guide-2",
          slug: "project-design-start",
          title: "프로젝트 설계 시작하기",
        }),
        document({
          id: "guide-3",
          slug: "guide-3",
          title: "가이드 3",
        }),
        document({
          id: "guide-4",
          slug: "guide-4",
          title: "가이드 4",
        }),
        document({
          id: "guide-5",
          slug: "guide-5",
          title: "가이드 5",
        }),
        document({
          id: "project-1",
          slug: "approval-tool",
          title: "업무 승인 요청 도구",
          metadata: {
            ...document().metadata,
            docType: "page",
          },
        }),
        document({
          id: "faq-1",
          slug: "common-questions",
          title: "자주 묻는 질문",
          metadata: {
            ...document().metadata,
            docType: "faq",
          },
        }),
        document({
          id: "library-1",
          slug: "basic-guidelines",
          title: "기본 지침서",
          metadata: {
            ...document().metadata,
            docType: "library",
          },
        }),
      ],
      errorMessage: null,
      isLoading: false,
    });

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(markup).toContain("궁금한 것을 검색해보세요");
    expect(markup).toContain("<textarea");
    expect(markup).toContain("추천 가이드");
    expect(markup).toContain("시작 가이드");
    expect(markup).toContain("/guides/agent-start");
    expect(markup).toContain("Agent 시작하기");
    expect(markup).toContain("사내 위키 활용 방법");
    expect(markup).toContain("프로젝트 설계 시작하기");
    expect(markup).toContain("가이드 3");
    expect(markup).toContain("가이드 4");
    expect(markup).not.toContain("가이드 5");
    expect(markup).toContain("home-guide-card-featured");
    expect(markup).toContain("home-guide-card-grid");
    // The project-design blueprint CTA is hidden (not yet complete) — see HomePage.tsx.
    expect(markup).not.toContain("만들고 싶은 방향이 정리되었나요?");
    expect(markup).not.toContain("프로젝트 사례");
    expect(markup).not.toContain("자료실");
  });

  it("renders the lesson entry section only when a lesson document exists", () => {
    useWikiDataMock.mockReturnValue({
      documents: [document({ id: "guide-1" })],
      errorMessage: null,
      isLoading: false,
    });

    const withoutLesson = renderToStaticMarkup(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(withoutLesson).not.toContain("교육 시작하기");

    useWikiDataMock.mockReturnValue({
      documents: [
        document({ id: "guide-1" }),
        document({
          id: "lesson-1",
          slug: "ai-first-perspective",
          title: "AI를 이해하는 첫 번째 관점",
          metadata: { ...document().metadata, docType: "lesson" },
          presentation: {
            schemaVersion: 1,
            lessonId: "ai-first-perspective",
            theme: "ai-foundation",
            scenes: [
              {
                sceneId: "scene-1",
                anchor: "장면",
                type: "concept",
                layout: "visual-split",
                narration: "",
                blocks: [{ order: 1, kind: "explanation", content: "본문" }],
              },
            ],
          },
        }),
      ],
      errorMessage: null,
      isLoading: false,
    });

    const withLesson = renderToStaticMarkup(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(withLesson).toContain("교육 시작하기");
    expect(withLesson).toContain('href="/lesson"');
  });
});
