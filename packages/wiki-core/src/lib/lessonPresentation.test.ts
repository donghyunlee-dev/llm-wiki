import { describe, expect, it } from "vitest";
import { compileLessonPresentationScenes } from "./lessonPresentation";
import type { LessonPresentationDocument } from "./lessonSemanticBlocks";

const baseDocument: LessonPresentationDocument = {
  schemaVersion: 1,
  lessonId: "today-route",
  theme: "ai-foundation",
  scenes: [
    {
      sceneId: "today-route-main",
      anchor: "AI를 이해하고 업무에 적용하는 흐름을 알아야 합니다.",
      type: "concept",
      layout: "visual-split",
      motion: "step-reveal",
      reveal: "manual",
      narration: "오늘은 AI를 업무에 쓰기 전에 무엇을 이해해야 하는지부터 짚어보겠습니다.",
      blocks: [
        { order: 1, kind: "hook", content: "AI를 업무에 쓰기 전에 무엇을 이해해야 할까요?" },
        { order: 2, kind: "explanation", content: "일은 많고 시간이 부족합니다." },
        {
          order: 3,
          kind: "visual",
          visualKind: "step-cards",
          html: "<div>카드</div>",
          css: ".card{color:red}",
        },
      ],
      interaction: { kind: "step-reveal", steps: ["이해 카드 공개", "설명 카드 공개"] },
      completionEvidence: "학습자가 세 흐름을 설명한다",
      transitionToNext: "먼저 AI가 무엇을 학습하는지 알아보겠습니다.",
    },
  ],
};

