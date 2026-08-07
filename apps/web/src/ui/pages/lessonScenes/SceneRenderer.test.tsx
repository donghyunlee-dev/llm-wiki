import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { SceneType, SemanticBlock } from "@sfood/wiki-core";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { SceneRenderer } from "./SceneRenderer";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg></svg>" }),
  },
}));

const blocks: SemanticBlock[] = [{ kind: "paragraph", html: "본문" }];

const ALL_SCENE_TYPES: SceneType[] = [
  "hook",
  "mental-model",
  "concept",
  "process",
  "comparison",
  "example",
  "screenshot",
  "misconception",
  "knowledge-check",
  "summary",
  "closing",
];

describe("SceneRenderer", () => {
  it("renders the hook scene wrapper for type hook", () => {
    const { container } = render(<SceneRenderer type="hook" layout="focus" blocks={blocks} />);
    expect(container.querySelector(".lesson-scene-hook")).toBeInTheDocument();
    expect(container.querySelector(".lesson-scene-layout-focus")).toBeInTheDocument();
  });

  it("renders the comparison scene wrapper for type comparison", () => {
    const { container } = render(
      <SceneRenderer type="comparison" layout="side-by-side" blocks={blocks} />,
    );
    expect(container.querySelector(".lesson-scene-comparison")).toBeInTheDocument();
    expect(container.querySelector(".lesson-scene-layout-side-by-side")).toBeInTheDocument();
  });

  it("renders the knowledge-check scene wrapper for type knowledge-check", () => {
    const { container } = render(
      <SceneRenderer type="knowledge-check" layout="focus" blocks={blocks} />,
    );
    expect(container.querySelector(".lesson-scene-knowledge-check")).toBeInTheDocument();
  });

  it.each(ALL_SCENE_TYPES)("dispatches a matching wrapper for every Scene Type (%s)", (type) => {
    const { container } = render(<SceneRenderer type={type} layout="focus" blocks={blocks} />);
    expect(container.querySelector(`.lesson-scene-${type}`)).toBeInTheDocument();
  });

  it("renders each interaction step label when the scene declares interaction.steps", () => {
    const { getByText } = render(
      <SceneRenderer
        type="concept"
        layout="visual-split"
        blocks={blocks}
        interaction={{ kind: "step-reveal", steps: ["이해 단계", "연결 단계"] }}
      />,
    );

    expect(getByText("이해 단계")).toBeInTheDocument();
    expect(getByText("연결 단계")).toBeInTheDocument();
  });

  it("does not render a step list when the scene has no interaction", () => {
    const { container } = render(<SceneRenderer type="concept" layout="visual-split" blocks={blocks} />);

    expect(container.querySelector(".lesson-scene-concept")?.children).toHaveLength(blocks.length);
  });

  it("does not render steps for an interaction.kind it doesn't recognize", () => {
    const { queryByText, container } = render(
      <SceneRenderer
        type="concept"
        layout="visual-split"
        blocks={blocks}
        interaction={{ kind: "hotspot-sequence", steps: ["알 수 없는 단계"] }}
      />,
    );

    expect(queryByText("알 수 없는 단계")).not.toBeInTheDocument();
    expect(container.querySelector(".lesson-scene-concept")?.children).toHaveLength(blocks.length);
  });

  it("does not repeat interaction.steps as a list when the scene already has a visual (customHtml) block describing the same steps", () => {
    const blocksWithVisual: SemanticBlock[] = [
      { kind: "paragraph", html: "본문" },
      { kind: "customHtml", html: "<div>도식</div>" },
    ];

    const { queryByText } = render(
      <SceneRenderer
        type="concept"
        layout="visual-split"
        blocks={blocksWithVisual}
        interaction={{ kind: "step-reveal", steps: ["지침 공개", "대화 공개"] }}
      />,
    );

    expect(queryByText("지침 공개")).not.toBeInTheDocument();
    expect(queryByText("대화 공개")).not.toBeInTheDocument();
  });

  it("does not repeat interaction.steps as a list when the scene already has a mermaidDiagram block", () => {
    const blocksWithMermaid: SemanticBlock[] = [
      { kind: "paragraph", html: "본문" },
      { kind: "mermaidDiagram", definition: "flowchart LR\nA-->B" },
    ];

    const { queryByText } = render(
      <ThemeProvider>
        <SceneRenderer
          type="concept"
          layout="visual-split"
          blocks={blocksWithMermaid}
          interaction={{ kind: "step-reveal", steps: ["지침 공개", "대화 공개"] }}
        />
      </ThemeProvider>,
    );

    expect(queryByText("지침 공개")).not.toBeInTheDocument();
    expect(queryByText("대화 공개")).not.toBeInTheDocument();
  });
});