describe("compileLessonPresentationScenes", () => {
  it("maps each scene's sceneId/type/layout and uses the scene's anchor as its title", () => {
    const scenes = compileLessonPresentationScenes(baseDocument);

    expect(scenes).toHaveLength(1);
    expect(scenes[0]).toMatchObject({
      id: "today-route-main",
      title: "AI를 이해하고 업무에 적용하는 흐름을 알아야 합니다.",
      type: "concept",
      layout: "visual-split",
      motion: "step-reveal",
      transitionToNext: "먼저 AI가 무엇을 학습하는지 알아보겠습니다.",
    });
  });

  it("carries interaction.steps through to the compiled scene so they can be rendered", () => {
    const scenes = compileLessonPresentationScenes(baseDocument);

    expect(scenes[0].interaction).toEqual({
      kind: "step-reveal",
      steps: ["이해 카드 공개", "설명 카드 공개"],
    });
  });

  it("does not carry reveal: manual through to the compiled scene (no click-gating for this schema)", () => {
    const scenes = compileLessonPresentationScenes(baseDocument);

    expect(scenes[0]).not.toHaveProperty("reveal");
  });

  it("maps hook/explanation/example/visual blocks to their semantic block kinds in order", () => {
    const scenes = compileLessonPresentationScenes(baseDocument);

    expect(scenes[0].blocks).toEqual([
      { kind: "hookStatement", html: "AI를 업무에 쓰기 전에 무엇을 이해해야 할까요?" },
      { kind: "paragraph", html: "일은 많고 시간이 부족합니다." },
      { kind: "customHtml", html: "<div>카드</div>", css: ".card{color:red}" },
    ]);
  });

  it("wraps narration as scriptHtml for the existing script-toggle UI", () => {
    const scenes = compileLessonPresentationScenes(baseDocument);

    expect(scenes[0].scriptHtml).toBe(
      "<p>오늘은 AI를 업무에 쓰기 전에 무엇을 이해해야 하는지부터 짚어보겠습니다.</p>",
    );
  });

  it("splits multi-sentence narration into separate paragraphs for readability", () => {
    const document: LessonPresentationDocument = {
      ...baseDocument,
      scenes: [
        {
          ...baseDocument.scenes[0],
          narration: "수고하셨습니다. 오늘 우리는 AI가 어떻게 학습하는지 살펴봤습니다. 감사합니다!",
        },
      ],
    };

    const scenes = compileLessonPresentationScenes(document);

    expect(scenes[0].scriptHtml).toBe(
      "<p>수고하셨습니다.</p><p>오늘 우리는 AI가 어떻게 학습하는지 살펴봤습니다.</p><p>감사합니다!</p>",
    );
  });

  it("does not split a decimal point in the middle of a sentence", () => {
    const document: LessonPresentationDocument = {
      ...baseDocument,
      scenes: [
        {
          ...baseDocument.scenes[0],
          narration: "버전은 3.14입니다. 다음으로 갑니다.",
        },
      ],
    };

    const scenes = compileLessonPresentationScenes(document);

    expect(scenes[0].scriptHtml).toBe("<p>버전은 3.14입니다.</p><p>다음으로 갑니다.</p>");
  });

  it("splits sentences even without a space after the terminator", () => {
    const document: LessonPresentationDocument = {
      ...baseDocument,
      scenes: [
        {
          ...baseDocument.scenes[0],
          narration: "첫 문장.다음 문장?마지막!",
        },
      ],
    };

    const scenes = compileLessonPresentationScenes(document);

    expect(scenes[0].scriptHtml).toBe("<p>첫 문장.</p><p>다음 문장?</p><p>마지막!</p>");
  });

  it("escapes special characters in plain-text block content and narration", () => {
    const document: LessonPresentationDocument = {
      ...baseDocument,
      scenes: [
        {
          ...baseDocument.scenes[0],
          narration: "A & B <걱정>",
          blocks: [{ order: 1, kind: "explanation", content: "회의록 <a> & <b>" }],
        },
      ],
    };

    const scenes = compileLessonPresentationScenes(document);

    expect(scenes[0].blocks[0]).toEqual({ kind: "paragraph", html: "회의록 &lt;a&gt; &amp; &lt;b&gt;" });
    expect(scenes[0].scriptHtml).toBe("<p>A &amp; B &lt;걱정&gt;</p>");
  });

  it("maps a mermaid-authored visual block to a mermaidDiagram semantic block", () => {
    const document: LessonPresentationDocument = {
      ...baseDocument,
      scenes: [
        {
          ...baseDocument.scenes[0],
          blocks: [
            {
              order: 1,
              kind: "visual",
              visualKind: "process",
              mermaid: "flowchart LR\n  A[이해] --> B[연결]",
            },
          ],
        },
      ],
    };

    const scenes = compileLessonPresentationScenes(document);

    expect(scenes[0].blocks).toEqual([
      { kind: "mermaidDiagram", definition: "flowchart LR\n  A[이해] --> B[연결]" },
    ]);
  });

  it("maps an example block to an exampleNote semantic block", () => {
    const document: LessonPresentationDocument = {
      ...baseDocument,
      scenes: [
        {
          ...baseDocument.scenes[0],
          blocks: [{ order: 1, kind: "example", content: "회의록 예시" }],
        },
      ],
    };

    const scenes = compileLessonPresentationScenes(document);

    expect(scenes[0].blocks).toEqual([{ kind: "exampleNote", html: "회의록 예시" }]);
  });

  it("silently ignores an unrecognized block kind instead of crashing", () => {
    const document: LessonPresentationDocument = {
      ...baseDocument,
      scenes: [
        {
          ...baseDocument.scenes[0],
          blocks: [
            { order: 1, kind: "hook", content: "제목" },
            { order: 2, kind: "future-kind" },
          ],
        },
      ],
    };

    const scenes = compileLessonPresentationScenes(document);

    expect(scenes[0].blocks).toEqual([{ kind: "hookStatement", html: "제목" }]);
  });

  it("omits scriptHtml/motion/interaction/transitionToNext when the scene doesn't declare them", () => {
    const document: LessonPresentationDocument = {
      ...baseDocument,
      scenes: [
        {
          sceneId: "minimal",
          anchor: "minimal",
          type: "concept",
          layout: "focus",
          narration: "",
          blocks: [{ order: 1, kind: "explanation", content: "본문" }],
        },
      ],
    };

    const scenes = compileLessonPresentationScenes(document);

    expect(scenes[0].scriptHtml).toBeUndefined();
    expect(scenes[0].motion).toBeUndefined();
    expect(scenes[0].interaction).toBeUndefined();
    expect(scenes[0].transitionToNext).toBeUndefined();
  });
});
